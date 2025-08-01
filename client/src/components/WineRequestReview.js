import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import { Link as RouterLink } from "react-router-dom";

export default function WineRequestReview() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // For confirmation dialogs
  const [confirmAction, setConfirmAction] = useState(""); // "approve" or "reject"
  const [pendingId, setPendingId] = useState(null);

  const getToken = () => localStorage.getItem("token");

  // Fetch all requests
  const fetchRequests = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const res = await fetch("http://localhost:5000/api/admin/wine-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load wine requests", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Open confirm dialog for approve/reject
  const handleConfirm = (action, id) => {
    setConfirmAction(action);
    setPendingId(id);
  };

  // Approve (move to wine, delete from requests)
  const handleApprove = async () => {
    const token = getToken();
    try {
      await fetch(`http://localhost:5000/api/admin/wine-requests/${pendingId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests();
    } catch (err) {
      alert("Failed to approve");
    }
    setConfirmAction("");
    setPendingId(null);
  };

  // Reject (delete from requests)
  const handleReject = async () => {
    const token = getToken();
    try {
      await fetch(`http://localhost:5000/api/admin/wine-requests/${pendingId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests();
    } catch (err) {
      alert("Failed to reject");
    }
    setConfirmAction("");
    setPendingId(null);
  };

  // Edit and save request
  const handleEdit = (request) => {
    setSelectedRequest({ ...request });
    setOpenEdit(true);
  };

  const handleSave = async () => {
    const token = getToken();
    try {
      await fetch(`http://localhost:5000/api/admin/wine-requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedRequest),
      });
      setOpenEdit(false);
      fetchRequests();
    } catch (err) {
      alert("Failed to save changes");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine Request Review</Typography>
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
          flexWrap: "wrap"
        }}
      >
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist">Restaurants</Button>
        <Button variant="text" component={RouterLink} to="/admin/restaurantlist/add">Add Restaurant</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/">Wine Database</Button>
        <Button variant="text" component={RouterLink} to="/admin/wines/add">Add Wine</Button>
        <Button variant="text" component={RouterLink} to="/user-view">User View</Button>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: "#f4fdfc" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Wine Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Vintage</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Body</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell align="center">Edit</TableCell>
              <TableCell align="center">Approve</TableCell>
              <TableCell align="center">Reject</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.wine_name}</TableCell>
                <TableCell>{req.company}</TableCell>
                <TableCell>{req.country}</TableCell>
                <TableCell>{req.region}</TableCell>
                <TableCell>{req.vintage}</TableCell>
                <TableCell>{req.type}</TableCell>
                <TableCell>{req.body}</TableCell>
                <TableCell>{req.notes || "-"}</TableCell>
                <TableCell>{req.restaurant_name}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleEdit(req)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <IconButton color="success" onClick={() => handleConfirm("approve", req.id)}>
                    <CheckIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <IconButton color="error" onClick={() => handleConfirm("reject", req.id)}>
                    <ClearIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  No wine requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Wine Request</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {selectedRequest && (
            <>
              <TextField
                label="Wine Name"
                value={selectedRequest.wine_name || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, wine_name: e.target.value }))
                }
              />
              <TextField
                label="Company"
                value={selectedRequest.company || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, company: e.target.value }))
                }
              />
              <TextField
                label="Country"
                value={selectedRequest.country || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, country: e.target.value }))
                }
              />
              <TextField
                label="Region"
                value={selectedRequest.region || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, region: e.target.value }))
                }
              />
              <TextField
                label="Vintage"
                value={selectedRequest.vintage || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, vintage: e.target.value }))
                }
              />
              <TextField
                label="Type"
                value={selectedRequest.type || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, type: e.target.value }))
                }
              />
              <TextField
                label="Body"
                value={selectedRequest.body || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, body: e.target.value }))
                }
              />
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={selectedRequest.notes || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
              <TextField
                label="Requested By"
                value={selectedRequest.restaurant_name || ""}
                onChange={(e) =>
                  setSelectedRequest((prev) => ({ ...prev, restaurant_name: e.target.value }))
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction("")}>
        <DialogTitle>
          {confirmAction === "approve"
            ? "Approve Wine Request"
            : "Reject Wine Request"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction === "approve"
              ? "Are you sure you want to approve this wine and add it to the main wine list? This will remove the request from the list."
              : "Are you sure you want to reject and delete this wine request? This cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction("")}>Cancel</Button>
          {confirmAction === "approve" ? (
            <Button color="success" onClick={handleApprove} variant="contained">
              Approve & Add
            </Button>
          ) : (
            <Button color="error" onClick={handleReject} variant="contained">
              Reject & Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
