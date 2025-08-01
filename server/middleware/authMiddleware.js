const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token and attach user info
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Expect: Bearer <token>

  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    
    req.user = user; // e.g., { id, email, role }
    next();
  });
}

// Middleware to allow only restaurants
// middleware/authMiddleware.js
function requireRestaurant(req, res, next) {
  const user = req.user;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role === "restaurant" || user.role === "admin") return next();

  return res.status(403).json({ error: "Access denied: must be restaurant or admin" });
}


// Middleware to allow only admins
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireRestaurant,
  requireAdmin,
};
