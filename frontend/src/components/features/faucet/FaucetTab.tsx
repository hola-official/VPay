import { useState, useEffect } from "react"
import { Droplets, Clock, Gift, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface FaucetToken {
  symbol: string
  name: string
  icon: string
  amount: number
  cooldown: number // in minutes
  lastClaimed?: number
}

export function FaucetTab() {
  const [faucetTokens] = useState<FaucetToken[]>([
    {
      symbol: "USDT",
      name: "Tether USD",
      icon: "🟢",
      amount: 100,
      cooldown: 60, // 1 hour
      lastClaimed: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: "🔵",
      amount: 100,
      cooldown: 60, // 1 hour
      lastClaimed: Date.now() - 70 * 60 * 1000, // 70 minutes ago (can claim)
    },
  ])

  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft: { [key: string]: number } = {}

      faucetTokens.forEach((token) => {
        if (token.lastClaimed) {
          const timeSinceLastClaim = Date.now() - token.lastClaimed
          const cooldownMs = token.cooldown * 60 * 1000
          const remaining = Math.max(0, cooldownMs - timeSinceLastClaim)
          newTimeLeft[token.symbol] = remaining
        }
      })

      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(interval)
  }, [faucetTokens])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const canClaim = (token: FaucetToken) => {
    return !timeLeft[token.symbol] || timeLeft[token.symbol] === 0
  }

  const getProgress = (token: FaucetToken) => {
    if (!token.lastClaimed) return 100
    const timeSinceLastClaim = Date.now() - token.lastClaimed
    const cooldownMs = token.cooldown * 60 * 1000
    return Math.min(100, (timeSinceLastClaim / cooldownMs) * 100)
  }

  const handleClaim = (tokenSymbol: string) => {
    console.log(`Claiming ${tokenSymbol} from faucet`)
    // Handle claim logic here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Token Faucet</h1>
          <p className="text-gray-400">Claim free USDT and USDC tokens every hour for testing</p>
        </div>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400">
          <Droplets className="w-4 h-4 mr-2" />
          Free Tokens
        </Badge>
      </div>

      {/* Faucet Info */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">How it works</h3>
              <p className="text-gray-400 text-sm">
                Claim free testnet tokens every hour. Perfect for testing your vesting schedules and payments.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">100</p>
              <p className="text-gray-400 text-sm">Tokens per claim</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Tokens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {faucetTokens.map((token) => {
          const progress = getProgress(token)
          const claimable = canClaim(token)

          return (
            <Card key={token.symbol} className="bg-black/20 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                      {token.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">{token.symbol}</CardTitle>
                      <CardDescription className="text-gray-400">{token.name}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      claimable ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400"
                    }
                  >
                    {claimable ? "Ready" : "Cooldown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Claim Amount</span>
                  <span className="text-white font-semibold">
                    {token.amount} {token.symbol}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cooldown</span>
                  <span className="text-white">{token.cooldown} minutes</span>
                </div>

                {!claimable && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Time remaining
                      </span>
                      <span className="text-white font-mono">{formatTime(timeLeft[token.symbol] || 0)}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={() => handleClaim(token.symbol)}
                  disabled={!claimable}
                  className={`w-full h-12 ${claimable
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      : "bg-gray-600 cursor-not-allowed"
                    } text-white shadow-lg transition-all duration-300`}
                >
                  {claimable ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Claim {token.amount} {token.symbol}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Wait {formatTime(timeLeft[token.symbol] || 0)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Claims */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Claims</CardTitle>
          <CardDescription className="text-gray-400">Your latest faucet claims</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { token: "USDC", amount: 100, time: "30 minutes ago", tx: "0x1234...5678" },
            { token: "USDT", amount: 100, time: "1 hour ago", tx: "0x8765...4321" },
            { token: "USDC", amount: 100, time: "2 hours ago", tx: "0x9876...1234" },
          ].map((claim, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">
                  Claimed {claim.amount} {claim.token}
                </p>
                <p className="text-gray-400 text-sm">
                  {claim.time} • {claim.tx}
                </p>
              </div>
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                Success
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
