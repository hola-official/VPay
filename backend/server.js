const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const workerRoutes = require("./routes/userRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/workers", workerRoutes);
app.use("/api/invoices", invoiceRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "VPay API is up and running!" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Database connected successfully!");
    app.listen(PORT, () => console.log(`Server Is 🏃‍♂️ On PORT ${PORT}`));
  })
  .catch((err) => console.log("❌ Database connection failed:", err));
