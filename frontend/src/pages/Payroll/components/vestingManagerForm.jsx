import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Contact,
  X,
  Plus,
  Trash2,
  Upload,
  Clock,
  Percent,
} from "lucide-react";
import {
  useVestingManager,
  UnlockSchedule,
  CancelPermission,
  ChangeRecipientPermission,
} from "@/hooks/useVestingManager";
import { useTokenLock } from "@/hooks/useTokenLock";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import ContactSelector from "@/components/ContactSelector";

export default function VestingManagerForm() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("unified"); // 'unified', 'multivesting', 'dashboard'
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
      address: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
      name: "USD Coin",
      symbol: "USDC",
    },
  });

  // Single schedule state (for UnifiedSchedule tab)
  const [singleRecipient, setSingleRecipient] = useState({
    address: "",
    amount: "",
    title: "",
    email: "",
    error: "",
  });

  // Multiple schedules state (for Multivesting tab)
  const [recipients, setRecipients] = useState([
    { address: "", amount: "", email: "", error: "" },
  ]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [unlockSchedule, setUnlockSchedule] = useState(UnlockSchedule.DAILY);
  const [autoClaim, setAutoClaim] = useState(false);
  const [contractTitle, setContractTitle] = useState("");
  const [cancelPermission, setCancelPermission] = useState(
    CancelPermission.BOTH
  );
  const [changeRecipientPermission, setChangeRecipientPermission] = useState(
    ChangeRecipientPermission.BOTH
  );
  const [csvInput, setCsvInput] = useState("");
  const [showCsvInput, setShowCsvInput] = useState(false);
  const [openPickerIndex, setOpenPickerIndex] = useState(null);

  // Vesting specific state (from TokenLockForm)
  const [tgeDate, setTgeDate] = useState("");
  const [tgeBps, setTgeBps] = useState("2000"); // Default 20%
  const [cycle, setCycle] = useState("86400"); // Default 1 day
  const [cycleBps, setCycleBps] = useState("1000"); // Default 10%
  const [vestingDetails, setVestingDetails] = useState(null);

  // Dashboard state
  const [userSchedules, setUserSchedules] = useState({
    recipientSchedules: [],
    senderSchedules: [],
  });
  const [detailedSchedules, setDetailedSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});
  const [showTooltip, setShowTooltip] = useState("");

  // Hook instances
  const vestingManager = useVestingManager();
  const tokenLock = useTokenLock();
  const { tokenInfo, isLoadingToken, tokenError, fetchTokenInfo } =
    useTokenInfo(tokenAddress, address);

  // Set minimum dates
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // 5 minutes from now
  const minDateTime = now.toISOString().slice(0, 16);

  const loadUserSchedules = useCallback(async () => {
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
  }, [vestingManager, address]);

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

    // Validate single recipient
    if (!singleRecipient.address) {
      newErrors.singleRecipient = "Recipient address is required";
    } else if (
      !singleRecipient.address.startsWith("0x") ||
      singleRecipient.address.length !== 42
    ) {
      newErrors.singleRecipient = "Invalid recipient address";
    }

    if (!singleRecipient.amount) {
      newErrors.singleAmount = "Amount is required";
    } else if (
      isNaN(Number(singleRecipient.amount)) ||
      Number(singleRecipient.amount) <= 0
    ) {
      newErrors.singleAmount = "Invalid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMultipleSchedules = () => {
    const newErrors = {};

    if (!tokenAddress) newErrors.tokenAddress = "Token address is required";
    if (!tgeDate) newErrors.tgeDate = "TGE date is required";
    if (!tgeBps) newErrors.tgeBps = "Initial release percentage is required";
    if (!cycle) newErrors.cycle = "Release cycle is required";
    if (!cycleBps)
      newErrors.cycleBps = "Release per cycle percentage is required";

    if (tgeDate && new Date(tgeDate).getTime() <= Date.now()) {
      newErrors.tgeDate = "TGE date must be in the future";
    }

    if (
      tgeBps &&
      (isNaN(Number(tgeBps)) || Number(tgeBps) < 0 || Number(tgeBps) > 10000)
    ) {
      newErrors.tgeBps = "Initial release must be between 0 and 10000";
    }

    if (cycle && (isNaN(Number(cycle)) || Number(cycle) <= 0)) {
      newErrors.cycle = "Release cycle must be greater than 0";
    }

    if (
      cycleBps &&
      (isNaN(Number(cycleBps)) ||
        Number(cycleBps) < 0 ||
        Number(cycleBps) > 10000)
    ) {
      newErrors.cycleBps = "Release per cycle must be between 0 and 10000";
    }

    // Validate recipients
    const validRecipients = recipients.filter((r) => r.address && r.amount);
    if (validRecipients.length === 0) {
      newErrors.recipients = "At least one valid recipient is required";
    }

    // Check for duplicate addresses
    const addresses = recipients
      .map((r) => r.address.toLowerCase())
      .filter((a) => a);
    const duplicates = addresses.filter(
      (addr, index) => addresses.indexOf(addr) !== index
    );

    if (duplicates.length > 0) {
      newErrors.recipients = "Duplicate addresses found";
    }

    // Validate each recipient
    recipients.forEach((recipient, index) => {
      if (
        recipient.address &&
        (!recipient.address.startsWith("0x") || recipient.address.length !== 42)
      ) {
        newErrors[`recipient_${index}_address`] = "Invalid recipient address";
      }
      if (recipient.amount) {
        const amount = Number(recipient.amount.replace(/,/g, ""));
        if (isNaN(amount) || amount <= 0) {
          newErrors[`recipient_${index}_amount`] = "Invalid amount";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSingleSchedule = async () => {
    if (!validateSingleSchedule()) return;

    try {
      const result = await vestingManager.performVestingScheduleCreation(
        tokenAddress,
        tokenInfo.decimals,
        singleRecipient.address,
        singleRecipient.amount,
        startTime,
        endTime,
        unlockSchedule,
        {
          autoClaim,
          contractTitle: singleRecipient.title || contractTitle,
          recipientEmail: singleRecipient.email || "",
          cancelPermission,
          changeRecipientPermission,
        }
      );

      if (result.success) {
        // Reset form
        setSingleRecipient({
          address: "",
          amount: "",
          title: "",
          email: "",
          error: "",
        });
        setStartTime("");
        setEndTime("");
        setContractTitle("");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  const handleCreateMultipleSchedules = async () => {
    if (!validateMultipleSchedules()) return;

    const validRecipients = recipients.filter(
      (r) => r.address && r.amount && !r.error
    );
    if (validRecipients.length === 0) return;

    try {
      const addresses = validRecipients.map((r) => r.address);
      const amounts = validRecipients.map((r) => r.amount);

      // Calculate TGE timestamp
      const tgeTimestamp = Math.floor(new Date(tgeDate).getTime() / 1000);
      const cycleSeconds = Number(cycle);

      const hash = await tokenLock.multipleVestingLock(
        addresses,
        amounts,
        tokenAddress,
        tokenInfo.decimals,
        tgeTimestamp,
        Number(tgeBps),
        cycleSeconds,
        Number(cycleBps),
        contractTitle || "Multiple Vesting Schedule"
      );

      if (hash) {
        // Reset form
        setRecipients([{ address: "", amount: "", email: "", error: "" }]);
        setTgeDate("");
        setTgeBps("2000");
        setCycle("86400");
        setCycleBps("1000");
        setVestingDetails(null);
        setContractTitle("");
      }
    } catch (error) {
      console.error("Error creating schedules:", error);
    }
  };

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { address: "", amount: "", email: "", error: "" },
    ]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
      validateRecipients(newRecipients);
    }
  };

  const updateSingleRecipient = (field, value) => {
    const newRecipient = { ...singleRecipient };
    newRecipient[field] = value;

    // Validate
    if (field === "address") {
      if (value && (!value.startsWith("0x") || value.length !== 42)) {
        newRecipient.error = "Invalid address format";
      } else {
        newRecipient.error = "";
      }
    } else if (field === "amount") {
      if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
        newRecipient.error = "Invalid amount";
      } else {
        newRecipient.error = "";
      }
    }

    setSingleRecipient(newRecipient);
  };

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;

    // Validate the specific recipient
    if (field === "address") {
      if (value && !value.startsWith("0x")) {
        newRecipients[index].error = "Address must start with 0x";
      } else if (value && value.length !== 42) {
        newRecipients[index].error = "Address must be 42 characters long";
      } else {
        newRecipients[index].error = "";
      }
    } else if (field === "amount") {
      if (value && isNaN(Number(value.replace(/,/g, "")))) {
        newRecipients[index].error = "Please enter a valid number";
      } else if (value && Number(value.replace(/,/g, "")) <= 0) {
        newRecipients[index].error = "Amount must be greater than 0";
      } else {
        newRecipients[index].error = "";
      }
    }

    setRecipients(newRecipients);
    validateRecipients(newRecipients);
  };

  const validateRecipients = (recipientsList = recipients) => {
    const addresses = recipientsList
      .map((r) => r.address.toLowerCase())
      .filter((a) => a);
    const duplicates = addresses.filter(
      (addr, index) => addresses.indexOf(addr) !== index
    );

    if (duplicates.length > 0) {
      setErrors({ ...errors, recipients: "Duplicate addresses found" });
      return false;
    }

    const hasErrors = recipientsList.some(
      (r) => r.error || !r.address || !r.amount
    );
    if (hasErrors) {
      setErrors({ ...errors, recipients: "Please fix all recipient errors" });
      return false;
    }

    setErrors({ ...errors, recipients: "" });
    return true;
  };

  const parseCsvInput = () => {
    try {
      const lines = csvInput.trim().split("\n");
      const newRecipients = lines
        .map((line) => {
          const [address, amount, email = ""] = line
            .split(",")
            .map((s) => s.trim());
          return {
            address: address || "",
            amount: amount || "",
            email: email || "",
            error: "",
          };
        })
        .filter((r) => r.address || r.amount);

      if (newRecipients.length > 0) {
        setRecipients(newRecipients);
        setCsvInput("");
        setShowCsvInput(false);
        validateRecipients(newRecipients);
      }
    } catch {
      setErrors({ ...errors, recipients: "Invalid CSV format" });
    }
  };

  const formatScheduleTime = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatAmount = (amount, decimals) => {
    console.log(amount);
    console.log(Number(formatUnits(amount, decimals)).toLocaleString());
    formatUnits(amount, decimals);
    return Number(amount).toLocaleString();
  };

  const getTotalAmount = useCallback(() => {
    return recipients.reduce((total, recipient) => {
      const amount = Number(recipient.amount.replace(/,/g, "")) || 0;
      return total + amount;
    }, 0);
  }, [recipients]);

  const getScheduleProgress = (schedule) => {
    const now = Date.now() / 1000;
    const start = Number(schedule.startTime);
    const end = Number(schedule.endTime);

    if (now < start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  };

  // Vesting handlers (from TokenLockForm)
  const handleTgeDateChange = (e) => {
    const value = e.target.value;
    setTgeDate(value);
    calculateVestingSchedule();
  };

  const handleTgeBpsChange = (e) => {
    const value = e.target.value;
    setTgeBps(value);
    calculateVestingSchedule();
  };

  const handleCycleChange = (e) => {
    const value = e.target.value;
    setCycle(value);
    calculateVestingSchedule();
  };

  const handleCycleBpsChange = (e) => {
    const value = e.target.value;
    setCycleBps(value);
    calculateVestingSchedule();
  };

  const calculateVestingSchedule = useCallback(() => {
    if (!recipients.length || !tgeBps || !cycle || !cycleBps) {
      setVestingDetails(null);
      return;
    }

    const totalAmount = getTotalAmount();
    const initialReleaseBps = Number(tgeBps);
    const cycleReleaseBps = Number(cycleBps);

    const initialRelease = (totalAmount * initialReleaseBps) / 10000;
    const remainingAmount = totalAmount - initialRelease;
    const cycleReleaseAmount = (totalAmount * cycleReleaseBps) / 10000;

    let totalCycles = 0;
    if (cycleReleaseAmount > 0) {
      totalCycles = Math.ceil(remainingAmount / cycleReleaseAmount);
    }

    setVestingDetails({
      initialRelease,
      cycleReleaseAmount,
      totalCycles,
      remainingAmount,
      totalDays: Math.ceil((totalCycles * Number(cycle)) / 86400),
    });
  }, [recipients, tgeBps, cycle, cycleBps, getTotalAmount]);

  // Quick TGE period
  const setQuickTgePeriod = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setTgeDate(date.toISOString().slice(0, 16));
    calculateVestingSchedule();
  };

  // Cycle presets
  const setCyclePreset = (days) => {
    const seconds = days * 86400;
    setCycle(seconds.toString());
    calculateVestingSchedule();
  };

  // Format cycle duration for display
  const formatCycleDuration = (seconds) => {
    if (!seconds) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
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
  }, [activeTab, address, loadUserSchedules]);

  // Calculate vesting schedule when parameters change
  useEffect(() => {
    if (activeTab === "multivesting") {
      calculateVestingSchedule();
    }
  }, [activeTab, calculateVestingSchedule]);

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
                  Unified Schedule
                </h4>
                <p className="text-sm text-[#97CBDC]/80">
                  Create a single vesting schedule for one recipient with
                  detailed customization options.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <h4 className="font-medium text-[#97CBDC] mb-2">
                  Multiple Vesting
                </h4>
                <p className="text-sm text-[#97CBDC]/80">
                  Create multiple vesting schedules at once for team members
                  with bulk import capabilities.
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
          onClick={() => setActiveTab("unified")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "unified"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Unified Schedule</span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("multivesting")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "multivesting"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Multiple Vesting</span>
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
        {activeTab === "unified" && (
          <motion.div
            key="unified"
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
              singleRecipient={singleRecipient}
              startTime={startTime}
              endTime={endTime}
              unlockSchedule={unlockSchedule}
              autoClaim={autoClaim}
              contractTitle={contractTitle}
              cancelPermission={cancelPermission}
              changeRecipientPermission={changeRecipientPermission}
              errors={errors}
              showTooltip={showTooltip}
              minDateTime={minDateTime}
              vestingManager={vestingManager}
              onTokenSelectionChange={setTokenSelection}
              onTokenAddressChange={handleTokenAddressChange}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onUnlockScheduleChange={setUnlockSchedule}
              onAutoClaimChange={setAutoClaim}
              onContractTitleChange={setContractTitle}
              onCancelPermissionChange={setCancelPermission}
              onChangeRecipientPermissionChange={setChangeRecipientPermission}
              onUpdateSingleRecipient={updateSingleRecipient}
              onShowTooltip={setShowTooltip}
              onCreateSchedule={handleCreateSingleSchedule}
            />
          </motion.div>
        )}

        {activeTab === "multivesting" && (
          <motion.div
            key="multivesting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* MULTIPLE VESTING TAB SPECIFIC FIELDS - COPIED FROM TOKENLOCKFORM */}
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
                        setTokenSelection(key);
                        handleTokenAddressChange({
                          target: { value: token.address },
                        });
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
                      setTokenSelection("custom");
                      handleTokenAddressChange({ target: { value: "" } });
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
                          onChange={handleTokenAddressChange}
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
                        <p className="text-sm text-red-500">
                          {errors.tokenAddress}
                        </p>
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

              {/* Vesting Parameters */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#97CBDC]">
                    TGE Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={tgeDate}
                      onChange={handleTgeDateChange}
                      min={minDateTime}
                      className={`w-full bg-[#0a0a20]/80 border ${
                        errors.tgeDate
                          ? "border-red-500"
                          : tgeDate
                            ? "border-[#018ABD]"
                            : "border-[#475B74]/50"
                      } rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
                  </div>
                  {errors.tgeDate && (
                    <p className="text-sm text-red-500">{errors.tgeDate}</p>
                  )}
                  {/* Quick TGE Date Buttons */}
                  <div className="mt-2">
                    <div className="text-xs text-[#97CBDC]/70 mb-2">
                      Quick select:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickTgePeriod(1)}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickTgePeriod(7)}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        1 Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickTgePeriod(30)}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        1 Month
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#97CBDC]">
                    Initial Release % <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={tgeBps}
                      onChange={handleTgeBpsChange}
                      className="w-full h-2 bg-[#0a0a20] rounded-lg appearance-none cursor-pointer accent-[#018ABD]"
                    />
                    <div className="flex justify-between mt-1 text-xs text-[#97CBDC]/70">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={tgeBps}
                      onChange={handleTgeBpsChange}
                      className="w-20 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                    />
                    <div className="text-[#97CBDC] font-medium">
                      {(Number(tgeBps) / 100).toFixed(2)}%
                    </div>
                  </div>
                  {errors.tgeBps && (
                    <p className="text-sm text-red-500">{errors.tgeBps}</p>
                  )}
                </div>
              </div>

              {/* Cycle Settings */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#97CBDC]">
                    Release Cycle (seconds){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={cycle}
                        onChange={handleCycleChange}
                        className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                      />
                    </div>
                    <div className="text-[#97CBDC] font-medium whitespace-nowrap">
                      {formatCycleDuration(Number(cycle))}
                    </div>
                  </div>
                  {errors.cycle && (
                    <p className="text-sm text-red-500">{errors.cycle}</p>
                  )}
                  {/* Quick Cycle Buttons */}
                  <div className="mt-2">
                    <div className="text-xs text-[#97CBDC]/70 mb-2">
                      Quick select:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCyclePreset(1)}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setCyclePreset(7)}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => setCyclePreset(30)}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#97CBDC]">
                    Release Per Cycle % <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={cycleBps}
                      onChange={handleCycleBpsChange}
                      className="w-full h-2 bg-[#0a0a20] rounded-lg appearance-none cursor-pointer accent-[#018ABD]"
                    />
                    <div className="flex justify-between mt-1 text-xs text-[#97CBDC]/70">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={cycleBps}
                      onChange={handleCycleBpsChange}
                      className="w-20 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                    />
                    <div className="text-[#97CBDC] font-medium">
                      {(Number(cycleBps) / 100).toFixed(2)}%
                    </div>
                  </div>
                  {errors.cycleBps && (
                    <p className="text-sm text-red-500">{errors.cycleBps}</p>
                  )}
                  {/* Quick Cycle BPS Buttons */}
                  <div className="mt-2">
                    <div className="text-xs text-[#97CBDC]/70 mb-2">
                      Quick select:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCycleBps("500")}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        5%
                      </button>
                      <button
                        type="button"
                        onClick={() => setCycleBps("1000")}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        onClick={() => setCycleBps("2000")}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        20%
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MULTIPLE VESTING TAB SPECIFIC FIELDS */}
              <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#97CBDC] flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Recipients ({recipients.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCsvInput(!showCsvInput)}
                      className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      CSV Import
                    </button>
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="cursor-pointer px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
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
                          CSV Format: address,amount,email (one per line)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCsvInput(false)}
                          className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        placeholder={`0x1234...abcd,1000,member1@example.com\n0x5678...efgh,2000,member2@example.com\n0x9abc...ijkl,1500,member3@example.com`}
                        className="w-full h-20 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={parseCsvInput}
                          className="cursor-pointer px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
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
                            onClick={() => removeRecipient(index)}
                            className="cursor-pointer p-1 text-red-400 hover:text-red-300 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs text-[#97CBDC]/70">
                              Address
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPickerIndex(
                                  openPickerIndex === index ? null : index
                                )
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                            >
                              {openPickerIndex === index ? "Hide" : "Select"}
                            </button>
                          </div>
                          {openPickerIndex === index && (
                            <div className="mb-2">
                              <ContactSelector
                                placeholder="Search contacts"
                                showEmail
                                onSelect={(contact) => {
                                  updateRecipient(
                                    index,
                                    "address",
                                    contact.walletAddress
                                  );
                                  updateRecipient(
                                    index,
                                    "email",
                                    contact.email || ""
                                  );
                                  setOpenPickerIndex(null);
                                }}
                              />
                            </div>
                          )}
                          <input
                            value={recipient.address}
                            onChange={(e) =>
                              updateRecipient(index, "address", e.target.value)
                            }
                            placeholder="0x..."
                            className={`w-full bg-[#0a0a20]/80 border ${
                              recipient.error &&
                              recipient.error.includes("Address")
                                ? "border-red-500"
                                : recipient.address
                                  ? "border-[#018ABD]"
                                  : "border-[#475B74]/50"
                            } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#97CBDC]/70 mb-1">
                            Amount
                          </label>
                          <div className="relative">
                            <input
                              value={recipient.amount}
                              onChange={(e) =>
                                updateRecipient(index, "amount", e.target.value)
                              }
                              placeholder="1000"
                              className={`w-full bg-[#0a0a20]/80 border ${
                                recipient.error &&
                                recipient.error.includes("number")
                                  ? "border-red-500"
                                  : recipient.amount
                                    ? "border-[#018ABD]"
                                    : "border-[#475B74]/50"
                              } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 pr-12`}
                            />
                            {tokenInfo &&
                              recipient.amount &&
                              !recipient.error && (
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
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={recipient.email}
                            onChange={(e) =>
                              updateRecipient(index, "email", e.target.value)
                            }
                            placeholder="member@example.com"
                            className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                          />
                        </div>
                      </div>
                      {recipient.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {recipient.error}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {errors.recipients && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.recipients}
                  </p>
                )}

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

              {/* Contract Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#97CBDC]">
                  Contract Title (Optional)
                </label>
                <input
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  placeholder="Multiple Vesting Schedule"
                  className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                />
              </div>

              {/* Vesting Schedule Preview */}
              {vestingDetails &&
                recipients.length > 0 &&
                tgeBps &&
                cycleBps && (
                  <div className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl">
                    <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Vesting Schedule Preview
                    </h3>
                    {/* Visual representation of vesting schedule */}
                    <div className="mb-4">
                      <div className="h-6 bg-[#0a0a20] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD] flex items-center justify-center text-xs text-white font-medium"
                          style={{
                            width: `${Number(tgeBps) / 100}%`,
                            minWidth: "40px",
                          }}
                          title="Initial Release"
                        >
                          {Number(tgeBps) / 100 >= 10
                            ? `${(Number(tgeBps) / 100).toFixed(0)}%`
                            : ""}
                        </div>
                        <div
                          className="h-full bg-[#018ABD]/30 flex items-center justify-center text-xs text-white/90 font-medium"
                          style={{
                            width: `${100 - Number(tgeBps) / 100}%`,
                          }}
                          title="Vesting Period"
                        >
                          {100 - Number(tgeBps) / 100 >= 30
                            ? "Vesting Period"
                            : ""}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-[#97CBDC]/70">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          TGE
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {vestingDetails.totalDays} days
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <Users className="w-3 h-3" />
                          Recipients:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {recipients.length}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <BarChart3 className="w-3 h-3" />
                          Total Amount:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {getTotalAmount().toLocaleString()}{" "}
                          {tokenInfo?.symbol}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <Percent className="w-3 h-3" />
                          Initial Release:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {(Number(tgeBps) / 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <Clock className="w-3 h-3" />
                          Release Cycle:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {formatCycleDuration(Number(cycle))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <Percent className="w-3 h-3" />
                          Per Cycle:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {(Number(cycleBps) / 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <BarChart3 className="w-3 h-3" />
                          Total Cycles:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {vestingDetails.totalCycles}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                        <div className="flex items-center gap-1 text-[#97CBDC]/70">
                          <Calendar className="w-3 h-3" />
                          Duration:
                        </div>
                        <div className="text-[#97CBDC] font-medium">
                          {vestingDetails.totalDays} days
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={handleCreateMultipleSchedules}
                  disabled={
                    tokenLock.isProcessing ||
                    !tokenAddress ||
                    recipients.length === 0 ||
                    !tgeDate ||
                    !tgeBps ||
                    !cycle ||
                    !cycleBps ||
                    recipients.some(
                      (r) => !r.address || !r.amount || r.error
                    ) ||
                    errors.tgeDate ||
                    errors.tgeBps ||
                    errors.cycle ||
                    errors.cycleBps ||
                    errors.recipients
                  }
                  className="px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] transition-all duration-300 shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tokenLock.isProcessing ? (
                    <span className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {tokenLock.isApproving
                        ? "Approving..."
                        : "Creating Schedules..."}
                    </span>
                  ) : (
                    `Create ${recipients.length} Vesting Schedule${recipients.length > 1 ? "s" : ""}`
                  )}
                </motion.button>
              </div>
            </div>
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
              onRefresh={loadUserSchedules}
              onSelectSchedule={() => {}}
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
  singleRecipient,
  startTime,
  endTime,
  unlockSchedule,
  autoClaim,
  contractTitle,
  cancelPermission,
  changeRecipientPermission,
  errors,
  showTooltip,
  minDateTime,
  vestingManager,
  onTokenSelectionChange,
  onTokenAddressChange,
  onStartTimeChange,
  onEndTimeChange,
  onUnlockScheduleChange,
  onAutoClaimChange,
  onContractTitleChange,
  onCancelPermissionChange,
  onChangeRecipientPermissionChange,
  onUpdateSingleRecipient,
  onShowTooltip,
  onCreateSchedule,
}) {
  const [openPicker, setOpenPicker] = useState(false);
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
                    {/* <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#26A17B] to-[#26A17B] flex items-center justify-center text-white text-xs font-bold">
                      {token.symbol[0]}
                    </div> */}
                    <img
                      src={`${token.symbol.toLowerCase()}.png`}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
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

      {/* Single Recipient Management */}
      <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#97CBDC] flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recipient Details
          </h3>
        </div>

        <div className="p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-[#97CBDC]/70">
                  Address *
                </label>
                <button
                  type="button"
                  onClick={() => setOpenPicker(!openPicker)}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                >
                  {openPicker ? "Hide" : "Select"}
                </button>
              </div>
              {openPicker && (
                <div className="mb-2">
                  <ContactSelector
                    placeholder="Search contacts"
                    showEmail
                    onSelect={(contact) => {
                      onUpdateSingleRecipient("address", contact.walletAddress);
                      onUpdateSingleRecipient("email", contact.email || "");
                      setOpenPicker(false);
                    }}
                  />
                </div>
              )}
              <input
                value={singleRecipient.address}
                onChange={(e) =>
                  onUpdateSingleRecipient("address", e.target.value)
                }
                placeholder="0x..."
                className={`w-full bg-[#0a0a20]/80 border ${
                  singleRecipient.error &&
                  singleRecipient.error.includes("address")
                    ? "border-red-500"
                    : singleRecipient.address
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
                  value={singleRecipient.amount}
                  onChange={(e) =>
                    onUpdateSingleRecipient("amount", e.target.value)
                  }
                  placeholder="1000"
                  className={`w-full bg-[#0a0a20]/80 border ${
                    singleRecipient.error &&
                    singleRecipient.error.includes("amount")
                      ? "border-red-500"
                      : singleRecipient.amount
                        ? "border-[#018ABD]"
                        : "border-[#475B74]/50"
                  } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 pr-12`}
                />
                {tokenInfo &&
                  singleRecipient.amount &&
                  !singleRecipient.error && (
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
                value={singleRecipient.title}
                onChange={(e) =>
                  onUpdateSingleRecipient("title", e.target.value)
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
                value={singleRecipient.email}
                onChange={(e) =>
                  onUpdateSingleRecipient("email", e.target.value)
                }
                placeholder="member@example.com"
                className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
              />
            </div>
          </div>
          {singleRecipient.error && (
            <p className="text-xs text-red-500 mt-1">{singleRecipient.error}</p>
          )}
        </div>

        {/* Amount Summary */}
        {singleRecipient.amount && (
          <div className="mt-4 p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#97CBDC]/70">Total Amount:</span>
              <span className="text-[#97CBDC] font-medium">
                {Number(singleRecipient.amount).toLocaleString()}{" "}
                {tokenInfo?.symbol || "tokens"}
              </span>
            </div>
          </div>
        )}
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
            !singleRecipient.address ||
            !singleRecipient.amount ||
            singleRecipient.error ||
            !startTime ||
            !endTime
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

// Multiple Schedules Form Component
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
  const [openPickerIndex, setOpenPickerIndex] = useState(null);

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
              className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              CSV Import
            </button>
            <button
              type="button"
              onClick={onAddRecipient}
              className="cursor-pointer px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
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
                  CSV Format: address,amount,email (one per line)
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
                placeholder={`0x1234...abcd,1000,member1@example.com\n0x5678...efgh,2000,member2@example.com\n0x9abc...ijkl,1500,member3@example.com`}
                className="w-full h-20 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={onParseCsvInput}
                  className="cursor-pointer px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
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
                    className="cursor-pointer p-1 text-red-400 hover:text-red-300 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-[#97CBDC]/70">
                      Address
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPickerIndex(
                          openPickerIndex === index ? null : index
                        )
                      }
                      className="text-[10px] px-2 py-0.5 rounded bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                    >
                      {openPickerIndex === index ? "Hide" : "Select"}
                    </button>
                  </div>
                  {openPickerIndex === index && (
                    <div className="mb-2">
                      <ContactSelector
                        placeholder="Search contacts"
                        showEmail
                        onSelect={(contact) => {
                          onUpdateRecipient(
                            index,
                            "address",
                            contact.walletAddress
                          );
                          onUpdateRecipient(
                            index,
                            "email",
                            contact.email || ""
                          );
                          setOpenPickerIndex(null);
                        }}
                      />
                    </div>
                  )}
                  <input
                    value={recipient.address}
                    onChange={(e) =>
                      onUpdateRecipient(index, "address", e.target.value)
                    }
                    placeholder="0x..."
                    className={`w-full bg-[#0a0a20]/80 border ${
                      recipient.error && recipient.error.includes("Address")
                        ? "border-red-500"
                        : recipient.address
                          ? "border-[#018ABD]"
                          : "border-[#475B74]/50"
                    } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      value={recipient.amount}
                      onChange={(e) =>
                        onUpdateRecipient(index, "amount", e.target.value)
                      }
                      placeholder="1000"
                      className={`w-full bg-[#0a0a20]/80 border ${
                        recipient.error && recipient.error.includes("number")
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

        {errors.recipients && (
          <p className="text-sm text-red-500 mt-2">{errors.recipients}</p>
        )}

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

// Schedules Dashboard Component
function SchedulesDashboard({
  userSchedules,
  detailedSchedules,
  loadingSchedules,
  onRefresh,
  onSelectSchedule,
  onReleaseTokens,
  onCancelSchedule,
  formatScheduleTime,
  formatAmount,
  getScheduleProgress,
}) {
  if (loadingSchedules) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#97CBDC] animate-spin" />
        <span className="ml-2 text-[#97CBDC]">Loading schedules...</span>
      </div>
    );
  }

  const allSchedules = [
    ...userSchedules.recipientSchedules.map((id) => ({
      ...detailedSchedules.find((s) => s.id === id),
      type: "recipient",
    })),
    ...userSchedules.senderSchedules.map((id) => ({
      ...detailedSchedules.find((s) => s.id === id),
      type: "sender",
    })),
  ].filter(Boolean);

  console.log(allSchedules);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#97CBDC]">
          Your Vesting Schedules
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
        >
          Refresh
        </button>
      </div>

      {allSchedules.length === 0 ? (
        <div className="text-center p-8 text-[#97CBDC]/70">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No vesting schedules found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {allSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[#97CBDC]">
                  {schedule.title || "Untitled Schedule"}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    schedule.type === "recipient"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {schedule.type === "recipient" ? "Recipient" : "Sender"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[#97CBDC]/70 text-xs">Amount</div>
                  <div className="text-[#97CBDC] font-medium">
                    {formatAmount(schedule.totalAmount, schedule.decimals)}
                  </div>
                </div>
                <div>
                  <div className="text-[#97CBDC]/70 text-xs">Start</div>
                  <div className="text-[#97CBDC]">
                    {formatScheduleTime(schedule.startTime)}
                  </div>
                </div>
                <div>
                  <div className="text-[#97CBDC]/70 text-xs">End</div>
                  <div className="text-[#97CBDC]">
                    {formatScheduleTime(schedule.endTime)}
                  </div>
                </div>
                <div>
                  <div className="text-[#97CBDC]/70 text-xs">Progress</div>
                  <div className="text-[#97CBDC]">
                    {getScheduleProgress(schedule).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onSelectSchedule(schedule)}
                  className="px-3 py-1 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                >
                  View Details
                </button>
                {schedule.type === "sender" && (
                  <>
                    <button
                      onClick={() => onReleaseTokens(schedule.id)}
                      className="px-3 py-1 text-xs bg-green-500/20 border border-green-500/50 rounded text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      Release
                    </button>
                    <button
                      onClick={() => onCancelSchedule(schedule.id)}
                      className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 rounded text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
