import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";

export default function RestaurantLibrary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [wines, setWines] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);

  // Assign dialog
  const [openAssign, setOpenAssign] = useState(false);
  const [availableWines, setAvailableWines] = useState([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedWineIds, setSelectedWineIds] = useState([]); // up to 10
  const [priceMap, setPriceMap] = useState({});               // { [wineId]: "12.00" }
  const [assignLoading, setAssignLoading] = useState(false);

  // Table filters
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"

  // Edit price dialog
  const [editPriceWine, setEditPriceWine] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // Load restaurant wines (also refresh after assign dialog closes)
  useEffect(() => {
    setLoading(true);
    fetch(`${apiBaseUrl}/api/restaurant/${id}/wines`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setWines(data.wines || []);
        setRestaurantName(data.restaurant_name || `Restaurant ${id}`);
      })
      .catch((err) => {
        console.error("Failed to load wines:", err);
        setWines([]);
        setRestaurantName(`Restaurant ${id}`);
      })
      .finally(() => setLoading(false));
  }, [id, openAssign, apiBaseUrl]);

  // ----- Price edit -----
  const handlePriceEdit = (wine) => {
    setEditPriceWine(wine);
    setNewPrice(wine.price ?? "");
  };

  const submitPriceUpdate = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/update-price`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          wine_id: editPriceWine.id,
          price_override: parseFloat(newPrice),
        }),
      });
      if (!res.ok) throw new Error("Update failed");

      setWines((prev) =>
        prev.map((w) => (w.id === editPriceWine.id ? { ...w, price: parseFloat(newPrice) } : w))
      );
      setEditPriceWine(null);
      setNewPrice("");
    } catch (err) {
      console.error("Update price error:", err);
      alert("Failed to update price.");
    }
  };

  // ----- Unassign -----
  const handleUnassignWine = async (wineId) => {
    if (!window.confirm("Remove this wine from the restaurant?")) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/unassign-wine/${wineId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to unassign wine");
      setWines((prev) => prev.filter((w) => w.id !== wineId));
    } catch (err) {
      console.error("Unassign wine failed:", err);
      alert("Failed to unassign wine.");
    }
  };

  // ----- Availability -----
  const toggleAvailable = async (wineId) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/update-availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ wine_id: wineId }),
      });
      if (!res.ok) throw new Error("Failed to update availability");
      setWines((prev) =>
        prev.map((w) => (w.id === wineId ? { ...w, available: !w.available } : w))
      );
    } catch (err) {
      console.error("Toggle availability failed:", err);
      alert("Could not update availability");
    }
  };

  // ----- Open Assign Dialog -----
  const openAssignDialog = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in.");
        return;
      }
      const res = await fetch(`${apiBaseUrl}/api/wines`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setAvailableWines(data || []);
      setOpenAssign(true);
    } catch (err) {
      console.error("openAssignDialog error:", err.message);
      alert("Could not load wines. Please try again.");
    }
  };

  // Only show unassigned wines in the picker
  const assignedWineIds = useMemo(
    () => new Set((wines || []).map((w) => w.id)),
    [wines]
  );

  const wineOptions = useMemo(() => {
    const raw = (availableWines || []).filter((w) => !assignedWineIds.has(w.id));
    return raw.map((w) => ({
      ...w,
      label: `${w.wine_name} (${w.vintage ?? "NV"}) — ${w.company ?? "—"}, ${w.region ?? ""}, ${w.country ?? ""}`
        .replace(/\s+,/g, ",")
        .replace(/—,\s*$/, "—"),
    }));
  }, [availableWines, assignedWineIds]);

  // Bulk assign up to 10 wines
  const handleAssignWine = async () => {
    const invalid = selectedWineIds.filter((id) => !(Number(priceMap[id]) > 0));
    if (invalid.length) {
      alert("Please enter a valid price (> 0) for each selected wine.");
      return;
    }

    setAssignLoading(true);
    try {
      for (const wid of selectedWineIds) {
        const res = await fetch(`${apiBaseUrl}/api/restaurant/${id}/assign-wine`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            wine_id: wid,
            price_override: Number(priceMap[wid]),
          }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`Failed to assign wine ${wid}: ${msg || res.status}`);
        }
      }

      alert(`Assigned ${selectedWineIds.length} wine(s) successfully!`);
      setOpenAssign(false);
      setSelectedWineIds([]);
      setPriceMap({});
    } catch (err) {
      console.error("Bulk assign error:", err);
      alert("One or more assignments failed. Some items may not have been added.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Table filtering
  const filteredWines = useMemo(() => {
    const n = searchName.toLowerCase();
    const c = searchCompany.toLowerCase();
    const r = searchRegion.toLowerCase();
    return (wines || []).filter((w) => {
      const ok =
        (w.wine_name || "").toLowerCase().includes(n) &&
        (w.company || "").toLowerCase().includes(c) &&
        (w.region || "").toLowerCase().includes(r) &&
        (searchYear === "" || String(w.vintage).includes(searchYear));
      if (!ok) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return !!w.available;
      if (statusFilter === "inactive") return !w.available;
      return true;
    });
  }, [wines, searchName, searchCompany, searchRegion, searchYear, statusFilter]);

  // Remove one selected wine from the assign list
  const deselectWine = (wid) => {
    setSelectedWineIds((ids) => ids.filter((id) => id !== wid));
    setPriceMap((pm) => {
      const copy = { ...pm };
      delete copy[wid];
      return copy;
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc", p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          p: 2,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: 1,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {restaurantName}'s Wine Library
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            maxWidth: "100%",
          }}
        >
          <Button
            size="small"
            href="#/admin"
            variant="contained"
            sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}
          >
            Dashboard
          </Button>
          <Button
            size="small"
            href="#/admin/restaurantlist"
            variant="contained"
            sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}
          >
            Back
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={openAssignDialog}
            sx={{ backgroundColor: "#cddaff", color: "#0026a3", whiteSpace: "nowrap" }}
          >
            Add Wine To Library
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Search by Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Search by Company"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Search by Region"
            value={searchRegion}
            onChange={(e) => setSearchRegion(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Search by Year"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            type="number"
            size="small"
            sx={{ minWidth: 120 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Available</MenuItem>
              <MenuItem value="inactive">Unavailable</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#fafafa" }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Vintage</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Body</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Edit Price</TableCell>
                <TableCell>Unassign</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWines.map((wine) => (
                <TableRow key={wine.id}>
                  <TableCell>{wine.wine_name}</TableCell>
                  <TableCell>{wine.company}</TableCell>
                  <TableCell>{wine.region}</TableCell>
                  <TableCell>{wine.country}</TableCell>
                  <TableCell>{wine.vintage}</TableCell>
                  <TableCell>{wine.type}</TableCell>
                  <TableCell>{wine.body}</TableCell>
                  <TableCell>${wine.price ?? "-"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!wine.available}
                      onChange={() => toggleAvailable(wine.id)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handlePriceEdit(wine)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleUnassignWine(wine.id)}
                      sx={{ ml: 1 }}
                      color="error"
                    >
                      🗑️
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {filteredWines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No wines found for this restaurant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign Dialog */}
      <Dialog
        open={openAssign}
        onClose={() => {
          setOpenAssign(false);
          setSelectedWineIds([]);
          setPriceMap({});
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { width: 960, maxWidth: "90vw", maxHeight: "85vh", borderRadius: 2 },
        }}
      >
        <DialogTitle>Assign up to 10 wines to {restaurantName}</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, py: 2 }}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={wineOptions}
            getOptionLabel={(opt) => opt?.label ?? ""}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            value={wineOptions.filter((o) => selectedWineIds.includes(o.id))}
            onChange={(_, vals) => {
              const ids = vals.map((v) => v.id).slice(0, 10); // cap at 10
              setSelectedWineIds(ids);
              setPriceMap((pm) =>
                Object.fromEntries(Object.entries(pm).filter(([k]) => ids.includes(k)))
              );
            }}
            // Do NOT show selected chips inside the input to save space
            renderTags={() => null}
            inputValue={assignSearch}
            onInputChange={(_, val) => setAssignSearch(val)}
            filterOptions={(options, { inputValue }) => {
              const raw = inputValue.trim().toLowerCase();
              const [namePartRaw, yearPartRaw] = raw.split(",").map((s) => s?.trim());
              const wantsYear = !!yearPartRaw && /^\d{2,4}$/.test(yearPartRaw);

              return options.filter((opt) => {
                const nameHit = namePartRaw
                  ? (opt.wine_name || "").toLowerCase().includes(namePartRaw)
                  : (opt.label || "").toLowerCase().includes(raw);
                if (!nameHit) return false;
                if (wantsYear) {
                  const vint = String(opt.vintage ?? "");
                  if (!vint) return false;
                  return vint.endsWith(yearPartRaw);
                }
                return true;
              });
            }}
            // When 10 are selected, disable picking more (but keep already picked selectable)
            getOptionDisabled={(opt) =>
              selectedWineIds.length >= 10 && !selectedWineIds.includes(opt.id)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label='Search wines (type "name" or "name, year")'
                placeholder='e.g., "Margaux, 2015"'
                helperText={`Only unassigned wines are shown. Selected: ${selectedWineIds.length}/10`}
              />
            )}
            sx={{ minWidth: 720 }}
            ListboxProps={{ sx: { maxHeight: 480 } }}
            renderOption={(props, opt) => (
              <li {...props} key={opt.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {opt.wine_name} {opt.vintage ? `(${opt.vintage})` : "(NV)"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(opt.company || "—")}, {opt.region}, {opt.country}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {/* Selected wines list with price + remove (X) */}
          {selectedWineIds.map((wid) => {
            const opt = wineOptions.find((o) => o.id === wid);
            return (
              <Box
                key={wid}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 40px",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="body2">{opt?.label}</Typography>
                <TextField
                  label="Price"
                  type="number"
                  value={priceMap[wid] ?? ""}
                  onChange={(e) => setPriceMap((pm) => ({ ...pm, [wid]: e.target.value }))}
                  inputProps={{ min: 0, step: "0.01" }}
                  required
                />
                <IconButton size="small" onClick={() => deselectWine(wid)} aria-label="remove">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenAssign(false);
              setSelectedWineIds([]);
              setPriceMap({});
            }}
            disabled={assignLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignWine}
            variant="contained"
            disabled={
              assignLoading ||
              selectedWineIds.length === 0 ||
              !selectedWineIds.every((wid) => {
                const v = Number(priceMap[wid]);
                return Number.isFinite(v) && v > 0;
              })
            }
          >
            {assignLoading ? "Assigning…" : "ASSIGN WINES"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog open={!!editPriceWine} onClose={() => setEditPriceWine(null)}>
        <DialogTitle>Edit Price</DialogTitle>
        <DialogContent>
          <TextField
            label="New Price"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPriceWine(null)}>Cancel</Button>
          <Button onClick={submitPriceUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
