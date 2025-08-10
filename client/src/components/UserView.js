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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Zoom from "@mui/material/Zoom";

export default function UserView() {
  const { id } = useParams(); // restaurant id from URL: /user-view/:id
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const [restaurant, setRestaurant] = useState({ name: "", logo_url: null });
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
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
          setPage(0); // reset page when restaurant changes
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

  const normalize = (str) =>
    (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredWines = useMemo(() => {
    const s = normalize(search);
    const comp = normalize(companyFilter);
    const country = normalize(countryFilter);
    const region = normalize(regionFilter);
    const vint = (vintageFilter || "").trim();

    const out = wines
      .filter((w) => {
        const name = normalize(w.wine_name);
        const company = normalize(w.company);
        const reg = normalize(w.region);
        const ctry = normalize(w.country);
        const v = String(w.vintage ?? "");

        return (
          // global search (name/company/region)
          (name.includes(s) || company.includes(s) || reg.includes(s)) &&
          // facet filters
          (typeFilter.length ? typeFilter.includes(w.type) : true) &&
          (bodyFilter.length ? bodyFilter.includes(w.body) : true) &&
          (companyFilter ? company.includes(comp) : true) &&
          (countryFilter ? ctry.includes(country) : true) &&
          (regionFilter ? reg.includes(region) : true) &&
          (vintageFilter ? v.includes(vint) : true)
        );
      })
      .sort((a, b) => {
        if (sortField === "vintage") return (b.vintage || 0) - (a.vintage || 0);
        if (sortField === "price-desc") return (b.price || 0) - (a.price || 0);
        if (sortField === "price-asc") return (a.price || 0) - (b.price || 0);
        return 0;
      });

    return out;
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

  const pageCount = Math.max(1, Math.ceil(filteredWines.length / winesPerPage));
  const pageWines = filteredWines.slice(page * winesPerPage, (page + 1) * winesPerPage);

  // If current page goes out of range after filtering, snap back
  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: "100vh",
        backgroundImage: "linear-gradient(135deg, #74316aed 10%, #512039e0 80%)",
        color: "#fff",
        fontFamily: `'Georgia', serif`,
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
          justifyContent: "center",
          textAlign: "center",
          flexWrap: "wrap",
        }}
      >
        {restaurant.logo_url ? (
          <img
            src={restaurant.logo_url}
            alt={`${restaurant.name} logo`}
            style={{ height: 56, width: "auto", marginRight: 12, borderRadius: 8 }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <Typography variant="h4" fontWeight="bold" color="white">
          {restaurant.name || "Wine Library"}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ maxWidth: 1100, mx: "auto", mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name, brand, or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ backgroundColor: "#fff", borderRadius: 1 }}
            />
          </Grid>

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
              {["Red", "White", "Rose"].map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={typeFilter.includes(type)} />
                  <ListItemText primary={type} />
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
              {["Light", "Medium", "Full"].map((body) => (
                <MenuItem key={body} value={body}>
                  <Checkbox checked={bodyFilter.includes(body)} />
                  <ListItemText primary={body} />
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
          Page {Math.min(page + 1, pageCount)} of {pageCount}
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
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "#f0e0c1",
                      borderRadius: 2,
                      overflow: "hidden",
                      boxShadow: 4,
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: 6,
                        backgroundColor: "#e6d3b8",
                      },
                    }}
                  >
                    {/* Text section */}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" color="black">
                        {wine.wine_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {wine.company}
                      </Typography>
                      <Typography variant="body2">
                        {wine.region}, {wine.country}
                      </Typography>
                      <Typography variant="body2">
                        {wine.vintage} • {wine.type} • {wine.body}
                        {typeof wine.price === "number" ? ` • $${wine.price}` : ""}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ mt: 2, fontStyle: "italic", color: "blue", display: "block" }}
                      >
                        Click for more info →
                      </Typography>
                    </CardContent>

                    {/* Image section */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: { xs: 110, sm: 130, md: 150 },
                        height: "100%",
                        py: 2.2,
                        backgroundColor: "#ffffff",
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
                          width: { xs: 110, sm: 130, md: 150 },
                          height: "auto",
                          maxHeight: 170,
                          objectFit: "contain",
                          backgroundColor: "#ffffff",
                          alignSelf: "center",
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
  );
}
