import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  Link,
  FormHelperText,
  Chip,
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
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // Refs to focus and scroll first invalid field
  const refs = {
    wine_name: useRef(null),
    company: useRef(null),
    country: useRef(null),
    region: useRef(null),
    vintage: useRef(null),
    type: useRef(null), // RadioGroup
    body: useRef(null), // RadioGroup
  };
  const uploadBtnRef = useRef(null);
  const fileInputRef = useRef(null); // <-- to reset the file input

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // clear that field's error as user types/selects
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const req = ["wine_name", "company", "country", "region", "vintage", "type", "body"];
    const next = {};
    req.forEach((k) => {
      const v = String(form[k] || "").trim();
      if (!v) next[k] = "This field is required";
    });

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
    if (firstKey === "type") target = refs.type.current;
    else if (firstKey === "body") target = refs.body.current;
    else target = refs[firstKey]?.current;

    if (target?.focus) target.focus();
    (target || refs.wine_name.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // client-side validation
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError(next);
      return;
    }

    // extract restaurant_id
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }
    let restaurant_id = null;
    try {
      const decoded = jwtDecode(token);
      restaurant_id = decoded.restaurant_id;
    } catch {
      alert("Invalid session token.");
      return;
    }

    setSubmitting(true);
    let imageUrl = null;

    try {
      // 1) upload image if provided (optional)
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const uploadRes = await fetch(`${apiBaseUrl}/api/upload-wine-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: imageFormData,
        });

        const contentType = uploadRes.headers.get("content-type") || "";
        if (!uploadRes.ok) {
          const raw = await uploadRes.text();
          throw new Error(`Image upload failed: ${raw}`);
        }
        if (!contentType.includes("application/json")) {
          throw new Error("Unexpected response. Image upload failed.");
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      // 2) submit request
      const payload = {
        ...form,
        wine_name: form.wine_name.trim(),
        company: form.company.trim(),
        country: form.country.trim(),
        region: form.region.trim(),
        vintage: Number(form.vintage),
        image_url: imageUrl,
        restaurant_id,
      };

      const response = await fetch(`${apiBaseUrl}/api/request-wine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const respJson = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(respJson.error || "Failed to submit request.");

      alert("✅ Wine request submitted!");
      setForm({
        wine_name: "",
        company: "",
        country: "",
        region: "",
        vintage: "",
        type: "",
        body: "",
        notes: "",
      });
      setImageFile(null);
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
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fff7f2" }}>
      <Box sx={{ backgroundColor: "#fce8dd", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine List</Typography>
        <Button href="#/restaurant" variant="contained" sx={{ backgroundColor: "#ffccbc", color: "#100412ff" }}>
          Back to Dashboard
        </Button>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Request a Wine
        </Typography>
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

            <FormControl component="fieldset" sx={{ mb: 2 }} error={!!errors.type}>
              <FormLabel component="legend">Type</FormLabel>
              <RadioGroup
                name="type"
                value={form.type}
                onChange={handleChange}
                row
                ref={refs.type}
              >
                <FormControlLabel value="Red" control={<Radio />} label="Red" />
                <FormControlLabel value="White" control={<Radio />} label="White" />
                <FormControlLabel value="Rose" control={<Radio />} label="Rose" />
                <FormControlLabel value="Sparkling" control={<Radio />} label="Sparkling" />
              </RadioGroup>
              {!!errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <FormControl component="fieldset" sx={{ mb: 2 }} error={!!errors.body}>
              <FormLabel component="legend">Body</FormLabel>
              <RadioGroup
                name="body"
                value={form.body}
                onChange={handleChange}
                row
                ref={refs.body}
              >
                <FormControlLabel value="Light" control={<Radio />} label="Light" />
                <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                <FormControlLabel value="Full" control={<Radio />} label="Full" />
              </RadioGroup>
              {!!errors.body && <FormHelperText>{errors.body}</FormHelperText>}
            </FormControl>

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
              <Button ref={uploadBtnRef} variant="outlined" component="label">
                Upload Image (optional)
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>

              {imageFile && (
                <Chip
                  label={imageFile.name}
                  onDelete={removeImage}
                  variant="outlined"
                  sx={{ alignSelf: "flex-start" }}
                />
              )}

              <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
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
