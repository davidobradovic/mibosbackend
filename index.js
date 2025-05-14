// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const path = require("path");
// const db = require("./db");

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// // === Multer konfiguracija ===
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = "uploads/";
//     if (req.baseUrl.includes("galerija")) folder += "galerija";
//     else if (req.baseUrl.includes("bobb")) folder += "bobb";
//     else if (req.baseUrl.includes("blog")) folder += "blog";
//     cb(null, folder);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + "-" + file.originalname;
//     cb(null, unique);
//   },
// });

// const upload = multer({ storage });

// // === GALERIJA ===
// app.post("/upload/galerija", upload.single("image"), (req, res) => {
//   const imageUrl = `/uploads/galerija/${req.file.filename}`;
//   db.query("INSERT INTO galerija (image) VALUES (?)", [imageUrl], (err) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ success: true, image_url: imageUrl });
//   });
// });

// app.get("/api/images/galerija", (req, res) => {
//   db.query("SELECT * FROM galerija", (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ images: results.map((r) => r.image_url) });
//   });
// });

// // === BOBB ===
// app.post("/upload/bobb", upload.single("image"), (req, res) => {
//   const imageUrl = `/uploads/bobb/${req.file.filename}`;
//   db.query("INSERT INTO bobb (image_url) VALUES (?)", [imageUrl], (err) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ success: true, image_url: imageUrl });
//   });
// });

// app.get("/api/images/bobb", (req, res) => {
//   db.query("SELECT * FROM bobb", (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ images: results.map((r) => r.image_url) });
//   });
// });

// // === BLOG ===
// app.post("/upload/blog", upload.single("image"), (req, res) => {
//   const { description } = req.body;
//   const imageUrl = `/uploads/blog/${req.file.filename}`;
//   db.query(
//     "INSERT INTO blog (description, image_url) VALUES (?, ?)",
//     [description, imageUrl],
//     (err) => {
//       if (err) return res.status(500).json({ error: err });
//       res.json({ success: true, image_url: imageUrl });
//     }
//   );
// });

// app.get("/api/blogs", (req, res) => {
//   db.query("SELECT * FROM blog ORDER BY id DESC", (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ blogs: results });
//   });
// });

// // === Pokretanje ===
// const PORT = 7142;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

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
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const upload = multer({ storage });

// ============ GALERIJA ============
app.post("/upload/galerija", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nema slike." });

  const imageUrl = `/uploads/galerija/${req.file.filename}`;
  db.query("INSERT INTO galerija (image) VALUES (?)", [imageUrl], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, image: imageUrl });
  });
});

app.get("/api/images/galerija", (req, res) => {
  db.query("SELECT * FROM galerija", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ images: results });
  });
});

// ============ BOBB ============
app.post("/upload/bobb", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nema slike." });

  const imageUrl = `/uploads/bobb/${req.file.filename}`;
  db.query("INSERT INTO bobb (image) VALUES (?)", [imageUrl], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, image: imageUrl });
  });
});

app.get("/api/images/bobb", (req, res) => {
  db.query("SELECT * FROM bobb", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ images: results });
  });
});

// ============ BLOG ============
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

// DELETE iz bobb
app.delete("/api/bobb/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM bobb WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
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

// ============ Server ============
const PORT = 7142;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
