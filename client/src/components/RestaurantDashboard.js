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
  const [restaurantLogo, setRestaurantLogo] = useState("");
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
  const fetchRestaurantData = async () => {
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");

    if (!restaurantId || !token) {
      console.error("Missing auth or restaurantId");
      return;
    }

    try {
      // Fetch wines
      const wineRes = await fetch(`${apiBaseUrl}/api/restaurant/${restaurantId}/wines`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { wines } = await wineRes.json();
      setAllWines(wines);
      setWines(wines);
    } catch (err) {
      console.error("Error fetching wines:", err.message);
    }

    try {
      // Fetch restaurant info (logo)
      const infoRes = await fetch(`${apiBaseUrl}/api/restaurant/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await infoRes.json();
      console.log("Restaurant Info:", data); // <- ADD THIS
      setRestaurantLogo(data.logo_url) // assuming logo_url is the correct column name
    } catch (err) {
      console.error("Error fetching restaurant info:", err.message);
    }
  };

  fetchRestaurantData();
}, []);


  useEffect(() => {
    const filtered = allWines.filter((entry) =>
      normalizeText(entry.region).includes(normalizeText(region)) &&
      normalizeText(entry.wine_name).includes(normalizeText(wineName))
    );
    setWines(filtered);
  }, [region, wineName, allWines]);

  const normalizeText = (str) =>
    str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

 const toggleStock = async (wine_id) => {
  const restaurantId = localStorage.getItem("restaurantId");
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${restaurantId}/update-availability`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ wine_id }),
    });

    if (!res.ok) throw new Error(await res.text());

    setWines((prev) =>
      prev.map((entry) =>
        entry.id === wine_id ? { ...entry, available: !entry.available } : entry
      )
    );
  } catch (err) {
    console.error(err);
    alert("Failed to update availability.");
  }
};



  const handleEditClick = (entry) => {
    setSelectedWine(entry);
    setPrice(entry.price);
    setOpenEdit(true);
  };

const handleSave = async () => {
  const restaurantId = localStorage.getItem("restaurantId");
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${restaurantId}/update-price`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        wine_id: selectedWine.id,
        price_override: parseFloat(price),
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    setWines((prev) =>
      prev.map((entry) =>
        entry.id === selectedWine.id ? { ...entry, price: parseFloat(price) } : entry
      )
    );

    setOpenEdit(false);
  } catch (err) {
    console.error(err);
    alert("Failed to update price.");
  }
};



  const handleDeleteClick = (entry) => {
    setSelectedWine(entry);
    setConfirmText("");
    setOpenConfirm(true);
  };
const handleDeleteConfirm = async () => {
  const restaurantId = localStorage.getItem("restaurantId");
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${restaurantId}/unassign-wine/${selectedWine.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(await res.text());

    setWines((prev) => prev.filter((wine) => wine.id !== selectedWine.id));
    setAllWines((prev) => prev.filter((wine) => wine.id !== selectedWine.id));
    setOpenConfirm(false);
  } catch (err) {
    console.error(err);
    alert("Failed to unassign wine.");
  }
};


  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor:"#fff7f2" }}>
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
          <Typography variant="h6" fontWeight="bold">Wine List</Typography>
          {restaurantLogo ? (
  <img
    src={restaurantLogo}
    alt="Restaurant Logo"
    style={{
      marginLeft: 30,
      height: 60,
      width: "auto",
      marginRight: 12,
      borderRadius: 8,
      objectFit: "contain",
    }}
    onError={(e) => {
      e.target.style.display = "none"; // Hide if load fails
    }}
  />
) : (
  <Typography sx={{ marginLeft: 2 }}>No Logo</Typography>
)}

        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#ffccbc", color: "#100412ff" }}
            onClick={() => {
              const base = window.location.origin;
              const path = "#/restaurant/requestwineform";
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

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
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
    flexDirection: { xs: "column", sm: "row" },
    justifyContent: "space-between",
    alignItems: { xs: "flex-start", sm: "center" },
    gap: 2,
  }}
>
  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
    {entry.wine_image_url && (
      <Box
        component="img"
        src={entry.wine_image_url}
        alt={entry.wine_name}
        sx={{
          height: "100px",
          width: "auto",
          objectFit: "contain",
          mr: 2,
          borderRadius: 1,
          transition: "transform 0.3s ease",
          "&:hover": {
            transform: "scale(2)",  
        
          },
        }}
      />
    )}

    <Box>
      <Typography fontWeight="bold">{entry.wine_name}</Typography>
      <Typography>{entry.company}</Typography>
      <Typography variant="caption" color="textSecondary">
        {entry.region} • {entry.country} • {entry.vintage}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Price: ${entry.price ?? "—"}
      </Typography>
    </Box>
  </Box>

  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm:"row" },
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 1,
      mt: { xs: 2, sm: 0 },
    }}
  >
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="caption">
        {entry.available ? "In Stock" : "Out of Stock"}
      </Typography>
      <Switch
        checked={entry.available}
        onChange={() => toggleStock(entry.id)}
        color="primary"
      />
    </Box>
    <Button
      variant="contained"
      size="small"
      sx={{
        backgroundColor: "#0033cc",
        "&:hover": { backgroundColor: "#0026a3" },
        minWidth: "100px",
      }}
      onClick={() => handleEditClick(entry)}
    >
      Edit Price
    </Button>
    <Button
      variant="outlined"
      color="error"
      size="small"
      onClick={() => handleDeleteClick(entry)}
    >
      Delete
    </Button>
  </Box>
</Paper>


        ))}
      </Box>

      {/* Edit Price Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Wine Price</DialogTitle>
        <DialogContent>
          <Typography gutterBottom><strong>{selectedWine?.wine_name}</strong></Typography>
          <Typography variant="body2" gutterBottom color="textSecondary">
            Current Price: ${selectedWine?.price}
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
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Type <strong>delete</strong> to confirm deleting <strong>{selectedWine?.wine_name}</strong>.
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
    onClick={handleDeleteConfirm}
    color="error"
    variant="contained"
    disabled={confirmText.trim().toLowerCase() !== "delete"}
  >
    Confirm Delete
  </Button>
</DialogActions>

      </Dialog>

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
