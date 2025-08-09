import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link as MuiLink,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
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
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // Refs to focus/scroll first invalid field
  const refs = {
    wine_name: useRef(null),
    company: useRef(null),
    country: useRef(null),
    region: useRef(null),
    vintage: useRef(null),
    type: useRef(null),   // RadioGroup
    body: useRef(null),   // RadioGroup
  };
  const fileInputRef = useRef(null);     // hidden <input type="file">
  const uploadBtnRef = useRef(null);     // the visible button

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // clear this field's error as user types/selects
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setForm((prev) => ({ ...prev, image: file || null }));
    setErrors((prev) => {
      if (!prev.image) return prev;
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });
  };

  const validate = () => {
    const req = ["wine_name", "company", "country", "region", "vintage", "type", "body", "image"];
    const next = {};

    req.forEach((k) => {
      const v = k === "image" ? form.image : String(form[k] ?? "").trim();
      if (!v) next[k] = "This field is required";
    });

    // Vintage: 4-digit year in a reasonable range
    if (String(form.vintage).trim()) {
      const yr = Number(form.vintage);
      if (!Number.isInteger(yr) || yr < 1900 || yr > 2100) {
        next.vintage = "Enter a valid year (e.g., 2018)";
      }
    }

    return next;
  };

  const focusFirstError = (errs) => {
    const firstKey = Object.keys(errs)[0];
    let target = null;

    if (firstKey === "image") target = uploadBtnRef.current;
    else target = refs[firstKey]?.current;

    if (target?.focus) target.focus();
    (target || refs.wine_name.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError(next);
      return;
    }

    setSubmitting(true);
    let imageUrl = "";

    try {
      // 1) Upload image
      if (form.image) {
        const formData = new FormData();
        formData.append("file", form.image);

        const uploadRes = await fetch(`${apiBaseUrl}/api/upload-wine-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });

        const contentType = uploadRes.headers.get("content-type") || "";
        if (!uploadRes.ok) {
          const raw = await uploadRes.text();
          throw new Error(`Image upload failed: ${raw}`);
        }
        if (!contentType.includes("application/json")) {
          throw new Error("Unexpected response. Image upload failed.");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // 2) Create wine
      const winePayload = {
        wine_name: form.wine_name.trim(),
        company: form.company.trim(),
        country: form.country.trim(),
        region: form.region.trim(),
        vintage: Number(form.vintage),
        type: form.type,
        body: form.body,
        notes: form.notes.trim(),
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

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Failed to add wine.");

      alert("✅ Wine added!");
      // Reset form
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
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Submit error:", err);
      alert(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine List</Typography>
        <Button href="#/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
          Dashboard
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
          flexWrap: "wrap",
        }}
      >
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist">Restaurants</Button>
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
        <Button variant="text" component={RouterLink} to="/admin/assign-image">Assign Wine Image</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Add Wine</Typography>

        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              required
              label="Wine Name"
              name="wine_name"
              value={form.wine_name}
              inputRef={refs.wine_name}
              error={!!errors.wine_name}
              helperText={errors.wine_name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Company"
              name="company"
              value={form.company}
              inputRef={refs.company}
              error={!!errors.company}
              helperText={errors.company}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Country"
              name="country"
              value={form.country}
              inputRef={refs.country}
              error={!!errors.country}
              helperText={errors.country}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Region"
              name="region"
              value={form.region}
              inputRef={refs.region}
              error={!!errors.region}
              helperText={errors.region}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Vintage (YYYY)"
              name="vintage"
              type="number"
              value={form.vintage}
              inputRef={refs.vintage}
              error={!!errors.vintage}
              helperText={errors.vintage}
              onChange={handleChange}
              inputProps={{ min: 1900, max: 2100, step: 1 }}
              sx={{ mb: 2 }}
            />

            <FormControl sx={{ mb: 2 }} error={!!errors.type}>
              <FormLabel>Type</FormLabel>
              <RadioGroup name="type" value={form.type} onChange={handleChange} row ref={refs.type}>
                <FormControlLabel value="Red" control={<Radio />} label="Red" />
                <FormControlLabel value="White" control={<Radio />} label="White" />
                <FormControlLabel value="Rose" control={<Radio />} label="Rose" />
              </RadioGroup>
              {!!errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <FormControl sx={{ mb: 2 }} error={!!errors.body}>
              <FormLabel>Body</FormLabel>
              <RadioGroup name="body" value={form.body} onChange={handleChange} row ref={refs.body}>
                <FormControlLabel value="Light" control={<Radio />} label="Light" />
                <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                <FormControlLabel value="Full" control={<Radio />} label="Full" />
              </RadioGroup>
              {!!errors.body && <FormHelperText>{errors.body}</FormHelperText>}
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
              <Button ref={uploadBtnRef} variant="outlined" component="label">
                Upload Image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>

              <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </Box>

            {!!errors.image && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {errors.image}
              </Typography>
            )}

            {form.image && !errors.image && (
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
        <MuiLink href="mailto:support@wineapp.com" underline="hover" color="inherit">
          Contact Us
        </MuiLink>
      </Box>
    </Box>
  );
}
