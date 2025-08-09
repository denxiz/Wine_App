import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function ResetPassword() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type:"", text:"" });
    if (p1.length < 6) return setMsg({ type:"error", text:"Use at least 6 characters." });
    if (p1 !== p2) return setMsg({ type:"error", text:"Passwords do not match." });
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: p1 })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data?.error || "Reset failed");
      setMsg({ type:"success", text:"Your password has been reset. You can now log in." });
      setP1(""); setP2("");
    } catch (err) {
      setMsg({ type:"error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight:"100vh", display:"grid", placeItems:"center", bgcolor:"#f4fdfc", p:2 }}>
      <Paper sx={{ p:3, maxWidth: 480, width:"100%" }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb:1 }}>Set a new password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb:3 }}>
          Choose a strong password. This link may expire soon.
        </Typography>

        <form onSubmit={onSubmit} noValidate>
          <TextField
            label="New password"
            fullWidth
            type={show ? "text" : "password"}
            value={p1}
            onChange={(e)=>setP1(e.target.value)}
            sx={{ mb:2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={()=>setShow(s=>!s)} edge="end">
                    {show ? <VisibilityOff/> : <Visibility/>}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            label="Confirm password"
            fullWidth
            type={show ? "text" : "password"}
            value={p2}
            onChange={(e)=>setP2(e.target.value)}
            sx={{ mb:2 }}
          />
          {msg.text && <Alert severity={msg.type} sx={{ mb:2 }}>{msg.text}</Alert>}
          <Button type="submit" variant="contained" disabled={submitting} fullWidth>
            {submitting ? "Saving…" : "Reset password"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
