import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiConfigProvider } from "@/provider/Wagmi";
import { ToastContainer } from "react-toastify";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WagmiConfigProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(30, 41, 59, 0.9)",
              color: "#fff",
              border: "1px solid rgba(71, 85, 105, 0.5)",
              backdropFilter: "blur(10px)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
        <App />
      </BrowserRouter>
    </WagmiConfigProvider>
  </StrictMode>
);

// USDT: 0xC9592d8D3AA150d62E9638C5588264abFc5D9976
// USDC: 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B
// Token Lock: 0x40E676D5Bd4553dE4E386D65119d5bbd747B7B67
// Payment Lock: 0x863c0a15372F3F9f76901693895dC9a2A4605400
// Backend contact api: https://v-pay-backend.vercel.app/api/workers
