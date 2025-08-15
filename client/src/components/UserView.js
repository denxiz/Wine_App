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

/* ---------------- Fallback synonyms (merged with backend, if provided) ---------------- */
const FALLBACK_SYNONYMS = {
  type: {
    Red: ["red", "kirmizi", "kırmızı", "rouge", "rosso", "tinto", "kırmizi"],
    White: ["white", "beyaz", "blanc", "bianco"],
    "Rosé": ["rose", "rosé", "rosee", "rosado", "rosato", "blush", "pembe"],
    Sparkling: [
      "sparkling",
      "bubbly",
      "pet-nat",
      "pet nat",
      "pét-nat",
      "champagne",
      "cava",
      "prosecco",
      "spumante",
      "frizzante",
      "pét nat",
    ],
  },
  body: {},
  grape: {},
  country: {
    France: ["france", "french", "français"],
    Italy: ["italy", "italian", "italiano"],
    Spain: ["spain", "spanish", "españa", "español", "espanol"],
    USA: ["usa", "american", "us", "california", "sonoma", "napa", "north coast"],
    Turkey: ["turkey", "turkish", "türk", "turkiye", "türkiye"],
    "New Zealand": ["new zealand", "nz", "kiwi", "marlborough"],
    Austria: ["austria", "austrian", "kamptal", "wachau"],
    Hungary: ["hungary", "hungarian", "tokaj"],
  },
};

/* ------------------------------ Utilities ------------------------------ */
const deepClone = (o) => JSON.parse(JSON.stringify(o || {}));
const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const mergeSynonymMaps = (base, extra) => {
  const out = deepClone(base);
  for (const key of Object.keys(extra || {})) {
    out[key] = out[key] || {};
    for (const [canon, aliases] of Object.entries(extra[key] || {})) {
      const canonKey = canon; // keep original casing for display
      const have = new Set((out[key][canonKey] || []).map(normalize));
      (aliases || []).forEach((a) => have.add(normalize(a)));
      out[key][canonKey] = Array.from(have);
    }
  }
  return out;
};

const grams3 = (s) => {
  const t = normalize(s);
  const n = [];
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
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

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

const findIntents = (facetMap, q) => {
  if (!facetMap) return [];
  const qq = ` ${normalize(q)} `;
  const hits = [];
  for (const [canon, aliases] of Object.entries(facetMap)) {
    const list = aliases || [];
    const matched =
      list.some((a) => qq.includes(` ${normalize(a)} `)) ||
      qq.includes(` ${normalize(canon)} `);
    if (matched) hits.push(canon);
  }
  return hits;
};

const aliasesForCanon = (facetMap, canon) =>
  (facetMap?.[canon] || []).concat([canon]).map(normalize);

/* ----------------------------- Search helpers ----------------------------- */
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "wine",
  "wines",
  "vineyard",
  "estate",
  "cellars",
  "winery",
  "and",
  "of",
  "de",
  "la",
  "le",
  "di",
  "da",
  "del",
  "y",
  "el",
  "dos",
  "das",
]);

const tokenize = (q) =>
  normalize(q)
    .split(/[^a-z0-9]+/i)
    .filter((t) => t && !STOPWORDS.has(t) && t.length >= 2);

/* ----------------------------------- Component ----------------------------------- */
export default function UserView() {
  const { id } = useParams(); // /user-view/:id
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const [restaurant, setRestaurant] = useState({ name: "", logo_url: null });
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Synonyms (merged backend + fallback)
  const [synonyms, setSynonyms] = useState({
    type: {},
    body: {},
    grape: {},
    country: {},
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [searchDraft, setSearchDraft] = useState(""); // typed
  const [search, setSearch] = useState(""); // applied

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

  // Load synonyms and merge with fallbacks
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${apiBaseUrl}/api/public/search-config`);
        if (!r.ok) {
          if (!ignore) setSynonyms(FALLBACK_SYNONYMS);
          return;
        }
        const json = await r.json().catch(() => ({}));
        const merged = mergeSynonymMaps(FALLBACK_SYNONYMS, json?.synonyms || {});
        if (!ignore) setSynonyms(merged);
      } catch {
        if (!ignore) setSynonyms(FALLBACK_SYNONYMS);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl]);

  /* ----------------------------- SMART SCORER (fuzzy, stricter) ----------------------------- */
  const buildSmartScorer = (query) => {
    const q = normalize(query);
    if (!q) return () => 0;

    const tokens = tokenize(q);
    const yearTokens = tokens.filter((t) => /^\d{2,4}$/.test(t));
    const otherTokens = tokens.filter((t) => !/^\d{2,4}$/.test(t));

    // intents from synonyms
    const typeIntents = findIntents(synonyms.type, q); // e.g., ["Red"]
    const bodyIntents = findIntents(synonyms.body, q);
    const grapeIntents = findIntents(synonyms.grape, q);
    const countryIntents = findIntents(synonyms.country, q); // e.g., ["France"]

    // Remove tokens already captured by intents (avoid double scoring/gating)
    const ignoreSet = new Set(
      [
        ...typeIntents.flatMap((c) => aliasesForCanon(synonyms.type, c)),
        ...bodyIntents.flatMap((c) => aliasesForCanon(synonyms.body, c)),
        ...countryIntents.flatMap((c) => aliasesForCanon(synonyms.country, c)),
      ].map(normalize)
    );
    const effectiveTokens = otherTokens.filter((t) => !ignoreSet.has(normalize(t)));

    // field weights (favor name & geography)
    const FIELD_W = {
      wine_name: 1.25,
      region: 1.0,
      country: 0.9,
      company: 0.6,
      type: 1.1,
      body: 0.5,
    };

    // Overall weights
    const W = {
      intents: 1.2, // applied per facet section
      grape: 0.9, // per grape
      year: 0.8, // per year token
      text: 2.4, // combined textual tokens across weighted fields
    };

    // Strong match thresholds
    const STRONG = 0.78; // token-level
    const INTENT_MATCH = 0.82; // facet gating

    // Require at least 1 strong hit in key fields to "separate" wines
    const requireKeyHit = (w, token) => {
      const keyFields = [w.wine_name, w.region, w.country];
      return keyFields.some((f) => tokenSim(f || "", token) >= STRONG);
    };

    // phrase bonus (for two+ words, prefer contiguous match in wine_name)
    const phrase = normalize(query).replace(/\s+/g, " ").trim();

    return (w) => {
      let score = 0;
      let denom = 0;

      // ---- HARD GATES from intents ----
      const typeOK =
        !typeIntents.length ||
        typeIntents.some((t) => tokenSim(w.type || "", t) >= INTENT_MATCH);
      const bodyOK =
        !bodyIntents.length ||
        bodyIntents.some((b) => tokenSim(w.body || "", b) >= INTENT_MATCH);
      const countryOK =
        !countryIntents.length ||
        countryIntents.some(
          (c) =>
            Math.max(tokenSim(w.country || "", c), tokenSim(w.region || "", c)) >= INTENT_MATCH
        );

      if (!(typeOK && bodyOK && countryOK)) return 0;

      // ---- Intent bonuses (soft) ----
      if (typeIntents.length) {
        const best = Math.max(...typeIntents.map((c) => tokenSim(w.type || "", c)), 0);
        score += W.intents * best;
        denom += W.intents;
      }
      if (bodyIntents.length) {
        const best = Math.max(...bodyIntents.map((c) => tokenSim(w.body || "", c)), 0);
        score += W.intents * 0.6 * best;
        denom += W.intents * 0.6;
      }
      if (countryIntents.length) {
        const best = Math.max(
          ...countryIntents.map((c) =>
            Math.max(tokenSim(w.country || "", c), tokenSim(w.region || "", c))
          ),
          0
        );
        score += W.intents * best;
        denom += W.intents;
      }

      if (grapeIntents.length) {
        const fields = [
          w.grape,
          w.varietal,
          w.variety,
          Array.isArray(w.grapes) ? w.grapes.join(" ") : null,
          w.wine_name,
        ];
        const best = Math.max(
          ...grapeIntents.map((g) => Math.max(...fields.map((f) => tokenSim(f || "", g)))),
          0
        );
        score += W.grape * best;
        denom += W.grape;
      }

      // ---- Vintage signals ----
      for (const y of yearTokens) {
        let yScore = 0;
        const v = String(w.vintage ?? "");
        if (v.startsWith(y)) yScore = 1;
        else if (y.length === 2 && v.endsWith(y)) yScore = 0.85;
        else yScore = tokenSim(v, y);
        score += W.year * yScore;
        denom += W.year;
      }

      // ---- Text tokens across weighted fields (NO notes) ----
      const fields = [
        { v: w.wine_name, w: FIELD_W.wine_name },
        { v: w.region, w: FIELD_W.region },
        { v: w.country, w: FIELD_W.country },
        { v: w.company, w: FIELD_W.company },
        { v: w.type, w: FIELD_W.type },
        { v: w.body, w: FIELD_W.body },
      ];

      let textSum = 0;
      let strongHits = 0;
      let keyHits = 0;

      for (const t of effectiveTokens) {
        let best = 0;
        for (const f of fields) {
          const s = tokenSim(f.v || "", t) * f.w;
          if (s > best) best = s;
        }
        // normalize per-token weight scale back roughly to [0,1.25] => cap at 1.0
        const perToken = Math.min(best / 1.25, 1);
        textSum += perToken;
        if (perToken >= STRONG) strongHits += 1;
        if (requireKeyHit(w, t)) keyHits += 1;
      }

      // Token coverage gating (stricter): need 60% strong + at least 1 key field hit
      const neededStrong = Math.ceil(Math.max(1, effectiveTokens.length) * 0.6);
      if (effectiveTokens.length && (strongHits < neededStrong || keyHits < 1)) return 0;

      if (effectiveTokens.length) {
        const textAvg = textSum / effectiveTokens.length;
        score += W.text * textAvg;
        denom += W.text;
      }

      // phrase bonus when query is > 1 word and matches wine_name/region closely
      if (phrase.includes(" ")) {
        const phraseBonus = Math.max(
          tokenSim(w.wine_name || "", phrase),
          tokenSim(`${w.region || ""} ${w.country || ""}`, phrase)
        );
        if (phraseBonus > 0.75) {
          score += 0.6 * phraseBonus;
          denom += 0.6;
        }
      }

      return denom ? score / denom : 0;
    };
  };
  /* --------------------------- END SMART SCORER --------------------------- */

  // Unique options from data
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

    // Strict gating from query
    const typeMust = findIntents(synonyms.type, search);
    const countryMust = findIntents(synonyms.country, search);
    const bodyMust = findIntents(synonyms.body, search);
    const grapeMust = findIntents(synonyms.grape, search);
    const yearTokens = (search.match(/\b\d{2,4}\b/g) || []).map((s) => s.trim());

    const comp = normalize(companyFilter);
    const country = normalize(countryFilter);
    const region = normalize(regionFilter);
    const vint = (vintageFilter || "").trim();
    const INTENT_MATCH = 0.85; // slightly higher here

    // Higher threshold to avoid loose matches when searching
    const THRESHOLD = search.trim() ? 0.62 : 0; // stricter than before

    // score first
    let scored = wines.map((w) => ({ w, score: scoreFn(w) }));

    // apply filters (hard intent + UI filters)
    scored = scored.filter(({ w }) => {
      const typeOK =
        !typeMust.length || typeMust.some((t) => tokenSim(w.type || "", t) >= INTENT_MATCH);

      const countryOK =
        !countryMust.length ||
        countryMust.some(
          (c) =>
            Math.max(tokenSim(w.country || "", c), tokenSim(w.region || "", c)) >= INTENT_MATCH
        );

      const bodyOK =
        !bodyMust.length || bodyMust.some((b) => tokenSim(w.body || "", b) >= INTENT_MATCH);

      const grapeFields = [
        w.grape,
        w.varietal,
        w.variety,
        Array.isArray(w.grapes) ? w.grapes.join(" ") : null,
        w.wine_name,
      ];
      const grapeOK =
        !grapeMust.length ||
        grapeMust.some((g) => grapeFields.some((f) => tokenSim(f || "", g) >= INTENT_MATCH));

      const yearOK =
        !yearTokens.length ||
        yearTokens.some((y) => {
          const v = String(w.vintage ?? "");
          if (!v) return false;
          return v.startsWith(y) || (y.length === 2 && v.endsWith(y));
        });

      return (
        typeOK &&
        countryOK &&
        bodyOK &&
        grapeOK &&
        yearOK &&
        (typeFilter.length ? typeFilter.includes(w.type) : true) &&
        (bodyFilter.length ? bodyFilter.includes(w.body) : true) &&
        (companyFilter ? normalize(w.company).startsWith(comp) : true) &&
        (countryFilter ? normalize(w.country).startsWith(country) : true) &&
        (regionFilter ? normalize(w.region).startsWith(region) : true) &&
        (vintageFilter ? String(w.vintage ?? "").startsWith(vint) : true)
      );
    });

    // drop low-score items only when a query is present
    if (THRESHOLD > 0) scored = scored.filter((x) => x.score >= THRESHOLD);

    // sort by score, then selected sort
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
    synonyms,
  ]);

  // reset to first page on filter/search changes
  useEffect(() => {
    setPage(0);
  }, [search, typeFilter, bodyFilter, companyFilter, countryFilter, regionFilter, vintageFilter, sortField]);

  const pageCount = Math.max(1, Math.ceil(filteredWines.length / winesPerPage));
  const pageWines = filteredWines.slice(page * winesPerPage, (page + 1) * winesPerPage);

  // guard current page
  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const handleSearch = () => setSearch(searchDraft.trim());

  // Pagination short text: "Pg 1/4 • 1–10 / 37"
  const rangeStart = filteredWines.length ? page * winesPerPage + 1 : 0;
  const rangeEnd = filteredWines.length ? Math.min((page + 1) * winesPerPage, filteredWines.length) : 0;
  const pagerText = `Pg ${Math.min(page + 1, pageCount)}/${pageCount} • ${rangeStart}-${rangeEnd} / ${filteredWines.length}`;

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
                placeholder="Search Wines"
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
            Prev
          </Button>

          <Typography sx={{ opacity: 0.9 }}>{pagerText}</Typography>

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
            <Typography sx={{ textAlign: "center", mt: 6, opacity: 0.9 }}>Loading…</Typography>
          ) : filteredWines.length === 0 ? (
            <Typography sx={{ textAlign: "center", mt: 6, opacity: 0.9 }}>
              No wines match your filters.
            </Typography>
          ) : (
            <Fade in timeout={500} key={page}>
              <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                {pageWines.map((wine) => (
                  <Grid item xs={12} sm={6} md={4} key={wine.id}>
                    <Card
                      onClick={() => setSelectedWine(wine)}
                      sx={{
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr 92px", sm: "1fr 120px", md: "1fr 150px" },
                        alignItems: "stretch",
                        bgcolor: "#e9dcc3",
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: 4,
                        height: { xs: 132, sm: 170, md: 190 },
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
                          pr: { xs: 1, sm: 2 },
                          py: { xs: 1, sm: 1.5 },
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          minWidth: 0,
                          gap: { xs: 0.25, sm: 0.5 },
                        }}
                      >
                        <Typography
                          fontWeight="bold"
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            lineHeight: { xs: 1.2, sm: 1.25 },
                            display: "-webkit-box",
                            WebkitLineClamp: { xs: 2, sm: 2 },
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {wine.wine_name}
                        </Typography>

                        <Typography
                          sx={{
                            color: "text.secondary",
                            fontSize: { xs: 12.5, sm: 13.5 },
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {wine.company || "—"}
                        </Typography>

                        <Typography sx={{ mt: 0.25, fontSize: { xs: 12.5, sm: 13.5 } }}>
                          {wine.region}, {wine.country}
                        </Typography>

                        <Typography sx={{ mt: 0.25, fontSize: { xs: 12.5, sm: 13.5 } }}>
                          {wine.vintage} • {wine.type} • {wine.body}
                          {typeof wine.price === "number" ? ` • $${wine.price}` : ""}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            mt: 0.5,
                            fontStyle: "italic",
                            color: "blue",
                            display: { xs: "none", sm: "block" },
                          }}
                        >
                          Click for more info →
                        </Typography>
                      </CardContent>

                      {/* Image section */}
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fff",
                          p: { xs: 1, sm: 1.5 },
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
