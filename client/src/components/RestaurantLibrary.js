import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Button, CircularProgress
} from "@mui/material";

export default function RestaurantLibrary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wines, setWines] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/restaurant/${id}/wines`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setWines(Array.isArray(data.wines) ? data.wines : []);
        setRestaurantName(data.restaurant_name || `Restaurant ${id}`);
      })
      .catch((err) => {
        console.error("Failed to load wines:", err);
        setWines([]);
        setRestaurantName(`Restaurant ${id}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4fdfc", p: 3 }}>
      <Box
        sx={{
          backgroundColor: "#d8f0ef",
          p: 2,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {restaurantName}'s Wine Library
        </Typography>
        <Button onClick={() => navigate(-1)} variant="outlined">
          Back
        </Button>
      </Box>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {wines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No wines found for this restaurant.
                  </TableCell>
                </TableRow>
              ) : (
                wines.map((wine) => (
                  <TableRow key={wine.id || `${wine.wine_name}-${wine.vintage}`}>
                    <TableCell>{wine.wine_name}</TableCell>
                    <TableCell>{wine.company}</TableCell>
                    <TableCell>{wine.region}</TableCell>
                    <TableCell>{wine.country}</TableCell>
                    <TableCell>{wine.vintage}</TableCell>
                    <TableCell>{wine.type}</TableCell>
                    <TableCell>{wine.body}</TableCell>
                    <TableCell>${wine.price ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
