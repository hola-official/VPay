// Debug test to see what data the frontend is sending
const API_BASE_URL = "https://v-pay-backend.vercel.app/api/workers";

// Simulate the data that the frontend would send
const mockFrontendData = {
  fullName: "John Doe",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  email: "john@example.com",
  label: "Developer",
  savedBy: "0x1234567890123456789012345678901234567890",
  isActive: true,
};

console.log("Data being sent:", JSON.stringify(mockFrontendData, null, 2));

async function testFrontendData() {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockFrontendData),
    });

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testFrontendData();
