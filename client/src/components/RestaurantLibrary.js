import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, TextField, FormControl,InputLabel, Select, MenuItem, Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Autocomplete from "@mui/material/Autocomplete";


export default function RestaurantLibrary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wines, setWines] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [openAssign, setOpenAssign] = useState(false);
  const [availableWines, setAvailableWines] = useState([]);
  const [selectedWineId, setSelectedWineId] = useState(null);
  const [priceOverride, setPriceOverride] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "inactive"
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const [assignSearch, setAssignSearch] = useState("");
const [priceError, setPriceError] = useState("");


  useEffect(() => {
    fetch(`${apiBaseUrl}/api/restaurant/${id}/wines`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setWines(data.wines || []);
        setRestaurantName(data.restaurant_name || `Restaurant ${id}`);
      })
      .catch((err) => {
        console.error("Failed to load wines:", err);
        setWines([]);
        setRestaurantName(`Restaurant ${id}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, openAssign]);

const [editPriceWine, setEditPriceWine] = useState(null);
const [newPrice, setNewPrice] = useState("");

const handlePriceEdit = (wine) => {
  setEditPriceWine(wine);
  setNewPrice(wine.price ?? "");
};

const submitPriceUpdate = async () => {
  console.log("💲 Submitting new price:", newPrice, "for wine:", editPriceWine?.id);
  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/update-price`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        wine_id: editPriceWine.id,
        price_override: parseFloat(newPrice),
      }),
    });

    if (!res.ok) throw new Error("Update failed");
    const updated = await res.json();

    setWines((prev) =>
      prev.map((wine) =>
        wine.id === editPriceWine.id ? { ...wine, price: parseFloat(newPrice) } : wine
      )
    );
    setEditPriceWine(null);
    setNewPrice("");
  } catch (err) {
    alert("Failed to update price.");
    console.error("Update price error:", err);
  }
};

const handleUnassignWine = async (wineId) => {
  if (!window.confirm("Are you sure you want to remove this wine from the restaurant?")) return;

  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/unassign-wine/${wineId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) throw new Error("Failed to unassign wine");

    // Remove it from the frontend list
    setWines((prev) => prev.filter((wine) => wine.id !== wineId));
  } catch (err) {
    console.error("Unassign wine failed:", err);
    alert("Failed to unassign wine.");
  }
};


const toggleAvailable = async (wineId) => {
  console.log("🍷 Sending availability update for wine:", wineId);
  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/update-availability`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ wine_id: wineId }),
    });

    if (!res.ok) throw new Error("Failed to update availability");

    const updated = await res.json();
    setWines((prev) =>
      prev.map((wine) =>
        wine.id === wineId ? { ...wine, available: !wine.available } : wine
      )
    );
  } catch (err) {
    console.error("Toggle availability failed:", err);
    alert("Could not update availability");
  }
};


 const openAssignDialog = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("JWT token:", token);

    if (!token) {
      alert("No token found. Please log in.");
      return;
    }

    const res = await fetch(`${apiBaseUrl}/api/wines`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text(); // Get raw response text
    console.log("Raw response:", text); // ✅ Log it before parsing

    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }

    let data;
    try {
      data = JSON.parse(text); // Try to parse JSON
    } catch (parseErr) {
      console.error("Failed to parse JSON:", parseErr.message);
      throw new Error("Server returned invalid JSON.");
    }

    setAvailableWines(data);
    setOpenAssign(true);
  } catch (err) {
    console.error("openAssignDialog error:", err.message);
    alert("Could not load wines. Please try again.");
  }
};




const handleAssignWine = async () => {
  // 1) Must pick a wine
  if (!selectedWineId) {
    alert("Select a wine first");
    return;
  }

  // 2) Price is required and must be > 0
  const priceNum = Number(priceOverride);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    setPriceError("Please enter a valid price > 0");
    return;
  }
  setPriceError("");

  // 3) Submit
  try {
    const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/assign-wine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        wine_id: selectedWineId,
        price_override: priceNum, // send numeric, not string/null
      }),
    });

    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      alert("Error assigning wine: " + (result.error || "Unknown error"));
      return;
    }

    alert("Wine assigned successfully!");
    setOpenAssign(false);
    setSelectedWineId(null);
    setPriceOverride("");
  } catch (err) {
    console.error("Assign error:", err);
    alert("Failed to assign wine.");
  }
};

const wineOptions = (availableWines || []).map(w => ({
  ...w,
  label: `${w.wine_name} (${w.vintage ?? "NV"}) — ${w.company}, ${w.region}, ${w.country}`,
}));



  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc", p: 3 }}>
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          p: 2,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {restaurantName}'s Wine Library
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
                    Dashboard
                  </Button>
          <Button href="#/admin/restaurantlist" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
                    Back
                  </Button>
          <Button variant="contained" onClick={openAssignDialog} sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
  Add Wine to Library
</Button>


        </Box>
      </Box>
<Box sx={{ mb: 2 }}>
  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
    <TextField
      label="Search by Name"
      value={searchName}
      onChange={e => setSearchName(e.target.value)}
      size="small"
      sx={{ minWidth: 200 }}
    />
    <TextField
      label="Search by Company"
      value={searchCompany}
      onChange={e => setSearchCompany(e.target.value)}
      size="small"
      sx={{ minWidth: 200 }}
    />
    <TextField
      label="Search by Region"
      value={searchRegion}
      onChange={e => setSearchRegion(e.target.value)}
      size="small"
      sx={{ minWidth: 200 }}
    />
    <TextField
      label="Search by Year"
      value={searchYear}
      onChange={e => setSearchYear(e.target.value)}
      type="number"
      size="small"
      sx={{ minWidth: 120 }}
    />
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>Status</InputLabel>
      <Select
        value={statusFilter}
        label="Status"
        onChange={e => setStatusFilter(e.target.value)}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="active">Available</MenuItem>
        <MenuItem value="inactive">Unavailable</MenuItem>
      </Select>
    </FormControl>
  </Box>
</Box>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#fafafa" }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Vintage</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Body</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Edit Price</TableCell>
                <TableCell>Unassign</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wines
  .filter(wine =>
    wine.wine_name?.toLowerCase().includes(searchName.toLowerCase()) &&
    wine.company?.toLowerCase().includes(searchCompany.toLowerCase()) &&
    wine.region?.toLowerCase().includes(searchRegion.toLowerCase()) &&
    (searchYear === "" || String(wine.vintage).includes(searchYear)) &&
    (
      statusFilter === "all" ||
      (statusFilter === "active" && wine.available) ||
      (statusFilter === "inactive" && !wine.available)
    )
  )
  .map((wine) => (
    <TableRow key={wine.id}>
      <TableCell>{wine.wine_name}</TableCell>
      <TableCell>{wine.company}</TableCell>
      <TableCell>{wine.region}</TableCell>
      <TableCell>{wine.country}</TableCell>
      <TableCell>{wine.vintage}</TableCell>
      <TableCell>{wine.type}</TableCell>
      <TableCell>{wine.body}</TableCell>
      <TableCell>${wine.price ?? "-"}</TableCell>
      <TableCell>
        <Switch checked={!!wine.available} onChange={() => toggleAvailable(wine.id)} color="primary" />
      </TableCell>
      <TableCell>
        <IconButton size="small" onClick={() => handlePriceEdit(wine)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell>
        <IconButton
          size="small"
          onClick={() => handleUnassignWine(wine.id)}
          sx={{ ml: 1 }}
          color="error"
        >
          🗑️
        </IconButton>
      </TableCell>
    </TableRow>
  ))
}
{
  wines.filter(wine =>
    wine.wine_name?.toLowerCase().includes(searchName.toLowerCase()) &&
    wine.company?.toLowerCase().includes(searchCompany.toLowerCase()) &&
    wine.region?.toLowerCase().includes(searchRegion.toLowerCase()) &&
    (searchYear === "" || String(wine.vintage).includes(searchYear)) &&
    (
      statusFilter === "all" ||
      (statusFilter === "active" && wine.available) ||
      (statusFilter === "inactive" && !wine.available)
    )
  ).length === 0 && (
    <TableRow>
      <TableCell colSpan={11} align="center">
        No wines found for this restaurant.
      </TableCell>
    </TableRow>
  )
}

            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign Dialog */}

<Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="lg" fullWidth
PaperProps={{
    sx: {
      width: 960,                      // ~960px wide
      maxWidth: '90vw',               // responsive
      maxHeight: '85vh',              // taller
      borderRadius: 2
    }
  }}>
  <DialogTitle>Assign Wine to {restaurantName}</DialogTitle>
  <DialogContent sx={{ display: 'grid', gap: 2, py: 2 }}>
    <Autocomplete
  fullWidth
  options={wineOptions}
  // shows combined "Name (Year) — Region, Country"
  getOptionLabel={(opt) => opt?.label ?? ""}
  // keep equality stable by id
  isOptionEqualToValue={(opt, val) => opt.id === val.id}
  // control the currently picked option by id
  value={wineOptions.find(o => o.id === selectedWineId) || null}
  onChange={(_, val) => setSelectedWineId(val?.id ?? null)}
  // control the text the user is typing
  inputValue={assignSearch}
  onInputChange={(_, val) => setAssignSearch(val)}
  // type "name, year" to filter both
  filterOptions={(options, { inputValue }) => {
    const raw = inputValue.trim().toLowerCase();

    // if they typed "name, year"
    const [namePartRaw, yearPartRaw] = raw.split(",").map(s => s?.trim());
    const wantsYear = !!yearPartRaw && /^\d{2,4}$/.test(yearPartRaw);

    return options.filter(opt => {
      const nameHit = namePartRaw
        ? (opt.wine_name || "").toLowerCase().includes(namePartRaw)
        : (opt.label || "").toLowerCase().includes(raw);

      if (!nameHit) return false;

      if (wantsYear) {
        // accept 2 or 4 digit entry; compare to vintage end
        const vint = String(opt.vintage ?? "");
        if (!vint) return false;
        return vint.endsWith(yearPartRaw);
      }
      return true;
    });
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label={`Select a Wine (type "name" or "name, year")`}
      placeholder={`e.g., "Margaux, 2015"`}
      InputLabelProps={{ ...params.InputLabelProps}}
    />
  )}
/>


    <TextField
  label="Price (required)"
  type="number"
  value={priceOverride}
  onChange={(e) => { setPriceOverride(e.target.value); if (priceError) setPriceError(""); }}
  inputProps={{ min: 0, step: "0.01" }}
  required
  error={!!priceError}
  helperText={priceError}
/>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
    <Button
  onClick={handleAssignWine}
  variant="contained"
  disabled={!selectedWineId || !priceOverride || Number(priceOverride) <= 0}
>
  ASSIGN WINE
</Button>


  </DialogActions>
</Dialog>


<Dialog open={!!editPriceWine} onClose={() => setEditPriceWine(null)}>
  <DialogTitle>Edit Price</DialogTitle>
  <DialogContent>
    <TextField
      label="New Price"
      type="number"
      value={newPrice}
      onChange={(e) => setNewPrice(e.target.value)}
      fullWidth
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditPriceWine(null)}>Cancel</Button>
    <Button onClick={submitPriceUpdate} variant="contained">Update</Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}
