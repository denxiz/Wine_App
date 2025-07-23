import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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


  useEffect(() => {
    // Sample wines
    setWines([
      {
        id: 1,
        wine_name: "Château Margaux",
        company: "Château Margaux Estate",
        region: "Bordeaux",
        type: "Red",
        vintage: 2015,
        notes: "Rich and complex with notes of blackberry and spice."
      },
      {
        id: 2,
        wine_name: "Cloudy Bay Sauvignon Blanc",
        company: "Cloudy Bay",
        region: "Marlborough",
        type: "White",
        vintage: 2021,
        notes: "Crisp and citrusy with hints of gooseberry."
      },
      {
        id: 3,
        wine_name: "Antinori Tignanello",
        company: "Marchesi Antinori",
        region: "Tuscany",
        type: "Red",
        vintage: 2018,
        notes: "Elegant with cherry, tobacco, and spice."
      }
    ]);
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
  const handleSaveEdit = () => {
  console.log("Edited wine:", selectedWine);
  setOpenEdit(false);
};


  const confirmDelete = () => {
    if (confirmText.toLowerCase() !== "delete") return;
    console.log("Confirmed delete wine", selectedWineId);
    setOpenConfirm(false);
  };

  const normalizeText = (text) =>
  text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";


  return (
    <Box sx={{ padding: 3, backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#f4fdfc", p: 1, display: "flex", justifyContent: "space-between" }}>
              <Typography variant = "h5" fontWeight="bold">Wine Database</Typography>
              <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
                Dashboard
              </Button>
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
              <TableCell>Region</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Vintage</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wines
              .filter((wine) =>
                normalizeText(wine.wine_name).includes(normalizeText(searchName)) &&
                wine.company.toLowerCase().includes(searchCompany.toLowerCase()) &&
                wine.region.toLowerCase().includes(searchRegion.toLowerCase())&&
                (searchYear === "" || String(wine.vintage).includes(searchYear))
              )
              .map((wine) => (
                <TableRow key={wine.id}>
                  <TableCell>{wine.wine_name}</TableCell>
                  <TableCell>{wine.company}</TableCell>
                  <TableCell>{wine.region}</TableCell>
                  <TableCell>{wine.type}</TableCell>
                  <TableCell>{wine.vintage}</TableCell>
                  <TableCell>{wine.notes}</TableCell>
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
        ? "/Wine_App/#/admin/wines/add"
        : "/Wine_App/#/admin/wines/add";
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
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}
