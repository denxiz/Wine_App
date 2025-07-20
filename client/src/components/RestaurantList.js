import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    setRestaurants([
      {
        id: 1,
        name: "Meyhouse Palo Alto",
        email: "paloalto@meyhouse.com",
        address: "343 University Ave, Palo Alto, CA",
        wine_count: 12,
        is_active: true
      },
      {
        id: 2,
        name: "Meyhouse SF",
        email: "sf@meyhouse.com",
        address: "123 Mission St, San Francisco, CA",
        wine_count: 8,
        is_active: false
      }
    ]);
  }, []);

  const handleEdit = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setOpenEdit(true);
  };

  const handleDelete = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setOpenConfirm(true);
  };

  const toggleMembership = (id) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r
      )
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc", display: "flex", flexDirection: "column" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Restaurant List</Typography>
        <Button href="/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
          Dashboard
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#d8f0ef" }}>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Location</TableCell>
              <TableCell># of Wines</TableCell>
              <TableCell>Membership</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {restaurants.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.address || "-"}</TableCell>
                <TableCell>{r.wine_count}</TableCell>
                <TableCell>
                  <Switch
                    checked={r.is_active}
                    onChange={() => toggleMembership(r.id)}
                    color="primary"
                  />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {r.is_active ? "Active" : "Inactive"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(r)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(r)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, px: 2 }}>
        <Button variant="contained" href="/admin/restaurantlist/add">
          Add New Restaurant
        </Button>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Restaurant</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={selectedRestaurant?.name || ""}
            onChange={(e) => setSelectedRestaurant((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            label="Email"
            value={selectedRestaurant?.email || ""}
            onChange={(e) => setSelectedRestaurant((prev) => ({ ...prev, email: e.target.value }))}
          />
          <TextField
            label="Address"
            value={selectedRestaurant?.address || ""}
            onChange={(e) => setSelectedRestaurant((prev) => ({ ...prev, address: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button
            onClick={() => {
              console.log("Saved restaurant edits:", selectedRestaurant);
              setOpenEdit(false);
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Type <strong>delete</strong> to confirm deleting <strong>{selectedRestaurant?.name}</strong>.
          </Typography>
          <TextField
            fullWidth
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={confirmText.trim().toLowerCase() !== "delete"}
            onClick={() => {
              console.log("Confirmed delete for:", selectedRestaurant?.id);
              setOpenConfirm(false);
            }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
