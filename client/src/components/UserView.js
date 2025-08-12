// src/pages/UserView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Fade,
  Button,
  Checkbox,
  ListItemText,
  Select,
  OutlinedInput,
  CssBaseline,
  Collapse,
  Tooltip,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import TuneIcon from "@mui/icons-material/Tune";
import Zoom from "@mui/material/Zoom";

export default function UserView() {
  const { id } = useParams(); // /user-view/:id
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const [restaurant, setRestaurant] = useState({ name: "", logo_url: null });
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Optional synonyms loaded from backend (no hardcoding needed)
  // Expected: { synonyms: { type: { Canonical:[aliases...] }, body:{}, grape:{} } }
  const [synonyms, setSynonyms] = useState({ type: {}, body: {}, grape: {} });

  // UI state
  const [showFilters, setShowFilters] = useState(false); // collapsed by default
  const [searchDraft, setSearchDraft] = useState(""); // what user types
  const [search, setSearch] = useState(""); // applied on Enter or Search click

  // filter fields
  const [typeFilter, setTypeFilter] = useState([]);
  const [bodyFilter, setBodyFilter] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [vintageFilter, setVintageFilter] = useState("");
  const [sortField, setSortField] = useState("");

  // paging & modal
  const [page, setPage] = useState(0);
  const [selectedWine, setSelectedWine] = useState(null);
  const winesPerPage = 10;

  // Theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          background: { default: "#efe9dd" },
          text: { primary: "#222222" },
          primary: { main: "#7b4a12" },
        },
      }),
    []
  );

  // Load wines
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/public/restaurant/${id}/wines`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to load wines");
        if (!ignore) {
          setRestaurant(json.restaurant || { name: "", logo_url: null });
          setWines(Array.isArray(json.wines) ? json.wines : []);
          setPage(0);
        }
      } catch (e) {
        console.error(e);
        if (!ignore) {
          setRestaurant({ name: "", logo_url: null });
          setWines([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, apiBaseUrl]);

  // Load synonyms (optional). If endpoint not present, search still works.
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${apiBaseUrl}/api/public/search-config`);
        if (!r.ok) return;
        const json = await r.json().catch(() => ({}));
        if (!ignore && json?.synonyms) setSynonyms(json.synonyms);
      } catch {
        // silent fail
      }
    })();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl]);

  // ---------- FUZZY SEARCH HELPERS ----------
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const grams3 = (s) => {
    const n = [];
    const t = normalize(s);
    for (let i = 0; i < t.length - 2; i++) n.push(t.slice(i, i + 3));
    return new Set(n);
  };

  const levenshtein = (a, b) => {
    a = normalize(a);
    b = normalize(b);
    const m = a.length,
      n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  };

  // token similarity: combine trigram Jaccard, Levenshtein ratio, contains/prefix
  const tokenSim = (a, b) => {
    const A = normalize(a),
      B = normalize(b);
    if (!A || !B) return 0;
    if (A === B) return 1;
    if (A.startsWith(B) || B.startsWith(A)) return 0.9;
    const GA = grams3(A),
      GB = grams3(B);
    const inter = [...GA].filter((g) => GB.has(g)).length;
    const uni = GA.size + GB.size - inter;
    const tri = uni ? inter / uni : 0;
    const dist = levenshtein(A, B);
    const lev = 1 - dist / Math.max(A.length, B.length);
    const contains = A.includes(B) || B.includes(A) ? 0.8 : 0;
    return Math.max(tri, lev, contains);
  };

  // best similarity for a token across candidate strings
  const bestFieldSim = (token, fields) => {
    let best = 0;
    for (const f of fields) {
      if (!f) continue;
      const str = String(f);
      const parts = str.split(/[^a-z0-9]+/i).filter(Boolean);
      const localBest = Math.max(
        tokenSim(token, str),
        ...parts.map((p) => tokenSim(token, p))
      );
      if (localBest > best) best = localBest;
      if (best >= 0.98) break;
    }
    return best;
  };

  // Synonym helpers (DB-driven; safe if empty)
  const findIntent = (facetMap, q) => {
    if (!facetMap) return null;
    const qq = ` ${normalize(q)} `;
    for (const [canon, aliases] of Object.entries(facetMap)) {
      if ((aliases || []).some((a) => qq.includes(` ${normalize(a)} `))) return canon;
    }
    return null;
  };

  const findMultiIntents = (facetMap, q) => {
    if (!facetMap) return [];
    const qq = ` ${normalize(q)} `;
    const out = [];
    for (const [canon, aliases] of Object.entries(facetMap)) {
      if ((aliases || []).some((a) => qq.includes(` ${normalize(a)} `))) out.push(canon);
    }
    return out;
  };

  const wineHasGrape = (wine, grapeCanon) => {
    const fields = [
      wine.grape,
      wine.varietal,
      wine.variety,
      Array.isArray(wine.grapes) ? wine.grapes.join(" ") : null,
      wine.wine_name,
      wine.notes,
    ];
    return fields.some((f) => (f ? tokenSim(f, grapeCanon) >= 0.7 : false));
  };

  // Build a fuzzy scorer (0..1) instead of boolean filter
  const buildSmartScorer = (query) => {
    const q = normalize(query);
    if (!q) return () => 0;

    const tokens = q.split(/[^a-z0-9]+/i).filter(Boolean);
    const yearTokens = tokens.filter((t) => /^\d{2,4}$/.test(t));
    const otherTokens = tokens.filter((t) => !/^\d{2,4}$/.test(t));

    const typeIntent = findIntent(synonyms.type, q); // e.g., "Sparkling"
    const bodyIntent = findIntent(synonyms.body, q); // e.g., "Full"
    const grapeIntents = findMultiIntents(synonyms.grape, q); // e.g., ["cabernet sauvignon"]

    // weights (tune as needed)
    const W = {
      type: 1.0,
      body: 0.6,
      grape: 0.9, // per grape
      year: 0.8, // per year token
      name: 1.0,
      company: 0.6,
      region: 0.8,
      country: 0.7,
      notes: 0.3,
    };

    return (w) => {
      let score = 0;
      let denom = 0;

      // soft facet bonuses (not hard filters)
      if (typeIntent) {
        const ok = normalize(w.type).includes(normalize(typeIntent))
          ? 1
          : tokenSim(w.type, typeIntent);
        score += W.type * ok;
        denom += W.type;
      }

      if (bodyIntent) {
        const ok = normalize(w.body).includes(normalize(bodyIntent))
          ? 1
          : tokenSim(w.body, bodyIntent);
        score += W.body * ok;
        denom += W.body;
      }

      if (grapeIntents.length) {
        for (const g of grapeIntents) {
          const ok = wineHasGrape(w, g) ? 1 : 0;
          score += W.grape * ok;
          denom += W.grape;
        }
      }

      // vintages
      for (const y of yearTokens) {
        let yScore = 0;
        const v = String(w.vintage ?? "");
        if (v.startsWith(y)) yScore = 1;
        else if (y.length === 2 && v.endsWith(y)) yScore = 0.8;
        else yScore = tokenSim(v, y);
        score += W.year * yScore;
        denom += W.year;
      }

      // text tokens across fields
      if (otherTokens.length) {
        const fields = [w.wine_name, w.company, w.region, w.country, w.notes];
        let textSum = 0;
        for (const t of otherTokens) {
          textSum += bestFieldSim(t, fields);
        }
        const textAvg = textSum / otherTokens.length;
        const textWeight = W.name + W.company + W.region + W.country + W.notes;
        score += textAvg * textWeight;
        denom += textWeight;
      }

      return denom ? score / denom : 0;
    };
  };
  // ---------- END FUZZY HELPERS ----------

  // Unique type/body options from data (no hardcoded lists)
  const typeOptions = useMemo(() => {
    const set = new Set();
    wines.forEach((w) => w?.type && set.add(String(w.type)));
    return Array.from(set);
  }, [wines]);

  const bodyOptions = useMemo(() => {
    const set = new Set();
    wines.forEach((w) => w?.body && set.add(String(w.body)));
    return Array.from(set);
  }, [wines]);

  // Build list with fuzzy scoring + hard filters + sorting
  const filteredWines = useMemo(() => {
    const scoreFn = buildSmartScorer(search);
    const comp = normalize(companyFilter);
    const country = normalize(countryFilter);
    const region = normalize(regionFilter);
    const vint = (vintageFilter || "").trim();
    const THRESHOLD = 0.35; // hide very weak matches when searching

    // score first
    let scored = wines.map((w) => ({ w, score: scoreFn(w) }));

    // apply UI filters as hard filters
    scored = scored.filter(({ w }) =>
      (typeFilter.length ? typeFilter.includes(w.type) : true) &&
      (bodyFilter.length ? bodyFilter.includes(w.body) : true) &&
      (companyFilter ? normalize(w.company).startsWith(comp) : true) &&
      (countryFilter ? normalize(w.country).startsWith(country) : true) &&
      (regionFilter ? normalize(w.region).startsWith(region) : true) &&
      (vintageFilter ? String(w.vintage ?? "").startsWith(vint) : true)
    );

    // drop low-score items only when a query is present
    if (search.trim()) {
      scored = scored.filter((x) => x.score >= THRESHOLD);
    }

    // primary sort by score, then user-chosen sort as tiebreaker
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (sortField === "vintage") return (b.w.vintage || 0) - (a.w.vintage || 0);
      if (sortField === "price-desc") return (b.w.price || 0) - (a.w.price || 0);
      if (sortField === "price-asc") return (a.w.price || 0) - (b.w.price || 0);
      return 0;
    });

    return scored.map((x) => x.w);
  }, [
    wines,
    search,
    typeFilter,
    bodyFilter,
    companyFilter,
    countryFilter,
    regionFilter,
    vintageFilter,
    sortField,
  ]);

  // reset to page 1 whenever filters/search/sort change (nicer UX)
  useEffect(() => {
    setPage(0);
  }, [search, typeFilter, bodyFilter, companyFilter, countryFilter, regionFilter, vintageFilter, sortField]);

  const pageCount = Math.max(1, Math.ceil(filteredWines.length / winesPerPage));
  const pageWines = filteredWines.slice(page * winesPerPage, (page + 1) * winesPerPage);

  // guard current page
  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  // Apply typed query
  const handleSearch = () => {
    setSearch(searchDraft.trim());
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            maxWidth: 1100,
            mx: "auto",
            mb: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                style={{ height: 56, width: "auto", borderRadius: 8 }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : null}
            <Typography variant="h4" fontWeight="bold">
              {restaurant.name || "Wine Library"}
            </Typography>
          </Box>
        </Box>

        {/* Search row + buttons */}
        <Box sx={{ maxWidth: 1100, mx: "auto", mb: showFilters ? 2 : 3 }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={8} md={8}>
              <TextField
                fullWidth
                placeholder='Try: "french red", "italian cabernet", "merlot", "2018 napa", "prosecco"'
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                type="search"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: 1,
                  "& .MuiInputBase-root": { height: 56 },
                  "& .MuiInputBase-input": { fontSize: 18 },
                }}
                inputProps={{ "aria-label": "Search wines" }}
              />
            </Grid>

            {/* Small Search button (left of Show filters), mobile-friendly */}
            <Grid item xs={6} sm={2} md={2}>
              <Tooltip title="Apply search">
                <Button
                  onClick={handleSearch}
                  variant="contained"
                  startIcon={<SearchIcon />}
                  fullWidth
                  disableElevation
                  sx={{
                    height: 56,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>Search</Box>
                  <Box sx={{ display: { xs: "block", sm: "none" } }}>Go</Box>
                </Button>
              </Tooltip>
            </Grid>

            {/* Show/Hide filters button */}
            <Grid item xs={6} sm={2} md={2}>
              <Button
                onClick={() => setShowFilters((v) => !v)}
                variant="outlined"
                startIcon={<TuneIcon />}
                fullWidth
                sx={{ height: 56, bgcolor: showFilters ? "#e9dcc3" : "transparent" }}
              >
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  {showFilters ? "Hide filters" : "Show filters"}
                </Box>
                <Box sx={{ display: { xs: "block", sm: "none" } }}>
                  {showFilters ? "Hide" : "Filters"}
                </Box>
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Filters (collapsible) */}
        <Collapse in={showFilters} timeout={250} unmountOnExit>
          <Box sx={{ maxWidth: 1100, mx: "auto", mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  fullWidth
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Country"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  fullWidth
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Region"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  fullWidth
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Vintage"
                  value={vintageFilter}
                  onChange={(e) => setVintageFilter(e.target.value)}
                  fullWidth
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Select
                  multiple
                  displayEmpty
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  input={<OutlinedInput fullWidth placeholder="Type" />}
                  renderValue={(selected) => selected.join(", ") || "Type"}
                  fullWidth
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                >
                  {typeOptions.map((t) => (
                    <MenuItem key={t} value={t}>
                      <Checkbox checked={typeFilter.includes(t)} />
                      <ListItemText primary={t} />
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Select
                  multiple
                  displayEmpty
                  value={bodyFilter}
                  onChange={(e) => setBodyFilter(e.target.value)}
                  input={<OutlinedInput fullWidth placeholder="Body" />}
                  renderValue={(selected) => selected.join(", ") || "Body"}
                  fullWidth
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                >
                  {bodyOptions.map((b) => (
                    <MenuItem key={b} value={b}>
                      <Checkbox checked={bodyFilter.includes(b)} />
                      <ListItemText primary={b} />
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Sort By"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="vintage">Vintage (Newest)</MenuItem>
                  <MenuItem value="price-desc">Price (High to Low)</MenuItem>
                  <MenuItem value="price-asc">Price (Low to High)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Page Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            px: 2,
            maxWidth: 1100,
            mx: "auto",
          }}
        >
          <Button
            startIcon={<ArrowBackIosNewIcon />}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            variant="outlined"
            color="inherit"
            size="small"
          >
            Previous
          </Button>
          <Typography sx={{ opacity: 0.9 }}>
            Page {Math.min(page + 1, pageCount)} of {pageCount} • Showing{" "}
            {filteredWines.length === 0
              ? 0
              : `${page * winesPerPage + 1}-${Math.min(
                  (page + 1) * winesPerPage,
                  filteredWines.length
                )}`}{" "}
            of {filteredWines.length}
          </Typography>
          <Button
            endIcon={<ArrowForwardIosIcon />}
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={page + 1 >= pageCount}
            variant="outlined"
            color="inherit"
            size="small"
          >
            Next
          </Button>
        </Box>

        {/* Wine Cards */}
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
          {loading ? (
            <Typography sx={{ textAlign: "center", mt: 6, opacity: 0.9 }}>
              Loading…
            </Typography>
          ) : filteredWines.length === 0 ? (
            <Typography sx={{ textAlign: "center", mt: 6, opacity: 0.9 }}>
              No wines match your filters.
            </Typography>
          ) : (
            <Fade in timeout={500} key={page}>
              <Grid container spacing={3} justifyContent="center">
                {pageWines.map((wine) => (
                  <Grid item xs={12} sm={6} md={4} key={wine.id}>
                    <Card
                      onClick={() => setSelectedWine(wine)}
                      sx={{
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "stretch",
                        bgcolor: "#e9dcc3",
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: 4,
                        height: { xs: 150, sm: 170, md: 190 },
                        transition:
                          "transform .15s ease, box-shadow .15s ease, background-color .15s ease",
                        "&:hover": {
                          transform: "scale(1.03)",
                          boxShadow: 6,
                          bgcolor: "#dfcfb2",
                        },
                      }}
                    >
                      {/* Text section */}
                      <CardContent
                        sx={{
                          pr: 2,
                          py: 1.5,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {wine.wine_name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.25,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {wine.company}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 0.25 }}>
                          {wine.region}, {wine.country}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 0.25 }}>
                          {wine.vintage} • {wine.type} • {wine.body}
                          {typeof wine.price === "number" ? ` • $${wine.price}` : ""}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            mt: 1,
                            fontStyle: "italic",
                            color: "blue",
                            display: "block",
                          }}
                        >
                          Click for more info →
                        </Typography>
                      </CardContent>

                      {/* Image section — fixed box */}
                      <Box
                        sx={{
                          width: { xs: 110, sm: 130, md: 150 },
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fff",
                          p: 1.5,
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={
                            (wine.wine_image_url || "").startsWith("http")
                              ? wine.wine_image_url
                              : wine.wine_image_url
                              ? `${process.env.PUBLIC_URL}${wine.wine_image_url}`
                              : `${process.env.PUBLIC_URL}/default-wine.png`
                          }
                          alt={wine.wine_name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `${process.env.PUBLIC_URL}/default-wine.png`;
                          }}
                          sx={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Fade>
          )}
        </Box>

        {/* Wine Notes Dialog */}
        <Dialog
          open={!!selectedWine}
          onClose={() => setSelectedWine(null)}
          TransitionComponent={Zoom}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              borderRadius: 3,
              backgroundColor: "#fef9f2",
              overflow: "hidden",
              boxShadow: 6,
              p: 0,
              position: "relative",
            },
          }}
        >
          <DialogTitle sx={{ display: { xs: "block", sm: "none" }, pr: 6 }}>
            {selectedWine?.wine_name}
          </DialogTitle>

          <IconButton
            onClick={() => setSelectedWine(null)}
            sx={{ position: "absolute", right: 8, top: 8, zIndex: 10 }}
          >
            <CloseIcon />
          </IconButton>

          {/* Image side */}
          {selectedWine?.wine_image_url && (
            <Box
              sx={{
                flex: { xs: "none", sm: 1 },
                width: { xs: "100%", sm: "auto" },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                backgroundColor: "#fff",
              }}
            >
              <img
                src={
                  selectedWine.wine_image_url?.startsWith("http")
                    ? selectedWine.wine_image_url
                    : `${process.env.PUBLIC_URL}${selectedWine.wine_image_url}`
                }
                alt={selectedWine.wine_name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${process.env.PUBLIC_URL}/default-wine.png`;
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "250px",
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </Box>
          )}

          {/* Text side */}
          <DialogContent sx={{ flex: 2 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {selectedWine?.wine_name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom color="text.secondary">
              {selectedWine?.company}
            </Typography>

            <Typography
              variant="subtitle2"
              sx={{ mt: 2, fontSize: 18, fontWeight: "bold", color: "#6d4c41" }}
            >
              Tasting Notes
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 1,
                fontSize: "1rem",
                fontWeight: 500,
                color: "#4e342e",
                backgroundColor: "#ebdbbdff",
                p: 2,
                borderRadius: 2,
                boxShadow: 1,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedWine?.notes || "—"}
            </Typography>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
