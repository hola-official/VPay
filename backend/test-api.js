// Test script to demonstrate API usage
// Run with: node test-api.js

const BASE_URL = "https://v-pay-backend.vercel.app/api/workers";

// Helper function to make API calls
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log(`\n${options.method || "GET"} ${url}`);
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Test functions
async function testCreateWorker() {
  console.log("\n=== Testing Create Worker ===");

  const workerData = {
    fullName: "John Doe",
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    email: "john@example.com",
    label: "Smart Contract Developer",
    savedBy: "0x1234567890123456789012345678901234567890",
    isActive: true,
  };

  await makeRequest(`${BASE_URL}`, {
    method: "POST",
    body: JSON.stringify(workerData),
  });
}

async function testCreateAnotherWorker() {
  console.log("\n=== Testing Create Another Worker ===");

  const workerData = {
    fullName: "Jane Smith",
    walletAddress: "0x8ba1f109551bD432803012645Hac136c772c3",
    email: "jane@example.com",
    label: "Frontend Developer",
    savedBy: "0x1234567890123456789012345678901234567890",
    isActive: true,
  };

  await makeRequest(`${BASE_URL}`, {
    method: "POST",
    body: JSON.stringify(workerData),
  });
}

async function testGetAllWorkers() {
  console.log("\n=== Testing Get All Workers ===");
  await makeRequest(`${BASE_URL}`);
}

async function testGetWorkersByWallet() {
  console.log("\n=== Testing Get Workers by Wallet Address ===");
  await makeRequest(
    `${BASE_URL}?savedBy=0x1234567890123456789012345678901234567890`
  );
}

async function testSearchWorkers() {
  console.log("\n=== Testing Search Workers ===");
  await makeRequest(`${BASE_URL}/search?q=john`);
}

async function testSearchWorkersByWallet() {
  console.log("\n=== Testing Search Workers by Wallet Address ===");
  await makeRequest(
    `${BASE_URL}/search?q=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
  );
}

async function testGetWorkerById() {
  console.log("\n=== Testing Get Worker by ID ===");
  // First get all workers to get an ID
  const workers = await makeRequest(`${BASE_URL}`);
  if (workers.data && workers.data.length > 0) {
    const workerId = workers.data[0]._id;
    await makeRequest(`${BASE_URL}/${workerId}`);
  }
}

async function testUpdateWorker() {
  console.log("\n=== Testing Update Worker ===");
  // First get all workers to get an ID
  const workers = await makeRequest(`${BASE_URL}`);
  if (workers.data && workers.data.length > 0) {
    const workerId = workers.data[0]._id;
    const updateData = {
      fullName: "John Updated",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      email: "john.updated@example.com",
      label: "Senior Smart Contract Developer",
      savedBy: "0x1234567890123456789012345678901234567890",
      isActive: true,
    };

    await makeRequest(`${BASE_URL}/${workerId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }
}

async function testDeleteWorker() {
  console.log("\n=== Testing Delete Worker ===");
  // First get all workers to get an ID
  const workers = await makeRequest(`${BASE_URL}`);
  if (workers.data && workers.data.length > 0) {
    const workerId = workers.data[0]._id;
    await makeRequest(`${BASE_URL}/${workerId}`, {
      method: "DELETE",
    });
  }
}

async function testGetWorkersByWalletAddress() {
  console.log(
    "\n=== Testing Get Workers by Wallet Address (Path Parameter) ==="
  );
  await makeRequest(
    `${BASE_URL}/wallet/0x1234567890123456789012345678901234567890`
  );
}

async function testGetActiveWorkersCount() {
  console.log("\n=== Testing Get Active Workers Count ===");
  await makeRequest(
    `${BASE_URL}/count/0x1234567890123456789012345678901234567890`
  );
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting Web3 Worker API Tests...\n");

  await testCreateWorker();
  await testCreateAnotherWorker();
  await testGetAllWorkers();
  await testGetWorkersByWallet();
  await testSearchWorkers();
  await testSearchWorkersByWallet();
  await testGetWorkerById();
  await testUpdateWorker();
  await testDeleteWorker();
  await testGetWorkersByWalletAddress();
  await testGetActiveWorkersCount();

  console.log("\n✅ All tests completed!");
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === "undefined") {
  console.log(
    "⚠️  This script requires Node.js 18+ or you need to install node-fetch"
  );
  console.log("To install node-fetch: npm install node-fetch");
  process.exit(1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  makeRequest,
  testCreateWorker,
  testGetAllWorkers,
  testGetWorkersByWallet,
  testSearchWorkers,
  testSearchWorkersByWallet,
  testGetWorkerById,
  testUpdateWorker,
  testDeleteWorker,
  testGetWorkersByWalletAddress,
  testGetActiveWorkersCount,
};
