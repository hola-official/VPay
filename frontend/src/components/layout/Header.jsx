import { Link } from "react-router-dom";
import { Twitter, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VPayLogo } from "@/components/ui/VPay-logo";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header({ onMenuToggle }) {
  return (
    <header className="h-16 sm:h-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <VPayLogo size="md" variant="default" />
          <div className="hidden sm:block w-px h-6 bg-white/20" />
          <h2 className="text-lg sm:text-xl font-medium text-gray-300 truncate">
            Token Distribution
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to={"https://x.com/hola_officia"}
            target={"_blank"}
            title="Dev X handle"
          >
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#1DA1F2]/30 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50 transition-all duration-300 cursor-pointer"
            >
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-[#1DA1F2]" />
            </Button>
          </Link>

          <ConnectButton
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
            showBalance={{
              smallScreen: true,
              largeScreen: true,
            }}
          />
        </div>
      </div>
    </header>
  );
}
