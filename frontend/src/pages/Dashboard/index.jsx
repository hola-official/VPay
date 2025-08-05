import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LockIcon as LockClosed,
  BarChart2,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Shield,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useTokenLock } from "@/hooks/useTokenLock";
import { useVestingManager } from "@/hooks/useVestingManager";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenLocks, setTokenLocks] = useState([]);
  const [lpLocks, setLpLocks] = useState([]);
  const [vestingSchedules, setVestingSchedules] = useState([]);
  const [stats, setStats] = useState({
    totalTokenLocks: 0,
    totalLpLocks: 0,
    totalVestingSchedules: 0,
    unlockableTokens: 0,
    unlockableLp: 0,
    activeVesting: 0,
    totalValueLocked: 0,
  });

  const { getUserLocks } = useTokenLock();
  const { getUserSchedules, getDetailedScheduleInfo } = useVestingManager();

  // Load all data on component mount
  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
  }, [address]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load token locks
      const { normalLocks, lpLocks } = await getUserLocks();
      setTokenLocks(normalLocks || []);
      setLpLocks(lpLocks || []);

      // Calculate stats
      const unlockableTokens = (normalLocks || []).filter(
        (lock) =>
          Date.now() / 1000 > Number(lock.tgeDate) &&
          BigInt(lock.unlockedAmount) < BigInt(lock.amount)
      ).length;

      const unlockableLp = (lpLocks || []).filter(
        (lock) =>
          Date.now() / 1000 > Number(lock.tgeDate) &&
          BigInt(lock.unlockedAmount) < BigInt(lock.amount)
      ).length;

      // Get vesting schedules for stats calculation
      let vestingSchedulesData = [];
      try {
        const schedules = await getUserSchedules();
        console.log("Raw schedules data:", schedules);
        // The getUserSchedules returns an object with recipientSchedules and senderSchedules
        // We need to combine them and get detailed info
        if (
          schedules &&
          (schedules.recipientSchedules || schedules.senderSchedules)
        ) {
          const allScheduleIds = [
            ...(schedules.recipientSchedules || []),
            ...(schedules.senderSchedules || []),
          ];

          console.log("All schedule IDs:", allScheduleIds);

          if (allScheduleIds.length > 0) {
            // Get detailed schedule info
            const detailedSchedules =
              await getDetailedScheduleInfo(allScheduleIds);
            vestingSchedulesData = detailedSchedules || [];
            console.log("Detailed schedules:", vestingSchedulesData);
          }
        }
        setVestingSchedules(vestingSchedulesData);
      } catch (error) {
        console.error("Error loading vesting schedules:", error);
        setVestingSchedules([]);
      }

      const activeVesting = (vestingSchedulesData || []).filter(
        (schedule) => !schedule.cancelled && schedule.vestedAmount > 0
      ).length;

      setStats({
        totalTokenLocks: normalLocks?.length || 0,
        totalLpLocks: lpLocks?.length || 0,
        totalVestingSchedules: vestingSchedulesData?.length || 0,
        unlockableTokens,
        unlockableLp,
        activeVesting,
        totalValueLocked: 0, // This would need price data to calculate
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent activity (last 5 items from each category)
  const getRecentActivity = () => {
    const allItems = [
      ...(Array.isArray(tokenLocks)
        ? tokenLocks.map((lock) => ({ ...lock, type: "token-lock" }))
        : []),
      ...(Array.isArray(lpLocks)
        ? lpLocks.map((lock) => ({ ...lock, type: "lp-lock" }))
        : []),
      ...(Array.isArray(vestingSchedules)
        ? vestingSchedules.map((schedule) => ({ ...schedule, type: "vesting" }))
        : []),
    ];

    return allItems
      .sort((a, b) => {
        // Handle different timestamp formats for different types
        let aTime, bTime;

        if (a.type === "vesting") {
          aTime = Number(a.createdAt || a.startTime || 0);
        } else {
          aTime = Number(a.lockDate || a.createdAt || 0);
        }

        if (b.type === "vesting") {
          bTime = Number(b.createdAt || b.startTime || 0);
        } else {
          bTime = Number(b.lockDate || b.createdAt || 0);
        }

        return bTime - aTime; // Most recent first
      })
      .slice(0, 5);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short",
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

  // Get status badge for items
  const getStatusBadge = (item) => {
    if (item.type === "vesting") {
      // For vesting schedules, check if they're cancelled, completed, or active
      if (item.cancelled) {
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
            <BarChart2 className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      }

      const now = Date.now() / 1000;
      const startTime = Number(item.startTime);
      const endTime = Number(item.endTime);

      if (now >= endTime) {
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      } else if (now >= startTime) {
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
            <BarChart2 className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      } else {
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            <BarChart2 className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      }
    }

    const isUnlockable =
      Date.now() / 1000 > Number(item.tgeDate) &&
      BigInt(item.unlockedAmount) < BigInt(item.amount);

    if (isUnlockable) {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
          <CheckCircle className="w-3 h-3" />
          <span>Unlockable</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#018ABD]/20 text-[#018ABD]">
        <LockClosed className="w-3 h-3" />
        <span>Locked</span>
      </span>
    );
  };

  // Get time remaining
  const getTimeRemaining = (timestamp, type = "lock") => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();

    if (date <= now) {
      if (type === "vesting") {
        return "Vesting active";
      }
      return "Unlockable now";
    }

    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (!address) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#97CBDC] to-[#018ABD]">
            Dashboard
          </h1>
          <p className="text-[#97CBDC]/70 mt-2">
            Connect your wallet to view your token locks and vesting schedules
          </p>
        </motion.div>

        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-[#97CBDC]/50" />
          </div>
          <h2 className="text-2xl font-bold text-[#97CBDC] mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-[#97CBDC]/70 max-w-md mx-auto mb-8">
            To view your dashboard, please connect your wallet using the button
            in the top right corner.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/create-lock"
              className="px-6 py-3 bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-xl transition-colors font-medium"
            >
              Create Token Lock
            </Link>
            <Link
              to="/pay"
              className="px-6 py-3 bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] rounded-xl transition-colors font-medium"
            >
              Create Vesting Schedule
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1D2538]/70 rounded mb-2"></div>
            <div className="h-4 bg-[#1D2538]/70 rounded w-64 mx-auto"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-[#1D2538]/70 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#97CBDC] to-[#018ABD]">
          Dashboard
        </h1>
        <p className="text-[#97CBDC]/70 mt-2">
          Overview of your token locks and vesting schedules
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Token Locks Card */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
              <LockClosed className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                {stats.totalTokenLocks}
              </div>
              <div className="text-sm text-[#97CBDC]/70">Token Locks</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#97CBDC]/70">Unlockable</span>
            <span className="text-sm font-medium text-green-400">
              {stats.unlockableTokens}
            </span>
          </div>
          <Link
            to="/token-lock"
            className="mt-4 flex items-center justify-between text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* LP Locks Card */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                {stats.totalLpLocks}
              </div>
              <div className="text-sm text-[#97CBDC]/70">LP Locks</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#97CBDC]/70">Unlockable</span>
            <span className="text-sm font-medium text-green-400">
              {stats.unlockableLp}
            </span>
          </div>
          <Link
            to="/lp-lock"
            className="mt-4 flex items-center justify-between text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Vesting Schedules Card */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                {stats.totalVestingSchedules}
              </div>
              <div className="text-sm text-[#97CBDC]/70">Vesting Schedules</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#97CBDC]/70">Active</span>
            <span className="text-sm font-medium text-[#018ABD]">
              {stats.activeVesting}
            </span>
          </div>
          <Link
            to="/pay"
            className="mt-4 flex items-center justify-between text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#97CBDC]">
                Quick Actions
              </div>
              <div className="text-sm text-[#97CBDC]/70">Create new</div>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              to="/create-lock"
              className="block text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
            >
              Create Token Lock
            </Link>
            <Link
              to="/pay"
              className="block text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
            >
              Create Vesting Schedule
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="p-6 border-b border-[#475B74]/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#97CBDC]">
              Recent Activity
            </h2>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 text-sm text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          {getRecentActivity().length > 0 ? (
            <div className="space-y-4">
              {getRecentActivity().map((item, index) => (
                <motion.div
                  key={`${item.type}-${item.id || index}`}
                  className="flex items-center justify-between p-4 bg-[#0a0a20]/60 backdrop-blur-sm border border-[#475B74]/30 rounded-xl hover:border-[#018ABD]/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
                      {item.type === "vesting" ? (
                        <BarChart2 className="w-5 h-5 text-[#97CBDC]" />
                      ) : (
                        <LockClosed className="w-5 h-5 text-[#97CBDC]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#97CBDC]">
                          {item.type === "vesting"
                            ? "Vesting Schedule"
                            : item.type === "token-lock"
                              ? "Token Lock"
                              : "LP Lock"}
                        </span>
                        {getStatusBadge(item)}
                      </div>
                      <div className="text-xs text-[#97CBDC]/70">
                        {item.type === "vesting"
                          ? `Recipient: ${formatAddress(item.recipient)}`
                          : `Token: ${formatAddress(item.token)}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#97CBDC]">
                      {formatDate(
                        item.lockDate || item.createdAt || item.startTime
                      )}
                    </div>
                    <div className="text-xs text-[#97CBDC]/70">
                      {item.type === "vesting"
                        ? getTimeRemaining(item.startTime, "vesting")
                        : getTimeRemaining(item.tgeDate || item.startTime)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8 text-[#97CBDC]/50" />
              </div>
              <p className="text-[#97CBDC] mb-2 text-lg font-medium">
                No activity yet
              </p>
              <p className="text-sm text-[#97CBDC]/70 max-w-md mx-auto">
                Create your first token lock or vesting schedule to get started
              </p>
              <div className="mt-6 flex gap-4 justify-center">
                <Link
                  to="/create-lock"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-xl transition-colors font-medium"
                >
                  Create Lock
                </Link>
                <Link
                  to="/pay"
                  className="px-6 py-2.5 bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] rounded-xl transition-colors font-medium"
                >
                  Create Vesting
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
