import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid, Link
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link as RouterLink } from "react-router-dom";

export default function WineListScreen() {
  const [wines, setWines] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedWineId, setSelectedWineId] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedWine, setSelectedWine] = useState(null);
  const [searchYear, setSearchYear] = useState("");
  const [searchCountry, setSearchCountry] = useState("");

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;


useEffect(() => {
  fetch(`${apiBaseUrl}/api/wines`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setWines(data);
      } else {
        console.error("Unexpected response:", data);
        setWines([]);
      }
    })
    .catch((err) => {
      console.error("Fetch error:", err);
    });
}, []);


const handleEdit = (wineId) => {
  const wine = wines.find(w => w.id === wineId);
  setSelectedWine({ ...wine }); // Clone to edit safely
  setOpenEdit(true);
};


  const handleDelete = (wineId) => {
    setSelectedWineId(wineId);
    setConfirmText("");
    setOpenConfirm(true);
  };

const handleSaveEdit = async () => {
  try {
    const res = await fetch(`${apiBaseUrl}/api/wines/${selectedWine.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(selectedWine),
    });

    if (res.ok) {
      setWines((prev) =>
        prev.map((wine) =>
          wine.id === selectedWine.id ? { ...wine, ...selectedWine } : wine
        )
      );
      setOpenEdit(false);
    } else {
      const err = await res.json();
      alert("Update failed: " + (err.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Update error:", err);
    alert("Failed to update wine.");
  }
};



const confirmDelete = async () => {
  if (confirmText.toLowerCase() !== "delete") return;

  try {
    const res = await fetch(`${apiBaseUrl}/api/wines/${selectedWineId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.ok) {
      setWines((prev) => prev.filter((w) => w.id !== selectedWineId));
      setOpenConfirm(false);
      setConfirmText("");
    } else {
      const err = await res.json();
      alert("Delete failed: " + (err.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete wine.");
  }
};


  const normalizeText = (text) =>
  text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";


  return (
    <Box sx={{ padding: 2, backgroundColor: "#d8f0ef", minHeight: '100vh' }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 1, display: "flex", justifyContent: "space-between" }}>
              <Typography variant = "h5" fontWeight="bold">Wine Database</Typography>
              <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
                Dashboard
              </Button>
            </Box>
      {/* Top Navigation Bar */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          px: 2,
          py: 1,
          borderBottom: "1px solid #d8f0ef",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap"
        }}
      >
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist">Restaurants</Button>
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/add">Add Wine</Button>
        <Button variant="text" component={RouterLink} to="/admin/assign-image">Assign Wine Image</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
      </Box>

      {/* Search Fields */}
<Grid container spacing={2} sx={{ mb: 2 }}>
  <Grid item xs={12} sm={6} md={3}>
    <TextField
      label="Search by Name"
      fullWidth
      value={searchName}
      onChange={(e) => setSearchName(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <TextField
      label="Search by Company"
      fullWidth
      value={searchCompany}
      onChange={(e) => setSearchCompany(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
  <TextField
    label="Search by Country"
    fullWidth
    value={searchCountry}
    onChange={(e) => setSearchCountry(e.target.value)}
  />
</Grid>
  <Grid item xs={12} sm={6} md={3}>
    <TextField
      label="Search by Region"
      fullWidth
      value={searchRegion}
      onChange={(e) => setSearchRegion(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <TextField
      label="Search by Year"
      type="number"
      fullWidth
      value={searchYear}
      onChange={(e) => setSearchYear(e.target.value)}
    />
  </Grid>
</Grid>


      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Wine Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Vintage</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>wine_image_url</TableCell>
              <TableCell>Actions</TableCell>
              
            </TableRow>
          </TableHead>
          <TableBody>
            {wines
              .filter((wine) =>
  (searchName === "" || normalizeText(wine.wine_name).startsWith(normalizeText(searchName))) &&
  (searchCompany === "" || wine.company.toLowerCase().startsWith(searchCompany.toLowerCase())) &&
  (searchRegion === "" || wine.region.toLowerCase().startsWith(searchRegion.toLowerCase())) &&
  (searchCountry === "" || (wine.country || "").toLowerCase().startsWith(searchCountry.toLowerCase())) &&
  (searchYear === "" || String(wine.vintage).startsWith(searchYear))
)

              .map((wine) => (
                <TableRow key={wine.id}>
                  <TableCell>{wine.wine_name}</TableCell>
                  <TableCell>{wine.company}</TableCell>
                  <TableCell>{wine.country}</TableCell>
                  <TableCell>{wine.region}</TableCell>
                  <TableCell>{wine.type}</TableCell>
                  <TableCell>{wine.vintage}</TableCell>
                  <TableCell sx={{     whiteSpace: "pre-line",   // respect \n
    wordBreak: "keep-all",    // or "normal" — don’t break inside words
    overflowWrap: "normal",   // only wrap at spaces/hyphens
    maxWidth: 450 }}>
                    {wine.notes}</TableCell>
                  <TableCell> {wine.wine_image_url ? (<a href={wine.wine_image_url}
      target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", wordBreak: "break-all" }}>
      {wine.wine_image_url} </a>) : ("-")}</TableCell>

                  <TableCell>
                    <IconButton onClick={() => handleEdit(wine.id)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton onClick={() => handleDelete(wine.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add New Wine Button */}
<Box sx={{ mt: 2, px: 2 }}>
  <Button
    variant="contained"
    onClick={() => {
      const base = window.location.origin;
      const path = window.location.pathname.includes("github.io")
        ? "#/admin/wines/add"
        : "#/admin/wines/add";
      window.location.href = base + path;
    }}
  >
    Add New Wine
  </Button>
</Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Type <strong>delete</strong> to confirm this action. This cannot be undone.
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={confirmText.toLowerCase() !== "delete"}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
              {/* Edit Confirmation Dialog */}
<Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
  <DialogTitle>Edit Wine</DialogTitle>
  <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
    <TextField
      label="Wine Name"
      value={selectedWine?.wine_name || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, wine_name: e.target.value }))}
    />
    <TextField
      label="Company"
      value={selectedWine?.company || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, company: e.target.value }))}
    />
    <TextField
      label="Country"
      value={selectedWine?.country || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, country: e.target.value }))}
    />
    <TextField
      label="Region"
      value={selectedWine?.region || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, region: e.target.value }))}
    />
    <TextField
      label="Type"
      value={selectedWine?.type || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, type: e.target.value }))}
    />
    <TextField
      label="Vintage"
      type="number"
      value={selectedWine?.vintage || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, vintage: e.target.value }))}
    />
    <TextField
      label="Notes"
      multiline
      value={selectedWine?.notes || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, notes: e.target.value }))}
    />
        <TextField
      label="Image_Url"
      multiline
      value={selectedWine?.wine_image_url || ""}
      onChange={(e) => setSelectedWine(prev => ({ ...prev, wine_image_url: e.target.value }))}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
  </DialogActions>
</Dialog>

    </Box>

    
  );
}
