import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Paper, Link
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";


export default function AddRestaurant() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact_name: "",
    contact_email: "",
    address: "",
    password: "",
    logo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  let imageUrl = "";

  try {
    // Step 1: Upload the logo if one is selected
    if (form.logo) {
      const formData = new FormData();
      formData.append("file", form.logo);

const uploadRes = await fetch(`${apiBaseUrl}/api/logo`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: formData,
});

      const contentType = uploadRes.headers.get("content-type");

      if (!uploadRes.ok) {
        const raw = await uploadRes.text();
        throw new Error(`Logo upload failed: ${raw}`);
      }

      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected response. Logo upload failed.");
      }

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
    }

    // Step 2: Create restaurant payload
    const restaurantPayload = {
      name: form.name,
      email: form.email,
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      address: form.address,
      password: form.password,
      logo_url: imageUrl, // this will be "" if not uploaded
    };

    const res = await fetch(`${apiBaseUrl}/api/admin/restaurants`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify(restaurantPayload),
});

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData?.error || "Failed to add restaurant.");
    }

    alert("✅ Restaurant added!");
    setForm({
      name: "",
      email: "",
      contact_name: "",
      contact_email: "",
      address: "",
      password: "",
      logo: null,
    });

  } catch (err) {
    console.error("Submit error:", err);
    alert(`❌ ${err.message}`);
  }
};



  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine List</Typography>
        <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>Dashboard</Button>
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
            <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
            <Button variant="text" component={RouterLink} to="/admin/wines/add">Add Wine</Button>
            <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
            <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
          </Box>
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Add Restaurant</Typography>
        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Name" name="name" value={form.name} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" name="email" value={form.email} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Contact Name" name="contact_name" value={form.contact_name} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Contact Email" name="contact_email" value={form.contact_email} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Address" name="address" value={form.address} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" type="password" name="password" value={form.password} onChange={handleChange} sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "flex-start", mt: 2 }}>
              <Button variant="outlined" component="label">
                Logo Upload
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setForm((prev) => ({ ...prev, logo: file }));
                    }
                  }}
                />
              </Button>

              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </Box>

            {form.logo && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {form.logo.name}
              </Typography>
            )}
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
