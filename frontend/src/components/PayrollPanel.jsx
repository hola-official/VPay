"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenSelector } from "@/components/TokenSelector";
import { RecipientManager } from "@/components/RecipientManager";
import { Building2, Users, Calendar, Settings, TrendingUp } from "lucide-react";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletBalance } from "@/components/WalletBalance";
import { FormSection } from "@/components/FormSection";
import { HelpTooltip } from "@/components/HelpTooltip";
import { tokenAddresses } from "@/lib/tokenAddresses";

export function PayrollPanel({ multiVesting, contacts }) {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [recipients, setRecipients] = useState([{ address: "", amount: "" }]);
  const [vestingSchedule, setVestingSchedule] = useState({
    startTime: "",
    endTime: "",
    unlockSchedule: multiVesting.UnlockSchedule.MONTHLY,
    autoClaim: false,
    cancelPermission: multiVesting.CancelPermission.BOTH,
    changeRecipientPermission: multiVesting.ChangeRecipientPermission.BOTH,
  });

  // Get user's vesting schedules
  const { data: senderSchedules } = multiVesting.getSenderSchedules;

  const handleCreatePayroll = async () => {
    try {
      const tokenAddress =
        selectedToken === "USDT" ? tokenAddresses.USDT : tokenAddresses.USDC;

      const recipientAddresses = recipients.map((r) => r.address);
      const amounts = recipients.map((r) => r.amount);
      const contractTitles = recipients.map(
        (_, i) => `Employee Payroll ${i + 1}`
      );
      const recipientEmails = recipients.map(() => ""); // Add email inputs if needed

      await multiVesting.createMultipleVestingSchedules({
        token: tokenAddress,
        recipients: recipientAddresses,
        amounts,
        startTime: vestingSchedule.startTime,
        endTime: vestingSchedule.endTime,
        unlockSchedule: vestingSchedule.unlockSchedule,
        autoClaim: vestingSchedule.autoClaim,
        contractTitles,
        recipientEmails,
        cancelPermission: vestingSchedule.cancelPermission,
        changeRecipientPermission: vestingSchedule.changeRecipientPermission,
      });
    } catch (error) {
      console.error("Failed to create payroll:", error);
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

      {/* Main Card */}
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                Company Payroll
              </span>
              <p className="text-slate-400 text-sm font-normal mt-1">
                Create multiple vesting schedules for employee salaries
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <FormSection
            title="Select Token"
            description="Choose the token for employee payments"
            icon={Building2}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-slate-300 font-medium">Token</Label>
              <HelpTooltip content="Select the ERC-20 token for employee salary payments." />
            </div>
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
            />
          </FormSection>

          {/* Recipients */}
          <FormSection
            title="Employee Recipients"
            description="Add employee wallet addresses and salaries"
            icon={Users}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-slate-300 font-medium">Employees</Label>
              <HelpTooltip content="Add employee wallet addresses and their respective salary amounts." />
            </div>
            <RecipientManager
              recipients={recipients}
              setRecipients={setRecipients}
              contacts={contacts}
            />
          </FormSection>

          {/* Vesting Schedule */}
          <FormSection
            title="Vesting Schedule"
            description="Configure the salary vesting parameters"
            icon={Settings}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Start Date
                    </Label>
                    <HelpTooltip content="When the vesting schedule begins" />
                  </div>
                  <Input
                    type="datetime-local"
                    value={vestingSchedule.startTime}
                    onChange={(e) =>
                      setVestingSchedule((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      End Date
                    </Label>
                    <HelpTooltip content="When the vesting schedule ends" />
                  </div>
                  <Input
                    type="datetime-local"
                    value={vestingSchedule.endTime}
                    onChange={(e) =>
                      setVestingSchedule((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      Release Schedule
                    </Label>
                    <HelpTooltip content="How frequently tokens are released to employees" />
                  </div>
                  <select
                    value={vestingSchedule.unlockSchedule}
                    onChange={(e) =>
                      setVestingSchedule((prev) => ({
                        ...prev,
                        unlockSchedule: Number(e.target.value),
                      }))
                    }
                    className="w-full h-10 bg-white/5 border border-white/10 text-white rounded-md px-3 focus:border-green-500 focus:ring-green-500/20"
                  >
                    <option value={multiVesting.UnlockSchedule.DAILY}>
                      Daily
                    </option>
                    <option value={multiVesting.UnlockSchedule.WEEKLY}>
                      Weekly
                    </option>
                    <option value={multiVesting.UnlockSchedule.BIWEEKLY}>
                      Bi-weekly
                    </option>
                    <option value={multiVesting.UnlockSchedule.MONTHLY}>
                      Monthly
                    </option>
                    <option value={multiVesting.UnlockSchedule.QUARTERLY}>
                      Quarterly
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      Auto Claim
                    </Label>
                    <HelpTooltip content="Automatically claim tokens when they become available" />
                  </div>
                  <select
                    value={vestingSchedule.autoClaim.toString()}
                    onChange={(e) =>
                      setVestingSchedule((prev) => ({
                        ...prev,
                        autoClaim: e.target.value === "true",
                      }))
                    }
                    className="w-full h-10 bg-white/5 border border-white/10 text-white rounded-md px-3 focus:border-green-500 focus:ring-green-500/20"
                  >
                    <option value="false">Manual Claim</option>
                    <option value="true">Auto Claim</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <h4 className="text-green-300 font-medium mb-2">
                  Payroll Preview
                </h4>
                <p className="text-green-200 text-sm">
                  Employee salaries will be vested from{" "}
                  <strong>
                    {vestingSchedule.startTime
                      ? new Date(vestingSchedule.startTime).toLocaleDateString()
                      : "start date"}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {vestingSchedule.endTime
                      ? new Date(vestingSchedule.endTime).toLocaleDateString()
                      : "end date"}
                  </strong>{" "}
                  with{" "}
                  <strong>
                    {vestingSchedule.unlockSchedule ===
                    multiVesting.UnlockSchedule.DAILY
                      ? "daily"
                      : vestingSchedule.unlockSchedule ===
                          multiVesting.UnlockSchedule.WEEKLY
                        ? "weekly"
                        : vestingSchedule.unlockSchedule ===
                            multiVesting.UnlockSchedule.BIWEEKLY
                          ? "bi-weekly"
                          : vestingSchedule.unlockSchedule ===
                              multiVesting.UnlockSchedule.MONTHLY
                            ? "monthly"
                            : "quarterly"}
                  </strong>{" "}
                  releases.
                </p>
              </div>
            </div>
          </FormSection>

          {/* Create Button */}
          <Button
            onClick={handleCreatePayroll}
            disabled={multiVesting.isTransactionPending}
            className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/25 transition-all duration-300"
          >
            {multiVesting.isTransactionPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              "🏢 Create Company Payroll"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Payroll Schedules */}
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-green-400" />
            <span>Active Payroll Schedules</span>
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
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
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
                      <p className="text-green-400 font-semibold">
                        {(
                          (Number(schedule.releasedAmount) /
                            Number(schedule.totalAmount)) *
                          100
                        ).toFixed(1)}
                        % Released
                      </p>
                      <p className="text-slate-400 text-sm">
                        Available: {releasableAmount || "0"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
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
                No active payroll schedules found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
