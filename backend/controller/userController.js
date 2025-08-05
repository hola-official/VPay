const Worker = require("../model/user");

// Create a new worker
const createWorker = async (req, res) => {
  try {
    const { fullName, walletAddress, email, label, savedBy, isActive } =
      req.body;

    // Validate required fields
    if (!fullName || !walletAddress || !email || !savedBy) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, wallet address, email, and savedBy wallet address are required",
      });
    }

    // Validate wallet address format (basic check)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker wallet address format",
      });
    }

    // Validate savedBy wallet address format
    if (!savedBy.startsWith("0x") || savedBy.length !== 42) {
      return res.status(400).json({
        success: false,
        message: "Invalid savedBy wallet address format",
      });
    }

    // Check if worker with wallet address already exists
    const existingWorkerByWallet = await Worker.findOne({ walletAddress });
    if (existingWorkerByWallet) {
      return res.status(409).json({
        success: false,
        message: "Worker with this wallet address already exists",
      });
    }

    // Check if worker with email already exists
    const existingWorkerByEmail = await Worker.findOne({ email });
    if (existingWorkerByEmail) {
      return res.status(409).json({
        success: false,
        message: "Worker with this email address already exists",
      });
    }

    const worker = await Worker.create({
      fullName,
      walletAddress,
      email,
      label,
      savedBy,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Worker created successfully",
      data: worker,
    });
  } catch (error) {
    console.error("Error creating worker:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all workers (with optional filtering by savedBy wallet address)
const getAllWorkers = async (req, res) => {
  try {
    const { savedBy, isActive } = req.query;
    let query = {};

    // Filter by savedBy wallet address if provided
    if (savedBy) {
      query.savedBy = savedBy;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const workers = await Worker.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Workers retrieved successfully",
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    console.error("Error getting workers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get worker by ID
const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Worker retrieved successfully",
      data: worker,
    });
  } catch (error) {
    console.error("Error getting worker:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update worker by ID
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, walletAddress, email, label, savedBy, isActive } =
      req.body;

    // Check if worker exists
    const existingWorker = await Worker.findById(id);
    if (!existingWorker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // If wallet address is being updated, check for duplicates
    if (walletAddress && walletAddress !== existingWorker.walletAddress) {
      const walletExists = await Worker.findOne({
        walletAddress,
        _id: { $ne: id },
      });
      if (walletExists) {
        return res.status(409).json({
          success: false,
          message: "Wallet address already exists",
        });
      }
    }

    // Validate wallet address if being updated
    if (
      walletAddress &&
      (!walletAddress.startsWith("0x") || walletAddress.length !== 42)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker wallet address format",
      });
    }

    // Validate savedBy wallet address if being updated
    if (savedBy && (!savedBy.startsWith("0x") || savedBy.length !== 42)) {
      return res.status(400).json({
        success: false,
        message: "Invalid savedBy wallet address format",
      });
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      { fullName, walletAddress, email, label, savedBy, isActive },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Worker updated successfully",
      data: updatedWorker,
    });
  } catch (error) {
    console.error("Error updating worker:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete worker by ID
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findByIdAndDelete(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Worker deleted successfully",
      data: worker,
    });
  } catch (error) {
    console.error("Error deleting worker:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get workers filtered by savedBy wallet address
const getWorkersByWallet = async (req, res) => {
  try {
    const { savedBy } = req.params;

    if (!savedBy) {
      return res.status(400).json({
        success: false,
        message: "Wallet address parameter is required",
      });
    }

    // Validate wallet address format
    if (!savedBy.startsWith("0x") || savedBy.length !== 42) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address format",
      });
    }

    const workers = await Worker.find({ savedBy, isActive: true }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: `Workers saved by wallet ${savedBy} retrieved successfully`,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    console.error("Error getting workers by wallet:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Search workers by name, wallet address, or email
const searchWorkers = async (req, res) => {
  try {
    const { q, savedBy, isActive } = req.query;

    let query = {};

    // Add search query if provided
    if (q) {
      query.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { walletAddress: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { label: { $regex: q, $options: "i" } },
      ];
    }

    // Add savedBy wallet address filter if provided
    if (savedBy) {
      query.savedBy = savedBy;
    }

    // Add active status filter if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const workers = await Worker.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    console.error("Error searching workers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get active workers count by savedBy wallet address
const getActiveWorkersCount = async (req, res) => {
  try {
    const { savedBy } = req.params;

    if (!savedBy) {
      return res.status(400).json({
        success: false,
        message: "Wallet address parameter is required",
      });
    }

    const count = await Worker.countDocuments({ savedBy, isActive: true });

    res.status(200).json({
      success: true,
      message: "Active workers count retrieved successfully",
      data: { count, walletAddress: savedBy },
    });
  } catch (error) {
    console.error("Error getting active workers count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkersByWallet,
  searchWorkers,
  getActiveWorkersCount,
};
