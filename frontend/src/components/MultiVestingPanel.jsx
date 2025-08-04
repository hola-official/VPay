"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenSelector } from "@/components/token-selector";
import { RecipientManager } from "@/components/RecipientManager";
import { CreditCard, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TransactionStatus } from "@/components/TransactionStatus";
import { tokenAddresses } from "@/lib/tokenAddresses";
import { toast } from "react-toastify";

export function MultiVestingPanel({ multiVesting, contacts }) {
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [recipients, setRecipients] = useState([{ address: "", amount: "" }]);
  const [vestingSchedule, setVestingSchedule] = useState({
    startTime: "",
    endTime: "",
    unlockSchedule: multiVesting.UnlockSchedule.MONTHLY,
  });

  // Get user's vesting schedules
  const { data: senderSchedules } = multiVesting.getSenderSchedules;

  const handleCreateMultiVesting = async () => {
    try {
      const tokenAddress =
        selectedToken === "USDT" ? tokenAddresses.USDT : tokenAddresses.USDC;

      const recipientAddresses = recipients.map((r) => r.address);
      const amounts = recipients.map((r) => r.amount);
      const contractTitles = recipients.map(
        (_, i) => `Vesting Schedule ${i + 1}`
      );
      const recipientEmails = recipients.map(() => ""); // Add email inputs if needed

      await multiVesting.createMultipleVestingSchedules({
        token: tokenAddress,
        recipients: recipientAddresses,
        amounts,
        startTime: vestingSchedule.startTime,
        endTime: vestingSchedule.endTime,
        unlockSchedule: vestingSchedule.unlockSchedule,
        autoClaim: false,
        contractTitles,
        recipientEmails,
        cancelPermission: multiVesting.CancelPermission.BOTH,
        changeRecipientPermission: multiVesting.ChangeRecipientPermission.BOTH,
      });
      toast.success("Created");
    } catch (error) {
      console.error("Failed to create multi vesting:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Transaction Status */}
      <TransactionStatus
        isTransactionPending={multiVesting.isTransactionPending}
        isTransactionConfirming={multiVesting.isTransactionConfirming}
        isTransactionConfirmed={multiVesting.isTransactionConfirmed}
        transactionHash={multiVesting.transactionHash}
        transactionError={multiVesting.transactionError}
        operationStates={multiVesting.operationStates}
      />

      {/* Wallet Balance */}
      <WalletBalance />

      {/* Main Vesting Creation Card */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50 shadow-2xl shadow-blue-500/10">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Multi Vesting Schedule
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label className="text-slate-300 font-medium">Select Token</Label>
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-slate-300 font-medium">
              Recipients & Amounts
            </Label>
            <RecipientManager
              recipients={recipients}
              setRecipients={setRecipients}
              contacts={contacts}
            />
          </div>

          {/* Vesting Schedule */}
          <div className="space-y-4">
            <Label className="text-slate-300 font-medium">
              Vesting Schedule
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={vestingSchedule.startTime}
                  onChange={(e) =>
                    setVestingSchedule((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="bg-slate-700/50 border-slate-600/50 text-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">End Date</Label>
                <Input
                  type="datetime-local"
                  value={vestingSchedule.endTime}
                  onChange={(e) =>
                    setVestingSchedule((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="bg-slate-700/50 border-slate-600/50 text-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">
                  Release Schedule
                </Label>
                <select
                  value={vestingSchedule.unlockSchedule}
                  onChange={(e) =>
                    setVestingSchedule((prev) => ({
                      ...prev,
                      unlockSchedule: Number(e.target.value),
                    }))
                  }
                  className="w-full h-10 bg-slate-700/50 border border-slate-600/50 text-white rounded-md px-3 focus:border-blue-500 focus:ring-blue-500/20"
                >
                  <option value={multiVesting.UnlockSchedule.DAILY}>
                    Daily
                  </option>
                  <option value={multiVesting.UnlockSchedule.WEEKLY}>
                    Weekly
                  </option>
                  <option value={multiVesting.UnlockSchedule.MONTHLY}>
                    Monthly
                  </option>
                  <option value={multiVesting.UnlockSchedule.QUARTERLY}>
                    Quarterly
                  </option>
                  <option value={multiVesting.UnlockSchedule.YEARLY}>
                    Yearly
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Create Vesting Button */}
          <Button
            onClick={handleCreateMultiVesting}
            disabled={multiVesting.isTransactionPending}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300"
          >
            {multiVesting.isTransactionPending
              ? "Creating..."
              : "Create Multi Vesting Schedule"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Vesting Schedules */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-xl text-slate-200">
            Active Vesting Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {senderSchedules?.map((scheduleId) => {
              const schedule = null; // Placeholder - will be implemented when contract ABI is added
              const releasableAmount = "0"; // Placeholder - will be implemented when contract ABI is added

              if (!schedule) return null;

              return (
                <div
                  key={scheduleId}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {schedule.totalAmount} {selectedToken}
                        </p>
                        <p className="text-slate-400 text-sm">
                          To: {schedule.recipient.slice(0, 6)}...
                          {schedule.recipient.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-semibold">
                        {(
                          (Number(schedule.releasedAmount) /
                            Number(schedule.totalAmount)) *
                          100
                        ).toFixed(1)}
                        % Released
                      </p>
                      <p className="text-slate-400 text-sm">
                        Releasable: {releasableAmount || "0"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${(Number(schedule.releasedAmount) / Number(schedule.totalAmount)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!senderSchedules || senderSchedules.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                No active vesting schedules found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
