import React, { useState } from "react";
import {
  Box,
  Button,
  Link,
  TextField,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

if (res.ok && data.token) {
  localStorage.setItem("token", data.token);

  try {
    const decoded = jwtDecode(data.token);

    if (decoded.role === "admin") {
      navigate("/admin");
    } else {
      localStorage.setItem("restaurantId", data.restaurantId); // ✅ added line
      navigate("/restaurant");
    }
  } catch (err) {
    console.error("Token decoding failed:", err);
    setError("Invalid login response");
  }
}
  else {
      // Show error returned from backend (e.g., inactive account)
      setError(data.error || "Login failed");
    }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#0033cc",
          padding: "1rem",
          color: "white",
          textAlign: "left",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Wine List
        </Typography>
      </Box>

      {/* Form */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: isMobile ? "100%" : 400,
            maxWidth: "90vw",
            padding: 4,
          }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Box sx={{ textAlign: "right", mt: 1 }}>
              <Link href="#" underline="hover" fontSize="0.9rem">
                Forgot Password
              </Link>
            </Box>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                backgroundColor: "#0033cc",
                "&:hover": { backgroundColor: "#0026a3" },
              }}
            >
              Sign In
            </Button>
          </form>
        </Paper>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: "#0033cc",
          color: "white",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.9rem",
        }}
      >
        <Typography fontWeight="bold">WineList © 2024 WineList Co.</Typography>
        <Link href="mailto:support@wineapp.com" underline="hover" color="inherit">
          Contact Us
        </Link>
      </Box>
    </Box>
  );
}
