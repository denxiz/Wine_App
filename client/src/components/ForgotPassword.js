import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function ForgotPassword() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      // Always show success regardless of existence
      setDone(true);
    } catch (err) {
      setDone(true); // still generic
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight:"100vh", display:"grid", placeItems:"center", bgcolor:"#f4fdfc", p:2 }}>
      <Paper sx={{ p:3, maxWidth: 480, width:"100%" }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb:1 }}>Forgot your password?</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb:3 }}>
          Enter your email address and we’ll send you a link to reset your password.
        </Typography>

        {done ? (
          <Alert severity="success">
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
            Please check your inbox (and spam).
          </Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
              sx={{ mb:2 }}
            />
            {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
            <Button type="submit" variant="contained" disabled={submitting} fullWidth>
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <Button component={RouterLink} to="/" sx={{ mt:2 }}>
          Back to login
        </Button>
      </Paper>
    </Box>
  );
}
