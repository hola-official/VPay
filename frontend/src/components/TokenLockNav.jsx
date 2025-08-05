import { motion } from "framer-motion";
import { List, PlusCircle, Info, BriefcaseBusiness, Contact } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function TokenLockNav() {
  const { pathname } = useLocation();
  const [showTooltip, setShowTooltip] = useState(null);

  const isActive = (path) => {
    return pathname === path;
  };

  const navItems = [
    {
      path: "/",
      label: "Create Lock",
      icon: PlusCircle,
      tooltip: "Lock your tokens with our secure time-release vault",
    },
    {
      path: "/pay",
      label: "Create Payroll",
      icon: BriefcaseBusiness,
      tooltip: "Create payroll vesting for your workers",
    },
    {
      path: "/contact",
      label: "Contact",
      icon: Contact,
      tooltip: "Create payroll vesting for your workers",
    },
    {
      path: "/token-lock",
      label: "Token Locks",
      icon: List,
      tooltip: "View all token locks and manage your own",
    },
    {
      path: "/lp-lock",
      label: "LP Locks",
      icon: List,
      tooltip: "View all liquidity pool token locks",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="mt-2 mb-4 p-4 rounded-xl bg-[#0a0a20]/60 border border-[#475B74]/30 flex items-start gap-3 justify-between">
        <h1 className="text-xl sm:text-3xl font-bold text-[#97CBDC] leading-tight">
          Token Distribution
        </h1>
        <div>
          <ConnectButton />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {navItems.map((item) => (
          <div key={item.path} className="relative group">
            <Link href={item.path} to={item.path}>
              <motion.div
                className={`flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-[#004581] to-[#018ABD] text-white shadow-lg shadow-[#004581]/20"
                    : "bg-[#0a0a20]/80 border border-[#475B74]/50 text-[#97CBDC] hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setShowTooltip(item.path)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.div>
            </Link>

            {showTooltip === item.path && (
              <motion.div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-[#0a0a20] border border-[#475B74]/50 rounded-lg shadow-lg text-xs text-[#97CBDC]/90 text-center z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {item.tooltip}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#0a0a20] border-r border-b border-[#475B74]/50"></div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <motion.div
        className="mt-6 p-4 rounded-xl bg-[#0a0a20]/60 border border-[#475B74]/30 flex items-start gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Info className="w-5 h-5 text-[#018ABD] mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-[#97CBDC]">
            Token Lock Security
          </h3>
          <p className="text-xs text-[#97CBDC]/70 mt-1">
            Our token lock system uses secure smart contracts to lock your
            tokens until the specified date. Once locked, tokens cannot be
            accessed until the unlock date, providing confidence to your
            community and investors.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
