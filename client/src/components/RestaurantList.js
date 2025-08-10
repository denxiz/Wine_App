import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, Link, MenuItem, Select, InputLabel, FormControl, Grid
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link as RouterLink } from "react-router-dom";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // Search/filter state
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/restaurants`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRestaurants(data);
        else setRestaurants([]);
      })
      .catch((err) => console.error("Failed to fetch restaurants:", err));
  }, []);

  const handleEdit = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setOpenEdit(true);
  };

  const handleDelete = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setConfirmText(""); // Reset confirmation input
    setOpenConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/restaurants/${selectedRestaurant.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setRestaurants((prev) => prev.filter((r) => r.id !== selectedRestaurant.id));
        setOpenConfirm(false);
        setConfirmText("");
      } else {
        const result = await res.json();
        alert("Delete failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Request failed");
    }
  };

  const toggleMembership = async (id) => {
    const restaurant = restaurants.find((r) => r.id === id);
    const newStatus = restaurant.member_status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${apiBaseUrl}/api/restaurants/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ member_status: newStatus }),
      });
      const result = await res.json();
      if (res.ok) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, member_status: newStatus } : r))
        );
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Failed to update member status.");
    }
  };

  const handleRowClick = (id) => {
    const base = window.location.origin;
    const path = window.location.pathname.includes("github.io")
      ? `#/admin/restaurantlibrary/${id}`
      : `#/admin/restaurantlibrary/${id}`;
    window.location.href = base + path;
  };

  // Filtering logic
  const normalize = (v) => v?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
  const filteredRestaurants = restaurants.filter((r) =>
    normalize(r.name).includes(normalize(searchName)) &&
    normalize(r.email).includes(normalize(searchEmail)) &&
    (
      statusFilter === "all" ||
      (statusFilter === "active" && r.member_status === "active") ||
      (statusFilter === "inactive" && r.member_status === "inactive")
    )
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc", display: "flex", flexDirection: "column" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Restaurant List</Typography>
        <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
          Dashboard
        </Button>
      </Box>
      {/* Top Navigation Bar */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          px: 2, py: 1, borderBottom: "1px solid #ccc",
          display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap"
        }}>
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/add">Add Wine</Button>
        <Button variant="text" component={RouterLink} to="/admin/assign-image">Assign Wine Image</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
      </Box>

      {/* Search & Filter */}
      <Grid container spacing={2} sx={{ p: 2 }}>
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            label="Search by Restaurant Name"
            fullWidth
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            label="Search by Email"
            fullWidth
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={e => setStatusFilter(e.target.value)}
              sx={{ backgroundColor: "" }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#ffffff" }}>
              <TableCell>Restaurant Name</TableCell>
              <TableCell>Restaurant Email</TableCell>
              <TableCell>Restaurant Address</TableCell>
              <TableCell>Contact_Name</TableCell>
              <TableCell>Contact_Email</TableCell>
              <TableCell>logo_url</TableCell>
              <TableCell># of Wines</TableCell>
              <TableCell>Membership</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRestaurants.map((r) => (
              <TableRow
                key={r.id}
                hover
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  "&:hover": {
                    transform: "scale(1.015)",
                    boxShadow: 1,
                    backgroundColor: "#f0ffff",
                  }
                }}
                onClick={() => handleRowClick(r.id)}
              >
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.address || "-"}</TableCell>
                <TableCell>{r.contact_name}</TableCell>
                <TableCell>{r.contact_email}</TableCell>
                <TableCell> {r.logo_url ? (<a href={r.logo_url}
                      target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", wordBreak: "break-all" }}>
                      {r.logo_url} </a>) : ("-")}</TableCell>
                
                <TableCell>{r.restaurant_wines?.[0]?.count || 0}</TableCell>
                <TableCell>
                  <Box
                    sx={{ display: "flex", alignItems: "center" }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Switch
                      checked={r.member_status === "active"}
                      onChange={e => {
                        e.stopPropagation();
                        toggleMembership(r.id);
                      }}
                      color="primary"
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {r.member_status === "active" ? "Active" : "Inactive"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={e => { e.stopPropagation(); handleEdit(r); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={e => { e.stopPropagation(); handleDelete(r); }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add New Restaurant Button */}
      <Box sx={{ mt: 2, px: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            const base = window.location.origin;
            const path = "#/admin/restaurantlist/add";
            window.location.href = base + path;
          }}
        >
          Add New Restaurant
        </Button>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Restaurant</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Restaurant Name"
            variant="outlined"
            value={selectedRestaurant?.name || ""}
            onChange={e => setSelectedRestaurant((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            label="Restaurant Email"
            value={selectedRestaurant?.email || ""}
            onChange={e => setSelectedRestaurant((prev) => ({ ...prev, email: e.target.value }))}
          />
          <TextField
            label="Restaurant Address"
            value={selectedRestaurant?.address || ""}
            onChange={e => setSelectedRestaurant((prev) => ({ ...prev, address: e.target.value }))}
          />
          <TextField
            label="Contact_Name"
            value={selectedRestaurant?.contact_name || ""}
            onChange={e => setSelectedRestaurant((prev) => ({ ...prev, contact_name: e.target.value }))}
          />
          <TextField
            label="Contact_Email"
            value={selectedRestaurant?.contact_email || ""}
            onChange={e => setSelectedRestaurant((prev) => ({ ...prev, contact_email: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const res = await fetch(`${apiBaseUrl}/api/restaurants/${selectedRestaurant.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify({
                    name: selectedRestaurant.name,
                    email: selectedRestaurant.email,
                    contact_name: selectedRestaurant.contact_name,
                    contact_email: selectedRestaurant.contact_email,
                    address: selectedRestaurant.address,
                    member_status: selectedRestaurant.member_status
                  }),
                });

                if (res.ok) {
                  setRestaurants((prev) =>
                    prev.map((r) =>
                      r.id === selectedRestaurant.id
                        ? { ...r, ...selectedRestaurant }
                        : r
                    )
                  );
                  setOpenEdit(false);
                } else {
                  const result = await res.json();
                  alert("Update failed: " + (result.error || "Unknown error"));
                }
              } catch (err) {
                alert("Request failed");
              }
            }}
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
            onChange={e => setConfirmText(e.target.value)}
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
            onClick={handleDeleteConfirmed}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          color: "#fff",
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
