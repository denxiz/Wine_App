import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, RadioGroup, FormControlLabel,
  Radio, FormControl, FormLabel, Paper, Link
} from "@mui/material";
import { jwtDecode } from "jwt-decode";

export default function RequestWinePage() {
  const [form, setForm] = useState({
    wine_name: "",
    company: "",
    country: "",
    region: "",
    vintage: "",
    type: "",
    body: "",
    notes: "",
  });

  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const decoded = jwtDecode(token);
  const restaurant_id = decoded.restaurant_id;
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  let imageUrl = null;

  // 1. If imageFile exists, upload it and get URL
  if (imageFile) {
    const imageFormData = new FormData();
    imageFormData.append('file', imageFile);

    const uploadRes = await fetch(`${apiBaseUrl}/api/upload-wine-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // If your upload route is protected
      body: imageFormData
    });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      imageUrl = url;
    } else {
      alert("Image upload failed");
      return;
    }
  }

  // 2. Submit wine request with image url
  const payload = {
    ...form,
    vintage: parseInt(form.vintage),
    image_url: imageUrl,
    restaurant_id
  };

  const response = await fetch(`${apiBaseUrl}/api/request-wine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("✅ Wine request submitted!");
    setForm({ wine_name: "", company: "", country: "", region: "", vintage: "", type: "", body: "", notes: "" });
    setImageFile(null);
  } else {
    const error = await response.json();
    alert(`❌ Failed: ${error.error}`);
  }
};

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fff7f2" }}>
      <Box sx={{ backgroundColor: "#fce8dd", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine List</Typography>
        <Button href="#/restaurant" variant="contained" sx={{ backgroundColor: "#ffccbc", color: "#100412ff" }}>Back to Dashboard</Button>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Request a Wine</Typography>
        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Wine Name" name="wine_name" value={form.wine_name} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Company" name="company" value={form.company} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Country" name="country" value={form.country} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Region" name="region" value={form.region} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Vintage" name="vintage" type = "number"  inputProps={{ min: 1000, max: 9999 }} value={form.vintage} onChange={handleChange} required sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
              <input
  type="radio"
  name="type"
  value={form.type}
  required
  style={{ display: "none" }}
  readOnly
/>
              <FormControl component="fieldset">
                <FormLabel component="legend">Type</FormLabel>
                <RadioGroup name="type" value={form.type} onChange={handleChange}>
                  <FormControlLabel value="Red" control={<Radio />} label="Red" />
                  <FormControlLabel value="White" control={<Radio />} label="White" />
                  <FormControlLabel value="Rose" control={<Radio />} label="Rose" />
                </RadioGroup>
              </FormControl>
<input
  type="radio"
  name="body"
  value={form.body}
  required
  style={{ display: "none" }}
  readOnly
/>
              <FormControl component="fieldset">
                <FormLabel component="legend">Body</FormLabel>
                <RadioGroup name="body" value={form.body} onChange={handleChange}>
                  <FormControlLabel value="Light" control={<Radio />} label="Light" />
                  <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                  <FormControlLabel value="Full" control={<Radio />} label="Full" />
                </RadioGroup>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
<Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
  <Button variant="outlined" component="label">
    Upload Image
    <input hidden type="file" accept="image/*" onChange={handleImageChange} />
  </Button>

  {imageFile && (
    <Typography variant="body2">
      Selected: {imageFile.name}
    </Typography>
  )}

  <Button type="submit" variant="contained" color="primary">
    Submit Request
  </Button>
</Box>

          </form>
        </Paper>
      </Box>

      <Box
        sx={{
          backgroundColor: "#fce8dd",
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
