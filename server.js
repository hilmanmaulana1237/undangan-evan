const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3001;

// Data files
const DATA_DIR = path.join(__dirname, "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const GUESTS_FILE = path.join(DATA_DIR, "guests.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for local development
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use(
  express.static(__dirname, {
    index: "index.html",
    maxAge: "1h",
  })
);

// Initialize data files
async function initializeDataFiles() {
  try {
    await fs.ensureDir(DATA_DIR);

    // Initialize comments.json
    if (!(await fs.pathExists(COMMENTS_FILE))) {
      await fs.writeJson(
        COMMENTS_FILE,
        {
          comments: [],
          total: 0,
          lastId: 0,
        },
        { spaces: 2 }
      );
    }

    // Initialize guests.json
    if (!(await fs.pathExists(GUESTS_FILE))) {
      await fs.writeJson(
        GUESTS_FILE,
        {
          guests: [],
          total: 0,
          lastId: 0,
        },
        { spaces: 2 }
      );
    }

    // Initialize settings.json
    if (!(await fs.pathExists(SETTINGS_FILE))) {
      await fs.writeJson(
        SETTINGS_FILE,
        {
          event: {
            title: "Khitanan Ahmad",
            childName: "Ahmad bin Bapak Fulan",
            fatherName: "Bapak Fulan",
            motherName: "Ibu Fulanah",
            date: "2025-09-14",
            time: "08:00:00",
            location:
              "RT 10 RW 02, Desa Pajerukan, Kec. Kalibagor, Kab. Banyumas, Jawa Tengah 53191",
            mapUrl: "https://goo.gl/maps/ALZR6FJZU3kxVwN86",
          },
          contact: {
            phone: "0812345678",
            bankName: "Bank Central Asia",
            bankAccount: "1234567891234",
            bankHolder: "Riski Siapa?",
          },
          stats: {
            totalViews: 0,
            totalComments: 0,
            totalGuests: 0,
          },
        },
        { spaces: 2 }
      );
    }

    console.log("✅ Data files initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing data files:", error);
  }
}

// Helper functions
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatGuestName(type, name) {
  return `${type} ${name}`;
}

async function readDataFile(filePath) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

async function writeDataFile(filePath, data) {
  try {
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// API Routes

// Comments API
app.get("/api/comments", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const per_page = parseInt(req.query.per_page) || 10;
    const data = await readDataFile(COMMENTS_FILE);

    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read comments data",
      });
    }

    const totalPages = Math.ceil(data.total / per_page);
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;

    const comments = data.comments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        data: comments,
        pagination: {
          page,
          per_page,
          total: data.total,
          total_pages: totalPages,
          has_more: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.post("/api/comments", async (req, res) => {
  try {
    const { name, presence, comment, gif_url } = req.body;

    if (!name || !comment) {
      return res.status(400).json({
        success: false,
        error: "Name and comment are required",
      });
    }

    const data = await readDataFile(COMMENTS_FILE);
    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read comments data",
      });
    }

    const newComment = {
      uuid: uuidv4(),
      id: ++data.lastId,
      own: generateSlug(name),
      name: name.trim(),
      presence: presence === 1 || presence === "1" || presence === true,
      comment: comment.trim(),
      gif_url: gif_url || null,
      created_at: new Date().toISOString(),
      is_admin: false,
      is_parent: true,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent"),
      comments: [],
      like_count: 0,
    };

    data.comments.push(newComment);
    data.total = data.comments.length;

    const success = await writeDataFile(COMMENTS_FILE, data);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to save comment",
      });
    }

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.put("/api/comments/:uuid/like", async (req, res) => {
  try {
    const { uuid } = req.params;
    const data = await readDataFile(COMMENTS_FILE);

    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read comments data",
      });
    }

    const comment = data.comments.find((c) => c.uuid === uuid);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found",
      });
    }

    comment.like_count = (comment.like_count || 0) + 1;

    const success = await writeDataFile(COMMENTS_FILE, data);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to update comment",
      });
    }

    res.json({
      success: true,
      data: { like_count: comment.like_count },
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Guests API
app.get("/api/guests", async (req, res) => {
  try {
    const data = await readDataFile(GUESTS_FILE);

    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read guests data",
      });
    }

    res.json({
      success: true,
      data: data.guests.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    });
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.post("/api/guests", async (req, res) => {
  try {
    const { name, type, category } = req.body;

    if (!name || !type || !category) {
      return res.status(400).json({
        success: false,
        error: "Name, type, and category are required",
      });
    }

    const data = await readDataFile(GUESTS_FILE);
    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read guests data",
      });
    }

    const fullName = formatGuestName(type, name.trim());
    const slug = generateSlug(name.trim());
    const link = `index.html?to=${encodeURIComponent(fullName)}`;

    // Check if guest already exists
    const existingGuest = data.guests.find((g) => g.slug === slug);
    if (existingGuest) {
      return res.status(409).json({
        success: false,
        error: "Guest with this name already exists",
      });
    }

    const newGuest = {
      id: ++data.lastId,
      name: name.trim(),
      type,
      category,
      full_name: fullName,
      slug,
      invitation_link: link,
      views: 0,
      comment_count: 0,
      created_at: new Date().toISOString(),
    };

    data.guests.push(newGuest);
    data.total = data.guests.length;

    const success = await writeDataFile(GUESTS_FILE, data);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to save guest",
      });
    }

    res.status(201).json({
      success: true,
      data: newGuest,
    });
  } catch (error) {
    console.error("Error creating guest:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.delete("/api/guests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readDataFile(GUESTS_FILE);

    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read guests data",
      });
    }

    const guestIndex = data.guests.findIndex((g) => g.id === parseInt(id));
    if (guestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Guest not found",
      });
    }

    data.guests.splice(guestIndex, 1);
    data.total = data.guests.length;

    const success = await writeDataFile(GUESTS_FILE, data);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete guest",
      });
    }

    res.json({
      success: true,
      message: "Guest deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.delete("/api/guests", async (req, res) => {
  try {
    const data = await readDataFile(GUESTS_FILE);

    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read guests data",
      });
    }

    const deletedCount = data.guests.length;
    data.guests = [];
    data.total = 0;
    data.lastId = 0;

    const success = await writeDataFile(GUESTS_FILE, data);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to clear guests data",
      });
    }

    res.json({
      success: true,
      data: { deleted_count: deletedCount },
    });
  } catch (error) {
    console.error("Error clearing guests:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Settings API
app.get("/api/settings", async (req, res) => {
  try {
    const data = await readDataFile(SETTINGS_FILE);

    if (!data) {
      return res.status(500).json({
        success: false,
        error: "Failed to read settings data",
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const currentData = await readDataFile(SETTINGS_FILE);

    if (!currentData) {
      return res.status(500).json({
        success: false,
        error: "Failed to read settings data",
      });
    }

    const updatedData = {
      ...currentData,
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const success = await writeDataFile(SETTINGS_FILE, updatedData);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to save settings",
      });
    }

    res.json({
      success: true,
      data: updatedData,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Stats API
app.get("/api/stats", async (req, res) => {
  try {
    const [commentsData, guestsData, settingsData] = await Promise.all([
      readDataFile(COMMENTS_FILE),
      readDataFile(GUESTS_FILE),
      readDataFile(SETTINGS_FILE),
    ]);

    if (!commentsData || !guestsData || !settingsData) {
      return res.status(500).json({
        success: false,
        error: "Failed to read stats data",
      });
    }

    const stats = {
      total_comments: commentsData.total,
      total_guests: guestsData.total,
      total_views: settingsData.stats?.totalViews || 0,
      comments_today: commentsData.comments.filter(
        (c) =>
          new Date(c.created_at).toDateString() === new Date().toDateString()
      ).length,
      guests_today: guestsData.guests.filter(
        (g) =>
          new Date(g.created_at).toDateString() === new Date().toDateString()
      ).length,
      latest_comments: commentsData.comments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
      popular_categories: guestsData.guests.reduce((acc, guest) => {
        acc[guest.category] = (acc[guest.category] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Start server
async function startServer() {
  try {
    await initializeDataFiles();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📂 Data directory: ${DATA_DIR}`);
      console.log(`📝 Comments file: ${COMMENTS_FILE}`);
      console.log(`👥 Guests file: ${GUESTS_FILE}`);
      console.log(`⚙️ Settings file: ${SETTINGS_FILE}`);
      console.log(`\n📖 API Endpoints:`);
      console.log(`   GET  /api/comments     - Get comments`);
      console.log(`   POST /api/comments     - Create comment`);
      console.log(`   PUT  /api/comments/:uuid/like - Like comment`);
      console.log(`   GET  /api/guests       - Get guests`);
      console.log(`   POST /api/guests       - Create guest`);
      console.log(`   DELETE /api/guests/:id - Delete guest`);
      console.log(`   DELETE /api/guests     - Clear all guests`);
      console.log(`   GET  /api/settings     - Get settings`);
      console.log(`   PUT  /api/settings     - Update settings`);
      console.log(`   GET  /api/stats        - Get statistics`);
      console.log(`\n🌐 Web Interface:`);
      console.log(`   http://localhost:${PORT}              - Main invitation`);
      console.log(
        `   http://localhost:${PORT}/generate.html - Guest generator`
      );
      console.log(
        `   http://localhost:${PORT}/dashboard.html - Admin dashboard`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Server shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down...");
  process.exit(0);
});

startServer();
