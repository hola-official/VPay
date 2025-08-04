"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, Check } from "lucide-react";

export function TokenSelector({ selectedToken, onTokenSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const tokens = [
    {
      symbol: "USDT",
      name: "Tether USD",
      icon: "/usdt.png",
      color: "from-green-500 to-emerald-400",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: "/usdc.png",
      color: "from-blue-500 to-cyan-400",
    },
  ];

  const selectedTokenData = tokens.find(
    (token) => token.symbol === selectedToken
  );

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 bg-slate-800/50 border border-slate-600/50 hover:bg-slate-700/50 text-white justify-between rounded-xl"
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedTokenData?.color} flex items-center justify-center`}
          >
            <img
              src={selectedTokenData?.icon}
              alt={selectedTokenData?.symbol}
              className="w-4 h-4"
            />
          </div>
          <div className="text-left">
            <p className="font-semibold">{selectedTokenData?.symbol}</p>
            <p className="text-slate-400 text-sm">{selectedTokenData?.name}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 backdrop-blur-xl bg-slate-900/90 border-slate-700/50 shadow-2xl">
          <div className="p-2">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => {
                  onTokenSelect(token.symbol);
                  setIsOpen(false);
                }}
                className="w-full p-3 rounded-lg hover:bg-slate-800/50 transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${token.color} flex items-center justify-center`}
                  >
                    <span className="text-sm">{token.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{token.symbol}</p>
                    <p className="text-slate-400 text-sm">{token.name}</p>
                  </div>
                </div>
                {selectedToken === token.symbol && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
