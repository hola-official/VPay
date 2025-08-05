import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { createAvatar } from "@dicebear/core";
import { personas } from "@dicebear/collection";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  okxWallet,
  bitgetWallet,
  binanceWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

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
      name: "Xfi Scan",
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

const DicebearPersonaAvatar = ({ address, size }) => {
  // Generate avatar using the same function from your code
  const avatarUri = createAvatar(personas, {
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

const customAvatar = ({ address, ensImage, size }) => {
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

export const WagmiConfigProvider = ({ children }) => {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            // accentColor: "#97CBDC/30",
            accentColorForeground: "white",
            fontStack: "system",
          })}
          avatar={customAvatar}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
