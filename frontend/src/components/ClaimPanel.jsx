import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Clock, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { TransactionStatus } from "@/components/TransactionStatus";

export function ClaimPanel({ multiVesting, tokenLocker }) {
  // Get user's claimable schedules and locks
  const { data: recipientSchedules } = multiVesting.getRecipientSchedules;
  const { data: userNormalLocks } = tokenLocker.getUserNormalLocks;
  const { data: userLpLocks } = tokenLocker.getUserLpLocks;

  const handleClaimVesting = async (scheduleId) => {
    try {
      await multiVesting.release(scheduleId);
    } catch (error) {
      console.error("Failed to claim vesting:", error);
    }
  };

  const handleClaimAllVesting = async () => {
    try {
      await multiVesting.releaseAll();
    } catch (error) {
      console.error("Failed to claim all vesting:", error);
    }
  };

  const handleUnlockToken = async (lockId) => {
    try {
      await tokenLocker.unlock(lockId);
    } catch (error) {
      console.error("Failed to unlock token:", error);
    }
  };

  // Combine all claimable items
  const allClaimableItems = [
    ...(recipientSchedules?.map((scheduleId) => ({
      id: scheduleId,
      type: "vesting",
      scheduleId,
    })) || []),
    ...(userNormalLocks?.map((lock, index) => ({
      id: lock.id || index,
      type: "lock",
      lock,
    })) || []),
    ...(userLpLocks?.map((lock, index) => ({
      id: lock.id || index,
      type: "lpLock",
      lock,
    })) || []),
  ];

  const [claimableTokens] = useState([
    {
      id: 1,
      token: "USDT",
      amount: "1,250.00",
      type: "Time Lock",
      status: "ready",
      unlockDate: "2024-01-15",
      progress: 100,
    },
    {
      id: 2,
      token: "USDC",
      amount: "850.50",
      type: "Vesting",
      status: "ready",
      unlockDate: "2024-01-10",
      progress: 100,
    },
    {
      id: 3,
      token: "USDT",
      amount: "2,000.00",
      type: "Vesting",
      status: "partial",
      unlockDate: "2024-03-15",
      progress: 45,
    },
    {
      id: 4,
      token: "USDC",
      amount: "500.00",
      type: "Time Lock",
      status: "locked",
      unlockDate: "2024-04-20",
      progress: 20,
    },
  ]);

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

  const totalClaimable = claimableTokens
    .filter((token) => token.status === "ready")
    .reduce(
      (sum, token) => sum + Number.parseFloat(token.amount.replace(",", "")),
      0
    );

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

      {/* Summary Card */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-blue-900/20 border-slate-700/50 shadow-2xl shadow-blue-500/10">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Claim Your Tokens
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Total Claimable</p>
              <p className="text-2xl font-bold text-green-400">
                ${totalClaimable.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Active Locks</p>
              <p className="text-2xl font-bold text-blue-400">
                {claimableTokens.length}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Ready to Claim</p>
              <p className="text-2xl font-bold text-cyan-400">
                {claimableTokens.filter((t) => t.status === "ready").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claimable Tokens List */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-slate-200">
              Your Claimable Tokens
            </CardTitle>
            <Button
              onClick={handleClaimAllVesting}
              disabled={multiVesting.isTransactionPending}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
            >
              {multiVesting.isTransactionPending
                ? "Claiming..."
                : "Claim All Vesting"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allClaimableItems.map((item) => {
              if (item.type === "vesting") {
                const schedule = null; // Placeholder - will be implemented when contract ABI is added
                const releasableAmount = "0"; // Placeholder - will be implemented when contract ABI is added

                if (!schedule) return null;

                const progress =
                  (Number(schedule.releasedAmount) /
                    Number(schedule.totalAmount)) *
                  100;
                const isClaimable = Number(releasableAmount) > 0;

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            VST
                          </span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {schedule.totalAmount} Tokens
                          </h3>
                          <p className="text-slate-400 text-sm">
                            Vesting Schedule • End:{" "}
                            {new Date(
                              Number(schedule.endTime) * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isClaimable ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        )}
                        <Badge
                          className={
                            isClaimable
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }
                        >
                          {isClaimable ? "Ready to Claim" : "Vesting"}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-300">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleClaimVesting(item.scheduleId)}
                      disabled={
                        !isClaimable || multiVesting.isTransactionPending
                      }
                      className={`w-full h-10 rounded-xl font-semibold transition-all duration-300 ${
                        isClaimable
                          ? "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25"
                          : "bg-slate-700 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {multiVesting.isTransactionPending
                        ? "Claiming..."
                        : isClaimable
                          ? `Claim ${releasableAmount} Tokens`
                          : "Not Ready"}
                    </Button>
                  </div>
                );
              } else {
                // Handle lock items
                const lock = item.lock;
                const isUnlockable =
                  new Date() >= new Date(Number(lock.tgeDate) * 1000);
                const isVestingLock = Number(lock.tgeBps) > 0;

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {lock.amount} Tokens
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {isVestingLock ? "Vesting" : "Time"} Lock • Unlock:{" "}
                            {new Date(
                              Number(lock.tgeDate) * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isUnlockable ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                        )}
                        <Badge
                          className={
                            isUnlockable
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                          }
                        >
                          {isUnlockable ? "Ready to Unlock" : "Locked"}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleUnlockToken(lock.id)}
                      disabled={
                        !isUnlockable || tokenLocker.isTransactionPending
                      }
                      className={`w-full h-10 rounded-xl font-semibold transition-all duration-300 ${
                        isUnlockable
                          ? "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25"
                          : "bg-slate-700 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {tokenLocker.isTransactionPending
                        ? "Unlocking..."
                        : isUnlockable
                          ? "Unlock Tokens"
                          : "Locked"}
                    </Button>
                  </div>
                );
              }
            })}
            {allClaimableItems.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No claimable tokens found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
