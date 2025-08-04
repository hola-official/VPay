import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Gift,
  Wallet,
  Users,
  DollarSign,
} from "lucide-react";
import { TransactionStatus } from "@/components/TransactionStatus";

export function DashboardPanel({ multiVesting, tokenLocker }) {
  // Get user's data
  // const { data: recipientSchedules } = multiVesting.getRecipientSchedules;
  // const { data: senderSchedules } = multiVesting.getSenderSchedules;
  // const { data: userNormalLocks } = tokenLocker.getUserNormalLocks;
  // const { data: userLpLocks } = tokenLocker.getUserLpLocks;

  // Mock data for demonstration
  const [dashboardData] = useState({
    totalValue: 45250,
    claimableValue: 12450,
    activeSchedules: 8,
    totalRecipients: 24,
    claimableItems: [
      {
        id: 1,
        type: "vesting",
        token: "USDT",
        amount: "2,500.00",
        status: "ready",
        unlockDate: "2024-01-15",
        recipient: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        progress: 100,
      },
      {
        id: 2,
        type: "lock",
        token: "USDC",
        amount: "1,850.50",
        status: "ready",
        unlockDate: "2024-01-10",
        recipient: "0x8ba1f109551bD432803012645Hac136c22C57B",
        progress: 100,
      },
      {
        id: 3,
        type: "vesting",
        token: "USDT",
        amount: "5,000.00",
        status: "partial",
        unlockDate: "2024-03-15",
        recipient: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        progress: 45,
      },
      {
        id: 4,
        type: "lock",
        token: "USDC",
        amount: "3,100.00",
        status: "locked",
        unlockDate: "2024-04-20",
        recipient: "0x8ba1f109551bD432803012645Hac136c22C57B",
        progress: 20,
      },
    ],
    recentActivity: [
      {
        id: 1,
        action: "Created Vesting Schedule",
        amount: "10,000 USDT",
        recipient: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        timestamp: "2024-01-08 14:30",
      },
      {
        id: 2,
        action: "Claimed Tokens",
        amount: "2,500 USDC",
        recipient: "You",
        timestamp: "2024-01-07 09:15",
      },
      {
        id: 3,
        action: "Created Time Lock",
        amount: "5,000 USDT",
        recipient: "0x8ba1f109551bD432803012645Hac136c22C57B",
        timestamp: "2024-01-06 16:45",
      },
    ],
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "partial":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "locked":
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Ready to Claim
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Partially Available
          </Badge>
        );
      case "locked":
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            Locked
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleClaimAll = async () => {
    try {
      await multiVesting.releaseAll();
    } catch (error) {
      console.error("Failed to claim all:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Transaction Status */}
      <TransactionStatus
        isTransactionPending={
          multiVesting.isTransactionPending || tokenLocker.isTransactionPending
        }
        isTransactionConfirming={
          multiVesting.isTransactionConfirming ||
          tokenLocker.isTransactionConfirming
        }
        isTransactionConfirmed={
          multiVesting.isTransactionConfirmed ||
          tokenLocker.isTransactionConfirmed
        }
        transactionHash={
          multiVesting.transactionHash || tokenLocker.transactionHash
        }
        transactionError={
          multiVesting.transactionError || tokenLocker.transactionError
        }
        operationStates={{
          ...multiVesting.operationStates,
          ...tokenLocker.operationStates,
        }}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-400">
              Overview of your token locks and vesting schedules
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">
                  ${dashboardData.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Claimable</p>
                <p className="text-2xl font-bold text-green-400">
                  ${dashboardData.claimableValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Schedules</p>
                <p className="text-2xl font-bold text-purple-400">
                  {dashboardData.activeSchedules}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-400 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Recipients</p>
                <p className="text-2xl font-bold text-orange-400">
                  {dashboardData.totalRecipients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claimable Items */}
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center space-x-2">
              <Gift className="w-6 h-6 text-green-400" />
              <span>Claimable Tokens</span>
            </CardTitle>
            <Button
              onClick={handleClaimAll}
              disabled={multiVesting.isTransactionPending}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
            >
              {multiVesting.isTransactionPending ? "Claiming..." : "Claim All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.claimableItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      {item.type === "vesting" ? (
                        <TrendingUp className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {item.amount} {item.token}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {item.type === "vesting"
                          ? "Vesting Schedule"
                          : "Time Lock"}{" "}
                        • Unlock:{" "}
                        {new Date(item.unlockDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-300">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recipient */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">
                      {item.recipient.slice(0, 6)}...{item.recipient.slice(-4)}
                    </span>
                  </div>
                  {item.status === "ready" && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                    >
                      Claim
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-4 p-3 rounded-lg bg-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-slate-400 text-sm">
                    {activity.amount} •{" "}
                    {activity.recipient === "You"
                      ? "You"
                      : `${activity.recipient.slice(0, 6)}...${activity.recipient.slice(-4)}`}
                  </p>
                </div>
                <span className="text-slate-500 text-sm">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
