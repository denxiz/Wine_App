const express = require("express");
const router = express.Router();
const db = require("./db"); // Supabase client


const {
  authenticateToken,
  requireRestaurant,
  requireAdmin
} = require("./middleware/authMiddleware");

router.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "You accessed a protected route", user: req.user });
});

router.get("/restaurant-only", authenticateToken, requireRestaurant, (req, res) => {
  res.json({ message: "Welcome Restaurant", user: req.user });
});

router.get("/admin-only", authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin", user: req.user });
});

module.exports = router;
// ✅ Route: GET restaurant-specific wine price
router.get("/wine-prices/:wineId", async (req, res) => {
  const { wineId } = req.params;
  const { restaurant_id } = req.query;

  const { data, error } = await db
    .from("restaurant_wines")
    .select("price_override")
    .eq("wine_id", wineId)
    .eq("restaurant_id", restaurant_id)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || { price_override: null });
});

// ✅ Route: PUT update price_override for restaurant/wine
router.put("/wine-prices/:wineId", async (req, res) => {
  const { wineId } = req.params;
  const { restaurant_id, price } = req.body;

  if (!restaurant_id || price === undefined) {
    return res.status(400).json({ error: "Missing restaurant_id or price" });
  }

  const { error } = await db
    .from("restaurant_wines")
    .upsert({
      wine_id: wineId,
      restaurant_id: restaurant_id,
      price_override: price,
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Price updated successfully" });
});

// ✅ NEW: GET all wines for a specific restaurant
router.get("/restaurant-wines", async (req, res) => {
  const { restaurant_id } = req.query;

  if (!restaurant_id) {
    return res.status(400).json({ error: "Missing restaurant_id" });
  }

  const { data, error } = await db
    .from("restaurant_wines")
    .select(`
      id,
      price_override,
      available,
      wine: wine_id (
        id,
        wine_name,
        company,
        country,
        region,
        vintage,
        type,
        body,
        notes,
        image_url
      )
    `)
    .eq("restaurant_id", restaurant_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
