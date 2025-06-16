const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ============ Ensure upload folders exist ============
const ensureUploadFolders = () => {
  const folders = ["uploads/galerija", "uploads/bobb", "uploads/blog"];
  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
};

ensureUploadFolders();

// ============ Multer konfiguracija ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const url = req.originalUrl;
    let folder = "uploads/";

    if (url.includes("/upload/galerija")) folder += "galerija";
    else if (url.includes("/upload/bobb")) folder += "bobb";
    else if (url.includes("/upload/blog")) folder += "blog";
    else return cb(new Error("Nepoznata ruta!"), null);

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.random().toString(36).substr(2, 9) + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files at once
  }
});

// ============ GALERIJA ============

// Single upload (backwards compatibility)
app.post("/upload/galerija", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nema slike." });

  const imageUrl = `/uploads/galerija/${req.file.filename}`;
  db.query("INSERT INTO galerija (image) VALUES (?)", [imageUrl], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, image: imageUrl });
  });
});

// Multiple uploads
app.post("/upload/galerija/multiple", upload.array("images", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nema slika za upload." });
  }

  const imageUrls = req.files.map(file => `/uploads/galerija/${file.filename}`);

  // Insert all images in a single transaction
  const values = imageUrls.map(url => [url]);
  const placeholders = values.map(() => "(?)").join(",");

  db.query(`INSERT INTO galerija (image) VALUES ${placeholders}`, imageUrls, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      images: imageUrls,
      count: imageUrls.length
    });
  });
});

app.get("/api/images/galerija", (req, res) => {
  db.query("SELECT * FROM galerija ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ images: results });
  });
});

// ============ BOBB ============

// Single upload (backwards compatibility)
app.post("/upload/bobb", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nema slike." });

  const imageUrl = `/uploads/bobb/${req.file.filename}`;
  db.query("INSERT INTO bobb (image) VALUES (?)", [imageUrl], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, image: imageUrl });
  });
});

// Multiple uploads
app.post("/upload/bobb/multiple", upload.array("images", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nema slika za upload." });
  }

  const imageUrls = req.files.map(file => `/uploads/bobb/${file.filename}`);

  const values = imageUrls.map(url => [url]);
  const placeholders = values.map(() => "(?)").join(",");

  db.query(`INSERT INTO bobb (image) VALUES ${placeholders}`, imageUrls, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      images: imageUrls,
      count: imageUrls.length
    });
  });
});

app.get("/api/images/bobb", (req, res) => {
  db.query("SELECT * FROM bobb ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ images: results });
  });
});

// ============ BLOG ============

// Single upload (backwards compatibility)
app.post("/upload/blog", upload.single("image"), (req, res) => {
  const { description } = req.body;
  if (!req.file || !description) {
    return res.status(400).json({ error: "Nedostaje slika ili opis." });
  }

  const imageUrl = `/uploads/blog/${req.file.filename}`;
  db.query(
    "INSERT INTO blog (description, image) VALUES (?, ?)",
    [description, imageUrl],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, image: imageUrl });
    }
  );
});

// Multiple uploads with shared description
app.post("/upload/blog/multiple", upload.array("images", 10), (req, res) => {
  const { description } = req.body;
  if (!req.files || req.files.length === 0 || !description) {
    return res.status(400).json({ error: "Nedostaju slike ili opis." });
  }

  const imageUrls = req.files.map(file => `/uploads/blog/${file.filename}`);

  // Insert all blog entries with the same description
  const values = imageUrls.map(url => [description, url]);
  const placeholders = values.map(() => "(?, ?)").join(",");
  const flatValues = values.flat();

  db.query(`INSERT INTO blog (description, image) VALUES ${placeholders}`, flatValues, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      images: imageUrls,
      count: imageUrls.length,
      description: description
    });
  });
});

app.get("/api/blogs", (req, res) => {
  db.query("SELECT * FROM blog ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ blogs: results });
  });
});

// ============ DELETE ============

// DELETE iz galerija
app.delete("/api/galerija/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM galerija WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DELETE multiple from galerija
app.delete("/api/galerija/multiple", (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Nedostaju ID-jevi za brisanje." });
  }

  const placeholders = ids.map(() => "?").join(",");
  db.query(`DELETE FROM galerija WHERE id IN (${placeholders})`, ids, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedCount: result.affectedRows });
  });
});

// DELETE iz bobb
app.delete("/api/bobb/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM bobb WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DELETE multiple from bobb
app.delete("/api/bobb/multiple", (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Nedostaju ID-jevi za brisanje." });
  }

  const placeholders = ids.map(() => "?").join(",");
  db.query(`DELETE FROM bobb WHERE id IN (${placeholders})`, ids, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedCount: result.affectedRows });
  });
});

// DELETE iz blog
app.delete("/api/blog/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM blog WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DELETE multiple from blog
app.delete("/api/blog/multiple", (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Nedostaju ID-jevi za brisanje." });
  }

  const placeholders = ids.map(() => "?").join(",");
  db.query(`DELETE FROM blog WHERE id IN (${placeholders})`, ids, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedCount: result.affectedRows });
  });
});

// ============ Server ============
const PORT = 7142;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});