import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockIcon as LockClosed,
  Unlock,
  ExternalLink,
  Search,
  ChevronDown,
  Clock,
  Calendar,
  Loader2,
  X,
  AlertCircle,
  BarChart2,
  Percent,
  RefreshCw,
  Eye,
  CheckCircle,
  Shield,
  ListFilter,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi } from "viem";
import { readContract } from "@wagmi/core";
import { useTokenLock } from "@/hooks/useTokenLock";
import { toast } from "react-toastify";
import { config } from "@/lib/config";

// Loading skeleton components
const TokenLockCardSkeleton = () => (
  <div className="bg-[#0a0a20]/60 backdrop-blur-sm border border-[#475B74]/30 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 border-b border-[#475B74]/30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1D2538]/70"></div>
        <div>
          <div className="h-4 w-20 bg-[#1D2538]/70 rounded mb-2"></div>
          <div className="h-3 w-16 bg-[#1D2538]/70 rounded"></div>
        </div>
      </div>
      <div className="h-6 w-20 bg-[#1D2538]/70 rounded-full"></div>
    </div>
    <div className="p-4">
      <div className="mb-4">
        <div className="h-3 w-16 bg-[#1D2538]/70 rounded mb-2"></div>
        <div className="h-6 w-24 bg-[#1D2538]/70 rounded"></div>
      </div>
      <div className="mb-4">
        <div className="h-3 w-24 bg-[#1D2538]/70 rounded mb-2"></div>
        <div className="h-2 bg-[#1D2538]/70 rounded-full"></div>
        <div className="h-3 w-32 bg-[#1D2538]/70 rounded mt-2"></div>
      </div>
      <div className="mt-4">
        <div className="h-10 bg-[#1D2538]/70 rounded-lg"></div>
      </div>
    </div>
  </div>
);

const TokenLockListItemSkeleton = () => (
  <tr className="border-b border-[#475B74]/30 animate-pulse">
    <td className="px-4 py-4">
      <div className="flex items-center">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1D2538]/70"></div>
        <div className="ml-3">
          <div className="h-4 w-20 bg-[#1D2538]/70 rounded mb-2"></div>
          <div className="h-3 w-16 bg-[#1D2538]/70 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 w-16 bg-[#1D2538]/70 rounded mb-2"></div>
      <div className="h-3 w-24 bg-[#1D2538]/70 rounded"></div>
    </td>
    <td className="px-4 py-4 hidden md:table-cell">
      <div className="h-4 w-32 bg-[#1D2538]/70 rounded mb-2"></div>
      <div className="h-3 w-24 bg-[#1D2538]/70 rounded"></div>
    </td>
    <td className="px-4 py-4 text-right">
      <div className="h-8 w-20 bg-[#1D2538]/70 rounded-xl ml-auto"></div>
    </td>
  </tr>
);

// Empty state component
const EmptyState = ({ searchTerm, type }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center mb-4">
      <LockClosed className="w-8 h-8 text-[#97CBDC]/50" />
    </div>
    <p className="text-[#97CBDC] mb-2 text-lg font-medium">No locks found</p>
    <p className="text-sm text-[#97CBDC]/70 max-w-md text-center">
      {searchTerm
        ? "Try a different search term or clear the filters"
        : `Create your first ${type === "lp" ? "LP" : "token"} lock to secure your tokens`}
    </p>
    <button className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-xl transition-colors font-medium shadow-lg shadow-[#004581]/20">
      Create Lock
    </button>
  </div>
);

export default function TokenLockList({ type = "token" }) {
  const { address, chain } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [locks, setLocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [unlockableOnly, setUnlockableOnly] = useState(false);
  const [selectedLock, setSelectedLock] = useState(null);
  const [showLockDetails, setShowLockDetails] = useState(false);
  const [unlockingId, setUnlockingId] = useState(null);
  const [unlockError, setUnlockError] = useState(null);
  const [tokenInfoCache, setTokenInfoCache] = useState({});
  const [withdrawableAmounts, setWithdrawableAmounts] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [failedTokenAddresses, setFailedTokenAddresses] = useState(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  const { getUserLocks, unlockToken, getWithdrawableTokens, isProcessing } =
    useTokenLock();

  // Load locks on initial render and tab change
  useEffect(() => {
    if (address) {
      fetchLocks();
      setIsInitialLoad(false);
    }
  }, [address, activeTab, chainId]);

  // Auto-refresh every 2 minutes when the user has unlockable tokens
  useEffect(() => {
    // Check if we have any unlockable tokens
    const hasUnlockableTokens = locks.some((lock) => lock.isUnlockable);

    // Clear existing interval
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
    }

    // Set up auto-refresh only if there are unlockable tokens
    if (hasUnlockableTokens && address) {
      const interval = setInterval(() => {
        // Only refresh if it's been at least 2 minutes since last manual refresh
        if (Date.now() - lastRefreshTime > 120000) {
          fetchLocks(true); // silent refresh
        }
      }, 120000); // 2 minutes

      setAutoRefreshInterval(interval);
    }

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [locks, address]);

  // Fetch token info (name, symbol, decimals)
  const fetchTokenInfo = useCallback(
    async (tokenAddress) => {
      if (tokenInfoCache[tokenAddress]) {
        return tokenInfoCache[tokenAddress];
      }

      // If we've already failed to fetch this token, don't try again
      if (failedTokenAddresses.has(tokenAddress)) {
        return { name: "Unknown Token", symbol: "???", decimals: 18 };
      }

      try {
        const [name, symbol, decimals] = await Promise.all([
          readContract(config, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "name",
          }),
          readContract(config, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "symbol",
          }),
          readContract(config, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "decimals",
          }),
        ]);

        const tokenInfo = { name, symbol, decimals };
        setTokenInfoCache((prev) => ({ ...prev, [tokenAddress]: tokenInfo }));
        return tokenInfo;
      } catch (error) {
        console.error(`Error fetching token info for ${tokenAddress}:`, error);
        // Track failed token addresses to avoid repeated failed requests
        setFailedTokenAddresses((prev) => new Set([...prev, tokenAddress]));
        return { name: "Unknown Token", symbol: "???", decimals: 18 };
      }
    },
    [tokenInfoCache, failedTokenAddresses]
  );

  // Fetch withdrawable amount for vesting locks
  const fetchWithdrawableAmount = useCallback(
    async (lockId) => {
      try {
        const withdrawable = await getWithdrawableTokens(lockId);
        setWithdrawableAmounts((prev) => ({
          ...prev,
          [lockId]: withdrawable,
        }));
        return withdrawable;
      } catch (error) {
        console.error(
          `Error fetching withdrawable amount for lock ${lockId}:`,
          error
        );
        return BigInt(0);
      }
    },
    [getWithdrawableTokens]
  );

  // Process a single lock to add token info and other computed properties
  const processLock = useCallback(
    async (lock) => {
      try {
        const tokenInfo = await fetchTokenInfo(lock.token);

        // For vesting locks, fetch withdrawable amount
        let withdrawable = BigInt(0);
        if (lock.tgeBps > 0) {
          withdrawable = await fetchWithdrawableAmount(lock.id);
        }

        // Convert BigInt values to strings for display
        const formattedAmount = formatUnits(lock.amount, tokenInfo.decimals);
        const formattedUnlockedAmount = formatUnits(
          lock.unlockedAmount,
          tokenInfo.decimals
        );
        const formattedWithdrawable =
          withdrawable > 0
            ? formatUnits(withdrawable, tokenInfo.decimals)
            : "0";

        return {
          ...lock,
          tokenName: tokenInfo.name,
          tokenSymbol: tokenInfo.symbol,
          tokenDecimals: tokenInfo.decimals,
          formattedAmount,
          formattedUnlockedAmount,
          withdrawableAmount: formattedWithdrawable,
          lockUntil: new Date(Number(lock.tgeDate) * 1000),
          createdAt: new Date(Number(lock.lockDate) * 1000),
          isVesting: lock.tgeBps > 0,
          isUnlockable:
            lock.tgeBps > 0
              ? withdrawable > 0
              : Date.now() / 1000 > Number(lock.tgeDate) &&
                lock.unlockedAmount < lock.amount,
        };
      } catch (error) {
        console.error("Error processing lock:", error);
        // Return a minimal processed lock with defaults
        return {
          ...lock,
          tokenName: "Error Loading",
          tokenSymbol: "ERR",
          tokenDecimals: 18,
          formattedAmount: "0",
          formattedUnlockedAmount: "0",
          withdrawableAmount: "0",
          lockUntil: new Date(Number(lock.tgeDate) * 1000),
          createdAt: new Date(Number(lock.lockDate) * 1000),
          isVesting: lock.tgeBps > 0,
          isUnlockable: false,
          hasError: true,
        };
      }
    },
    [fetchTokenInfo, fetchWithdrawableAmount]
  );

  // Batch process locks to prevent UI freezes
  const batchProcessLocks = useCallback(
    async (locks, batchSize = 5) => {
      const results = [];
      for (let i = 0; i < locks.length; i += batchSize) {
        const batch = locks.slice(i, i + batchSize);
        const processed = await Promise.all(
          batch.map((lock) => processLock(lock))
        );
        results.push(...processed);

        // Update the state incrementally as batches complete
        if (results.length > 0 && !isInitialLoad) {
          setLocks((prevLocks) => {
            const updatedLocks = [...prevLocks];
            results.forEach((result) => {
              const index = updatedLocks.findIndex(
                (lock) => lock.id.toString() === result.id.toString()
              );
              if (index >= 0) {
                updatedLocks[index] = result;
              } else {
                updatedLocks.push(result);
              }
            });
            return updatedLocks;
          });
        }
      }
      return results;
    },
    [processLock, isInitialLoad]
  );

  // Fetch and process locks
  const fetchLocks = useCallback(
    async (silentRefresh = false) => {
      if (!silentRefresh) {
        setIsLoading(true);
      }

      try {
        const { normalLocks, lpLocks } = await getUserLocks();

        // Filter by type (token or LP)
        const filteredLocks = type === "lp" ? lpLocks : normalLocks;

        // Process locks in batches to prevent UI freezes
        const processedLocks = await batchProcessLocks(filteredLocks);

        // Check if any locks have been unlocked recently (in case the on-chain state changed)
        if (processedLocks.length > 0) {
          // Filter out any locks that have been fully unlocked
          const finalLocks = processedLocks.filter((lock) => {
            // Keep locks that haven't been fully unlocked
            return BigInt(lock.unlockedAmount) < BigInt(lock.amount);
          });

          // Apply sorting
          let sortedLocks = [...finalLocks];
          switch (sortBy) {
            case "newest":
              sortedLocks.sort((a, b) => b.createdAt - a.createdAt);
              break;
            case "oldest":
              sortedLocks.sort((a, b) => a.createdAt - b.createdAt);
              break;
            case "unlockSoonest":
              sortedLocks.sort((a, b) => a.lockUntil - b.lockUntil);
              break;
            case "unlockLatest":
              sortedLocks.sort((a, b) => b.lockUntil - a.lockUntil);
              break;
            case "amountHighest":
              sortedLocks.sort((a, b) => BigInt(b.amount) - BigInt(a.amount));
              break;
            case "amountLowest":
              sortedLocks.sort((a, b) => BigInt(a.amount) - BigInt(b.amount));
              break;
            default:
              sortedLocks.sort((a, b) => b.createdAt - a.createdAt);
          }

          // Apply unlockable filter if needed
          if (unlockableOnly) {
            sortedLocks = sortedLocks.filter((lock) => lock.isUnlockable);
          }

          setLocks(sortedLocks);

          // Check if we have new unlockable tokens and notify the user
          const newUnlockableLocks = sortedLocks.filter(
            (lock) =>
              lock.isUnlockable &&
              !silentRefresh &&
              // For vesting locks, only notify if there's an amount to withdraw
              (!lock.isVesting || Number(lock.withdrawableAmount) > 0)
          );

          if (newUnlockableLocks.length > 0 && !isInitialLoad) {
            toast.success(
              `You have ${newUnlockableLocks.length} token ${
                newUnlockableLocks.length === 1 ? "lock" : "locks"
              } ready to unlock`,
              {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
              }
            );
          }
        } else {
          setLocks([]);
        }
      } catch (error) {
        console.error("Error fetching locks:", error);
        if (!silentRefresh) {
          setUnlockError("Failed to load token locks. Please try again.");
        }
      } finally {
        if (!silentRefresh) {
          setIsLoading(false);
        }
        setRefreshing(false);
        setLastRefreshTime(Date.now());
      }
    },
    [
      getUserLocks,
      batchProcessLocks,
      type,
      sortBy,
      unlockableOnly,
      address,
      isInitialLoad,
    ]
  );

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter locks by search term
  const filteredLocks = locks.filter((lock) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (lock.tokenName && lock.tokenName.toLowerCase().includes(searchLower)) ||
      (lock.tokenSymbol &&
        lock.tokenSymbol.toLowerCase().includes(searchLower)) ||
      lock.token.toLowerCase().includes(searchLower) ||
      (lock.description && lock.description.toLowerCase().includes(searchLower))
    );
  });

  // Handle unlock
  const handleUnlock = async (id) => {
    setUnlockingId(id);
    setUnlockError(null);

    try {
      const txHash = await unlockToken(id);
      if (txHash) {
        // Show success message
        toast.success("Your tokens have been successfully unlocked", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });

        // Refresh the lock list after a successful unlock
        setTimeout(() => {
          fetchLocks();
        }, 3000); // Give the blockchain time to process the transaction
      } else {
        setUnlockError("Transaction failed. Please try again.");
      }
    } catch (error) {
      console.error("Error unlocking tokens:", error);
      setUnlockError(error.message || "Transaction failed. Please try again.");
    } finally {
      setUnlockingId(null);
    }
  };

  // View lock details
  const viewLockDetails = (lock) => {
    setSelectedLock(lock);
    setShowLockDetails(true);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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

  // Calculate vesting progress percentage
  const calculateVestingProgress = (lock) => {
    if (!lock.isVesting) return 0;

    const now = Date.now() / 1000;
    const tgeDate = Number(lock.tgeDate);
    const totalAmount = BigInt(lock.amount);
    const unlockedAmount = BigInt(lock.unlockedAmount);

    if (now < tgeDate) return 0;

    // If fully unlocked
    if (unlockedAmount >= totalAmount) return 100;

    // Calculate based on time passed
    const tgeBps = Number(lock.tgeBps);
    const cycleBps = Number(lock.cycleBps);
    const cycle = Number(lock.cycle);

    const tgeAmount = (BigInt(totalAmount) * BigInt(tgeBps)) / BigInt(10000);
    const cycleAmount =
      (BigInt(totalAmount) * BigInt(cycleBps)) / BigInt(10000);

    const timePassedSinceTge = now - tgeDate;
    const cyclesPassed = Math.floor(timePassedSinceTge / cycle);

    const expectedUnlocked = tgeAmount + cycleAmount * BigInt(cyclesPassed);
    const cappedUnlocked =
      expectedUnlocked > totalAmount ? totalAmount : expectedUnlocked;

    return Number((cappedUnlocked * BigInt(100)) / totalAmount);
  };

  // Calculate time until next vesting release
  const calculateTimeUntilNextRelease = (lock) => {
    if (!lock.isVesting) return null;

    const now = Math.floor(Date.now() / 1000);
    const tgeDate = Number(lock.tgeDate);
    const cycle = Number(lock.cycle);

    // If TGE hasn't happened yet
    if (now < tgeDate) {
      return formatDistanceToNow(new Date(tgeDate * 1000), {
        addSuffix: true,
      });
    }

    // Calculate time since TGE
    const timeSinceTge = now - tgeDate;
    const cyclesPassed = Math.floor(timeSinceTge / cycle);
    const nextReleaseTime = tgeDate + (cyclesPassed + 1) * cycle;

    // If fully vested, return null
    if (calculateVestingProgress(lock) >= 100) {
      return null;
    }

    return formatDistanceToNow(new Date(nextReleaseTime * 1000), {
      addSuffix: true,
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLocks();
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Get explorer URL based on chain
  const getExplorerUrl = useCallback(() => {
    if (chain?.blockExplorers?.default.url) {
      return chain.blockExplorers.default.url;
    }

    const explorers = {
      1: "https://etherscan.io",
      56: "https://bscscan.com",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      8453: "https://basescan.org",
      // Add more chains as needed
    };

    return explorers[chainId] || "https://etherscan.io";
  }, [chainId, chain]);

  // Get time remaining in a more readable format
  const getTimeRemaining = (date) => {
    const now = new Date();
    if (date <= now) {
      return "Unlockable now";
    }

    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? "s" : ""} left`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} left`;
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""} left`;
    }
  };

  // Format number with friendly abbreviations (k, M, G, T, P, E)
  const abbreviateNumber = (number, decimals = 2) => {
    if (isNaN(number)) {
      return Number.NaN;
    }

    const abbreviations = ["", "K", "M", "B", "T"];
    let index = 0;

    while (Math.abs(number) >= 1000 && index < abbreviations.length - 1) {
      number /= 1000;
      index++;
    }

    return `${Number(number.toFixed(decimals)).toLocaleString()}${abbreviations[index]}`;
  };

  // Format token amount for display
  const formatTokenAmount = (lock) => {
    if (!lock) return "0";

    // If we have a formatted amount, use it
    if (lock.amount && !lock.hasError) {
      const numericAmount = Number(lock.amount);
      return abbreviateNumber(numericAmount);
    }

    // Otherwise, try to format the raw amount
    try {
      // If we have tokenDecimals, use them
      if (lock.tokenDecimals) {
        const formattedValue = Number(
          formatUnits(lock.amount, lock.tokenDecimals)
        );
        return abbreviateNumber(formattedValue);
      }

      // Fallback to displaying the raw amount
      return abbreviateNumber(Number(lock.amount).toLocaleString());
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return Number(lock.amount).toString();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#97CBDC] to-[#018ABD]">
          {type === "lp" ? "LP Token Locks" : "Token Locks"}
        </h1>
        <p className="text-[#97CBDC]/70 mt-2">
          Manage your {type === "lp" ? "liquidity pool" : "token"} locks and
          vesting schedules
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="mb-6 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/50 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by token name, symbol or address..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-[#0a0a20]/40 backdrop-blur-sm border border-[#475B74]/30 rounded-xl py-3 pl-10 pr-4 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 cursor-pointer top-1/2 transform -translate-y-1/2 text-[#97CBDC]/50 hover:text-[#97CBDC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center cursor-pointer gap-1 px-3 py-2 bg-[#0a0a20]/40 backdrop-blur-sm border border-[#475B74]/30 rounded-xl text-[#97CBDC] hover:text-white transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </motion.button>
          <div className="flex rounded-xl overflow-hidden border border-[#475B74]/30">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex cursor-pointer items-center justify-center w-10 h-10 ${
                viewMode === "grid"
                  ? "bg-[#018ABD]/20 text-[#97CBDC]"
                  : "bg-[#0a0a20]/40 text-[#97CBDC]/50"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex cursor-pointer items-center justify-center w-10 h-10 ${
                viewMode === "list"
                  ? "bg-[#018ABD]/20 text-[#97CBDC]"
                  : "bg-[#0a0a20]/40 text-[#97CBDC]/50"
              }`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <motion.button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-[#0a0a20]/40 backdrop-blur-sm border border-[#475B74]/30 rounded-xl text-[#97CBDC] hover:text-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ListFilter className="w-5 h-5" />
              <span>Filter & Sort</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </motion.button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  className="absolute right-0 z-10 mt-2 w-64 p-4 bg-[#0a0a20]/90 backdrop-blur-sm border border-[#475B74]/30 rounded-xl shadow-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-[#1D2538]/60 border border-[#475B74]/30 rounded-lg p-2 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="unlockSoonest">
                          Unlock Date (Soonest)
                        </option>
                        <option value="unlockLatest">
                          Unlock Date (Latest)
                        </option>
                        <option value="amountHighest">Amount (Highest)</option>
                        <option value="amountLowest">Amount (Lowest)</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="unlockable-only"
                        checked={unlockableOnly}
                        onChange={(e) => setUnlockableOnly(e.target.checked)}
                        className="rounded border-[#475B74] text-[#018ABD] focus:ring-[#018ABD]/50"
                      />
                      <label
                        htmlFor="unlockable-only"
                        className="ml-2 text-sm text-[#97CBDC]"
                      >
                        Show unlockable only
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        setFilterOpen(false);
                        fetchLocks();
                      }}
                      className="w-full py-2 bg-gradient-to-r cursor-pointer from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-lg transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {unlockError && (
          <motion.div
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-500 font-medium">Unlock Failed</p>
              <p className="text-red-400 text-sm">{unlockError}</p>
            </div>
            <button
              onClick={() => setUnlockError(null)}
              className="ml-auto cursor-pointer text-red-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock List - Grid View */}
      {viewMode === "grid" && (
        <motion.div
          className="rounded-2xl border border-[#475B74]/30 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm overflow-hidden shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {isLoading ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {[...Array(6)].map((_, index) => (
                <motion.div key={index} variants={item}>
                  <TokenLockCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredLocks.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredLocks.map((lock) => (
                <motion.div
                  key={lock.id.toString()}
                  variants={item}
                  className="bg-[#0a0a20]/60 backdrop-blur-sm border border-[#475B74]/30 rounded-xl overflow-hidden hover:border-[#018ABD]/50 transition-colors cursor-pointer group"
                  onClick={() => viewLockDetails(lock)}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#475B74]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#97CBDC]">
                          {lock.tokenSymbol?.slice(0, 2) || "??"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-[#97CBDC]">
                            {lock.tokenSymbol || "???"}
                          </p>
                          {lock.isVesting && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-[#018ABD]/20 text-[#018ABD]">
                              Vesting
                            </span>
                          )}
                        </div>
                        <a
                          href={`${getExplorerUrl()}/token/${lock.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#018ABD] hover:text-[#97CBDC] flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatAddress(lock.token)}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {lock.isUnlockable ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Unlockable</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#018ABD]/20 text-[#018ABD]">
                          <LockClosed className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-xs text-[#97CBDC]/70 mb-1">
                        Amount
                      </div>
                      <div className="text-lg font-medium text-[#97CBDC]">
                        {formatTokenAmount(lock)}
                      </div>
                    </div>

                    {/* Vesting Progress or Lock Time */}
                    {lock.isVesting ? (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#97CBDC]/70 mb-1">
                          <span>Vesting Progress</span>
                          <span>{calculateVestingProgress(lock)}%</span>
                        </div>
                        <div className="h-2 bg-[#0a0a20] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
                            style={{
                              width: `${calculateVestingProgress(lock)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="mt-2 text-xs text-[#97CBDC]/70">
                          <span>
                            {Number(lock.withdrawableAmount) > 0
                              ? `${Number(
                                  lock.withdrawableAmount
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: 4,
                                })} available to claim`
                              : getTimeRemaining(lock.lockUntil)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="text-xs text-[#97CBDC]/70 mb-1">
                          Unlock Date
                        </div>
                        <div className="text-sm text-[#97CBDC]">
                          {formatDate(lock.lockUntil)}
                        </div>
                        <div className="mt-1 text-xs text-[#97CBDC]/70 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(lock.lockUntil)}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-4">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lock.isUnlockable) {
                            handleUnlock(lock.id);
                          }
                        }}
                        disabled={
                          !lock.isUnlockable ||
                          unlockingId === lock.id ||
                          isProcessing
                        }
                        className={`w-full py-2 cursor-pointer rounded-lg flex items-center justify-center gap-2 text-sm font-medium ${
                          lock.isUnlockable &&
                          unlockingId !== lock.id &&
                          !isProcessing
                            ? "bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white shadow-md"
                            : "bg-[#0a0a20]/80 border border-[#475B74]/50 text-[#97CBDC]/50"
                        }`}
                        whileHover={
                          lock.isUnlockable &&
                          unlockingId !== lock.id &&
                          !isProcessing
                            ? { scale: 1.02 }
                            : {}
                        }
                        whileTap={
                          lock.isUnlockable &&
                          unlockingId !== lock.id &&
                          !isProcessing
                            ? { scale: 0.98 }
                            : {}
                        }
                      >
                        {unlockingId === lock.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Unlocking...
                          </>
                        ) : lock.isUnlockable ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            {lock.isVesting ? "Claim Tokens" : "Unlock Tokens"}
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            View Details
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState searchTerm={searchTerm} type={type} />
          )}
        </motion.div>
      )}

      {/* Lock List - List View */}
      {viewMode === "list" && (
        <motion.div
          className="rounded-2xl border border-[#475B74]/30 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-[#0a0a20]/60 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#1D2538]/70"></div>
                        <div className="ml-3">
                          <div className="h-4 w-20 bg-[#1D2538]/70 rounded mb-2"></div>
                          <div className="h-3 w-16 bg-[#1D2538]/70 rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-[#1D2538]/70 rounded"></div>
                        <div className="h-8 w-20 bg-[#1D2538]/70 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLocks.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {filteredLocks.map((lock) => (
                  <motion.div
                    key={lock.id.toString()}
                    variants={item}
                    className="bg-[#0a0a20]/60 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-4 hover:border-[#018ABD]/50 transition-colors cursor-pointer"
                    onClick={() => viewLockDetails(lock)}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-[#97CBDC]">
                            {lock.tokenSymbol?.slice(0, 2) || "??"}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-[#97CBDC]">
                              {lock.tokenSymbol || "???"}
                            </p>
                            {lock.isVesting && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-[#018ABD]/20 text-[#018ABD]">
                                Vesting
                              </span>
                            )}
                          </div>
                          <a
                            href={`${getExplorerUrl()}/token/${lock.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#018ABD] hover:text-[#97CBDC] flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {formatAddress(lock.token)}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 ml-13 sm:ml-0">
                        <div className="flex flex-col">
                          <span className="text-xs text-[#97CBDC]/70">
                            Amount
                          </span>
                          <span className="text-sm font-medium text-[#97CBDC]">
                            {formatTokenAmount(lock)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-[#97CBDC]/70">
                            Unlock
                          </span>
                          <span className="text-sm text-[#97CBDC]">
                            {lock.isUnlockable ? (
                              <span className="text-green-400">
                                {lock.isVesting ? "Available" : "Now"}
                              </span>
                            ) : (
                              getTimeRemaining(lock.lockUntil)
                            )}
                          </span>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (lock.isUnlockable) {
                              handleUnlock(lock.id);
                            }
                          }}
                          disabled={
                            !lock.isUnlockable ||
                            unlockingId === lock.id ||
                            isProcessing
                          }
                          className={`px-3 cursor-pointer py-1.5 h-8 text-xs font-medium rounded-xl flex items-center ${
                            lock.isUnlockable &&
                            unlockingId !== lock.id &&
                            !isProcessing
                              ? "bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white shadow-lg shadow-[#004581]/20"
                              : "bg-[#0a0a20]/80 border border-[#475B74]/50 text-[#97CBDC]/50"
                          }`}
                          whileHover={
                            lock.isUnlockable &&
                            unlockingId !== lock.id &&
                            !isProcessing
                              ? { scale: 1.05 }
                              : {}
                          }
                          whileTap={
                            lock.isUnlockable &&
                            unlockingId !== lock.id &&
                            !isProcessing
                              ? { scale: 0.95 }
                              : {}
                          }
                        >
                          {unlockingId === lock.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Unlocking
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3 mr-1" />
                              {lock.isVesting ? "Claim" : "Unlock"}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Progress bar for vesting locks */}
                    {lock.isVesting && (
                      <div className="mt-3 pl-13">
                        <div className="flex justify-between text-xs text-[#97CBDC]/70 mb-1">
                          <span>Vesting Progress</span>
                          <span>{calculateVestingProgress(lock)}%</span>
                        </div>
                        <div className="h-2 bg-[#0a0a20] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
                            style={{
                              width: `${calculateVestingProgress(lock)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState searchTerm={searchTerm} type={type} />
            )}
          </div>
        </motion.div>
      )}

      {/* Lock Details Modal */}
      <AnimatePresence>
        {showLockDetails && selectedLock && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLockDetails(false)}
          >
            <motion.div
              className="bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] rounded-2xl max-w-md w-full overflow-hidden border border-[#475B74]/50 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#475B74]/50 p-4">
                <h2 className="text-[#97CBDC] font-medium text-lg flex items-center gap-2">
                  {selectedLock.isVesting ? (
                    <>
                      <BarChart2 className="w-5 h-5 text-[#018ABD]" />
                      Vesting Lock Details
                    </>
                  ) : (
                    <>
                      <LockClosed className="w-5 h-5 text-[#018ABD]" />
                      Lock Details
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setShowLockDetails(false)}
                  className="text-white/70 cursor-pointer hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Token Info */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
                    <span className="text-xl font-medium text-[#97CBDC]">
                      {selectedLock.tokenSymbol?.slice(0, 2) || "??"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#97CBDC]">
                      {selectedLock.tokenName || "Unknown Token"}
                    </h3>
                    <div className="flex items-center">
                      <p className="text-sm text-[#97CBDC]/70">
                        {selectedLock.tokenSymbol || "???"}
                      </p>
                      {selectedLock.isVesting ? (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-[#018ABD]/20 text-[#018ABD]">
                          Vesting
                        </span>
                      ) : (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-[#0a0a20]/80 text-[#97CBDC]/70">
                          Time Lock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  {selectedLock.isUnlockable ? (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-green-400 font-medium">
                          {selectedLock.isVesting
                            ? "Tokens Available to Claim"
                            : "Tokens Unlockable"}
                        </p>
                        <p className="text-green-400/70 text-sm">
                          {selectedLock.isVesting
                            ? `${Number(
                                selectedLock.withdrawableAmount
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                              })} tokens ready to claim`
                            : "Your tokens can now be unlocked"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-[#018ABD]/10 border border-[#018ABD]/30 rounded-xl">
                      <Shield className="w-5 h-5 text-[#018ABD]" />
                      <div>
                        <p className="text-[#018ABD] font-medium">
                          Tokens Locked
                        </p>
                        <p className="text-[#018ABD]/70 text-sm">
                          {getTimeRemaining(selectedLock.lockUntil)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lock Details */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl">
                    <div className="text-sm text-[#97CBDC]/70">Lock Title:</div>
                    <div className="text-sm text-[#97CBDC] text-right truncate">
                      {selectedLock?.description}
                    </div>
                    <div className="text-sm text-[#97CBDC]/70">
                      Token Address:
                    </div>
                    <div className="text-sm text-[#97CBDC] text-right truncate">
                      <a
                        href={`${getExplorerUrl()}/token/${selectedLock.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#018ABD] hover:text-[#97CBDC] flex items-center justify-end"
                      >
                        {formatAddress(selectedLock.token)}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                    <div className="text-sm text-[#97CBDC]/70">
                      Amount Locked:
                    </div>
                    <div className="text-sm text-[#97CBDC] text-right">
                      {formatTokenAmount(selectedLock)}
                    </div>
                    <div className="text-sm text-[#97CBDC]/70">Owner:</div>
                    <div className="text-sm text-[#97CBDC] text-right truncate">
                      <a
                        href={`${getExplorerUrl()}/address/${selectedLock.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#018ABD] hover:text-[#97CBDC] flex items-center justify-end"
                      >
                        {formatAddress(selectedLock.owner)}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl">
                    <div className="text-sm text-[#97CBDC]/70 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created:
                    </div>
                    <div className="text-sm text-[#97CBDC] text-right">
                      {formatDate(selectedLock.createdAt)}
                    </div>
                    <div className="text-sm text-[#97CBDC]/70 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedLock.isVesting ? "TGE Date:" : "Unlocks:"}
                    </div>
                    <div className="text-sm text-[#97CBDC] text-right">
                      {formatDate(selectedLock.lockUntil)}
                    </div>
                    <div className="text-sm text-[#97CBDC]/70">Status:</div>
                    <div className="text-sm text-right">
                      {selectedLock.isUnlockable ? (
                        <span className="text-green-400">
                          {selectedLock.isVesting
                            ? "Tokens available"
                            : "Unlockable now"}
                        </span>
                      ) : (
                        <span className="text-[#97CBDC]">
                          {getTimeRemaining(selectedLock.lockUntil)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vesting Details */}
                  {selectedLock.isVesting && (
                    <div className="p-3 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl">
                      <h4 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Vesting Schedule
                      </h4>
                      {/* Visual representation of vesting progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#97CBDC]/70 mb-1">
                          <span>Progress</span>
                          <span>{calculateVestingProgress(selectedLock)}%</span>
                        </div>
                        <div className="h-3 bg-[#0a0a20] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
                            style={{
                              width: `${calculateVestingProgress(selectedLock)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-[#97CBDC]/70">
                          <span>TGE</span>
                          <span>Vesting Period</span>
                          <span>Complete</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-[#97CBDC]/70 flex items-center">
                          <Percent className="w-3 h-3 mr-1" />
                          Initial Release:
                        </div>
                        <div className="text-[#97CBDC] text-right">
                          {(Number(selectedLock.tgeBps) / 100).toFixed(2)}%
                        </div>
                        <div className="text-[#97CBDC]/70 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Release Cycle:
                        </div>
                        <div className="text-[#97CBDC] text-right">
                          {formatCycleDuration(Number(selectedLock.cycle))}
                        </div>
                        <div className="text-[#97CBDC]/70 flex items-center">
                          <Percent className="w-3 h-3 mr-1" />
                          Per Cycle:
                        </div>
                        <div className="text-[#97CBDC] text-right">
                          {(Number(selectedLock.cycleBps) / 100).toFixed(2)}%
                        </div>
                        <div className="text-[#97CBDC]/70 flex items-center">
                          <Unlock className="w-3 h-3 mr-1" />
                          Available Now:
                        </div>
                        <div className="text-[#97CBDC] text-right">
                          {Number(
                            selectedLock.withdrawableAmount
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedLock.isUnlockable && (
                    <motion.button
                      onClick={() => {
                        handleUnlock(selectedLock.id);
                        setShowLockDetails(false);
                      }}
                      disabled={unlockingId === selectedLock.id || isProcessing}
                      className="flex-1 flex cursor-pointer items-center justify-center bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-xl px-4 py-3 transition-all duration-300 font-medium shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {unlockingId === selectedLock.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Unlocking...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          {selectedLock.isVesting
                            ? "Claim Tokens"
                            : "Unlock Tokens"}
                        </>
                      )}
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setShowLockDetails(false)}
                    className="flex-1 cursor-pointer flex items-center justify-center bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] hover:text-white rounded-xl px-4 py-3 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
