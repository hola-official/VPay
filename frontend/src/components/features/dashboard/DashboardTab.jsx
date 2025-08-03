import { useState } from "react"
import {
  TrendingUp,
  Clock,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Building2,
  Droplets,
  Eye,
  Download,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardTab() {
  const [timeFilter, setTimeFilter] = useState("7d")
  const [vestingSchedules] = useState([
    {
      id: "1",
      type: "investor",
      tokenSymbol: "USDT",
      totalAmount: 50000,
      claimedAmount: 15000,
      nextUnlock: "2024-08-15",
      recipient: "Seed Investor A",
      status: "active",
      progress: 30,
      createdDate: "2024-07-01",
      contractAddress: "0x1234...5678",
    },
    {
      id: "2",
      type: "employee",
      tokenSymbol: "USDC",
      totalAmount: 12000,
      claimedAmount: 4000,
      nextUnlock: "2024-08-10",
      recipient: "John Doe - Developer",
      status: "active",
      progress: 33,
      createdDate: "2024-06-15",
      contractAddress: "0x2345...6789",
    },
    {
      id: "3",
      type: "lock",
      tokenSymbol: "USDT",
      totalAmount: 25000,
      claimedAmount: 0,
      nextUnlock: "2024-12-01",
      recipient: "Liquidity Lock",
      status: "pending",
      progress: 0,
      createdDate: "2024-07-20",
      contractAddress: "0x3456...7890",
    },
    {
      id: "4",
      type: "investor",
      tokenSymbol: "USDC",
      totalAmount: 30000,
      claimedAmount: 30000,
      nextUnlock: "Completed",
      recipient: "Series A Lead",
      status: "completed",
      progress: 100,
      createdDate: "2024-05-01",
      contractAddress: "0x4567...8901",
    },
    {
      id: "5",
      type: "employee",
      tokenSymbol: "USDT",
      totalAmount: 8000,
      claimedAmount: 2000,
      nextUnlock: "2024-08-20",
      recipient: "Jane Smith - Designer",
      status: "active",
      progress: 25,
      createdDate: "2024-07-10",
      contractAddress: "0x5678...9012",
    },
  ])

  const [tokenBalances] = useState([
    { symbol: "USDT", balance: 125000, value: 125000, change24h: 2.5 },
    { symbol: "USDC", balance: 87500, value: 87500, change24h: -1.2 },
    { symbol: "ETH", balance: 45.5, value: 91000, change24h: 5.8 },
    { symbol: "WBTC", balance: 2.1, value: 84000, change24h: 3.2 },
  ])

  const totalLocked = vestingSchedules.reduce((sum, schedule) => sum + schedule.totalAmount, 0)
  const totalClaimed = vestingSchedules.reduce((sum, schedule) => sum + schedule.claimedAmount, 0)
  const activeSchedules = vestingSchedules.filter((s) => s.status === "active").length
  const completedSchedules = vestingSchedules.filter((s) => s.status === "completed").length
  const totalContracts = vestingSchedules.length

  const getTypeIcon = (type) => {
    switch (type) {
      case "investor":
        return <TrendingUp className="w-4 h-4" />
      case "employee":
        return <Building2 className="w-4 h-4" />
      case "lock":
        return <Lock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "investor":
        return "border-blue-500/30 text-blue-400"
      case "employee":
        return "border-blue-500/30 text-blue-400"
      case "lock":
        return "border-orange-500/30 text-orange-400"
      default:
        return "border-gray-500/30 text-gray-400"
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">Overview of your token management and vesting schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-24 sm:w-32 bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/80 backdrop-blur-xl border border-white/10">
              <SelectItem value="24h" className="text-white hover:bg-white/10">
                24h
              </SelectItem>
              <SelectItem value="7d" className="text-white hover:bg-white/10">
                7 days
              </SelectItem>
              <SelectItem value="30d" className="text-white hover:bg-white/10">
                30 days
              </SelectItem>
              <SelectItem value="90d" className="text-white hover:bg-white/10">
                90 days
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10 bg-transparent text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Total Locked</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">${totalLocked.toLocaleString()}</div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Total Claimed</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">${totalClaimed.toLocaleString()}</div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
              +8.2% this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Active Contracts</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">{activeSchedules}</div>
            <p className="text-xs text-gray-400">
              {completedSchedules} completed • {totalContracts} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Portfolio Value</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">
              ${tokenBalances.reduce((sum, token) => sum + token.value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
              +3.7% today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Balances & Vesting Schedules */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Token Balances */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Droplets className="w-5 h-5" />
              Token Balances
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">Your current token holdings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tokenBalances.map((token) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs sm:text-sm font-bold text-white">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">{token.symbol}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{token.balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium text-sm sm:text-base">${token.value.toLocaleString()}</p>
                  <p
                    className={`text-xs flex items-center gap-1 ${token.change24h >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {token.change24h >= 0 ? (
                      <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
                    ) : (
                      <ArrowDownRight className="h-2 w-2 sm:h-3 sm:w-3" />
                    )}
                    {Math.abs(token.change24h)}%
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Vesting Schedules */}
        <Card className="xl:col-span-2 bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  Active Vesting Schedules
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Current token vesting and lock schedules
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/10 bg-transparent text-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {vestingSchedules.slice(0, 4).map((schedule) => (
              <div key={schedule.id} className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs sm:text-sm font-bold text-white">
                      {schedule.tokenSymbol}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{schedule.recipient}</p>
                        <Badge variant="outline" className={`${getTypeColor(schedule.type)} text-xs`}>
                          {getTypeIcon(schedule.type)}
                          <span className="ml-1 capitalize">{schedule.type}</span>
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {schedule.claimedAmount.toLocaleString()} / {schedule.totalAmount.toLocaleString()}{" "}
                        {schedule.tokenSymbol}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${schedule.status === "active"
                      ? "border-green-500/30 text-green-400"
                      : schedule.status === "completed"
                        ? "border-blue-500/30 text-blue-400"
                        : schedule.status === "cancelled"
                          ? "border-red-500/30 text-red-400"
                          : "border-yellow-500/30 text-yellow-400"
                      }`}
                  >
                    {schedule.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{schedule.progress}%</span>
                  </div>
                  <Progress value={schedule.progress} className="h-2" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                    <span className="text-gray-400">Next Unlock</span>
                    <span className="text-white">{schedule.nextUnlock}</span>
                  </div>
                  {schedule.contractAddress && (
                    <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                      <span className="text-gray-400">Contract</span>
                      <span className="text-blue-400 font-mono text-xs">{schedule.contractAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Vesting Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Enhanced Vesting Chart */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Token Release Timeline</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Projected token releases over the next 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
              {[
                { month: "Aug", amount: 25000, height: 20 },
                { month: "Sep", amount: 35000, height: 35 },
                { month: "Oct", amount: 45000, height: 45 },
                { month: "Nov", amount: 60000, height: 60 },
                { month: "Dec", amount: 75000, height: 75 },
                { month: "Jan", amount: 85000, height: 85 },
                { month: "Feb", amount: 95000, height: 95 },
                { month: "Mar", amount: 100000, height: 100 },
              ].map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 group cursor-pointer">
                  <div className="relative">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-sm transition-all duration-500 hover:from-blue-400 hover:to-cyan-400"
                      style={{ height: `${data.height}%` }}
                    />
                    <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${data.amount.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activity */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400 text-sm">Latest transactions and vesting events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {[
              {
                type: "claim",
                amount: "5,000 USDT",
                recipient: "John Doe",
                time: "2 hours ago",
                description: "Employee salary claim",
                txHash: "0x1234...5678",
              },
              {
                type: "lock",
                amount: "25,000 USDC",
                recipient: "Liquidity Pool",
                time: "1 day ago",
                description: "LP token lock created",
                txHash: "0x2345...6789",
              },
              {
                type: "vest",
                amount: "10,000 USDT",
                recipient: "Series A Investor",
                time: "2 days ago",
                description: "Investor vesting started",
                txHash: "0x3456...7890",
              },
              {
                type: "complete",
                amount: "30,000 USDC",
                recipient: "Seed Round",
                time: "3 days ago",
                description: "Vesting schedule completed",
                txHash: "0x4567...8901",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${activity.type === "claim"
                    ? "bg-green-500/20 text-green-400"
                    : activity.type === "lock"
                      ? "bg-blue-500/20 text-blue-400"
                      : activity.type === "vest"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-orange-500/20 text-orange-400"
                    }`}
                >
                  {activity.type === "claim" ? (
                    <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : activity.type === "lock" ? (
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : activity.type === "vest" ? (
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm sm:text-base">{activity.description}</p>
                  <p className="text-gray-400 text-xs sm:text-sm truncate">
                    {activity.amount} • {activity.recipient}
                  </p>
                  <p className="text-gray-500 text-xs font-mono truncate">{activity.txHash}</p>
                </div>
                <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
