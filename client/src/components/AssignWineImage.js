import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Link as RouterLink } from "react-router-dom";

export default function AssignWineImage() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyNoImage, setOnlyNoImage] = useState(true);

  const [selectedWine, setSelectedWine] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/wines`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load wines");
        if (!ignore) setWines(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!ignore) setSnack({ open: true, msg: e.message, severity: "error" });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl]);

  // Build Autocomplete options (option object = wine record)
  const options = useMemo(() => {
    const base = wines
      .filter(w => !onlyNoImage || !w.wine_image_url)
      .sort((a, b) => String(a.wine_name).localeCompare(String(b.wine_name)));
    return base;
  }, [wines, onlyNoImage]);

  const getOptionLabel = (w) =>
    w ? `${w.wine_name} (${w.vintage ?? "NV"}) — ${w.company}, ${w.region}, ${w.country}${w.wine_image_url ? "" : " • no image"}` : "";

  const handleSelect = (_, val) => setSelectedWine(val);

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWine) {
      setSnack({ open: true, msg: "Please select a wine", severity: "warning" });
      return;
    }
    if (!file) {
      setSnack({ open: true, msg: "Please choose an image file", severity: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      // 1) upload -> backend trims/crops and returns URL(s)
      const fd = new FormData();
      fd.append("file", file);

      const upRes = await fetch(`${apiBaseUrl}/api/upload-wine-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });

      const contentType = upRes.headers.get("content-type") || "";
      const upJson = contentType.includes("application/json") ? await upRes.json() : {};
      if (!upRes.ok) throw new Error(upJson?.error || "Upload failed");

      const imageUrl = upJson.url;
      if (!imageUrl) throw new Error("Upload succeeded but no URL returned");

      // 2) save URL on the wine
      const saveRes = await fetch(`${apiBaseUrl}/api/wines/${selectedWine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ wine_image_url: imageUrl }),
      });
      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) throw new Error(saveJson?.error || "Failed to save image on wine");

      // update local state
      setWines(prev =>
        prev.map(w => (w.id === selectedWine.id ? { ...w, wine_image_url: imageUrl } : w))
      );
      setSnack({ open: true, msg: "✅ Image assigned to wine", severity: "success" });
      setSelectedWine(null);
      clearFile();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: `❌ ${err.message}`, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4fdfc" }}>
      {/* Header */}
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold">Wine List</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button component={RouterLink} to="/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
            Dashboard
          </Button>
          <Button component={RouterLink} to="/admin/wines" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
            Wine Database
          </Button>
        </Box>
      </Box>

      {/* Subnav */}
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
        <Button variant="text" component={RouterLink} to="/admin/wines/add">Add Wine</Button>
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
        <Button variant="text" component={RouterLink} to="/admin/wine-requests">Wine Requests</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
        
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Assign Image to Wine</Typography>
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", gap: 2, alignItems: { xs: "stretch", sm: "center" },
    flexWrap: "wrap",flexDirection: { xs: "column", sm: "row" }}}>
              <Autocomplete
  options={options}
  getOptionLabel={getOptionLabel}
  value={selectedWine}
  onChange={handleSelect}
  loading={loading}
  loadingText="Loading wines…"
  size="small"
  disablePortal
  sx={{width: "100%",minWidth: 0, flex: "1 1 100%", maxWidth: { xs: "100%", sm: 520 },}}
  ListboxProps={{ sx: {"& .MuiAutocomplete-option": {whiteSpace: "normal", wordBreak: "break-word",},},}}
  renderInput={(params) => (
    <TextField
      {...params}
      fullWidth
      label="Select wine"
      placeholder="Search by name, region, vintage…"
    />
  )}
/>


              <FormControlLabel
                control={<Switch checked={onlyNoImage} onChange={(e) => setOnlyNoImage(e.target.checked)} />}
                label="Only show wines without image"
              />
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button variant="outlined" component="label" disabled={submitting}>
                  Choose Image
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                  />
                </Button>

                {file && (
                  <Chip
                    label={file.name}
                    onDelete={() => clearFile()}
                    variant="outlined"
                    sx={{ maxWidth: 360 }}
                  />
                )}

                <Typography variant="body2" color="text.secondary">
                  The backend will auto-trim borders and normalize to a 3:4 box (no stretching).
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                  >
                    {submitting ? <><CircularProgress size={18} sx={{ mr: 1 }} />Assigning…</> : "Assign Image"}
                  </Button>
                </Box>
              </Box>

              {/* Preview (local) */}
              <Box sx={{ width: 220 }}>
                <Typography variant="caption" color="text.secondary">Preview (local file)</Typography>
                <Box
                  sx={{
                    mt: 1,
                    width: "100%",
                    aspectRatio: "3 / 4",
                    border: "1px dashed #ccc",
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {file ? (
                    <img
                      alt="preview"
                      src={URL.createObjectURL(file)}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.disabled">No file chosen</Typography>
                  )}
                </Box>

                {selectedWine?.wine_image_url && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                      Current image (saved)
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        width: "100%",
                        aspectRatio: "3 / 4",
                        border: "1px solid #eee",
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "#fff",
                      }}
                    >
                      <img
                        alt="current"
                        src={selectedWine.wine_image_url}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        loading="lazy"
                      />
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
