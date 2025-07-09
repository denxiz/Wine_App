
// React.js wine list exploration app with Material-UI and enhanced UI

import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  CardMedia,
  Box,
  CircularProgress,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './styles.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8B1E3F', // Wine Red
    },
    secondary: {
      main: '#FFB74D', // Golden Yellow
    },
    background: {
      default: '#FAF3E0', // Light Beige
    },
    text: {
      primary: '#333333',
    },
  },
  typography: {
    fontFamily: 'Playfair Display, serif',
    h3: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#8B1E3F',
    },
    body1: {
      color: '#555555',
    },
  },
});

const App = () => {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    region: '',
    subRegion: '',
    body: '',
    vintage: '',
  });
  const [sortOption, setSortOption] = useState('');

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const response = await fetch('/wines.json'); // Replace with your backend API URL
        if (!response.ok) {
          throw new Error('Failed to fetch wines');
        }
        const data = await response.json();
        setWines(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWines();
  }, []);

  const filteredWines = wines.filter((wine) => {
    const matchesType = !filters.type || wine.type === filters.type;
    const matchesRegion = !filters.region || wine.region.toLowerCase().includes(filters.region.toLowerCase());
    const matchesSubRegion = !filters.subRegion || wine.subRegion.toLowerCase().includes(filters.subRegion.toLowerCase());
    const matchesBody = !filters.body || wine.body === filters.body;
    const matchesVintage = !filters.vintage || wine.vintage === parseInt(filters.vintage);
    return matchesType && matchesRegion && matchesSubRegion && matchesBody && matchesVintage;
  });

  const sortedWines = [...filteredWines].sort((a, b) => {
    switch (sortOption) {
      case 'vintage-asc':
        return a.vintage - b.vintage;
      case 'vintage-desc':
        return b.vintage - a.vintage;
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'body-asc':
        return a.body.localeCompare(b.body);
      case 'body-desc':
        return b.body.localeCompare(a.body);
      default:
        return 0;
    }
  });

  const updateFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #8B1E3F, #FFB74D)',
          color: '#FFFFFF',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3">🍷 Wine List Exploration</Typography>
      </Box>

      <Container>
        {loading && (
          <Box sx={{ textAlign: 'center', marginTop: 4 }}>
            <CircularProgress />
            <Typography>Loading wines...</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ textAlign: 'center', marginTop: 4, color: 'red' }}>
            <Typography>Error: {error}</Typography>
          </Box>
        )}

        {!loading && !error && (
          <Box sx={{ padding: '20px 0' }}>
            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => updateFilter('type', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Red">Red</MenuItem>
                    <MenuItem value="White">White</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Region"
                  fullWidth
                  value={filters.region}
                  onChange={(e) => updateFilter('region', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="vintage-asc">Vintage (Ascending)</MenuItem>
                    <MenuItem value="vintage-desc">Vintage (Descending)</MenuItem>
                    <MenuItem value="price-asc">Price (Low to High)</MenuItem>
                    <MenuItem value="price-desc">Price (High to Low)</MenuItem>
                    <MenuItem value="body-asc">Body (A-Z)</MenuItem>
                    <MenuItem value="body-desc">Body (Z-A)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {!loading && !error && (
          <Grid container spacing={3}>
            {sortedWines.map((wine, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={wine.label}
                    alt={wine.name}
                  />
                  <CardHeader title={wine.name} subheader={`Region: ${wine.region}`} />
                  <CardContent>
                    <Typography>Type: {wine.type}</Typography>
                    <Typography>Body: {wine.body}</Typography>
                    <Typography>Vintage: {wine.vintage}</Typography>
                    <Typography>Price: ${wine.price}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
