import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { defineChain } from "viem";
import { createAvatar } from "@dicebear/core";
import { pixelArt, personas } from "@dicebear/collection";
import {
  bitgetWallet,
  walletConnectWallet,
  metaMaskWallet,
  rabbyWallet
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";

const REOWN_CLOUD_APP_ID = import.meta.env.VITE_REOWN_CLOUD_APP_ID || "";

const crossFiTestnet = defineChain({
  id: 4157,
  caipNetworkId: "eip155:4157",
  chainNamespace: "eip155",
  name: "CrossFi Testnet",
  iconUrl: "/CrossFi-chain.jpg",
  nativeCurrency: {
    decimals: 18,
    name: "CrossFi Testnet",
    symbol: "XFI",
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_CROSSFI_TESTNET_RPC_URL],
      webSocket: [import.meta.env.VITE_CROSSFI_TESTNET_WS_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "CrossFi Explorers",
      url: "https://test.xfiscan.com/",
    },
  }
});

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        bitgetWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "VPay",
    projectId: REOWN_CLOUD_APP_ID,
  }
);

const config = createConfig({
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

interface DicebearPersonaAvatarProps {
  address: string;
  size: number;
}

const DicebearPersonaAvatar = ({ address, size }: DicebearPersonaAvatarProps) => {
  // Generate avatar using the same function from your code
  const avatarUri = createAvatar(pixelArt, personas, {
    seed: address.toLowerCase(),
    scale: 90,
    radius: 50,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
  }).toDataUri();

  return (
    <img
      src={avatarUri}
      width={size}
      height={size}
      alt={`${address.slice(0, 6)}...${address.slice(-4)} avatar`}
      className="rounded-full"
    />
  );
};

interface CustomAvatarProps {
  address: string;
  ensImage?: string;
  size: number;
}

const customAvatar = ({ address, ensImage, size }: CustomAvatarProps) => {
  // If there's an ENS image, use it instead of DiceBear
  if (ensImage) {
    return (
      <img
        src={ensImage}
        width={size}
        height={size}
        alt={`${address.slice(0, 6)}...${address.slice(-4)} avatar`}
        className="rounded-full"
      />
    );
  } else {
    // Otherwise use DiceBear
    return <DicebearPersonaAvatar address={address} size={size} />;
  }
};

interface WagmiConfigProviderProps {
  children: ReactNode;
}

export const WagmiConfigProvider = ({ children }: WagmiConfigProviderProps) => {
  const queryClient = new QueryClient();

  if (!REOWN_CLOUD_APP_ID) {
    console.error("REOWN_CLOUD_APP_ID is not set!");
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          // initialChain={crossFiDevnet?.id}
          modalSize="compact"
          theme={darkTheme({
            accentColorForeground: "white",
            fontStack: "system",
          })}
          avatar={customAvatar}
          initialChain={crossFiTestnet}
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
