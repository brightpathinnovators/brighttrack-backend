require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Schema
const locationSchema = new mongoose.Schema({
  employeeId: String,
  latitude: Number,
  longitude: Number,
  time: { type: Date, default: Date.now }
});

const Location = mongoose.model("Location", locationSchema);

// ================= ROUTES ================= //

// Health Check
app.get("/", (req, res) => {
  res.send("BrightTrack API Running 🚀");
});

// Save Location
app.post("/location", async (req, res) => {
  try {
    const { employeeId, latitude, longitude } = req.body;

    if (!employeeId || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newLocation = new Location({
      employeeId,
      latitude,
      longitude
    });

    await newLocation.save();

    res.json({ success: true, message: "Location saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Locations
app.get("/locations", async (req, res) => {
  try {
    const data = await Location.find().sort({ time: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Latest Location per Employee
app.get("/latest", async (req, res) => {
  try {
    const data = await Location.aggregate([
      { $sort: { time: -1 } },
      {
        $group: {
          _id: "$employeeId",
          employeeId: { $first: "$employeeId" },
          latitude: { $first: "$latitude" },
          longitude: { $first: "$longitude" },
          time: { $first: "$time" }
        }
      }
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= START SERVER ================= //

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB ERROR:", err));
