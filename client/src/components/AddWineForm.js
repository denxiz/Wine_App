import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, RadioGroup, FormControlLabel,
  Radio, FormControl, FormLabel, Paper, Link
} from "@mui/material";

export default function AddWinePage() {
  const [form, setForm] = useState({
    wine_name: "",
    company: "",
    country: "",
    region: "",
    vintage: "",
    type: "Red",
    body: "Light",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/wines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("Wine added successfully!");
      setForm({ wine_name: "", company: "", country: "", region: "", vintage: "", type: "Red", body: "Light", notes: "" });
    } else {
      alert("Failed to add wine");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine List</Typography>
        <Button href="/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>Dashboard</Button>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Add Wine</Typography>
        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Wine Name" name="wine_name" value={form.wine_name} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Company" name="company" value={form.company} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Country" name="country" value={form.country} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Region" name="region" value={form.region} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Vintage" name="vintage" value={form.vintage} onChange={handleChange} sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Type</FormLabel>
                <RadioGroup name="type" value={form.type} onChange={handleChange}>
                  <FormControlLabel value="Red" control={<Radio />} label="Red" />
                  <FormControlLabel value="White" control={<Radio />} label="White" />
                  <FormControlLabel value="Rose" control={<Radio />} label="Rose" />
                </RadioGroup>
              </FormControl>

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
