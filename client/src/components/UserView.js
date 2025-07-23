import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, CardMedia,
  TextField, InputAdornment, MenuItem, Dialog, DialogTitle,
  DialogContent, IconButton, Fade, Button, Checkbox, ListItemText, Select,
  OutlinedInput
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Zoom from '@mui/material/Zoom';


export default function UserWineLibrary() {
  const [wines, setWines] = useState([
    {
      id: 1,
      wine_name: "Château Margaux",
      company: "Château Margaux Estate",
      region: "Bordeaux",
      country: "France",
      vintage: 2015,
      type: "Red",
      body: "Full",
      notes: "Rich and complex with notes of blackberry, plum, and spice.",
      image_url: "/Margaux-700x700_12.webp",
      price: 450
    },
    {
      id: 2,
      wine_name: "Cloudy Bay Sauvignon Blanc",
      company: "Cloudy Bay",
      region: "Marlborough",
      country: "New Zealand",
      vintage: 2021,
      type: "White",
      body: "Light",
      notes: "Crisp and citrusy with hints of passionfruit and gooseberry.",
      image_url: "/cloudy bay sauvignon.png",
      price: 75
    },
    {
      id: 3,
      wine_name: "Antinori Tignanello",
      company: "Marchesi Antinori",
      region: "Tuscany",
      country: "Italy",
      vintage: 2018,
      type: "Red",
      body: "Medium",
      notes: "Elegant and well-balanced with flavors of cherry, tobacco, and spice.",
      image_url: "/antinori.jpeg",
      price: 200
    },
    
  ]);

  
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [bodyFilter, setBodyFilter] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [vintageFilter, setVintageFilter] = useState("");
  const [selectedWine, setSelectedWine] = useState(null);
  const [page, setPage] = useState(0);

  const winesPerPage = 10;

  useEffect(() => {
    fetch("/api/wines")
      .then((res) => res.json())
      .then((data) => setWines(data))
      .catch((err) => console.error("Failed to load wines", err));
  }, []);

  const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filteredWines = wines
    .filter((w) => {
      const searchText = normalize(search);
      const wineName = normalize(w.wine_name);
      const company = normalize(w.company);
      const region = normalize(w.region);
      const country = normalize(w.country);
      const vintage = String(w.vintage || "");

      return (
        (wineName.includes(searchText) || company.includes(searchText) || region.includes(searchText)) &&
        (typeFilter.length ? typeFilter.includes(w.type) : true) &&
        (bodyFilter.length ? bodyFilter.includes(w.body) : true) &&
        (companyFilter ? company.includes(normalize(companyFilter)) : true) &&
        (countryFilter ? country.includes(normalize(countryFilter)) : true) &&
        (regionFilter ? region.includes(normalize(regionFilter)) : true) &&
        (vintageFilter ? vintage.includes(vintageFilter) : true)
      );
    })
    .sort((a, b) => {
      if (sortField === "vintage") return b.vintage - a.vintage;
      if (sortField === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortField === "price-asc") return (a.price || 0) - (b.price || 0);
      return 0;
    });

  const pageCount = Math.ceil(filteredWines.length / winesPerPage);
  const pageWines = filteredWines.slice(page * winesPerPage, (page + 1) * winesPerPage);

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        backgroundImage: "linear-gradient(135deg, #74316aed 10%, #512039e0 80%)",
        backgroundRepeat: "repeat",
        color: "#fff",
        fontFamily: `'Georgia', serif`
      }}
    >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
  <img
    src={`${process.env.PUBLIC_URL}/logonewomerM2 copy_edited.jpg`}
    alt="Wine App Logo"
    style={{ height: 60,width: "auto", marginRight: 12 }}
  />
  <Typography variant="h4" fontWeight="bold" color="white">
    Wine Library
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
            <TextField label="Company" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} fullWidth sx={{ backgroundColor: "#fff", borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Country" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} fullWidth sx={{ backgroundColor: "#fff", borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Region" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} fullWidth sx={{ backgroundColor: "#fff", borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Vintage" value={vintageFilter} onChange={(e) => setVintageFilter(e.target.value)} fullWidth sx={{ backgroundColor: "#fff", borderRadius: 1 }} />
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

      {/* Page Flip Controls */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, px: 2 }}>
        <Button
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          variant="outlined"
          color="inherit"
        >
          Previous
        </Button>
        <Typography>Page {page + 1} of {pageCount}</Typography>
        <Button
          endIcon={<ArrowForwardIosIcon />}
          onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
          disabled={page + 1 >= pageCount}
          variant="outlined"
          color="inherit"
        >
          Next
        </Button>
      </Box>

      {/* Wine Cards */}
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
    "&:hover": {transform: "scale(1.05)",
      boxShadow: 6,
      backgroundColor: "#e6d3b8"}
  }}
>
  {/* Text section on the left */}
  <CardContent sx={{ flex: 1 }}>
    <Typography variant="h6" fontWeight="bold" color="Black">
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
    </Typography>
    <Typography variant="caption" sx={{ mt: 2, fontStyle: "italic", color: "blue" }}>
  Click for more info →
</Typography>

  </CardContent>

  {/* Image section on the right */}
   {wine.image_url && (
     <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: { xs: 110, sm: 130, md: 150 },
      height: "100%",
      py: 2.2, // adds white space top & bottom
      backgroundColor: "#ffffff",
    }}
  >
            <CardMedia
              component="img"
              image={
                wine.image_url.startsWith("http")
                  ? wine.image_url
                  : `${process.env.PUBLIC_URL}${wine.image_url}`
              }
              alt={wine.wine_name}
              sx={{
                width: { xs: 110, sm: 130, md: 150 },
                height: "auto",
                maxHeight: 170,
                objectFit: "contain",
                backgroundColor: "#ffffff",
                alignSelf: "center"
              }}
            />
            </Box>
  )}
  
</Card>

            </Grid>
          ))}
        </Grid>
      </Fade>

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
      position: "relative"
    }
  }}
>

  <IconButton
    onClick={() => setSelectedWine(null)}
    sx={{ position: "absolute", right: 8, top: 8, zIndex: 10 }}
  >
    <CloseIcon />
  </IconButton>

  {/* Image side */}
  {selectedWine?.image_url && (
    <Box
  sx={{
    flex: { xs: "none", sm: 1 },
    width: { xs: "100%", sm: "auto" },
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: 2,
    backgroundColor: "#fff"
  }}
>
  <img
    src={
      selectedWine.image_url?.startsWith("http")
        ? selectedWine.image_url
        : `${process.env.PUBLIC_URL}${selectedWine.image_url}`
    }
    alt={selectedWine.wine_name}
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = `${process.env.PUBLIC_URL}/default-wine.png`;
    }}
    style={{
      maxWidth: "100%",
      maxHeight: "250px",      // ✅ Bump up for mobile
      width: "auto",
      objectFit: "contain",
      borderRadius: 8
    }}
  />
</Box>

  )}

  {/* Text side */}
  <Box sx={{ flex: 2, p: 3 }}>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      {selectedWine?.wine_name}
    </Typography>
    <Typography variant="subtitle1" gutterBottom color="text.secondary">
      {selectedWine?.company}
    </Typography>

    <Typography variant="subtitle2" sx={{ mt: 2,fontSize: 18,  fontWeight: "bold", color: "#6d4c41" }}>
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
        whiteSpace: "pre-wrap"
      }}
    >
      {selectedWine?.notes}
    </Typography>
  </Box>
</Dialog>

    </Box>
  );
}