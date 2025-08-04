import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { WagmiConfigProvider } from "@/provider/Wagmi";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WagmiConfigProvider>
      <App />
    </WagmiConfigProvider>
  </StrictMode>
);
