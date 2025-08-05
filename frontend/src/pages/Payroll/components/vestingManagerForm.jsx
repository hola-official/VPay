import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Info,
  CheckCircle,
  Loader2,
  BarChart3,
  Settings,
  FileText,
  HelpCircle,
} from "lucide-react";
import {
  useVestingManager,
  UnlockSchedule,
  CancelPermission,
  ChangeRecipientPermission,
} from "@/hooks/useVestingManager";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";

export default function VestingManagerForm() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("single"); // 'single', 'multiple', 'dashboard'
  const [showHelp, setShowHelp] = useState(false);

  // Token selection state
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenSelection, setTokenSelection] = useState("custom");
  const [predefinedTokens] = useState({
    usdt: {
      address: "0xC9592d8D3AA150d62E9638C5588264abFc5D9976",
      name: "Tether USD",
      symbol: "USDT",
    },
    usdc: {
      address: "0xae6c13C19ff16110BAD54E54280ec1014994631f",
      name: "USD Coin",
      symbol: "USDC",
    },
  });

  // Single schedule state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [unlockSchedule, setUnlockSchedule] = useState(UnlockSchedule.DAILY);
  const [autoClaim, setAutoClaim] = useState(false);
  const [contractTitle, setContractTitle] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [cancelPermission, setCancelPermission] = useState(
    CancelPermission.BOTH
  );
  const [changeRecipientPermission, setChangeRecipientPermission] = useState(
    ChangeRecipientPermission.BOTH
  );

  // Multiple schedules state
  const [recipients, setRecipients] = useState([
    { address: "", amount: "", title: "", email: "", error: "" },
  ]);
  const [csvInput, setCsvInput] = useState("");
  const [showCsvInput, setShowCsvInput] = useState(false);

  // Dashboard state
  const [userSchedules, setUserSchedules] = useState({
    recipientSchedules: [],
    senderSchedules: [],
  });
  const [detailedSchedules, setDetailedSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});
  const [showTooltip, setShowTooltip] = useState("");

  // Hook instances
  const vestingManager = useVestingManager();
  const { tokenInfo, isLoadingToken, tokenError, fetchTokenInfo } =
    useTokenInfo(tokenAddress, address);

  // Set minimum dates
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // 5 minutes from now
  const minDateTime = now.toISOString().slice(0, 16);

  // Fetch token info when address changes
  useEffect(() => {
    if (tokenAddress && tokenAddress.length === 42) {
      fetchTokenInfo();
    }
  }, [tokenAddress, fetchTokenInfo]);

  // Load user schedules when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard" && address) {
      loadUserSchedules();
    }
  }, [activeTab, address]);

  const loadUserSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const schedules = await vestingManager.getUserSchedules();
      setUserSchedules(schedules);

      // Get detailed info for all schedules
      const allScheduleIds = [
        ...schedules.recipientSchedules,
        ...schedules.senderSchedules,
      ];
      if (allScheduleIds.length > 0) {
        const detailed =
          await vestingManager.getDetailedScheduleInfo(allScheduleIds);
        setDetailedSchedules(detailed);
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleTokenAddressChange = (e) => {
    const value = e.target.value;
    setTokenAddress(value);

    if (tokenSelection !== "custom") {
      setTokenSelection("custom");
    }

    // Validate address
    if (value && !value.startsWith("0x")) {
      setErrors((prev) => ({
        ...prev,
        tokenAddress: "Address must start with 0x",
      }));
    } else if (value && value.length !== 42) {
      setErrors((prev) => ({
        ...prev,
        tokenAddress: "Address must be 42 characters long",
      }));
    } else {
      setErrors((prev) => ({ ...prev, tokenAddress: "" }));
    }
  };

  const validateSingleSchedule = () => {
    const newErrors = {};

    if (!tokenAddress) newErrors.tokenAddress = "Token address is required";
    if (!recipient) newErrors.recipient = "Recipient address is required";
    if (!amount || Number.parseFloat(amount) <= 0)
      newErrors.amount = "Valid amount is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endTime) newErrors.endTime = "End time is required";

    if (startTime && new Date(startTime).getTime() <= Date.now()) {
      newErrors.startTime = "Start time must be in the future";
    }

    if (
      startTime &&
      endTime &&
      new Date(endTime).getTime() <= new Date(startTime).getTime()
    ) {
      newErrors.endTime = "End time must be after start time";
    }

    if (recipient && (!recipient.startsWith("0x") || recipient.length !== 42)) {
      newErrors.recipient = "Invalid recipient address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSingleSchedule = async () => {
    if (!validateSingleSchedule()) return;

    try {
      const result = await vestingManager.performVestingScheduleCreation(
        tokenAddress,
        tokenInfo.decimals,
        recipient,
        amount,
        startTime,
        endTime,
        unlockSchedule,
        {
          autoClaim,
          contractTitle,
          recipientEmail,
          cancelPermission,
          changeRecipientPermission,
        }
      );

      if (result.success) {
        // Reset form
        setRecipient("");
        setAmount("");
        setStartTime("");
        setEndTime("");
        setContractTitle("");
        setRecipientEmail("");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  const handleCreateMultipleSchedules = async () => {
    if (!tokenAddress || recipients.length === 0) return;

    const validRecipients = recipients.filter(
      (r) => r.address && r.amount && !r.error
    );
    if (validRecipients.length === 0) return;

    try {
      const addresses = validRecipients.map((r) => r.address);
      const amounts = validRecipients.map((r) => r.amount);
      const titles = validRecipients.map((r) => r.title || "");
      const emails = validRecipients.map((r) => r.email || "");

      const hash = await vestingManager.createMultipleVestingSchedules(
        tokenAddress,
        addresses,
        amounts,
        tokenInfo.decimals,
        startTime,
        endTime,
        unlockSchedule,
        autoClaim,
        titles,
        emails,
        cancelPermission,
        changeRecipientPermission
      );

      if (hash) {
        // Reset form
        setRecipients([
          { address: "", amount: "", title: "", email: "", error: "" },
        ]);
        setStartTime("");
        setEndTime("");
      }
    } catch (error) {
      console.error("Error creating multiple schedules:", error);
    }
  };

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { address: "", amount: "", title: "", email: "", error: "" },
    ]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;

    // Validate
    if (field === "address") {
      if (value && (!value.startsWith("0x") || value.length !== 42)) {
        newRecipients[index].error = "Invalid address format";
      } else {
        newRecipients[index].error = "";
      }
    } else if (field === "amount") {
      if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
        newRecipients[index].error = "Invalid amount";
      } else {
        newRecipients[index].error = "";
      }
    }

    setRecipients(newRecipients);
  };

  const parseCsvInput = () => {
    try {
      const lines = csvInput.trim().split("\n");
      const newRecipients = lines
        .map((line) => {
          const [address, amount, title = "", email = ""] = line
            .split(",")
            .map((s) => s.trim());
          return {
            address: address || "",
            amount: amount || "",
            title,
            email,
            error: "",
          };
        })
        .filter((r) => r.address || r.amount);

      if (newRecipients.length > 0) {
        setRecipients(newRecipients);
        setCsvInput("");
        setShowCsvInput(false);
      }
    } catch (error) {
      console.error("Error parsing CSV:", error);
    }
  };

  const formatScheduleTime = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatAmount = (amount, decimals) => {
    return Number(formatUnits(BigInt(amount), decimals)).toLocaleString();
  };

  const getScheduleProgress = (schedule) => {
    const now = Date.now() / 1000;
    const start = Number(schedule.startTime);
    const end = Number(schedule.endTime);

    if (now < start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  };

  const handleReleaseTokens = async (scheduleId) => {
    try {
      await vestingManager.releaseTokens(scheduleId);
      // Refresh schedules
      loadUserSchedules();
    } catch (error) {
      console.error("Error releasing tokens:", error);
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    try {
      await vestingManager.cancelVestingSchedule(scheduleId);
      // Refresh schedules
      loadUserSchedules();
    } catch (error) {
      console.error("Error cancelling schedule:", error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
            whileHover={{ scale: 1.05 }}
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-[#97CBDC]">
              Vesting Manager
            </h1>
            <p className="text-[#97CBDC]/70">
              Create and manage token vesting schedules
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/50 text-[#97CBDC] hover:bg-[#0a0a20] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm">Help</span>
        </button>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-[#0a0a20]/80 border border-[#475B74]/50 overflow-hidden"
          >
            <h3 className="text-lg font-medium text-[#97CBDC] mb-2">
              Vesting Schedules
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <h4 className="font-medium text-[#97CBDC] mb-2">
                  Single Schedule
                </h4>
                <p className="text-sm text-[#97CBDC]/80">
                  Create a vesting schedule for one recipient with customizable
                  unlock intervals and permissions.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <h4 className="font-medium text-[#97CBDC] mb-2">
                  Multiple Schedules
                </h4>
                <p className="text-sm text-[#97CBDC]/80">
                  Create multiple vesting schedules at once with the same
                  parameters but different recipients and amounts.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <h4 className="font-medium text-[#97CBDC] mb-2">Dashboard</h4>
                <p className="text-sm text-[#97CBDC]/80">
                  View and manage all your vesting schedules, release tokens,
                  and track progress.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-[#0a0a20]/40 p-1 rounded-xl">
        <motion.button
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "single"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Single Schedule</span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("multiple")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "multiple"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Multiple Schedules</span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "dashboard"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </motion.button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "single" && (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <SingleScheduleForm
              tokenAddress={tokenAddress}
              tokenSelection={tokenSelection}
              predefinedTokens={predefinedTokens}
              tokenInfo={tokenInfo}
              isLoadingToken={isLoadingToken}
              tokenError={tokenError}
              recipient={recipient}
              amount={amount}
              startTime={startTime}
              endTime={endTime}
              unlockSchedule={unlockSchedule}
              autoClaim={autoClaim}
              contractTitle={contractTitle}
              recipientEmail={recipientEmail}
              cancelPermission={cancelPermission}
              changeRecipientPermission={changeRecipientPermission}
              errors={errors}
              showTooltip={showTooltip}
              minDateTime={minDateTime}
              vestingManager={vestingManager}
              onTokenSelectionChange={setTokenSelection}
              onTokenAddressChange={handleTokenAddressChange}
              onRecipientChange={setRecipient}
              onAmountChange={setAmount}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onUnlockScheduleChange={setUnlockSchedule}
              onAutoClaimChange={setAutoClaim}
              onContractTitleChange={setContractTitle}
              onRecipientEmailChange={setRecipientEmail}
              onCancelPermissionChange={setCancelPermission}
              onChangeRecipientPermissionChange={setChangeRecipientPermission}
              onShowTooltip={setShowTooltip}
              onCreateSchedule={handleCreateSingleSchedule}
            />
          </motion.div>
        )}

        {activeTab === "multiple" && (
          <motion.div
            key="multiple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <MultipleSchedulesForm
              tokenAddress={tokenAddress}
              tokenSelection={tokenSelection}
              predefinedTokens={predefinedTokens}
              tokenInfo={tokenInfo}
              isLoadingToken={isLoadingToken}
              recipients={recipients}
              startTime={startTime}
              endTime={endTime}
              unlockSchedule={unlockSchedule}
              autoClaim={autoClaim}
              cancelPermission={cancelPermission}
              changeRecipientPermission={changeRecipientPermission}
              csvInput={csvInput}
              showCsvInput={showCsvInput}
              errors={errors}
              minDateTime={minDateTime}
              vestingManager={vestingManager}
              onTokenSelectionChange={setTokenSelection}
              onTokenAddressChange={handleTokenAddressChange}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onUnlockScheduleChange={setUnlockSchedule}
              onAutoClaimChange={setAutoClaim}
              onCancelPermissionChange={setCancelPermission}
              onChangeRecipientPermissionChange={setChangeRecipientPermission}
              onAddRecipient={addRecipient}
              onRemoveRecipient={removeRecipient}
              onUpdateRecipient={updateRecipient}
              onCsvInputChange={setCsvInput}
              onShowCsvInputChange={setShowCsvInput}
              onParseCsvInput={parseCsvInput}
              onCreateSchedules={handleCreateMultipleSchedules}
            />
          </motion.div>
        )}

        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <SchedulesDashboard
              userSchedules={userSchedules}
              detailedSchedules={detailedSchedules}
              loadingSchedules={loadingSchedules}
              selectedSchedule={selectedSchedule}
              showScheduleModal={showScheduleModal}
              vestingManager={vestingManager}
              onRefresh={loadUserSchedules}
              onSelectSchedule={setSelectedSchedule}
              onShowScheduleModal={setShowScheduleModal}
              onReleaseTokens={handleReleaseTokens}
              onCancelSchedule={handleCancelSchedule}
              formatScheduleTime={formatScheduleTime}
              formatAmount={formatAmount}
              getScheduleProgress={getScheduleProgress}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Single Schedule Form Component
function SingleScheduleForm({
  tokenAddress,
  tokenSelection,
  predefinedTokens,
  tokenInfo,
  isLoadingToken,
  tokenError,
  recipient,
  amount,
  startTime,
  endTime,
  unlockSchedule,
  autoClaim,
  contractTitle,
  recipientEmail,
  cancelPermission,
  changeRecipientPermission,
  errors,
  showTooltip,
  minDateTime,
  vestingManager,
  onTokenSelectionChange,
  onTokenAddressChange,
  onRecipientChange,
  onAmountChange,
  onStartTimeChange,
  onEndTimeChange,
  onUnlockScheduleChange,
  onAutoClaimChange,
  onContractTitleChange,
  onRecipientEmailChange,
  onCancelPermissionChange,
  onChangeRecipientPermissionChange,
  onShowTooltip,
  onCreateSchedule,
}) {
  return (
    <div className="p-6 rounded-3xl border border-[#475B74]/50 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] shadow-lg space-y-6">
      {/* Token Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Select Token <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(predefinedTokens).map(([key, token]) => (
            <motion.div
              key={key}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                tokenSelection === key
                  ? "border-[#018ABD] bg-[#018ABD]/10"
                  : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
              }`}
              onClick={() => {
                onTokenSelectionChange(key);
                onTokenAddressChange({ target: { value: token.address } });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="tokenSelection"
                  checked={tokenSelection === key}
                  onChange={() => {}}
                  className="text-[#018ABD] focus:ring-[#018ABD]/50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#26A17B] to-[#26A17B] flex items-center justify-center text-white text-xs font-bold">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#97CBDC]">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-[#97CBDC]/70">
                        {token.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              tokenSelection === "custom"
                ? "border-[#018ABD] bg-[#018ABD]/10"
                : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
            }`}
            onClick={() => {
              onTokenSelectionChange("custom");
              onTokenAddressChange({ target: { value: "" } });
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="tokenSelection"
                checked={tokenSelection === "custom"}
                onChange={() => {}}
                className="text-[#018ABD] focus:ring-[#018ABD]/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#475B74] to-[#475B74] flex items-center justify-center text-white text-xs font-bold">
                    ?
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#97CBDC]">
                      Custom Token
                    </div>
                    <div className="text-xs text-[#97CBDC]/70">
                      Enter token address
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Custom Token Address Input */}
        <AnimatePresence>
          {tokenSelection === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="relative">
                <input
                  value={tokenAddress}
                  onChange={onTokenAddressChange}
                  placeholder="0x..."
                  className={`w-full bg-[#0a0a20]/80 border ${
                    errors.tokenAddress
                      ? "border-red-500"
                      : tokenInfo
                        ? "border-green-500"
                        : "border-[#475B74]/50"
                  } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                />
                {isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#97CBDC]/70 animate-spin" />
                  </div>
                )}
                {tokenInfo && !isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.tokenAddress && (
                <p className="text-sm text-red-500">{errors.tokenAddress}</p>
              )}
              {tokenError && (
                <p className="text-sm text-red-500">{tokenError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Info Display */}
        <AnimatePresence>
          {tokenInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center text-[#97CBDC] font-medium">
                  {tokenInfo.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#97CBDC]">
                    {tokenInfo.name}
                  </div>
                  <div className="text-xs text-[#97CBDC]/70">
                    {tokenInfo.symbol} • {tokenInfo.decimals} decimals
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">
                    Your Balance:
                  </div>
                  <div className="text-[#97CBDC] font-medium">
                    {Number(tokenInfo.balance).toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">
                    Total Supply:
                  </div>
                  <div className="text-[#97CBDC] font-medium">
                    {Number(tokenInfo.totalSupply).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipient and Amount */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#97CBDC]">
            Recipient Address <span className="text-red-500">*</span>
          </label>
          <input
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
            placeholder="0x..."
            className={`w-full bg-[#0a0a20]/80 border ${
              errors.recipient
                ? "border-red-500"
                : recipient
                  ? "border-[#018ABD]"
                  : "border-[#475B74]/50"
            } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50`}
          />
          {errors.recipient && (
            <p className="text-sm text-red-500">{errors.recipient}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-[#97CBDC]">
              Amount <span className="text-red-500">*</span>
            </label>
            {tokenInfo && (
              <button
                type="button"
                onClick={() => onAmountChange(tokenInfo.balance)}
                className="text-xs px-2 py-1 rounded-md bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
              >
                Use Max: {Number(tokenInfo.balance).toLocaleString()}
              </button>
            )}
          </div>
          <div className="relative">
            <input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="100000"
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.amount
                  ? "border-red-500"
                  : amount
                    ? "border-[#018ABD]"
                    : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50`}
            />
            {tokenInfo && amount && !errors.amount && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 text-sm">
                {tokenInfo.symbol}
              </div>
            )}
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount}</p>
          )}
        </div>
      </div>

      {/* Time Settings */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#97CBDC]">
            Start Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              min={minDateTime}
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.startTime
                  ? "border-red-500"
                  : startTime
                    ? "border-[#018ABD]"
                    : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
          </div>
          {errors.startTime && (
            <p className="text-sm text-red-500">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#97CBDC]">
            End Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              min={startTime || minDateTime}
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.endTime
                  ? "border-red-500"
                  : endTime
                    ? "border-[#018ABD]"
                    : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
          </div>
          {errors.endTime && (
            <p className="text-sm text-red-500">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Unlock Schedule */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Unlock Schedule <span className="text-red-500">*</span>
        </label>
        <select
          value={unlockSchedule}
          onChange={(e) => onUnlockScheduleChange(Number(e.target.value))}
          className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
        >
          <option value={UnlockSchedule.SECOND}>Every Second</option>
          <option value={UnlockSchedule.MINUTE}>Every Minute</option>
          <option value={UnlockSchedule.HOUR}>Every Hour</option>
          <option value={UnlockSchedule.DAILY}>Daily</option>
          <option value={UnlockSchedule.WEEKLY}>Weekly</option>
          <option value={UnlockSchedule.BIWEEKLY}>Bi-weekly</option>
          <option value={UnlockSchedule.MONTHLY}>Monthly</option>
          <option value={UnlockSchedule.QUARTERLY}>Quarterly</option>
          <option value={UnlockSchedule.YEARLY}>Yearly</option>
        </select>
      </div>

      {/* Optional Settings */}
      <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
        <h3 className="text-sm font-medium text-[#97CBDC] mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Optional Settings
        </h3>

        <div className="space-y-4">
          {/* Auto Claim */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoClaim"
              checked={autoClaim}
              onChange={(e) => onAutoClaimChange(e.target.checked)}
              className="rounded border-[#475B74] text-[#018ABD] focus:ring-[#018ABD]/50"
            />
            <label htmlFor="autoClaim" className="text-sm text-[#97CBDC]">
              Enable auto-claim
            </label>
            <div className="relative">
              <button
                type="button"
                className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                onMouseEnter={() => onShowTooltip("autoClaim")}
                onMouseLeave={() => onShowTooltip("")}
              >
                <Info className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showTooltip === "autoClaim" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                  >
                    When enabled, tokens will be automatically released to the
                    recipient according to the schedule.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Contract Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#97CBDC]">
              Contract Title
            </label>
            <input
              value={contractTitle}
              onChange={(e) => onContractTitleChange(e.target.value)}
              placeholder="My Vesting Schedule"
              className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
            />
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#97CBDC]">
              Recipient Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
            />
          </div>

          {/* Permissions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#97CBDC]">
                Cancel Permission
              </label>
              <select
                value={cancelPermission}
                onChange={(e) =>
                  onCancelPermissionChange(Number(e.target.value))
                }
                className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
              >
                <option value={CancelPermission.NONE}>None</option>
                <option value={CancelPermission.SENDER_ONLY}>
                  Sender Only
                </option>
                <option value={CancelPermission.RECIPIENT_ONLY}>
                  Recipient Only
                </option>
                <option value={CancelPermission.BOTH}>Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#97CBDC]">
                Change Recipient Permission
              </label>
              <select
                value={changeRecipientPermission}
                onChange={(e) =>
                  onChangeRecipientPermissionChange(Number(e.target.value))
                }
                className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
              >
                <option value={ChangeRecipientPermission.NONE}>None</option>
                <option value={ChangeRecipientPermission.SENDER_ONLY}>
                  Sender Only
                </option>
                <option value={ChangeRecipientPermission.RECIPIENT_ONLY}>
                  Recipient Only
                </option>
                <option value={ChangeRecipientPermission.BOTH}>Both</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={onCreateSchedule}
          disabled={
            vestingManager.isProcessing ||
            !tokenAddress ||
            !recipient ||
            !amount ||
            !startTime ||
            !endTime ||
            Object.values(errors).some((error) => error)
          }
          className="px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] transition-all duration-300 shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {vestingManager.isProcessing ? (
            <span className="flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {vestingManager.isApproving
                ? "Approving..."
                : "Creating Schedule..."}
            </span>
          ) : (
            "Create Vesting Schedule"
          )}
        </motion.button>
      </div>
    </div>
  );
}

// Multiple Schedules Form Component (simplified for brevity)
function MultipleSchedulesForm({
  tokenAddress,
  tokenSelection,
  predefinedTokens,
  tokenInfo,
  isLoadingToken,
  recipients,
  startTime,
  endTime,
  unlockSchedule,
  autoClaim,
  cancelPermission,
  changeRecipientPermission,
  csvInput,
  showCsvInput,
  errors,
  minDateTime,
  vestingManager,
  onTokenSelectionChange,
  onTokenAddressChange,
  onStartTimeChange,
  onEndTimeChange,
  onUnlockScheduleChange,
  onAutoClaimChange,
  onCancelPermissionChange,
  onChangeRecipientPermissionChange,
  onAddRecipient,
  onRemoveRecipient,
  onUpdateRecipient,
  onCsvInputChange,
  onShowCsvInputChange,
  onParseCsvInput,
  onCreateSchedules,
}) {
  const getTotalAmount = () => {
    return recipients.reduce((total, recipient) => {
      const amount = Number(recipient.amount.replace(/,/g, "")) || 0;
      return total + amount;
    }, 0);
  };

  return (
    <div className="p-6 rounded-3xl border border-[#475B74]/50 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] shadow-lg space-y-6">
      {/* Token Selection - Same as Single Schedule */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Select Token <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(predefinedTokens).map(([key, token]) => (
            <motion.div
              key={key}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                tokenSelection === key
                  ? "border-[#018ABD] bg-[#018ABD]/10"
                  : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
              }`}
              onClick={() => {
                onTokenSelectionChange(key);
                onTokenAddressChange({ target: { value: token.address } });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="tokenSelection"
                  checked={tokenSelection === key}
                  onChange={() => {}}
                  className="text-[#018ABD] focus:ring-[#018ABD]/50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#26A17B] to-[#26A17B] flex items-center justify-center text-white text-xs font-bold">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#97CBDC]">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-[#97CBDC]/70">
                        {token.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              tokenSelection === "custom"
                ? "border-[#018ABD] bg-[#018ABD]/10"
                : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
            }`}
            onClick={() => {
              onTokenSelectionChange("custom");
              onTokenAddressChange({ target: { value: "" } });
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="tokenSelection"
                checked={tokenSelection === "custom"}
                onChange={() => {}}
                className="text-[#018ABD] focus:ring-[#018ABD]/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#475B74] to-[#475B74] flex items-center justify-center text-white text-xs font-bold">
                    ?
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#97CBDC]">
                      Custom Token
                    </div>
                    <div className="text-xs text-[#97CBDC]/70">
                      Enter token address
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Custom Token Address Input */}
        <AnimatePresence>
          {tokenSelection === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="relative">
                <input
                  value={tokenAddress}
                  onChange={onTokenAddressChange}
                  placeholder="0x..."
                  className={`w-full bg-[#0a0a20]/80 border ${
                    errors.tokenAddress
                      ? "border-red-500"
                      : tokenInfo
                        ? "border-green-500"
                        : "border-[#475B74]/50"
                  } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                />
                {isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#97CBDC]/70 animate-spin" />
                  </div>
                )}
                {tokenInfo && !isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.tokenAddress && (
                <p className="text-sm text-red-500">{errors.tokenAddress}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Info Display */}
        <AnimatePresence>
          {tokenInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center text-[#97CBDC] font-medium">
                  {tokenInfo.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#97CBDC]">
                    {tokenInfo.name}
                  </div>
                  <div className="text-xs text-[#97CBDC]/70">
                    {tokenInfo.symbol} • {tokenInfo.decimals} decimals
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">
                    Your Balance:
                  </div>
                  <div className="text-[#97CBDC] font-medium">
                    {Number(tokenInfo.balance).toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">
                    Total Supply:
                  </div>
                  <div className="text-[#97CBDC] font-medium">
                    {Number(tokenInfo.totalSupply).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Time Settings */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#97CBDC]">
            Start Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              min={minDateTime}
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.startTime
                  ? "border-red-500"
                  : startTime
                    ? "border-[#018ABD]"
                    : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
          </div>
          {errors.startTime && (
            <p className="text-sm text-red-500">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#97CBDC]">
            End Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              min={startTime || minDateTime}
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.endTime
                  ? "border-red-500"
                  : endTime
                    ? "border-[#018ABD]"
                    : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
          </div>
          {errors.endTime && (
            <p className="text-sm text-red-500">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Unlock Schedule */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Unlock Schedule <span className="text-red-500">*</span>
        </label>
        <select
          value={unlockSchedule}
          onChange={(e) => onUnlockScheduleChange(Number(e.target.value))}
          className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
        >
          <option value={UnlockSchedule.SECOND}>Every Second</option>
          <option value={UnlockSchedule.MINUTE}>Every Minute</option>
          <option value={UnlockSchedule.HOUR}>Every Hour</option>
          <option value={UnlockSchedule.DAILY}>Daily</option>
          <option value={UnlockSchedule.WEEKLY}>Weekly</option>
          <option value={UnlockSchedule.BIWEEKLY}>Bi-weekly</option>
          <option value={UnlockSchedule.MONTHLY}>Monthly</option>
          <option value={UnlockSchedule.QUARTERLY}>Quarterly</option>
          <option value={UnlockSchedule.YEARLY}>Yearly</option>
        </select>
      </div>

      {/* Recipients Management */}
      <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#97CBDC] flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recipients ({recipients.length})
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onShowCsvInputChange(!showCsvInput)}
              className="px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              CSV Import
            </button>
            <button
              type="button"
              onClick={onAddRecipient}
              className="px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              Add Recipient
            </button>
          </div>
        </div>

        {/* CSV Input Section */}
        <AnimatePresence>
          {showCsvInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#97CBDC]">
                  CSV Format: address,amount,title,email (one per line)
                </label>
                <button
                  type="button"
                  onClick={() => onShowCsvInputChange(false)}
                  className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                >
                  ×
                </button>
              </div>
              <textarea
                value={csvInput}
                onChange={(e) => onCsvInputChange(e.target.value)}
                placeholder={`0x1234...abcd,1000,Team Member 1,member1@example.com\n0x5678...efgh,2000,Team Member 2,member2@example.com\n0x9abc...ijkl,1500,Team Member 3,member3@example.com`}
                className="w-full h-20 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={onParseCsvInput}
                  className="px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                >
                  Import CSV
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipients List */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {recipients.map((recipient, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[#97CBDC]/70 min-w-[60px]">
                  #{index + 1}
                </span>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(index)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors ml-auto"
                  >
                    <Users className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">
                    Address *
                  </label>
                  <input
                    value={recipient.address}
                    onChange={(e) =>
                      onUpdateRecipient(index, "address", e.target.value)
                    }
                    placeholder="0x..."
                    className={`w-full bg-[#0a0a20]/80 border ${
                      recipient.error && recipient.error.includes("address")
                        ? "border-red-500"
                        : recipient.address
                          ? "border-[#018ABD]"
                          : "border-[#475B74]/50"
                    } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <input
                      value={recipient.amount}
                      onChange={(e) =>
                        onUpdateRecipient(index, "amount", e.target.value)
                      }
                      placeholder="1000"
                      className={`w-full bg-[#0a0a20]/80 border ${
                        recipient.error && recipient.error.includes("amount")
                          ? "border-red-500"
                          : recipient.amount
                            ? "border-[#018ABD]"
                            : "border-[#475B74]/50"
                      } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 pr-12`}
                    />
                    {tokenInfo && recipient.amount && !recipient.error && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 text-xs">
                        {tokenInfo.symbol}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">
                    Title (Optional)
                  </label>
                  <input
                    value={recipient.title}
                    onChange={(e) =>
                      onUpdateRecipient(index, "title", e.target.value)
                    }
                    placeholder="Team Member"
                    className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) =>
                      onUpdateRecipient(index, "email", e.target.value)
                    }
                    placeholder="member@example.com"
                    className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                  />
                </div>
              </div>
              {recipient.error && (
                <p className="text-xs text-red-500 mt-1">{recipient.error}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Total Summary */}
        {recipients.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#97CBDC]/70">Total Amount:</span>
              <span className="text-[#97CBDC] font-medium">
                {getTotalAmount().toLocaleString()}{" "}
                {tokenInfo?.symbol || "tokens"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Global Settings */}
      <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
        <h3 className="text-sm font-medium text-[#97CBDC] mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Global Settings
        </h3>

        <div className="space-y-4">
          {/* Auto Claim */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoClaimMultiple"
              checked={autoClaim}
              onChange={(e) => onAutoClaimChange(e.target.checked)}
              className="rounded border-[#475B74] text-[#018ABD] focus:ring-[#018ABD]/50"
            />
            <label
              htmlFor="autoClaimMultiple"
              className="text-sm text-[#97CBDC]"
            >
              Enable auto-claim for all schedules
            </label>
          </div>

          {/* Permissions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#97CBDC]">
                Cancel Permission
              </label>
              <select
                value={cancelPermission}
                onChange={(e) =>
                  onCancelPermissionChange(Number(e.target.value))
                }
                className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
              >
                <option value={CancelPermission.NONE}>None</option>
                <option value={CancelPermission.SENDER_ONLY}>
                  Sender Only
                </option>
                <option value={CancelPermission.RECIPIENT_ONLY}>
                  Recipient Only
                </option>
                <option value={CancelPermission.BOTH}>Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#97CBDC]">
                Change Recipient Permission
              </label>
              <select
                value={changeRecipientPermission}
                onChange={(e) =>
                  onChangeRecipientPermissionChange(Number(e.target.value))
                }
                className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
              >
                <option value={ChangeRecipientPermission.NONE}>None</option>
                <option value={ChangeRecipientPermission.SENDER_ONLY}>
                  Sender Only
                </option>
                <option value={ChangeRecipientPermission.RECIPIENT_ONLY}>
                  Recipient Only
                </option>
                <option value={ChangeRecipientPermission.BOTH}>Both</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={onCreateSchedules}
          disabled={
            vestingManager.isProcessing ||
            !tokenAddress ||
            recipients.length === 0 ||
            !startTime ||
            !endTime ||
            recipients.some((r) => !r.address || !r.amount || r.error)
          }
          className="px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] transition-all duration-300 shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {vestingManager.isProcessing ? (
            <span className="flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {vestingManager.isApproving
                ? "Approving..."
                : "Creating Schedules..."}
            </span>
          ) : (
            `Create ${recipients.length} Vesting Schedule${recipients.length > 1 ? "s" : ""}`
          )}
        </motion.button>
      </div>
    </div>
  );
}

// Replace the SchedulesDashboard component with this full implementation:
function SchedulesDashboard({
  userSchedules,
  detailedSchedules,
  loadingSchedules,
  selectedSchedule,
  showScheduleModal,
  vestingManager,
  onRefresh,
  onSelectSchedule,
  onShowScheduleModal,
  onReleaseTokens,
  onCancelSchedule,
  formatScheduleTime,
  formatAmount,
  getScheduleProgress,
}) {
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'active', 'completed', 'cancelled'
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSchedules = detailedSchedules.filter((schedule) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        schedule.recipient?.toLowerCase().includes(searchLower) ||
        schedule.sender?.toLowerCase().includes(searchLower) ||
        schedule.contractTitle?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (activeFilter === "active") {
      return !schedule.cancelled && getScheduleProgress(schedule) < 100;
    } else if (activeFilter === "completed") {
      return !schedule.cancelled && getScheduleProgress(schedule) >= 100;
    } else if (activeFilter === "cancelled") {
      return schedule.cancelled;
    }

    return true; // 'all'
  });

  const getStatusBadge = (schedule) => {
    if (schedule.cancelled) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
          Cancelled
        </span>
      );
    }

    const progress = getScheduleProgress(schedule);
    if (progress >= 100) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
          Completed
        </span>
      );
    } else if (progress > 0) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
          Pending
        </span>
      );
    }
  };

  if (loadingSchedules) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#018ABD]" />
          <p className="text-[#97CBDC]/70">Loading your vesting schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#97CBDC]">
            Your Vesting Schedules
          </h2>
          <p className="text-[#97CBDC]/70">
            {userSchedules.recipientSchedules.length} as recipient •{" "}
            {userSchedules.senderSchedules.length} as sender
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-[#018ABD]" />
            <span className="text-sm font-medium text-[#97CBDC]">
              Total Schedules
            </span>
          </div>
          <div className="text-2xl font-bold text-[#97CBDC]">
            {detailedSchedules.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-[#97CBDC]">Active</span>
          </div>
          <div className="text-2xl font-bold text-[#97CBDC]">
            {
              detailedSchedules.filter(
                (s) => !s.cancelled && getScheduleProgress(s) < 100
              ).length
            }
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-[#97CBDC]">
              Completed
            </span>
          </div>
          <div className="text-2xl font-bold text-[#97CBDC]">
            {
              detailedSchedules.filter(
                (s) => !s.cancelled && getScheduleProgress(s) >= 100
              ).length
            }
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-[#97CBDC]">
              Cancelled
            </span>
          </div>
          <div className="text-2xl font-bold text-[#97CBDC]">
            {detailedSchedules.filter((s) => s.cancelled).length}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {["all", "active", "completed", "cancelled"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeFilter === filter
                  ? "bg-[#018ABD] text-white"
                  : "bg-[#0a0a20]/50 text-[#97CBDC]/70 hover:bg-[#0a0a20] hover:text-[#97CBDC]"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by recipient, sender, or title..."
            className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
          />
        </div>
      </div>

      {/* Schedules List */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50 text-[#97CBDC]" />
          <h3 className="text-lg font-medium text-[#97CBDC] mb-2">
            No schedules found
          </h3>
          <p className="text-[#97CBDC]/70">
            {detailedSchedules.length === 0
              ? "You don't have any vesting schedules yet."
              : "No schedules match your current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchedules.map((schedule, index) => (
            <motion.div
              key={schedule.scheduleId || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30 hover:border-[#018ABD]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[#97CBDC]">
                      {schedule.contractTitle ||
                        `Schedule #${schedule.scheduleId}`}
                    </h3>
                    {getStatusBadge(schedule)}
                  </div>
                  <div className="text-sm text-[#97CBDC]/70">
                    <span>
                      Recipient: {schedule.recipient?.slice(0, 6)}...
                      {schedule.recipient?.slice(-4)}
                    </span>
                    {schedule.recipientEmail && (
                      <span className="ml-4">• {schedule.recipientEmail}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onSelectSchedule(schedule);
                      onShowScheduleModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                  >
                    View Details
                  </button>

                  {!schedule.cancelled && schedule.releasableAmount > 0 && (
                    <button
                      onClick={() => onReleaseTokens(schedule.scheduleId)}
                      disabled={vestingManager.isProcessing}
                      className="px-3 py-1.5 text-xs bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      {vestingManager.isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Release"
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[#97CBDC]/70 mb-1">Total Amount</div>
                  <div className="text-[#97CBDC] font-medium">
                    {formatAmount(
                      schedule.scheduleAmount || 0,
                      schedule.tokenDecimals || 18
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[#97CBDC]/70 mb-1">Vested</div>
                  <div className="text-[#97CBDC] font-medium">
                    {formatAmount(
                      schedule.vestedAmount || 0,
                      schedule.tokenDecimals || 18
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[#97CBDC]/70 mb-1">Releasable</div>
                  <div className="text-green-400 font-medium">
                    {formatAmount(
                      schedule.releasableAmount || 0,
                      schedule.tokenDecimals || 18
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[#97CBDC]/70 mb-1">Progress</div>
                  <div className="text-[#97CBDC] font-medium">
                    {getScheduleProgress(schedule).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-[#0a0a20] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD] transition-all duration-300"
                    style={{
                      width: `${Math.min(getScheduleProgress(schedule), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#97CBDC]/70 mt-2">
                <span>Start: {formatScheduleTime(schedule.startTime)}</span>
                <span>End: {formatScheduleTime(schedule.endTime)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Schedule Detail Modal */}
      <AnimatePresence>
        {showScheduleModal && selectedSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => onShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1D2538] border border-[#475B74]/50 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#97CBDC]">
                  {selectedSchedule.contractTitle ||
                    `Schedule #${selectedSchedule.scheduleId}`}
                </h2>
                <button
                  onClick={() => onShowScheduleModal(false)}
                  className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Status and Progress */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedSchedule)}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#97CBDC]">
                      {getScheduleProgress(selectedSchedule).toFixed(1)}%
                    </div>
                    <div className="text-sm text-[#97CBDC]/70">Complete</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-[#0a0a20] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD] transition-all duration-300"
                    style={{
                      width: `${Math.min(getScheduleProgress(selectedSchedule), 100)}%`,
                    }}
                  />
                </div>

                {/* Schedule Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                    <div className="text-[#97CBDC]/70 text-sm mb-1">
                      Recipient
                    </div>
                    <div className="text-[#97CBDC] font-medium font-mono text-sm">
                      {selectedSchedule.recipient}
                    </div>
                    {selectedSchedule.recipientEmail && (
                      <div className="text-[#97CBDC]/70 text-xs mt-1">
                        {selectedSchedule.recipientEmail}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                    <div className="text-[#97CBDC]/70 text-sm mb-1">Sender</div>
                    <div className="text-[#97CBDC] font-medium font-mono text-sm">
                      {selectedSchedule.sender}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                    <div className="text-[#97CBDC]/70 text-sm mb-1">
                      Total Amount
                    </div>
                    <div className="text-[#97CBDC] font-medium">
                      {formatAmount(
                        selectedSchedule.amount,
                        selectedSchedule.tokenDecimals || 18
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                    <div className="text-[#97CBDC]/70 text-sm mb-1">
                      Vested Amount
                    </div>
                    <div className="text-[#97CBDC] font-medium">
                      {formatAmount(
                        selectedSchedule.vestedAmount || 0,
                        selectedSchedule.tokenDecimals || 18
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                    <div className="text-[#97CBDC]/70 text-sm mb-1">
                      Releasable Amount
                    </div>
                    <div className="text-green-400 font-medium">
                      {formatAmount(
                        selectedSchedule.releasableAmount || 0,
                        selectedSchedule.tokenDecimals || 18
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                    <div className="text-[#97CBDC]/70 text-sm mb-1">
                      Unlock Schedule
                    </div>
                    <div className="text-[#97CBDC] font-medium">
                      {vestingManager.getUnlockScheduleText(
                        selectedSchedule.unlockSchedule
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-3 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-sm mb-2">Timeline</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#97CBDC]/70">Start:</span>
                      <span className="text-[#97CBDC]">
                        {formatScheduleTime(selectedSchedule.startTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#97CBDC]/70">End:</span>
                      <span className="text-[#97CBDC]">
                        {formatScheduleTime(selectedSchedule.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {!selectedSchedule.cancelled &&
                    selectedSchedule.releasableAmount > 0 && (
                      <button
                        onClick={() => {
                          onReleaseTokens(selectedSchedule.scheduleId);
                          onShowScheduleModal(false);
                        }}
                        disabled={vestingManager.isProcessing}
                        className="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {vestingManager.isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Release Tokens
                          </>
                        )}
                      </button>
                    )}

                  {!selectedSchedule.cancelled && (
                    <button
                      onClick={() => {
                        onCancelSchedule(selectedSchedule.scheduleId);
                        onShowScheduleModal(false);
                      }}
                      disabled={vestingManager.isProcessing}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      Cancel Schedule
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
