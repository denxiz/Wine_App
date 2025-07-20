import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [wineManagerCount, setWineManagerCount] = useState(0);
  const [wineRequestCount, setWineRequestCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setWineManagerCount(data.length);
      })
      .catch((err) => console.error("Failed to load users", err));

    fetch("/api/admin/restaurants/count")
      .then((res) => res.json())
      .then((data) => setRestaurantCount(data.count))
      .catch((err) => console.error("Failed to load restaurants count", err));

    fetch("/api/admin/wine-requests/count")
      .then((res) => res.json())
      .then((data) => setWineRequestCount(data.count))
      .catch((err) => console.error("Failed to load wine requests count", err));
  }, []);

  const handleEdit = (userId) => {
    console.log("Edit user", userId);
  };

  const handleDelete = (userId) => {
    console.log("Delete user", userId);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" , backgroundColor: "#f4fdfc"}}>
      {/* Top Header */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          padding: "1rem",
          borderBottom: "1px solid #ccc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Wine List <span style={{ fontWeight: "normal" }}>- ADMIN VIEW</span>
        </Typography>
        <TextField
          size="small"
          placeholder="Search for a user"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Top Navigation Bar */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          px: 2,
          py: 1,
          borderBottom: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap"
        }}
      >
        <Button variant="text" href="/admin/restaurantlist">Restaurants</Button>
        <Button variant="text" href="/admin/wines/add">Add Wine</Button>
        <Button variant="text" href="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" href="/user-view">User View</Button>
      </Box>

      {/* Dashboard Content */}
      <Box sx={{ backgroundColor: "#f4fdfc", p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Dashboard - ADMIN VIEW
        </Typography>

        {/* Stat Boxes */}
        <Box sx={{ display: "flex", justifyContent: "center",flexWrap: "wrap", gap: 10, mb: 3, }}>
          <Button href="/admin/wines" sx={{ p: 0 }}>
            <Paper elevation={2} sx={{ p: 2, minWidth: 240, transition: "transform 0.2s ease, box-shadow 0.2s ease", "&:hover": { transform: "scale(1.03)", boxShadow: 6 } }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">Wine Manager</Typography>
              <Typography variant="h5" fontWeight="bold">{wineManagerCount}</Typography>
            </Paper>
          </Button>

          <Button href="/admin/restaurantlist" sx={{ p: 0 }}>
            <Paper elevation={2} sx={{ p: 2, minWidth: 240, transition: "transform 0.2s ease, box-shadow 0.2s ease", "&:hover": { transform: "scale(1.03)", boxShadow: 6 } }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">Restaurant List</Typography>
              <Typography variant="h5" fontWeight="bold">{restaurantCount}</Typography>
            </Paper>
          </Button>

          <Button href="/admin/wine-requests" sx={{ p: 0 }}>
            <Paper elevation={2} sx={{ p: 2, minWidth: 240, transition: "transform 0.2s ease, box-shadow 0.2s ease", "&:hover": { transform: "scale(1.03)", boxShadow: 6 } }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">Wine Requests</Typography>
              <Typography variant="h5" fontWeight="bold">{wineRequestCount}</Typography>
            </Paper>
          </Button>
        </Box>

        {/* Users Table */}
        <Typography variant="h6" sx={{ mb: 1 }}>Users</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Address</TableCell>
                <TableCell># of wines</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, idx) => (
                <TableRow key={idx}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.address}</TableCell>
                  <TableCell>{user.wine_count}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(user.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(user.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

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
