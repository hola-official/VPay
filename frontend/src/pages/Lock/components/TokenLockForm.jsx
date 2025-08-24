"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockIcon as LockClosed,
  Calendar,
  Info,
  Loader2,
  CheckCircle,
  BarChart2,
  HelpCircle,
  Clock,
  Percent,
  AlertCircle,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Upload,
} from "lucide-react";
import TokenLockSuccessModal from "./TokenLockSuccessModal";
import { useTokenLock } from "@/hooks/useTokenLock";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useAccount } from "wagmi";
import ContactSelector from "@/components/ContactSelector";
const MOTION_USED = motion;

export default function TokenLockForm() {
  const { address } = useAccount();
  const [tokenAddress, setTokenAddress] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [lockUntil, setLockUntil] = useState("");
  const [useCustomOwner, setUseCustomOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [showOwnerContactPicker, setShowOwnerContactPicker] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [dateError, setDateError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState("");

  const [successData, setSuccessData] = useState(null);
  const [activeTab, setActiveTab] = useState("lock"); // 'lock', 'vesting', or 'multiple'
  const [showHelp, setShowHelp] = useState(false);

  // Token selection state
  const [tokenSelection, setTokenSelection] = useState("custom"); // "usdt", "usdc", or "custom"
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

  // Vesting specific state
  const [tgeDate, setTgeDate] = useState("");
  const [tgeBps, setTgeBps] = useState("2000"); // Default 20%
  const [cycle, setCycle] = useState("86400"); // Default 1 day
  const [cycleBps, setCycleBps] = useState("1000"); // Default 10%
  const [tgeDateError, setTgeDateError] = useState("");
  const [tgeBpsError, setTgeBpsError] = useState("");
  const [cycleError, setCycleError] = useState("");
  const [cycleBpsError, setCycleBpsError] = useState("");
  const [vestingDetails, setVestingDetails] = useState(null);

  // Multiple vesting specific state
  const [recipients, setRecipients] = useState([
    { address: "", amount: "", email: "", error: "" },
  ]);
  const [recipientsError, setRecipientsError] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [showCsvInput, setShowCsvInput] = useState(false);
  const [openPickerIndex, setOpenPickerIndex] = useState(null);

  const {
    performTokenLock,
    multipleVestingLock,
    isApproving,
    isLocking,
    isProcessing,
  } = useTokenLock();

  // Set minimum date to today
  const today = new Date();
  today.setHours(today.getHours() + 1);
  const minDate = today.toISOString().slice(0, 16);

  // Debounce token address changes
  const [debouncedTokenAddress, setDebouncedTokenAddress] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTokenAddress(tokenAddress);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [tokenAddress]);

  // Get token info using our custom hook
  const {
    tokenInfo,
    isLoadingToken,
    tokenError,
    fetchTokenInfo,
    setTokenInfo,
  } = useTokenInfo(debouncedTokenAddress, address);

  // Fetch token info when debounced address changes
  useEffect(() => {
    if (debouncedTokenAddress && debouncedTokenAddress.length === 42) {
      fetchTokenInfo();
    }
  }, [debouncedTokenAddress, fetchTokenInfo]);

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setTokenAddress(value);

    // If user is typing in custom field, make sure custom is selected
    if (tokenSelection !== "custom") {
      setTokenSelection("custom");
    }

    // Validate address format
    if (value && !value.startsWith("0x")) {
      setAddressError("Please enter a valid address starting with 0x");
      return;
    } else if (value && value.length !== 42) {
      setAddressError("Address must be 42 characters long");
      return;
    } else {
      setAddressError("");
    }
  };

  // Validate amount
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value && isNaN(Number(value.replace(/,/g, "")))) {
      setAmountError("Please enter a valid number");
    } else if (value && Number(value.replace(/,/g, "")) <= 0) {
      setAmountError("Amount must be greater than 0");
    } else {
      setAmountError("");
    }

    // Recalculate vesting schedule if in vesting mode
    if (activeTab === "vesting") {
      calculateVestingSchedule(value, tgeBps, cycle, cycleBps);
    }
  };

  // Validate date
  const handleDateChange = (e) => {
    const value = e.target.value;
    setLockUntil(value);
    const selectedDate = new Date(value);
    const now = new Date();
    if (selectedDate <= now) {
      setDateError("Lock date must be in the future");
    } else {
      setDateError("");
    }
  };

  // Handle form submission - now using the performTokenLock function
  const handleLockTokens = async () => {
    // Validate all fields
    if (
      addressError ||
      amountError ||
      dateError ||
      !tokenAddress ||
      !amount ||
      !lockUntil ||
      !tokenInfo
    ) {
      return;
    }

    try {
      // Perform the token lock
      const result = await performTokenLock(
        tokenAddress,
        tokenInfo.decimals,
        amount,
        lockUntil,
        title || `Lock for ${tokenInfo.symbol}`,
        null // No vesting options for now
      );

      if (result.success === true) {
        // Save successful lock data for the modal
        setSuccessData({
          tokenAddress,
          amount,
          lockUntil,
          tokenInfo,
          txHash: result.hash,
          isLpToken: result.isLpToken,
        });
      }
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error in lock process:", error);
      // Error handling is done in the hook with toast notifications
    }
  };

  // Multiple vesting handlers
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
      setRecipientsError("Duplicate addresses found");
      return false;
    }

    const hasErrors = recipientsList.some(
      (r) => r.error || !r.address || !r.amount
    );
    if (hasErrors) {
      setRecipientsError("Please fix all recipient errors");
      return false;
    }

    setRecipientsError("");
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
      setRecipientsError("Invalid CSV format");
    }
  };

  const getTotalAmount = () => {
    return recipients.reduce((total, recipient) => {
      const amount = Number(recipient.amount.replace(/,/g, "")) || 0;
      return total + amount;
    }, 0);
  };

  // Vesting handlers
  const handleTgeDateChange = (e) => {
    const value = e.target.value;
    setTgeDate(value);
    const selectedDate = new Date(value);
    const now = new Date();
    if (selectedDate <= now) {
      setTgeDateError("TGE date must be in the future");
    } else {
      setTgeDateError("");
    }
    calculateVestingSchedule(amount, tgeBps, cycle, cycleBps);
  };

  const handleTgeBpsChange = (e) => {
    const value = e.target.value;
    setTgeBps(value);
    if (value && isNaN(Number(value))) {
      setTgeBpsError("Please enter a valid number");
    } else if (value && (Number(value) < 0 || Number(value) > 10000)) {
      setTgeBpsError("Value must be between 0 and 10000");
    } else {
      setTgeBpsError("");
    }
    calculateVestingSchedule(amount, value, cycle, cycleBps);
  };

  const handleCycleChange = (e) => {
    const value = e.target.value;
    setCycle(value);
    if (value && isNaN(Number(value))) {
      setCycleError("Please enter a valid number");
    } else if (value && Number(value) <= 0) {
      setCycleError("Cycle must be greater than 0");
    } else {
      setCycleError("");
    }
    calculateVestingSchedule(amount, tgeBps, value, cycleBps);
  };

  const handleCycleBpsChange = (e) => {
    const value = e.target.value;
    setCycleBps(value);
    if (value && isNaN(Number(value))) {
      setCycleBpsError("Please enter a valid number");
    } else if (value && (Number(value) < 0 || Number(value) > 10000)) {
      setCycleBpsError("Value must be between 0 and 10000");
    } else {
      setCycleBpsError("");
    }
    calculateVestingSchedule(amount, tgeBps, cycle, value);
  };

  const calculateVestingSchedule = useCallback(
    (
      amountValue = amount,
      tgeBpsValue = tgeBps,
      cycleValue = cycle,
      cycleBpsValue = cycleBps
    ) => {
      if (!amountValue || !tgeBpsValue || !cycleValue || !cycleBpsValue) {
        setVestingDetails(null);
        return;
      }

      const totalAmount = Number(amountValue.replace(/,/g, ""));
      const initialReleaseBps = Number(tgeBpsValue);
      const cycleReleaseBps = Number(cycleBpsValue);

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
        totalDays: Math.ceil((totalCycles * Number(cycleValue)) / 86400),
      });
    },
    [amount, tgeBps, cycle, cycleBps]
  );

  const handleVestingLock = async () => {
    // Validate all fields
    if (
      addressError ||
      amountError ||
      tgeDateError ||
      tgeBpsError ||
      cycleError ||
      cycleBpsError ||
      !tokenAddress ||
      !amount ||
      !tgeDate ||
      !tgeBps ||
      !cycle ||
      !cycleBps ||
      !tokenInfo
    ) {
      return;
    }

    try {
      // Perform the vesting token lock
      const vestingOptions = {
        tgeDate,
        tgeBps: Number(tgeBps),
        cycle: Number(cycle),
        cycleBps: Number(cycleBps),
      };

      // Perform the token lock with vesting
      const result = await performTokenLock(
        tokenAddress,
        tokenInfo.decimals,
        amount,
        tgeDate,
        title || `Vesting for ${tokenInfo.symbol}`,
        vestingOptions
      );

      if (result.success) {
        // Save successful lock data for the modal
        setSuccessData({
          tokenAddress,
          amount,
          lockUntil: tgeDate, // Use TGE date for vesting
          tokenInfo,
          txHash: result.hash,
          isLpToken: result.isLpToken,
          isVesting: true,
          tgeBps,
          cycle,
          cycleBps,
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error in vesting lock process:", error);
      // Error handling is done in the hook with toast notifications
    }
  };

  // Handle multiple vesting lock
  const handleMultipleVestingLock = async () => {
    // Validate all fields
    if (
      addressError ||
      tgeDateError ||
      tgeBpsError ||
      cycleError ||
      cycleBpsError ||
      recipientsError ||
      !tokenAddress ||
      !tgeDate ||
      !tgeBps ||
      !cycle ||
      !cycleBps ||
      !tokenInfo ||
      recipients.length === 0
    ) {
      return;
    }

    // Validate recipients one more time
    if (!validateRecipients()) {
      return;
    }

    try {
      const owners = recipients.map((r) => r.address);
      const amounts = recipients.map((r) => r.amount);

      // Perform the multiple vesting lock
      const result = await multipleVestingLock(
        owners,
        amounts,
        tokenAddress,
        tokenInfo.decimals,
        tgeDate,
        Number(tgeBps),
        Number(cycle),
        Number(cycleBps),
        title || `Multiple Vesting for ${tokenInfo.symbol}`,
        false // isLpToken - you can add detection logic here
      );

      if (result) {
        // Save successful lock data for the modal
        setSuccessData({
          tokenAddress,
          amount: getTotalAmount().toString(),
          lockUntil: tgeDate,
          tokenInfo,
          txHash: result,
          isLpToken: false,
          isVesting: true,
          isMultiple: true,
          recipients: recipients.length,
          tgeBps,
          cycle,
          cycleBps,
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error in multiple vesting lock process:", error);
      // Error handling is done in the hook with toast notifications
    }
  };

  // Quick lock period
  const setQuickLockPeriod = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    setLockUntil(date.toISOString().slice(0, 16));
    setDateError("");
  };

  // Quick TGE period
  const setQuickTgePeriod = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setTgeDate(date.toISOString().slice(0, 16));
    setTgeDateError("");
    calculateVestingSchedule();
  };

  // Cycle presets
  const setCyclePreset = (days) => {
    const seconds = days * 86400;
    setCycle(seconds.toString());
    setCycleError("");
    calculateVestingSchedule(amount, tgeBps, seconds.toString(), cycleBps);
  };

  // (removed unused copy to clipboard helper)

  // Reset form after successful lock
  useEffect(() => {
    if (!showSuccessModal) {
      return;
    }
    // Reset form after modal is closed
    return () => {
      setTokenAddress("");
      setTitle("");
      setAmount("");
      setLockUntil("");
      setUseCustomOwner(false);
      setOwnerAddress("");
      setTokenInfo(null);
      setSuccessData(null);
      setTgeDate("");
      setTgeBps("2000");
      setCycle("86400");
      setCycleBps("1000");
      setVestingDetails(null);
      setRecipients([{ address: "", amount: "", error: "" }]);
      setRecipientsError("");
    };
  }, [showSuccessModal, setTokenInfo]);

  const calculateVestingDetails = () => {
    if (
      !successData?.amount ||
      !successData?.tgeBps ||
      !successData?.cycle ||
      !successData?.cycleBps
    ) {
      return null;
    }

    const totalAmount = Number(successData.amount.replace(/,/g, ""));
    const initialReleaseBps = Number(successData.tgeBps);
    const cycleReleaseBps = Number(successData.cycleBps);

    const initialRelease = (totalAmount * initialReleaseBps) / 10000;
    const remainingAmount = totalAmount - initialRelease;
    const cycleReleaseAmount = (totalAmount * cycleReleaseBps) / 10000;

    let totalCycles = 0;
    if (cycleReleaseAmount > 0) {
      totalCycles = Math.ceil(remainingAmount / cycleReleaseAmount);
    }

    return {
      initialRelease,
      cycleReleaseAmount,
      totalCycles,
      remainingAmount,
    };
  };

  // Initialize vesting schedule calculation when tab changes to vesting
  useEffect(() => {
    if (activeTab === "vesting" && amount && !vestingDetails) {
      calculateVestingSchedule();
    }
  }, [activeTab, amount, vestingDetails, calculateVestingSchedule]);

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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with Help Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#004581] to-[#018ABD] flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <LockClosed className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#97CBDC] leading-tight">
              Token Lock & Vesting
            </h1>
            <p className="text-sm sm:text-base text-[#97CBDC]/70 leading-tight">
              Secure your tokens with time-release or gradual vesting schedules
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center justify-center cursor-pointer gap-1 px-3 py-1.5 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/50 text-[#97CBDC] hover:bg-[#0a0a20] transition-colors flex-shrink-0 self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm whitespace-nowrap">Help</span>
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
              What's the difference?
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <div className="flex items-center gap-2 mb-2">
                  <LockClosed className="w-5 h-5 text-[#97CBDC]" />
                  <h4 className="font-medium text-[#97CBDC]">Time Lock</h4>
                </div>
                <p className="text-sm text-[#97CBDC]/80">
                  Locks your tokens until a specific date. All tokens will be
                  released at once when the lock period ends.
                  <span className="block mt-2 font-medium">
                    Best for: Liquidity pools, simple token locks
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-5 h-5 text-[#97CBDC]" />
                  <h4 className="font-medium text-[#97CBDC]">Vesting</h4>
                </div>
                <p className="text-sm text-[#97CBDC]/80">
                  Gradually releases tokens over time according to a schedule.
                  Includes an initial release followed by periodic releases.
                  <span className="block mt-2 font-medium">
                    Best for: Team tokens, investor allocations
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#97CBDC]" />
                  <h4 className="font-medium text-[#97CBDC]">
                    Multiple Vesting
                  </h4>
                </div>
                <p className="text-sm text-[#97CBDC]/80">
                  Create vesting schedules for multiple recipients at once. Same
                  vesting parameters applied to all recipients.
                  <span className="block mt-2 font-medium">
                    Best for: Team distributions, airdrops
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-3 text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
            >
              Got it, thanks!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation - Enhanced with Icons and Better Styling */}
      <div className="flex mb-6 bg-[#0a0a20]/40 p-1 rounded-xl">
        <motion.button
          onClick={() => setActiveTab("lock")}
          className={`flex items-center justify-center cursor-pointer gap-2 px-4 py-3 rounded-lg ${
            activeTab === "lock"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "bg-transparent text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all flex-1`}
          whileHover={{ scale: activeTab !== "lock" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          <LockClosed className="w-5 h-5" />
          <span className="font-medium">Time Lock</span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("vesting")}
          className={`flex items-center justify-center cursor-pointer gap-2 px-4 py-3 rounded-lg ${
            activeTab === "vesting"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "bg-transparent text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all flex-1`}
          whileHover={{ scale: activeTab !== "vesting" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="font-medium">Vesting</span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("multiple")}
          className={`flex items-center justify-center cursor-pointer gap-2 px-4 py-3 rounded-lg ${
            activeTab === "multiple"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "bg-transparent text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all flex-1`}
          whileHover={{ scale: activeTab !== "multiple" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Multiple Vesting</span>
        </motion.button>
      </div>

      <motion.div
        className="p-6 rounded-3xl border border-[#475B74]/50 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#018ABD] text-white text-sm font-medium">
                1
              </div>
              <div className="ml-2 text-[#97CBDC] font-medium">
                Token Details
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#97CBDC]/50" />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  tokenInfo
                    ? "bg-[#018ABD] text-white"
                    : "bg-[#0a0a20]/80 text-[#97CBDC]/50"
                } text-sm font-medium`}
              >
                2
              </div>
              <div
                className={`ml-2 ${tokenInfo ? "text-[#97CBDC]" : "text-[#97CBDC]/50"} font-medium`}
              >
                {activeTab === "multiple" ? "Recipients" : "Lock Settings"}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#97CBDC]/50" />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  tokenInfo &&
                  ((activeTab === "lock" && amount && lockUntil) ||
                    (activeTab === "vesting" && amount && tgeDate) ||
                    (activeTab === "multiple" &&
                      recipients.length > 0 &&
                      tgeDate))
                    ? "bg-[#018ABD] text-white"
                    : "bg-[#0a0a20]/80 text-[#97CBDC]/50"
                } text-sm font-medium`}
              >
                3
              </div>
              <div
                className={`ml-2 ${
                  tokenInfo &&
                  ((activeTab === "lock" && amount && lockUntil) ||
                    (activeTab === "vesting" && amount && tgeDate) ||
                    (activeTab === "multiple" &&
                      recipients.length > 0 &&
                      tgeDate))
                    ? "text-[#97CBDC]"
                    : "text-[#97CBDC]/50"
                } font-medium`}
              >
                Review & Submit
              </div>
            </div>
          </div>
          <div className="mt-2 h-1 bg-[#0a0a20]/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
              style={{
                width: tokenInfo
                  ? (activeTab === "lock" && amount && lockUntil) ||
                    (activeTab === "vesting" && amount && tgeDate) ||
                    (activeTab === "multiple" &&
                      recipients.length > 0 &&
                      tgeDate)
                    ? "100%"
                    : "66%"
                  : "33%",
              }}
            ></div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Token Selection and Address Field */}
          <div className="space-y-4">
            {/* Token Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#97CBDC]">
                Select Token <span className="text-red-500">*</span>
              </label>

              {/* Token Selection Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* USDT Option */}
                <motion.div
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    tokenSelection === "usdt"
                      ? "border-[#018ABD] bg-[#018ABD]/10"
                      : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
                  }`}
                  onClick={() => {
                    setTokenSelection("usdt");
                    setTokenAddress(predefinedTokens.usdt.address);
                    setAddressError("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tokenSelection"
                      checked={tokenSelection === "usdt"}
                      onChange={() => {}}
                      className="text-[#018ABD] focus:ring-[#018ABD]/50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#26A17B] to-[#26A17B] flex items-center justify-center text-white text-xs font-bold">
                          T
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#97CBDC]">
                            USDT
                          </div>
                          <div className="text-xs text-[#97CBDC]/70">
                            Tether USD
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* USDC Option */}
                <motion.div
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    tokenSelection === "usdc"
                      ? "border-[#018ABD] bg-[#018ABD]/10"
                      : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
                  }`}
                  onClick={() => {
                    setTokenSelection("usdc");
                    setTokenAddress(predefinedTokens.usdc.address);
                    setAddressError("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tokenSelection"
                      checked={tokenSelection === "usdc"}
                      onChange={() => {}}
                      className="text-[#018ABD] focus:ring-[#018ABD]/50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#2775CA] to-[#2775CA] flex items-center justify-center text-white text-xs font-bold">
                          C
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#97CBDC]">
                            USDC
                          </div>
                          <div className="text-xs text-[#97CBDC]/70">
                            USD Coin
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Custom Token Option */}
                <motion.div
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    tokenSelection === "custom"
                      ? "border-[#018ABD] bg-[#018ABD]/10"
                      : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
                  }`}
                  onClick={() => {
                    setTokenSelection("custom");
                    setTokenAddress("");
                    setAddressError("");
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
            </div>

            {/* Custom Token Address Input - Only show when custom is selected */}
            <AnimatePresence>
              {tokenSelection === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[#97CBDC]">
                      Token or LP Token address{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                        onMouseEnter={() => setShowTooltip("token")}
                        onMouseLeave={() => setShowTooltip("")}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {showTooltip === "token" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                          >
                            Enter the contract address of the token or LP token
                            you want to lock. Make sure it's on the correct
                            network.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      value={tokenAddress}
                      onChange={handleAddressChange}
                      placeholder="0x..."
                      className={`w-full bg-[#0a0a20]/80 border ${
                        addressError
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
                  {addressError && (
                    <p className="text-sm text-red-500">{addressError}</p>
                  )}
                  {tokenError && (
                    <p className="text-sm text-red-500">{tokenError}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Token Address Display - Show for predefined tokens */}
            {tokenSelection !== "custom" && (
              <div className="p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#97CBDC]/70">
                    Selected Token Address:
                  </div>
                  <div className="text-sm text-[#97CBDC] font-mono">
                    {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                  </div>
                </div>
              </div>
            )}

            {/* Token Info Card - Enhanced with better visual design */}
            <AnimatePresence>
              {tokenInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center text-[#97CBDC] font-medium">
                      {tokenInfo.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#97CBDC]">
                        {tokenInfo.name}{" "}
                        {tokenInfo.isLpToken && (
                          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[#018ABD]/20 text-[#018ABD]">
                            LP Token
                          </span>
                        )}
                        {tokenSelection !== "custom" && (
                          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-500">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#97CBDC]/70">
                        {tokenInfo.symbol} • {tokenInfo.decimal} decimals
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

          {/* Amount Field - Only show for single lock modes */}
          {activeTab !== "multiple" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[#97CBDC]">
                  Amount to lock <span className="text-red-500">*</span>
                </label>
                {tokenInfo && (
                  <button
                    type="button"
                    onClick={() => setAmount(tokenInfo.balance)}
                    className="cursor-pointer text-xs px-2 py-1 rounded-md bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                  >
                    Use Max: {Number(tokenInfo.balance).toLocaleString()}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="100000"
                  className={`w-full bg-[#0a0a20]/80 border ${
                    amountError
                      ? "border-red-500"
                      : amount
                        ? "border-[#018ABD]"
                        : "border-[#475B74]/50"
                  } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50`}
                />
                {tokenInfo && amount && !amountError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 text-sm">
                    {tokenInfo.symbol}
                  </div>
                )}
              </div>
              {amountError && (
                <p className="text-sm text-red-500">{amountError}</p>
              )}
            </div>
          )}

          {/* Lock Title Field - Enhanced with better placeholder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#97CBDC]">
                Title (Optional)
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                  onMouseEnter={() => setShowTooltip("title")}
                  onMouseLeave={() => setShowTooltip("")}
                >
                  <Info className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showTooltip === "title" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                    >
                      Give your lock a descriptive name to help you identify it
                      later. If left empty, we'll generate a name automatically.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                tokenInfo
                  ? `${
                      activeTab === "lock"
                        ? "Lock"
                        : activeTab === "multiple"
                          ? "Multiple Vesting"
                          : "Vesting"
                    } for ${tokenInfo.symbol}`
                  : "My Token Lock"
              }
              className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
            />
          </div>

          {/* Custom Owner Toggle - Enhanced with better styling */}
          {activeTab !== "multiple" && (
            <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="custom-owner"
                  checked={useCustomOwner}
                  onChange={(e) => setUseCustomOwner(e.target.checked)}
                  className="rounded border-[#475B74] text-[#018ABD] focus:ring-[#018ABD]/50"
                />
                <label
                  htmlFor="custom-owner"
                  className="text-sm font-medium text-[#97CBDC]"
                >
                  Use different owner address
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                    onMouseEnter={() => setShowTooltip("owner")}
                    onMouseLeave={() => setShowTooltip("")}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showTooltip === "owner" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                      >
                        By default, your connected wallet will be the owner of
                        the lock. Enable this to specify a different address as
                        the owner who can withdraw tokens when the lock expires.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Custom Owner Address Field */}
              <AnimatePresence>
                {useCustomOwner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-[#97CBDC]/70">
                        Owner address
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowOwnerContactPicker(!showOwnerContactPicker)
                        }
                        className="text-[10px] px-2 py-0.5 rounded bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                      >
                        {showOwnerContactPicker ? "Hide" : "Select"}
                      </button>
                    </div>
                    {showOwnerContactPicker && (
                      <div className="mb-2">
                        <ContactSelector
                          placeholder="Search contacts"
                          showEmail
                          onSelect={(contact) => {
                            setOwnerAddress(contact.walletAddress);
                            setOwnerEmail(contact.email || "");
                            setShowOwnerContactPicker(false);
                          }}
                        />
                      </div>
                    )}
                    <input
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                    />
                    <div className="space-y-1">
                      <label className="block text-xs text-[#97CBDC]/70">
                        Owner Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@example.com"
                        className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* LOCK TAB SPECIFIC FIELDS */}
          {activeTab === "lock" && (
            <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
              <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center gap-2">
                <LockClosed className="w-4 h-4" />
                Lock Settings
              </h3>
              {/* Lock Until Field - Enhanced with better date picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#97CBDC]">
                    Lock until <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                      onMouseEnter={() => setShowTooltip("date")}
                      onMouseLeave={() => setShowTooltip("")}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {showTooltip === "date" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                        >
                          Select the date and time when your tokens will be
                          unlockable. This cannot be changed after locking.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={lockUntil}
                    onChange={handleDateChange}
                    min={minDate}
                    className={`w-full bg-[#0a0a20]/80 border ${
                      dateError
                        ? "border-red-500"
                        : lockUntil
                          ? "border-[#018ABD]"
                          : "border-[#475B74]/50"
                    } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
                </div>
                {dateError && (
                  <p className="text-sm text-red-500">{dateError}</p>
                )}
              </div>
              {/* Quick Lock Buttons - Enhanced with better styling */}
              <div className="mt-3">
                <div className="text-xs text-[#97CBDC]/70 mb-2">
                  Quick select:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickLockPeriod(1)}
                    className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                  >
                    1 Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickLockPeriod(3)}
                    className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                  >
                    3 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickLockPeriod(6)}
                    className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                  >
                    6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickLockPeriod(12)}
                    className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                  >
                    1 Year
                  </button>
                </div>
              </div>
              {/* Lock Preview */}
              {lockUntil && amount && !dateError && !amountError && (
                <div className="mt-4 p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
                  <h4 className="text-xs font-medium text-[#97CBDC] mb-2">
                    Lock Preview
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#97CBDC]/70">
                      Tokens will unlock on:
                    </span>
                    <span className="text-[#97CBDC] font-medium">
                      {new Date(lockUntil).toLocaleDateString()} at{" "}
                      {new Date(lockUntil).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VESTING TAB SPECIFIC FIELDS */}
          {(activeTab === "vesting" || activeTab === "multiple") && (
            <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
              <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Vesting Schedule
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  {/* TGE Date Field */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-[#97CBDC]">
                        TGE Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                          onMouseEnter={() => setShowTooltip("tgeDate")}
                          onMouseLeave={() => setShowTooltip("")}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {showTooltip === "tgeDate" && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                            >
                              Token Generation Event date - when the initial
                              token release will occur.
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={tgeDate}
                        onChange={handleTgeDateChange}
                        min={minDate}
                        className={`w-full bg-[#0a0a20]/80 border ${
                          tgeDateError
                            ? "border-red-500"
                            : tgeDate
                              ? "border-[#018ABD]"
                              : "border-[#475B74]/50"
                        } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
                    </div>
                    {tgeDateError && (
                      <p className="text-sm text-red-500">{tgeDateError}</p>
                    )}
                  </div>
                  {/* Quick TGE Date Buttons */}
                  <div className="mb-4">
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
                  {/* TGE BPS Field */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <label className="block text-sm font-medium text-[#97CBDC]">
                          Initial Release %{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                            onMouseEnter={() => setShowTooltip("tgeBps")}
                            onMouseLeave={() => setShowTooltip("")}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {showTooltip === "tgeBps" && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                              >
                                Percentage of tokens released immediately at TGE
                                (0-100%).
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
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
                    {tgeBpsError && (
                      <p className="text-sm text-red-500">{tgeBpsError}</p>
                    )}
                  </div>
                  {/* Cycle Field */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <label className="block text-sm font-medium text-[#97CBDC]">
                          Release Cycle <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                            onMouseEnter={() => setShowTooltip("cycle")}
                            onMouseLeave={() => setShowTooltip("")}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {showTooltip === "cycle" && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                              >
                                How often tokens are released after TGE.
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
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
                    {cycleError && (
                      <p className="text-sm text-red-500">{cycleError}</p>
                    )}
                  </div>
                  {/* Quick Cycle Buttons */}
                  <div className="mb-4">
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
                  {/* Cycle BPS Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <label className="block text-sm font-medium text-[#97CBDC]">
                          Release Per Cycle %{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                            onMouseEnter={() => setShowTooltip("cycleBps")}
                            onMouseLeave={() => setShowTooltip("")}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {showTooltip === "cycleBps" && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 z-10 w-64 p-3 text-xs bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg text-[#97CBDC]/90"
                              >
                                Percentage of tokens released in each cycle
                                (0-100%).
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
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
                    {cycleBpsError && (
                      <p className="text-sm text-red-500">{cycleBpsError}</p>
                    )}
                  </div>
                  {/* Quick Cycle BPS Buttons */}
                  <div className="mt-3">
                    <div className="text-xs text-[#97CBDC]/70 mb-2">
                      Quick select:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCycleBps("500");
                          setCycleBpsError("");
                        }}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        5%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCycleBps("1000");
                          setCycleBpsError("");
                        }}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCycleBps("2000");
                          setCycleBpsError("");
                        }}
                        className="cursor-pointer px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors"
                      >
                        20%
                      </button>
                    </div>
                  </div>
                </div>
                {/* Vesting Schedule Preview - Enhanced with better visualization */}
                <div>
                  {vestingDetails &&
                    amount &&
                    tgeBps &&
                    cycleBps &&
                    activeTab === "vesting" && (
                      <div className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl h-full">
                        <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" />
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
                              <Percent className="w-3 h-3" />
                              Initial Release:
                            </div>
                            <div className="text-[#97CBDC] font-medium">
                              {vestingDetails.initialRelease.toLocaleString()}{" "}
                              {tokenInfo?.symbol} (
                              {(Number(tgeBps) / 100).toFixed(2)}%)
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
                              {vestingDetails.cycleReleaseAmount.toLocaleString()}{" "}
                              {tokenInfo?.symbol} (
                              {(Number(cycleBps) / 100).toFixed(2)}%)
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg bg-[#0a0a20]/50">
                            <div className="flex items-center gap-1 text-[#97CBDC]/70">
                              <BarChart2 className="w-3 h-3" />
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
                  {/* Multiple Vesting Summary */}
                  {activeTab === "multiple" &&
                    recipients.length > 0 &&
                    tgeBps &&
                    cycleBps && (
                      <div className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl h-full">
                        <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Multiple Vesting Summary
                        </h3>
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
                              <BarChart2 className="w-3 h-3" />
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
                        </div>
                      </div>
                    )}
                  {(!vestingDetails || !amount || !tgeBps || !cycleBps) &&
                    activeTab === "vesting" && (
                      <div className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/30 rounded-xl h-full flex items-center justify-center">
                        <div className="text-center text-[#97CBDC]/70">
                          <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>
                            Fill in all fields to see the vesting schedule
                            preview
                          </p>
                        </div>
                      </div>
                    )}
                  {activeTab === "multiple" && recipients.length === 0 && (
                    <div className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/30 rounded-xl h-full flex items-center justify-center">
                      <div className="text-center text-[#97CBDC]/70">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Add recipients to see the summary</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MULTIPLE VESTING TAB SPECIFIC FIELDS */}
          {activeTab === "multiple" && (
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

              {recipientsError && (
                <p className="text-sm text-red-500 mt-2">{recipientsError}</p>
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
          )}

          {/* Review & Submit Section */}
          {tokenInfo &&
            ((activeTab === "lock" &&
              amount &&
              lockUntil &&
              !dateError &&
              !amountError) ||
              (activeTab === "vesting" &&
                amount &&
                tgeDate &&
                !tgeDateError &&
                !amountError &&
                tgeBps &&
                !tgeBpsError &&
                cycle &&
                !cycleError &&
                cycleBps &&
                !cycleBpsError) ||
              (activeTab === "multiple" &&
                recipients.length > 0 &&
                tgeDate &&
                !tgeDateError &&
                !recipientsError &&
                tgeBps &&
                !tgeBpsError &&
                cycle &&
                !cycleError &&
                cycleBps &&
                !cycleBpsError)) && (
              <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
                <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Review & Submit
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-[#97CBDC]/70">Token:</div>
                      <div className="text-[#97CBDC] font-medium text-right">
                        {tokenInfo.name} ({tokenInfo.symbol})
                      </div>
                      <div className="text-[#97CBDC]/70">
                        {activeTab === "multiple" ? "Total Amount:" : "Amount:"}
                      </div>
                      <div className="text-[#97CBDC] font-medium text-right">
                        {activeTab === "multiple"
                          ? `${getTotalAmount().toLocaleString()} ${tokenInfo.symbol}`
                          : `${Number(amount).toLocaleString()} ${tokenInfo.symbol}`}
                      </div>
                      {activeTab === "multiple" && (
                        <>
                          <div className="text-[#97CBDC]/70">Recipients:</div>
                          <div className="text-[#97CBDC] font-medium text-right">
                            {recipients.length}
                          </div>
                        </>
                      )}
                      <div className="text-[#97CBDC]/70">Lock Type:</div>
                      <div className="text-[#97CBDC] font-medium text-right">
                        {activeTab === "lock"
                          ? "Time Lock"
                          : activeTab === "multiple"
                            ? "Multiple Vesting"
                            : "Vesting Schedule"}
                      </div>
                      {activeTab === "lock" ? (
                        <>
                          <div className="text-[#97CBDC]/70">Unlock Date:</div>
                          <div className="text-[#97CBDC] font-medium text-right">
                            {new Date(lockUntil).toLocaleDateString()} at{" "}
                            {new Date(lockUntil).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[#97CBDC]/70">TGE Date:</div>
                          <div className="text-[#97CBDC] font-medium text-right">
                            {new Date(tgeDate).toLocaleDateString()} at{" "}
                            {new Date(tgeDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-[#97CBDC]/70">
                            Initial Release:
                          </div>
                          <div className="text-[#97CBDC] font-medium text-right">
                            {(Number(tgeBps) / 100).toFixed(2)}%
                          </div>
                          <div className="text-[#97CBDC]/70">
                            Release Cycle:
                          </div>
                          <div className="text-[#97CBDC] font-medium text-right">
                            {formatCycleDuration(Number(cycle))}
                          </div>
                          <div className="text-[#97CBDC]/70">Per Cycle:</div>
                          <div className="text-[#97CBDC] font-medium text-right">
                            {(Number(cycleBps) / 100).toFixed(2)}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Warning Message */}
                  <div className="p-3 rounded-lg bg-[#0a0a20]/80 border border-yellow-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#97CBDC]/80">
                        <span className="font-medium text-yellow-500">
                          Important:
                        </span>{" "}
                        This action cannot be undone. Tokens will be locked
                        according to the schedule and can only be withdrawn when
                        the lock period ends.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Submit Button - Enhanced with better styling and feedback */}
          <div className="flex justify-center mt-8">
            <motion.button
              onClick={
                activeTab === "lock"
                  ? handleLockTokens
                  : activeTab === "vesting"
                    ? handleVestingLock
                    : handleMultipleVestingLock
              }
              disabled={
                isProcessing ||
                !tokenAddress ||
                (activeTab === "lock" &&
                  (!amount || !lockUntil || dateError || amountError)) ||
                (activeTab === "vesting" &&
                  (!amount ||
                    !tgeDate ||
                    !tgeBps ||
                    !cycle ||
                    !cycleBps ||
                    tgeDateError ||
                    tgeBpsError ||
                    cycleError ||
                    cycleBpsError ||
                    amountError)) ||
                (activeTab === "multiple" &&
                  (!tgeDate ||
                    !tgeBps ||
                    !cycle ||
                    !cycleBps ||
                    tgeDateError ||
                    tgeBpsError ||
                    cycleError ||
                    cycleBpsError ||
                    recipientsError ||
                    recipients.length === 0)) ||
                addressError
              }
              className="cursor-pointer px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] transition-all duration-300 shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isApproving ? (
                <span className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Approving...
                </span>
              ) : isLocking ? (
                <span className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {activeTab === "lock"
                    ? "Locking Tokens..."
                    : activeTab === "multiple"
                      ? "Creating Multiple Vesting Locks..."
                      : "Creating Vesting Schedule..."}
                </span>
              ) : (
                `${
                  tokenInfo
                    ? `${
                        activeTab === "multiple"
                          ? `Create ${recipients.length} Vesting Locks`
                          : `Lock ${tokenInfo.symbol} Tokens`
                      }`
                    : "Lock Tokens"
                }`
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Update the success modal to use the real transaction data */}
      <TokenLockSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        tokenAddress={successData?.tokenAddress || ""}
        amount={successData?.amount || ""}
        lockUntil={successData?.lockUntil || successData?.tgeDate || ""}
        tokenInfo={successData?.tokenInfo || null}
        txHash={successData?.txHash || ""}
        isLpToken={successData?.isLpToken || false}
        isVesting={successData?.isVesting || false}
        isMultiple={successData?.isMultiple || false}
        recipients={successData?.recipients || 0}
        vestingDetails={
          successData?.isVesting
            ? {
                tgeBps: Number(successData?.tgeBps || 0),
                cycle: Number(successData?.cycle || 0),
                cycleBps: Number(successData?.cycleBps || 0),
                totalCycles: calculateVestingDetails()?.totalCycles || 0,
              }
            : null
        }
      />
    </div>
  );
}
