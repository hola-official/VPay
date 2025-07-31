const mongoose = require("mongoose");

const workerSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true }, // worker's full name
    walletAddress: { type: String, required: true, unique: true }, // worker's wallet address
    email: { type: String, required: true }, // email for notifications
    label: String, // worker's position/label
    savedBy: { type: String, required: true }, // connected wallet address who saved this worker
    isActive: { type: Boolean, default: true }, // whether worker is currently active
  },
  {
    timestamps: true,
  }
);

const Worker = mongoose.model("Worker", workerSchema);

module.exports = Worker;
