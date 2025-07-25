// server/auth.js
const express = require("express");
const router = express.Router();
const supabase = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Look up restaurant user by email
    const { data, error } = await supabase
      .from("restaurant")
      .select("*")
      .eq("email", email)
      .single();

      console.log("Supabase query result:", { data, error });
    if (error || !data) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const restaurant = data;

    console.log("Found restaurant:", restaurant);

    // Compare password
    const validPassword = await bcrypt.compare(password, restaurant.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: restaurant.id, email: restaurant.email, role: "restaurant" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, restaurant });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
