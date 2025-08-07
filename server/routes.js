const express = require("express");
const router = express.Router();
const db = require("./db"); // Supabase client
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const upload = multer({ storage: multer.memoryStorage() });
const {
  authenticateToken,
  requireRestaurant,
  requireAdmin
} = require("./middleware/authMiddleware");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");



const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/logo", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    res.json({ url });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});


// ✅ GET all restaurants
router.get("/restaurants", authenticateToken, requireAdmin, async (req, res) => {
  const { data, error } = await db
    .from("restaurant")
    .select("id, name, email, contact_name, contact_email, address, member_status, restaurant_wines(count)");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});



// ✅ DELETE restaurant
router.delete("/restaurants/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await db
    .from("restaurant")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Restaurant deleted successfully" });
});

// ✅ UPDATE restaurant info
router.put("/restaurants/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (
    updates.hasOwnProperty("member_status") &&
    !["active", "inactive"].includes(updates.member_status)
  ) {
    return res.status(400).json({ error: "Invalid member status" });
  }

  const { error } = await db
    .from("restaurant")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Restaurant updated" });
});

// ✅ ADD new restaurant
router.post("/admin/restaurants", authenticateToken, requireAdmin, async (req, res) => {
  const {
    name, email, contact_name, contact_email,
    address, password, logo_url
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await db
      .from("restaurant")
      .insert([{
        name,
        email,
        contact_name,
        contact_email,
        address,
        password: hashedPassword,
        logo_url,
        member_status: "active"
      }]);

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: "Restaurant added", restaurant: data });
  } catch (err) {
    console.error("Add restaurant error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wines", authenticateToken, requireAdmin, async (req, res) => {
  console.log("🍷 /api/wines called");
  const { data, error } = await db
    .from("wine")
    .select("id, wine_name, company, country, region, type, vintage, body, notes, wine_image_url");

console.log("Fetching wines for admin");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
  
});

router.put("/wines/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { error } = await db
    .from("wine")
    .update(updates)
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Wine updated" });
});

router.post("/wines", authenticateToken, requireAdmin, async (req, res) => {
  const { wine_name, company, country, region, type, vintage, notes, body, wine_image_url } = req.body;

if (!wine_name || !company || !region || !type || !country || !body || !wine_image_url || !vintage) {
  return res.status(400).json({ error: "Missing required fields" });
}


const insertObj = {
  wine_name,
  company,
  region,
  country,
  type,
  vintage: parseInt(vintage),
  body,
  notes: notes || null,
  wine_image_url
};

  const { data, error } = await db.from("wine").insert([insertObj]);

  if (error) {
    console.error("Insert wine error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ message: "Wine added", wine: data });
});


router.delete("/wines/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await db
    .from("wine")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Wine deleted successfully" });
});

router.post("/upload-wine-image", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    res.json({ url });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
//rest library
// ✅ Get single restaurant info (for logo etc.)
router.get("/restaurant/:id", authenticateToken, requireRestaurant, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await db
    .from("restaurant")
    .select("id, name, email, contact_name, contact_email, address, member_status, logo_url")
    .eq("id", id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  res.json({ ...data }); // direct object (not wrapped in `data: ...`)
});


router.get("/restaurant/:id/wines", authenticateToken, requireRestaurant, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await db
    .from("restaurant_wines")
    .select("price_override, available, wine:wine_id (id, wine_name, company, region, country, type, body, vintage, wine_image_url)")
    .eq("restaurant_id", id);

  if (error) {
    console.error("Fetch restaurant wines failed:", error);
    return res.status(500).json({ error: error.message });
  }

  const wines = data.map((entry) => ({
    ...entry.wine,
    price: entry.price_override,
    available: entry.available,
  }));

  const restaurantRes = await db
    .from("restaurant")
    .select("name")
    .eq("id", id)
    .single();

  const restaurant_name = restaurantRes?.data?.name || "";

  res.json({ wines, restaurant_name });
});


router.post("/restaurant/:id/assign-wine", authenticateToken, requireAdmin, async (req, res) => {
  console.log("🧾 Assign request body:", req.body);
console.log("🍽️ Restaurant ID param:", req.params.id);

  const restaurantId = req.params.id;
  const { wine_id, price_override } = req.body;

  if (!wine_id) {
    return res.status(400).json({ error: "Missing wine_id" });
  }

  // Check if wine is already assigned
const { count, error: existsError } = await db
  .from("restaurant_wines")
  .select("id", { count: "exact", head: true })
  .eq("restaurant_id", restaurantId)
  .eq("wine_id", wine_id);


if (existsError) {
  return res.status(500).json({ error: existsError.message });
}
if (count > 0) {
  return res.status(400).json({ error: "This wine is already assigned to the restaurant." });
}

// Proceed with insert
const { error } = await db
  .from("restaurant_wines")
  .insert([{
    restaurant_id: restaurantId,          // keep as UUID string
    wine_id: wine_id,                     // also UUID string
    price_override: price_override ? parseFloat(price_override) : null
  }]);


if (error) {
  return res.status(500).json({ error: error.message });
}


  res.json({ message: "Wine assigned successfully" });
});

router.put("/restaurant/:id/update-availability", authenticateToken, requireRestaurant, async (req, res) => {
  const { wine_id } = req.body;
  const { id: restaurant_id } = req.params;

  console.log("🔄 Update availability for wine_id:", wine_id, "restaurant_id:", restaurant_id);

  try {
    // Ensure the row exists
    const { data: row, error: fetchErr } = await db
      .from("restaurant_wines")
      .select("available")
      .eq("restaurant_id", restaurant_id)
      .eq("wine_id", wine_id)
      .single();

    if (fetchErr || !row) {
      console.error("❌ Could not find wine entry to update availability:", fetchErr?.message || "Not found");
      return res.status(404).json({ error: "Wine assignment not found for this restaurant" });
    }

    const { error: updateErr } = await db
      .from("restaurant_wines")
      .update({ available: !row.available })
      .eq("restaurant_id", restaurant_id)
      .eq("wine_id", wine_id);

    if (updateErr) {
      console.error("❌ Update availability error:", updateErr.message);
      return res.status(500).json({ error: updateErr.message });
    }

    res.json({ message: "Availability updated" });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});



router.put("/restaurant/:id/update-price", authenticateToken, requireRestaurant, async (req, res) => {
  const { id: restaurant_id } = req.params;
  const { wine_id, price_override } = req.body;

  console.log("💲 Update price for wine_id:", wine_id, "restaurant_id:", restaurant_id, "price:", price_override);

  try {
    const { data: row, error: fetchErr } = await db
      .from("restaurant_wines")
      .select("id")
      .eq("restaurant_id", restaurant_id)
      .eq("wine_id", wine_id)
      .single();

    if (fetchErr || !row) {
      console.error("❌ Could not find wine entry to update price:", fetchErr?.message || "Not found");
      return res.status(404).json({ error: "Wine assignment not found for this restaurant" });
    }

    const { error } = await db
      .from("restaurant_wines")
      .update({ price_override: parseFloat(price_override) })
      .eq("restaurant_id", restaurant_id)
      .eq("wine_id", wine_id);

    if (error) {
      console.error("❌ Update price error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Price updated" });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

// Unassign a wine from a restaurant
router.delete("/restaurant/:id/unassign-wine/:wine_id", authenticateToken, requireRestaurant, async (req, res) => {
  const { id: restaurant_id, wine_id } = req.params;

  const { error } = await db
    .from("restaurant_wines")
    .delete()
    .eq("restaurant_id", restaurant_id)
    .eq("wine_id", wine_id);

  if (error) {
    console.error("Unassign wine error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Wine unassigned successfully" });
});

// ✅ Submit wine request (fixed)
router.post("/request-wine", authenticateToken, requireRestaurant, async (req, res) => {
  const {
    wine_name, company, country, region, vintage, type, body, notes, image_url
  } = req.body;

  // ✅ Get restaurant_id from authenticated token (secure!)
  const restaurant_id = req.user.restaurant_id;

  if (!restaurant_id) {
    return res.status(400).json({ error: "Restaurant ID is missing from token." });
  }

  // Fetch restaurant name from DB
  const { data: restaurant, error: restaurantError } = await db
    .from("restaurant")
    .select("name")
    .eq("id", restaurant_id)
    .single();

  if (restaurantError || !restaurant) {
    return res.status(500).json({ error: restaurantError?.message || "Restaurant not found" });
  }

  const { data, error } = await db.from("wine_requests").insert([{
    wine_name,
    company,
    country,
    region,
    vintage: parseInt(vintage),
    type,
    body,
    notes,
    image_url,
    restaurant_id, // ✅ Using JWT value
    restaurant_name: restaurant.name
  }]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Wine request submitted successfully", request: data });
});


// --- ADMIN: Get all wine requests
router.get("/admin/wine-requests", authenticateToken, requireAdmin, async (req, res) => {
  const { data, error } = await db
    .from("wine_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- ADMIN: Edit a wine request
router.put("/admin/wine-requests/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await db
    .from("wine_requests")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// --- ADMIN: Approve (move to wine, delete from wine_requests)
router.post("/admin/wine-requests/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  // 1. Fetch the wine request
  const { data: requests, error: fetchError } = await db
    .from("wine_requests")
    .select("*")
    .eq("id", id);

  if (fetchError || !requests || requests.length === 0) {
    return res.status(404).json({ error: fetchError?.message || "Request not found" });
  }

  const wineData = requests[0];

  // 2. Insert into wine table
  const { error: insertError } = await db
    .from("wine")
    .insert([{
      wine_name: wineData.wine_name,
      company: wineData.company,
      country: wineData.country,
      region: wineData.region,
      vintage: wineData.vintage,
      type: wineData.type,
      body: wineData.body,
      notes: wineData.notes,
      wine_image_url: wineData.image_url || null
    }]);

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  // 3. Delete from wine_requests
  const { error: deleteError } = await db
    .from("wine_requests")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  res.json({ message: "Wine approved, added to library, and request deleted." });
});

// --- ADMIN: Reject (delete from wine_requests)
router.post("/admin/wine-requests/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  // 1. Fetch the request to get the image_url
  const { data, error: fetchError } = await db
    .from("wine_requests")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return res.status(404).json({ error: fetchError?.message || "Request not found" });
  }

  // 2. Delete from DB
  const { error: deleteError } = await db
    .from("wine_requests")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  // 3. Optionally delete image from S3 if image_url exists
  if (data.image_url) {
    let key = data.image_url.split(".amazonaws.com/")[1];
    if (!key) {
      // fallback for any weird URL
      const urlParts = data.image_url.split("/");
      key = urlParts.slice(4).join("/"); // after https:, '', bucket, region
    }

    if (key) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
          })
        );
        console.log("S3 image deleted:", key);
      } catch (err) {
        console.error("Failed to delete S3 image:", err);
      }
    } else {
      console.warn("Could not determine S3 key for deletion:", data.image_url);
    }
  }

  res.json({ message: "Wine request rejected and deleted." });
});


// Count restaurants
router.get("/admin/restaurants/count", authenticateToken, requireAdmin, async (req, res) => {
  const { count, error } = await db
    .from("restaurant")
    .select("*", { count: "exact", head: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ count });
});

// Count wine requests
router.get("/admin/wine-requests/count", authenticateToken, requireAdmin, async (req, res) => {
  const { count, error } = await db
    .from("wine_requests")
    .select("*", { count: "exact", head: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ count });
});



module.exports = router;
