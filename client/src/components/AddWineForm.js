import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Paper, Link, RadioGroup, Radio,
  FormControlLabel, FormControl, FormLabel
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
export default function AddWineForm() {
  const [form, setForm] = useState({
    wine_name: "",
    company: "",
    country: "",
    region: "",
    vintage: "",
    type: "",
    body: "",
    notes: "",
    image: null,
  });
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.image) {
      alert("❌ Please upload a wine image.");
      return;
    }

    let imageUrl = "";

    try {
      const formData = new FormData();
      formData.append("file", form.image);

      const uploadRes = await fetch(`${apiBaseUrl}/api/upload-wine-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const contentType = uploadRes.headers.get("content-type");
      if (!uploadRes.ok) {
        const raw = await uploadRes.text();
        throw new Error(`Image upload failed: ${raw}`);
      }
      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected response. Image upload failed.");
      }

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;

      const winePayload = {
        wine_name: form.wine_name,
        company: form.company,
        country: form.country,
        region: form.region,
        vintage: parseInt(form.vintage),
        type: form.type,
        body: form.body,
        notes: form.notes,
        wine_image_url: imageUrl,
      };

      const res = await fetch(`${apiBaseUrl}/api/wines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(winePayload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add wine.");

      alert("✅ Wine added!");
      setForm({
        wine_name: "",
        company: "",
        country: "",
        region: "",
        vintage: "",
        type: "Red",
        body: "Light",
        notes: "",
        image: null,
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
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
      </Box>
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Add Wine</Typography>
        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Wine Name" name="wine_name" value={form.wine_name} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Company" name="company" value={form.company} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Country" name="country" value={form.country} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Region" name="region" value={form.region} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Vintage" name="vintage" type="number" value={form.vintage} onChange={handleChange} sx={{ mb: 2 }} />

            <FormControl sx={{ mb: 2 }}>
              <FormLabel>Type</FormLabel>
              <RadioGroup name="type" value={form.type} onChange={handleChange} row>
                <FormControlLabel value="Red" control={<Radio />} label="Red" />
                <FormControlLabel value="White" control={<Radio />} label="White" />
                <FormControlLabel value="Rose" control={<Radio />} label="Rose" />
              </RadioGroup>
            </FormControl>

            <FormControl sx={{ mb: 2 }}>
              <FormLabel>Body</FormLabel>
              <RadioGroup name="body" value={form.body} onChange={handleChange} row>
                <FormControlLabel value="Light" control={<Radio />} label="Light" />
                <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                <FormControlLabel value="Full" control={<Radio />} label="Full" />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "flex-start", mt: 2 }}>
              <Button variant="outlined" component="label">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>

              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </Box>

            {form.image && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {form.image.name}
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
