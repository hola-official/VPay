import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenSelector } from "@/components/TokenSelector";
import { RecipientManager } from "@/components/RecipientManager";
import {
  Calendar,
  Clock,
  Lock,
  Coins,
  Users,
  Settings,
  Check,
} from "lucide-react";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletBalance } from "@/components/WalletBalance";
import { FormSection } from "@/components/FormSection";
import { HelpTooltip } from "@/components/HelpTooltip";
import { cn } from "@/lib/utils";
import { useTokenLocker } from "@/hooks/useTokenLocker";
import { tokenAddresses } from "@/lib/tokenAddresses";

export function TimeLockPanel({ contacts }) {
  const tokenLocker = useTokenLocker();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [recipients, setRecipients] = useState([{ address: "", amount: "" }]);
  const [lockDuration, setLockDuration] = useState("");
  const [lockDate, setLockDate] = useState("");
  const [isVesting, setIsVesting] = useState(false);
  const [vestingParams, setVestingParams] = useState({
    tgeBps: "",
    cycle: "",
    cycleBps: "",
  });

  const steps = [
    { id: "token", label: "Select Token" },
    { id: "recipients", label: "Add Recipients" },
    { id: "schedule", label: "Set Schedule" },
    { id: "review", label: "Review & Create" },
  ];

  // Get user's locks
  const { data: userNormalLocks } = tokenLocker.getUserNormalLocks;
  const { data: userLpLocks } = tokenLocker.getUserLpLocks;

  const handleCreateLock = async () => {
    try {
      const tokenAddress =
        selectedToken === "USDT" ? tokenAddresses.USDT : tokenAddresses.USDC;

      if (recipients.length === 1) {
        // Single lock
        if (isVesting) {
          await tokenLocker.vestingLock({
            owner: recipients[0].address,
            token: tokenAddress,
            isLpToken: false,
            amount: recipients[0].amount,
            tgeDate: lockDate,
            tgeBps: vestingParams.tgeBps,
            cycle: vestingParams.cycle,
            cycleBps: vestingParams.cycleBps,
            description: `${selectedToken} Vesting Lock`,
          });
        } else {
          await tokenLocker.lock({
            owner: recipients[0].address,
            token: tokenAddress,
            isLpToken: false,
            amount: recipients[0].amount,
            unlockDate: lockDate,
            description: `${selectedToken} Time Lock`,
          });
        }
      } else {
        // Multiple locks
        const owners = recipients.map((r) => r.address);
        const amounts = recipients.map((r) => r.amount);

        await tokenLocker.multipleVestingLock({
          owners,
          amounts,
          token: tokenAddress,
          isLpToken: false,
          tgeDate: lockDate,
          tgeBps: vestingParams.tgeBps,
          cycle: vestingParams.cycle,
          cycleBps: vestingParams.cycleBps,
          description: `${selectedToken} Multiple Vesting Lock`,
        });
      }
    } catch (error) {
      console.error("Failed to create lock:", error);
    }
  };

  const isStepCompleted = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return selectedToken !== "";
      case 1:
        return recipients.length > 0 && recipients[0].address !== "";
      case 2:
        return lockDate !== "";
      case 3:
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                          : "bg-slate-700 border-slate-600 text-slate-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-bold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 font-medium text-center max-w-20 sm:max-w-none",
                      isCompleted
                        ? "text-green-400"
                        : isCurrent
                          ? "text-blue-400"
                          : "text-slate-500"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "hidden sm:flex flex-1 h-0.5 mx-4 transition-all duration-300",
                      isCompleted ? "bg-green-500" : "bg-slate-700"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Status */}
      <TransactionStatus
        isTransactionPending={tokenLocker.isTransactionPending}
        isTransactionConfirming={tokenLocker.isTransactionConfirming}
        isTransactionConfirmed={tokenLocker.isTransactionConfirmed}
        transactionHash={tokenLocker.transactionHash}
        transactionError={tokenLocker.transactionError}
        operationStates={tokenLocker.operationStates}
      />

      {/* Wallet Balance */}
      <WalletBalance />

      {/* Main Lock Creation Card */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50 shadow-2xl shadow-blue-500/10">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Create Time Lock
              </span>
              <p className="text-slate-400 text-sm font-normal mt-1">
                Secure your tokens with time-based or vesting locks
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Step 1: Token Selection */}
          <FormSection
            title="Select Token"
            description="Choose which token you want to lock"
            icon={Coins}
            completed={isStepCompleted(0)}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-slate-300 font-medium">Token</Label>
              <HelpTooltip
                title="Token Selection"
                content="Select the ERC-20 token you want to lock. Make sure you have sufficient balance and token approval."
              />
            </div>
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
            />
          </FormSection>

          {/* Step 2: Recipients */}
          <FormSection
            title="Add Recipients"
            description="Specify who will receive the locked tokens"
            icon={Users}
            completed={isStepCompleted(1)}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-slate-300 font-medium">Recipients</Label>
              <HelpTooltip
                title="Recipients"
                content="Add wallet addresses that will receive the locked tokens. You can add multiple recipients or select from your saved contacts."
              />
            </div>
            <RecipientManager
              recipients={recipients}
              setRecipients={setRecipients}
              contacts={contacts}
            />
          </FormSection>

          {/* Step 3: Lock Configuration */}
          <FormSection
            title="Lock Configuration"
            description="Set up your lock parameters"
            icon={Settings}
            completed={isStepCompleted(2)}
          >
            {/* Lock Type Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Label className="text-slate-300 font-medium">Lock Type</Label>
                <HelpTooltip
                  title="Lock Types"
                  content="Time Lock: Tokens are locked until a specific date. Vesting Lock: Tokens are released gradually over time with customizable parameters."
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setIsVesting(false)}
                  className={`px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 font-medium flex-1 ${
                    !isVesting
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-600/50"
                  }`}
                >
                  🔒 Time Lock
                </button>
                <button
                  onClick={() => setIsVesting(true)}
                  className={`px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 font-medium flex-1 ${
                    isVesting
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg"
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-600/50"
                  }`}
                >
                   Vesting Lock
                </button>
              </div>
            </div>

            {/* Vesting Parameters */}
            {isVesting && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      TGE Release (%)
                    </Label>
                    <HelpTooltip content="Percentage of tokens released immediately at Token Generation Event" />
                  </div>
                  <Input
                    type="number"
                    placeholder="25"
                    value={vestingParams.tgeBps}
                    onChange={(e) =>
                      setVestingParams((prev) => ({
                        ...prev,
                        tgeBps: e.target.value,
                      }))
                    }
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      Cycle (seconds)
                    </Label>
                    <HelpTooltip content="Time interval between each token release (e.g., 2629746 = 1 month)" />
                  </div>
                  <Input
                    type="number"
                    placeholder="2629746"
                    value={vestingParams.cycle}
                    onChange={(e) =>
                      setVestingParams((prev) => ({
                        ...prev,
                        cycle: e.target.value,
                      }))
                    }
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      Cycle Release (%)
                    </Label>
                    <HelpTooltip content="Percentage of remaining tokens released each cycle" />
                  </div>
                  <Input
                    type="number"
                    placeholder="10"
                    value={vestingParams.cycleBps}
                    onChange={(e) =>
                      setVestingParams((prev) => ({
                        ...prev,
                        cycleBps: e.target.value,
                      }))
                    }
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
              </div>
            )}

            {/* Lock Duration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-slate-300 font-medium text-sm">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Lock Duration (days)
                  </Label>
                  <HelpTooltip content="Number of days the tokens will be locked" />
                </div>
                <Input
                  type="number"
                  placeholder="30"
                  value={lockDuration}
                  onChange={(e) => setLockDuration(e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-10 sm:h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-slate-300 font-medium text-sm">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Unlock Date
                  </Label>
                  <HelpTooltip content="Specific date when tokens will be unlocked" />
                </div>
                <Input
                  type="date"
                  value={lockDate}
                  onChange={(e) => setLockDate(e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white focus:border-blue-500 focus:ring-blue-500/20 h-10 sm:h-12"
                />
              </div>
            </div>
          </FormSection>

          {/* Create Lock Button */}
          <div className="flex space-x-4">
            <Button
              onClick={handleCreateLock}
              disabled={
                tokenLocker.isTransactionPending ||
                !isStepCompleted(0) ||
                !isStepCompleted(1) ||
                !isStepCompleted(2)
              }
              className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tokenLocker.isTransactionPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                `🚀 Create ${isVesting ? "Vesting" : "Time"} Lock`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Locks */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <Lock className="w-6 h-6 text-blue-400" />
            <span className="text-slate-200">Your Active Locks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userNormalLocks?.map((lock, index) => (
              <div
                key={lock.id || index}
                className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {lock.amount} {selectedToken}
                      </p>
                      <p className="text-slate-400">
                        {lock.tgeBps > 0 ? "🔄 Vesting" : "🔒 Time"} Lock •
                        Unlock:{" "}
                        {new Date(
                          Number(lock.tgeDate) * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => tokenLocker.unlock(lock.id)}
                    disabled={tokenLocker.isTransactionPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
                  >
                    {tokenLocker.isTransactionPending
                      ? "Unlocking..."
                      : "🔓 Unlock"}
                  </Button>
                </div>
              </div>
            ))}
            {(!userNormalLocks || userNormalLocks.length === 0) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-slate-400 text-lg font-medium mb-2">
                  No Active Locks
                </h3>
                <p className="text-slate-500">
                  Create your first token lock to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
