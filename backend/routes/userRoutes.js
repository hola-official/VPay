const express = require("express");
const router = express.Router();
const {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkersByWallet,
  searchWorkers,
  getActiveWorkersCount,
} = require("../controller/userController");

// POST /api/workers - Create a new worker contact
router.post("/", createWorker);

// GET /api/workers - Get all workers (with optional wallet address filter)
router.get("/", getAllWorkers);

// GET /api/workers/search - Search workers by name, email, phone, address, department, or position
router.get("/search", searchWorkers);

// GET /api/workers/wallet/:savedBy - Get workers filtered by wallet address
router.get("/wallet/:savedBy", getWorkersByWallet);

// GET /api/workers/count/:savedBy - Get active workers count by wallet address
router.get("/count/:savedBy", getActiveWorkersCount);

// GET /api/workers/:id - Get worker by ID
router.get("/:id", getWorkerById);

// PUT /api/workers/:id - Update worker by ID
router.put("/:id", updateWorker);

// DELETE /api/workers/:id - Delete worker by ID
router.delete("/:id", deleteWorker);

module.exports = router;
