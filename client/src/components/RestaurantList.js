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
  fetch("http://localhost:5000/api/restaurants", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
    console.log("Fetched restaurant data:", data);
  if (Array.isArray(data)) {
    setRestaurants(data);
  } else {
    console.error("Expected array, got:", data);
    setRestaurants([]); 
  }
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
    const res = await fetch(`http://localhost:5000/api/restaurants/${selectedRestaurant.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
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
    const res = await fetch(`http://localhost:5000/api/restaurants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ member_status: newStatus }),
    });

    const result = await res.json();
    console.log("PUT result:", result);

    if (res.ok) {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, member_status: newStatus } : r))
      );
    } else {
      console.error("Failed to update status:", result.error);
      alert("Error: " + result.error);
    }
  } catch (err) {
    console.error("Request failed:", err);
    alert("Failed to update member status.");
  }
};



  const handleRowClick = (id) => {
  const base = window.location.origin;
  const path = window.location.pathname.includes("github.io")
    ? `/Wine_App/#/admin/restaurantlibrary/${id}`
    : `/Wine_App/#/admin/restaurantlibrary/${id}`;
  window.location.href = base + path;
};
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc", display: "flex", flexDirection: "column" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Restaurant List</Typography>
        <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
        Dashboard
        </Button>

      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#ffffff" }}>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Contact_Name</TableCell>
              <TableCell>Contact_Email</TableCell>
              <TableCell>Address</TableCell>
              <TableCell># of Wines</TableCell>
              <TableCell>Membership</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {restaurants.map((r) => (
              <TableRow
  hover
  sx={{
    cursor: "pointer",
    transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
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
                <TableCell>{r.contact_name}</TableCell>
                <TableCell>{r.contact_email}</TableCell>
                <TableCell>{r.address || "-"}</TableCell>
                <TableCell>{r.restaurant_wines?.[0]?.count || 0}</TableCell>
 <TableCell>
  <Box
    sx={{ display: "flex", alignItems: "center" }}
    onClick={(e) => e.stopPropagation()}
  >
    <Switch
      checked={r.member_status === "active"}
      onChange={(e) => {
        e.stopPropagation(); // prevent row click
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
                  <IconButton onClick={(e) => { e.stopPropagation(); handleEdit(r); }}>
  <EditIcon />
</IconButton>
<IconButton onClick={(e) => { e.stopPropagation(); handleDelete(r); }}>
  <DeleteIcon />
</IconButton>

                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

<Box sx={{ mt: 2, px: 2 }}>
  <Button
    variant="contained"
    onClick={() => {
      const base = window.location.origin;
      const path = window.location.pathname.includes("github.io")
        ? "/Wine_App/#/admin/restaurantlist/add"
        : "/Wine_App/#/admin/restaurantlist/add";
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
            label="Contact_Name"
            value={selectedRestaurant?.contact_name || ""}
            onChange={(e) => setSelectedRestaurant((prev) => ({ ...prev, contact_name: e.target.value }))}
          />
                    <TextField
            label="Contact_Email"
            value={selectedRestaurant?.contact_email || ""}
            onChange={(e) => setSelectedRestaurant((prev) => ({ ...prev, contact_email: e.target.value }))}
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
  variant="contained"
  onClick={async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${selectedRestaurant.id}`, {
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
      console.error("Update error:", err);
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
  onClick={async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${selectedRestaurant.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        setRestaurants((prev) => prev.filter((r) => r.id !== selectedRestaurant.id));
        setOpenConfirm(false);
        setConfirmText(""); // optional: reset confirm input
      } else {
        const result = await res.json();
        alert("Delete failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Request failed");
    }
  }}
>
  Confirm Delete
</Button>

        </DialogActions>
      </Dialog>
    </Box>
  );
}
