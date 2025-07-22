import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Paper, Link
} from "@mui/material";

export default function AddRestaurant() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("Restaurant added successfully!");
      setForm({ name: "", email: "", address: "", password: "" });
    } else {
      alert("Failed to add restaurant");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine List</Typography>
        <Button href="/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>Dashboard</Button>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Add Restaurant</Typography>
        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Name" name="name" value={form.name} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" name="email" value={form.email} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Address" name="address" value={form.address} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" type="password" name="password" value={form.password} onChange={handleChange} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" color="primary">Submit</Button>
          </form>
        </Paper>
      </Box>

      <Box
        sx={{
          backgroundColor: "#d8f0ef",
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
