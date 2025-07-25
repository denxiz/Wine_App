import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
} from "@mui/material";
import logout from "../utils/logout";
const restaurantId = "61811ff2-59f7-4b77-986b-fab0c7948a46";

export default function RestaurantDashboard() {
  const [region, setRegion] = useState("");
  const [wineName, setWineName] = useState("");
  const [allWines, setAllWines] = useState([]);
  const [wines, setWines] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedWine, setSelectedWine] = useState(null);
  const [price, setPrice] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
  const initialWines = [
    {
      wine: {
        id: 1,
        wine_name: "Château Margaux",
        company: "Château Margaux Estate",
        region: "Bordeaux",
        country: "France",
        vintage: 2015,
        image_url: "/Margaux-700x700_12.webp",
      },
      price_override: 450,
      is_active: true,
    },
    {
      wine: {
        id: 2,
        wine_name: "Cloudy Bay Sauvignon Blanc",
        company: "Cloudy Bay",
        region: "Marlborough",
        country: "New Zealand",
        vintage: 2021,
        image_url: "/cloudy bay sauvignon.png",
      },
      price_override: 75,
      is_active: false,
    },
  ];
  setAllWines(initialWines);
  setWines(initialWines);
}, []);

useEffect(() => {
  const filtered = allWines.filter((entry) =>
    normalizeText(entry.wine.region).includes(normalizeText(region)) &&
    normalizeText(entry.wine.wine_name).includes(normalizeText(wineName))
  );
  setWines(filtered);
}, [region, wineName, allWines]);

const toggleStock = (id) => {
  setWines((prev) =>
    prev.map((entry) =>
      entry.wine.id === id ? { ...entry, is_active: !entry.is_active } : entry
    )
  );
};




const handleSearch = () => {
  const filtered = allWines.filter(entry =>
    normalizeText(entry.wine.region).includes(normalizeText(region)) &&
    normalizeText(entry.wine.wine_name).includes(normalizeText(wineName))
  );
  setWines(filtered);
};

const normalizeText = (str) =>
  str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";


  const handleEditClick = (entry) => {
    setSelectedWine(entry);
    setPrice(entry.price_override);
    setOpenEdit(true);
  };

  const handleSave = () => {
    console.log("Updated price:", price);
    setOpenEdit(false);
  };

  const handleDeleteClick = (entry) => {
    setSelectedWine(entry);
    setConfirmText("");
    setOpenConfirm(true);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor:"#fff7f2" }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#fce8dd",
          padding: "1rem",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Wine List 
          </Typography>
           <img
    src={`${process.env.PUBLIC_URL}/logonewomerM2 copy_edited.jpg`}
    alt="Wine App Logo"
    style={{marginLeft: 30, height: 60,width: "auto", marginRight: 12 }}
  />
        </Box>
        <Box sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    justifyContent: { xs: "center", sm: "flex-end" },
    mt: { xs: 1, sm: 0 },
  }}
>
  <Button sx={{ backgroundColor: "#ffccbc", color: "#100412ff" }}
    variant="contained"
    onClick={() => {
      const base = window.location.origin;
      const path = window.location.pathname.includes("github.io")
        ? "/Wine_App/#/restaurant/requestwineform"
        : "/Wine_App/#/restaurant/requestwineform";
      window.location.href = base + path;
    }}
  >
    Request Wine
  </Button>
          <Button href="#/user-view" variant="contained" sx={{ backgroundColor: "#ffccbc", color: "#100412ff" }}>
            User View
          </Button>
          <Button onClick={logout} variant="contained" sx={{ backgroundColor: "#ffccbc", color: "#100412ff" }}>
            Logout
          </Button>
        </Box>
      </Box>


      {/* Search Inputs */}
      <Box sx={{ p: 2}}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-evenly">
          <Grid item xs={12} sm={6}>
            <TextField
              label="Search by Region"
              fullWidth
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Search Wine"
              fullWidth
              value={wineName}
              onChange={(e) => setWineName(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Wine Collection */}
      <Box sx={{ px: 2 }}>
        <Typography variant="h6" sx={{ mt: 2 }}>
          My Wine Collection
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          viewing {wines.length} out of {wines.length}
        </Typography>

        {wines.map((entry, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography fontWeight="bold">
                {entry.wine?.wine_name || "Unnamed wine"}
              </Typography>
              <Typography>{entry.wine?.company}</Typography>
              <Typography variant="caption" color="textSecondary">
                {entry.wine?.region} • {entry.wine?.country} • {entry.wine?.vintage}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Price: ${entry.price_override ?? "—"}
              </Typography>
              {entry.wine?.image_url && (
                <img
                  src={
      entry.wine.image_url?.startsWith("http")
        ? entry.wine.image_url
        : `${process.env.PUBLIC_URL}${entry.wine.image_url}`
    }
                  alt={entry.wine.wine_name}
                    style={{
    maxWidth: "100px",
    maxHeight: "120px",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    marginTop: "8px",
    borderRadius: "6px"
  }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>

<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Typography variant="caption" sx={{ mb: 0.5 }}>
      {entry.is_active ? "In Stock" : "Out of Stock"}
    </Typography>
    <Switch
      checked={entry.is_active}
      onChange={() => toggleStock(entry.wine.id)}
      color="primary"
    />
  </Box>

  <Box sx={{ display: "flex", gap: 1 }}>
    <Button
      variant="contained"
      size="small"
      sx={{
        backgroundColor: "#0033cc",
        "&:hover": { backgroundColor: "#0026a3" },
        minWidth: "100px",
        padding: "6px 12px"
      }}
      onClick={() => handleEditClick(entry)}
    >
      Edit Price
    </Button>
    <Button
      variant="outlined"
      color="error"
      size="small"
      sx={{ minWidth: "100px", padding: "6px 12px" }}
      onClick={() => handleDeleteClick(entry)}
    >
      Delete
    </Button>
  </Box>
  
</Box>
</Box>
          </Paper>
        ))}
      </Box>
  
      {/* Edit Price Modal */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Wine Price</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography gutterBottom>
            <strong>{selectedWine?.wine?.wine_name}</strong>
          </Typography>
          <Typography variant="body2" gutterBottom color="textSecondary">
            Current Price: ${selectedWine?.price_override}
          </Typography>
          <TextField
            label="New Price ($)"
            type="number"
            fullWidth
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Type <strong>delete</strong> to confirm deleting{" "}
            <strong>{selectedWine?.wine?.wine_name}</strong>.
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button
            onClick={() => {
              console.log("Confirmed delete:", selectedWine?.wine?.id);
              setOpenConfirm(false);
            }}
            color="error"
            variant="contained"
            disabled={confirmText.trim().toLowerCase() !== "delete"}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: "#fce8dd",
          color: "#333",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.9rem",
          mt: "auto",
        }}
      >
        <Typography fontWeight="bold">Wine List</Typography>
        <Link href="mailto:support@wineapp.com" underline="hover" color="inherit">
          Contact Us
        </Link>
      </Box>
    </Box>
  );
}
