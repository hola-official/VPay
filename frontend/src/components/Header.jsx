import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VPayLogo } from "@/components/ui/VPayLogo";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="h-16 sm:h-20 border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <VPayLogo size="md" variant="default" />
          <div className="hidden sm:block w-px h-6 bg-white/20" />
          <h2 className="text-lg sm:text-xl font-medium text-gray-300 truncate">
            Token Distribution
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="https://x.com/hola_officia"
            target="_blank"
            rel="noopener noreferrer"
            title="Dev X handle"
          >
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </a>
          {/* Wallet Connection - Using our custom component */}
          <div className="scale-75 sm:scale-100 origin-right">
            <ConnectButton
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
