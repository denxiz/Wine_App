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

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple hardcoded login check
    if (email === "meyhouse" && password === "meyhouse123") {
      navigate("/restaurant");
    } else if (email === "deniz" && password === "deniz123") {
      navigate("/admin");
    } else {
      setError("Invalid credentials");
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

      {/* Center Form */}
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
              label="Username"
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
