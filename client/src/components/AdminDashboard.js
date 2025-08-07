import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Link,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import logout from "../utils/logout";

export default function AdminDashboard() {
  const [wineCount, setWineCount] = useState(null);
  const [restaurantCount, setRestaurantCount] = useState(null);
  const [wineRequestCount, setWineRequestCount] = useState(null);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

useEffect(() => {
  const token = localStorage.getItem("token");

  fetch(`${apiBaseUrl}/api/admin/wines/count`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => res.json())
    .then((data) => setWineCount(data.count))
    .catch(() => setWineCount("—"));

  fetch(`${apiBaseUrl}/api/admin/restaurants/count`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => res.json())
    .then((data) => setRestaurantCount(data.count))
    .catch(() => setRestaurantCount("—"));

  fetch(`${apiBaseUrl}/api/admin/wine-requests/count`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => res.json())
    .then((data) => setWineRequestCount(data.count))
    .catch(() => setWineRequestCount("—"));
}, []);


  // Loading state
  const loading = (val) =>
    val === null ? <CircularProgress size={24} /> : val;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4fdfc" }}>
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
          Wine List <span style={{ fontWeight: "bold" }}>- Admin</span>
        </Typography>
        <Button onClick={logout} variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
                    Logout
                  </Button>
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
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist">Restaurants</Button>
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/add">Add Wine</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
      </Box>

      {/* Dashboard Content */}
      <Box sx={{ backgroundColor: "#f4fdfc", p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Dashboard
        </Typography>

        {/* Stat Boxes (Responsive Grid) */}
        <Grid container spacing={3} justifyContent="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Button component={RouterLink} to="/admin/wines" sx={{ width: "100%", p: 0 }}>
              <Paper elevation={2}
                sx={{
                  p: 2,
                  width: "100%",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Wine Database</Typography>
                <Typography variant="h5" fontWeight="bold">{loading(wineCount)}</Typography>
              </Paper>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button component={RouterLink} to="/admin/restaurantlist" sx={{ width: "100%", p: 0 }}>
              <Paper elevation={2}
                sx={{
                  p: 2,
                  width: "100%",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Restaurant List</Typography>
                <Typography variant="h5" fontWeight="bold">{loading(restaurantCount)}</Typography>
              </Paper>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button component={RouterLink} to="/admin/wine-requests" sx={{ width: "100%", p: 0 }}>
              <Paper elevation={2}
                sx={{
                  p: 2,
                  width: "100%",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Wine Requests</Typography>
                <Typography variant="h5" fontWeight="bold">{loading(wineRequestCount)}</Typography>
              </Paper>
            </Button>
          </Grid>
        </Grid>
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
