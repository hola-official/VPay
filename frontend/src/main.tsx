import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { WagmiConfigProvider } from '@/provider/WagmiConfigProvider.tsx';
import "@rainbow-me/rainbowkit/styles.css";
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { Bounce, ToastContainer } from "react-toastify";
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WagmiConfigProvider>
        <QueryClientProvider client={queryClient}>
          <ToastContainer
            position="buttom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            transition={Bounce}
          />
          <App />
        </QueryClientProvider>
      </WagmiConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)

// USDT: 0xC9592d8D3AA150d62E9638C5588264abFc5D9976
// USDC: 0xae6c13C19ff16110BAD54E54280ec1014994631f
// Token Lock: 0x40E676D5Bd4553dE4E386D65119d5bbd747B7B67
// Payment Lock: 0x863c0a15372F3F9f76901693895dC9a2A4605400
// Backend contact api: https://v-pay-backend.vercel.app/api/workers