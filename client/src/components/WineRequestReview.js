import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

export default function WineRequestReview() {
  const [requests, setRequests] = useState([
    {
      id: 1,
      wine_name: "Château Margaux",
      company: "Château Margaux Estate",
      country: "France",
      region: "Bordeaux",
      vintage: 2015,
      type: "Red",
      body: "Full",
      notes: "A refined red for our reserve list. Prefer vintage 2015.",
      restaurant_name: "Meyhouse Palo Alto",
    },
    {
      id: 2,
      wine_name: "Cloudy Bay Sauvignon Blanc",
      company: "Cloudy Bay",
      country: "New Zealand",
      region: "Marlborough",
      vintage: 2021,
      type: "White",
      body: "Light",
      notes: "Light and citrusy. Customers have been asking.",
      restaurant_name: "Meyhouse SF",
    },
    {
      id: 3,
      wine_name: "Antinori Tignanello",
      company: "Marchesi Antinori",
      country: "Italy",
      region: "Tuscany",
      vintage: 2018,
      type: "Red",
      body: "Medium",
      notes: "Please consider adding for the upcoming Italian night.",
      restaurant_name: "Meyhouse San Jose",
    }
  ]);

  useEffect(() => {
    fetch("/api/admin/wine-requests")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Failed to load wine requests", err));
  }, []);

  const handleApprove = (id) => {
    console.log("Approve request", id);
  };

  const handleReject = (id) => {
    console.log("Reject request", id);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc" }}>
      <Box sx={{ backgroundColor: "#d8f0ef", p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography fontWeight="bold">Wine Request Review</Typography>
        <Button href="/admin" variant="contained" sx={{ backgroundColor: "#cddaff", color: "#0026a3" }}>
          Dashboard
        </Button>
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
              <TableCell>Actions</TableCell>
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
                <TableCell>
                  <IconButton color="success" onClick={() => handleApprove(req.id)}>
                    <CheckIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleReject(req.id)}>
                    <ClearIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
