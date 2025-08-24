import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  okxWallet,
  bitgetWallet,
  binanceWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { celoAlfajores } from "wagmi/chains";
import { createConfig, http } from "wagmi";

const REOWN_CLOUD_APP_ID = import.meta.env.VITE_REOWN_CLOUD_APP_ID || "";

if (!REOWN_CLOUD_APP_ID) {
  throw new Error("REOWN_CLOUD_APP_ID is not set");
}

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        okxWallet,
        bitgetWallet,
        binanceWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "VPay",
    projectId: REOWN_CLOUD_APP_ID,
  }
);

export const config = createConfig({
  connectors,
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http(
      import.meta.env.VITE_CELO_ALFAJORES_RPC_URL ||
        "https://alfajores-forno.celo-testnet.org"
    ),
  },
  ssr: true,
});
