import { useAccount, useBalance } from "wagmi";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { tokenAddresses } from "../lib/tokenAddresses";

export function WalletBalance() {
  const { address } = useAccount();

  const { data: ethBalance } = useBalance({
    address,
  });

  const { data: usdtBalance } = useBalance({
    address,
    token: tokenAddresses.USDT,
  });

  const { data: usdcBalance } = useBalance({
    address,
    token: tokenAddresses.USDC,
  });

  if (!address) return null;

  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-slate-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <h4 className="text-slate-300 font-medium text-sm sm:text-base">
          Wallet Balance
        </h4>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs sm:text-sm">ETH</span>
          <span className="text-white font-semibold text-sm sm:text-base">
            {ethBalance ? Number(ethBalance.formatted).toFixed(4) : "0.0000"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs sm:text-sm">USDT</span>
          <span className="text-green-400 font-semibold text-sm sm:text-base">
            {usdtBalance ? Number(usdtBalance.formatted).toFixed(2) : "0.00"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs sm:text-sm">USDC</span>
          <span className="text-blue-400 font-semibold text-sm sm:text-base">
            {usdcBalance ? Number(usdcBalance.formatted).toFixed(2) : "0.00"}
          </span>
        </div>
      </div>
    </Card>
  );
}
