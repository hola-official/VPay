import { useState } from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Token } from "@/types/token"

interface TokenSelectorProps {
  selectedToken: string
  onTokenSelect: (token: string) => void
  showBalance?: boolean
}

const predefinedTokens: Token[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xC9592d8D3AA150d62E9638C5588264abFc5D9976",
    icon: "/usdt.png",
    balance: 1250.75,
  },
  {
    symbol: "USDC",
    name: "Circle",
    address: "0xae6c13C19ff16110BAD54E54280ec1014994631f",
    icon: "/usdc.png",
    balance: 890.25,
  },
]

export function TokenSelector({ selectedToken, onTokenSelect, showBalance = false }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [customToken, setCustomToken] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

  const selectedTokenData = predefinedTokens.find((token) => token.symbol === selectedToken)

  const handleTokenSelect = (tokenSymbol: string) => {
    onTokenSelect(tokenSymbol)
    setOpen(false)
    setShowCustomInput(false)
  }

  const handleCustomTokenAdd = () => {
    if (customToken.trim()) {
      onTokenSelect(customToken.trim())
      setCustomToken("")
      setShowCustomInput(false)
      setOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-white">Token</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {selectedTokenData ? (
                <>
                  <img
                    src={selectedTokenData.icon}
                    alt=""
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full"
                  />
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{selectedTokenData.symbol}</p>
                    {showBalance && selectedTokenData.balance && (
                      <p className="text-xs text-gray-400 truncate">Balance: {selectedTokenData.balance.toLocaleString()}</p>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-gray-400 text-sm sm:text-base">Select token...</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-black/80 backdrop-blur-xl border border-white/10">
          <Command className="bg-transparent">
            <CommandInput placeholder="Search tokens..." className="text-white" />
            <CommandList>
              <CommandEmpty className="text-gray-400 p-4">No tokens found.</CommandEmpty>
              <CommandGroup>
                {predefinedTokens.map((token) => (
                  <CommandItem
                    key={token.symbol}
                    value={token.symbol}
                    onSelect={() => handleTokenSelect(token.symbol)}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <img
                        src={token.icon}
                        alt={token.name}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm sm:text-base truncate">{token.symbol}</span>
                          {showBalance && token.balance && (
                            <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">{token.balance.toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{token.name}</p>
                      </div>
                    </div>
                    <Check
                      className={cn("ml-auto h-4 w-4 flex-shrink-0", selectedToken === token.symbol ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => setShowCustomInput(true)}
                  className="text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add custom token
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>

          {showCustomInput && (
            <div className="p-3 border-t border-white/10 space-y-3">
              <Label className="text-white text-sm">Custom Token Address</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="0x..."
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <Button
                  onClick={handleCustomTokenAdd}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
