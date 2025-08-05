import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  okxWallet,
  bitgetWallet,
  binanceWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";

const crossFiTestnet = {
  id: 4157,
  name: "CrossFi Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "CrossFi Testnet",
    symbol: "XFI",
  },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_CROSSFI_TESTNET_RPC_URL ||
          "https://tendermint-rpc.testnet.ms/",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "CrossFi Explorers",
      url: "https://test.xfiscan.com/",
    },
  },
  contracts: {
    multicall3: {
      address: "0xe6F2f5f35752adc98FD0C1eB1b82DD09fC3F47A2",
      blockCreated: 10236317,
    },
  },
};

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
  chains: [crossFiTestnet],
  transports: {
    [crossFiTestnet.id]: http(import.meta.env.VITE_CROSSFI_TESTNET_RPC_URL, {
      fetchOptions: {
        headers: {
          Origin: window.location.origin,
        },
      },
    }),
  },
  ssr: true,
});
