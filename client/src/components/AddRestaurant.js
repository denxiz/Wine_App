import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link as MuiLink,
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
    logo: null,         // file object
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // refs to focus the first invalid field
  const refs = {
    name: useRef(null),
    email: useRef(null),
    contact_name: useRef(null),
    contact_email: useRef(null),
    address: useRef(null),
    password: useRef(null),
  };
  const fileInputRef = useRef(null);
  const uploadBtnRef = useRef(null); // focus target for logo error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // clear that field's error as user types
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const validate = () => {
    const req = [
      "name",
      "email",
      "contact_name",
      "contact_email",
      "address",
      "password",
      "logo", // <-- logo required
    ];
    const next = {};

    req.forEach((k) => {
      if (k === "logo") {
        if (!form.logo) next.logo = "Logo is required";
      } else {
        const v = String(form[k] ?? "").trim();
        if (!v) next[k] = "This field is required";
      }
    });

    const emailish = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailish.test(form.email)) next.email = "Enter a valid email";
    if (form.contact_email && !emailish.test(form.contact_email))
      next.contact_email = "Enter a valid email";

    if (form.password && form.password.length < 6)
      next.password = "Use at least 6 characters";

    return next;
  };

  const focusFirstError = (errs) => {
    const firstKey = Object.keys(errs)[0];
    if (firstKey === "logo") {
      uploadBtnRef.current?.focus();
      uploadBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (firstKey && refs[firstKey]?.current) {
      refs[firstKey].current.focus();
      refs[firstKey].current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
      // Step 1: Upload the logo (required)
      const formData = new FormData();
      formData.append("file", form.logo);

      const uploadRes = await fetch(`${apiBaseUrl}/api/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const contentType = uploadRes.headers.get("content-type") || "";
      if (!uploadRes.ok) {
        const raw = await uploadRes.text();
        throw new Error(`Logo upload failed: ${raw}`);
      }
      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected response. Logo upload failed.");
      }

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;

      // Step 2: Create restaurant
      const restaurantPayload = {
        name: form.name,
        email: form.email,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        address: form.address,
        password: form.password,
        logo_url: imageUrl,
      };

      const res = await fetch(`${apiBaseUrl}/api/admin/restaurants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(restaurantPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || "Failed to add restaurant.");
      }

      alert("✅ Restaurant added!");

      // reset form + errors
      setForm({
        name: "",
        email: "",
        contact_name: "",
        contact_email: "",
        address: "",
        password: "",
        logo: null,
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f4fdfc",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          p: 2,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography fontWeight="bold">Wine List</Typography>
        <Button
          href="#/admin"
          variant="contained"
          sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}
        >
          Dashboard
        </Button>
      </Box>

      {/* Top Navigation Bar */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          px: 2,
          py: 1,
          borderBottom: "1px solid " + "#ccc",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist">
          Restaurants
        </Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">
          Wine Database
        </Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/add">
          Add Wine
        </Button>
        <Button variant="text" component={RouterLink} to="/admin/assign-image">Assign Wine Image</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">
          Wine Requests
        </Button>
        <Button variant="text" component={RouterLink} to="/user-view">
          User View
        </Button>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Add Restaurant
        </Typography>

        <Paper sx={{ p: 3, backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              required
              label="Name"
              name="name"
              value={form.name}
              inputRef={refs.name}
              error={!!errors.name}
              helperText={errors.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              value={form.email}
              inputRef={refs.email}
              error={!!errors.email}
              helperText={errors.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Contact Name"
              name="contact_name"
              value={form.contact_name}
              inputRef={refs.contact_name}
              error={!!errors.contact_name}
              helperText={errors.contact_name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Contact Email"
              name="contact_email"
              value={form.contact_email}
              inputRef={refs.contact_email}
              error={!!errors.contact_email}
              helperText={errors.contact_email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Address"
              name="address"
              value={form.address}
              inputRef={refs.address}
              error={!!errors.address}
              helperText={errors.address}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Password"
              type="password"
              name="password"
              value={form.password}
              inputRef={refs.password}
              error={!!errors.password}
              helperText={errors.password}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                justifyContent: "flex-start",
                mt: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                ref={uploadBtnRef}
                variant="outlined"
                component="label"
                color={errors.logo ? "error" : "primary"}
              >
                Logo Upload (required)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm((prev) => ({ ...prev, logo: file }));
                    // clear logo error on file select
                    setErrors((prev) => {
                      if (!prev.logo) return prev;
                      const copy = { ...prev };
                      delete copy.logo;
                      return copy;
                    });
                  }}
                />
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </Box>

            {!!errors.logo && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {errors.logo}
              </Typography>
            )}

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
        <MuiLink href="mailto:support@wineapp.com" underline="hover" color="inherit">
          Contact Us
        </MuiLink>
      </Box>
    </Box>
  );
}
