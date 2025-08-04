import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenSelector } from "@/components/TokenSelector";
import { RecipientManager } from "@/components/RecipientManager";
import { CreditCard, Users, Calendar, Settings } from "lucide-react";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletBalance } from "@/components/WalletBalance";
import { FormSection } from "@/components/FormSection";
import { HelpTooltip } from "@/components/HelpTooltip";
import { tokenAddresses } from "@/lib/tokenAddresses";
import { toast } from "react-toastify";

export function InvestorPaymentPanel({ tokenLocker, contacts }) {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [recipients, setRecipients] = useState([{ address: "", amount: "" }]);
  const [vestingParams, setVestingParams] = useState({
    tgeDate: "",
    tgeBps: "25", // 25% at TGE
    cycle: "2629746", // 1 month in seconds
    cycleBps: "10", // 10% per cycle
    description: "Investor Payment Vesting Lock",
  });

  // Get user's locks
  const { data: userNormalLocks } = tokenLocker.getUserNormalLocks;
  const { data: userLpLocks } = tokenLocker.getUserLpLocks;

  const handleCreateInvestorPayment = async () => {
    try {
      const tokenAddress =
        selectedToken === "USDT" ? tokenAddresses.USDT : tokenAddresses.USDC;

      const owners = recipients.map((r) => r.address);
      const amounts = recipients.map((r) => r.amount);

      await tokenLocker.multipleVestingLock({
        owners,
        amounts,
        token: tokenAddress,
        isLpToken: false,
        tgeDate: vestingParams.tgeDate,
        tgeBps: vestingParams.tgeBps,
        cycle: vestingParams.cycle,
        cycleBps: vestingParams.cycleBps,
        description: vestingParams.description,
      });
      toast.success("Created");
    } catch (error) {
      console.error("Failed to create investor payment:", error);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Main Card */}
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                Investor Payment
              </span>
              <p className="text-slate-400 text-sm font-normal mt-1">
                Create multiple vesting locks for investor payments
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <FormSection
            title="Select Token"
            description="Choose the token for investor payments"
            icon={CreditCard}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-slate-300 font-medium">Token</Label>
              <HelpTooltip content="Select the ERC-20 token for investor payments. Ensure sufficient balance and approval." />
            </div>
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
            />
          </FormSection>

          {/* Recipients */}
          <FormSection
            title="Investor Recipients"
            description="Add investor wallet addresses and amounts"
            icon={Users}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-slate-300 font-medium">Investors</Label>
              <HelpTooltip content="Add investor wallet addresses and their respective token amounts." />
            </div>
            <RecipientManager
              recipients={recipients}
              setRecipients={setRecipients}
              contacts={contacts}
            />
          </FormSection>

          {/* Vesting Configuration */}
          <FormSection
            title="Vesting Configuration"
            description="Set up investor vesting parameters"
            icon={Settings}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      TGE Date
                    </Label>
                    <HelpTooltip content="Token Generation Event date when initial tokens are released" />
                  </div>
                  <Input
                    type="date"
                    value={vestingParams.tgeDate}
                    onChange={(e) =>
                      setVestingParams((prev) => ({
                        ...prev,
                        tgeDate: e.target.value,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      TGE Release (%)
                    </Label>
                    <HelpTooltip content="Percentage of tokens released immediately at TGE" />
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
                    className="bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-slate-300 font-medium text-sm">
                      Cycle (seconds)
                    </Label>
                    <HelpTooltip content="Time interval between releases (2629746 = 1 month)" />
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
                    className="bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
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
                    className="bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-slate-300 font-medium text-sm">
                    Description
                  </Label>
                  <HelpTooltip content="Optional description for this investor payment batch" />
                </div>
                <Input
                  placeholder="Investor Payment Vesting Lock"
                  value={vestingParams.description}
                  onChange={(e) =>
                    setVestingParams((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h4 className="text-purple-300 font-medium mb-2">
                  Vesting Preview
                </h4>
                <p className="text-purple-200 text-sm">
                  <strong>{vestingParams.tgeBps || "25"}%</strong> released at
                  TGE, then <strong>{vestingParams.cycleBps || "10"}%</strong>{" "}
                  every{" "}
                  <strong>
                    {Math.round(
                      (Number.parseInt(vestingParams.cycle) || 2629746) / 86400
                    )}{" "}
                    days
                  </strong>{" "}
                  until fully vested.
                </p>
              </div>
            </div>
          </FormSection>

          {/* Create Button */}
          <Button
            onClick={handleCreateInvestorPayment}
            disabled={tokenLocker.isTransactionPending}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300"
          >
            {tokenLocker.isTransactionPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              "💰 Create Investor Payment"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Investor Payments */}
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span>Active Investor Payments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userLpLocks?.map((lock, index) => (
              <div
                key={lock.id || index}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {lock.amount} {selectedToken}
                      </p>
                      <p className="text-slate-400 text-sm">
                        TGE:{" "}
                        {new Date(
                          Number(lock.tgeDate) * 1000
                        ).toLocaleDateString()}{" "}
                        • {lock.tgeBps}% initial
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => tokenLocker.unlock(lock.id)}
                    disabled={tokenLocker.isTransactionPending}
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                  >
                    {tokenLocker.isTransactionPending
                      ? "Processing..."
                      : "Unlock"}
                  </Button>
                </div>
              </div>
            ))}
            {(!userLpLocks || userLpLocks.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                No active investor payments found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
