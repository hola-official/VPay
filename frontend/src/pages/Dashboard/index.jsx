import { useState, useEffect, useCallback } from "react";
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
  FileText,
  Users,
  DollarSign,
  Calendar,
  PieChart,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useTokenLock } from "@/hooks/useTokenLock";
import { useVestingManager } from "@/hooks/useVestingManager";
import { useInvoices } from "@/hooks/useInvoices";
import {
  convertCurrency,
  formatCurrencyAmount as formatCurrency,
} from "@/lib/currencyConverter";
import { formatDistanceToNow } from "date-fns";
import {
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenLocks, setTokenLocks] = useState([]);
  const [lpLocks, setLpLocks] = useState([]);
  const [vestingSchedules, setVestingSchedules] = useState([]);
  const [usdConversions, setUsdConversions] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    // Token Lock Stats
    totalTokenLocks: 0,
    totalLpLocks: 0,
    unlockableTokens: 0,
    unlockableLp: 0,
    totalValueLocked: 0,

    // Vesting Stats
    totalVestingSchedules: 0,
    activeVesting: 0,
    completedVesting: 0,
    cancelledVesting: 0,
    totalVestingValue: 0,

    // Invoice Stats
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalInvoiceValue: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    totalOverdueAmount: 0,
    currency: "USD",
    currencyStats: [],

    // Activity Stats
    recentActivity: [],
    monthlyActivity: [],
    paymentMethods: [],
    topClients: [],
  });

  const { getUserLocks } = useTokenLock();
  const { getUserSchedules, getDetailedScheduleInfo } = useVestingManager();
  const { loadInvoiceStats, loadSentInvoices, loadReceivedInvoices } =
    useInvoices();

  // Custom pie chart label renderer
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${((percent ?? 1) * 100).toFixed(0)}%`}
      </text>
    );
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [tokenLocksData, vestingData, invoiceData] = await Promise.all([
        loadTokenLockData(),
        loadVestingData(),
        loadInvoiceData(),
      ]);

      // Update state variables first
      setTokenLocks(tokenLocksData.tokenLocks || []);
      setLpLocks(tokenLocksData.lpLocks || []);
      setVestingSchedules(vestingData.vestingSchedules || []);

      // Combine all data for comprehensive stats
      const combinedData = {
        ...tokenLocksData,
        ...vestingData,
        ...invoiceData,
      };

      const combinedStats = {
        ...combinedData,
        recentActivity: generateRecentActivity(combinedData),
        monthlyActivity: generateMonthlyActivity(combinedData),
        paymentMethods: generatePaymentMethodStats(combinedData),
        topClients: generateTopClientsStats(combinedData),
      };

      console.log("Dashboard data loaded:", combinedStats);
      console.log("Recent activity:", combinedStats.recentActivity);
      console.log("Monthly activity:", combinedStats.monthlyActivity);
      console.log("Payment methods:", combinedStats.paymentMethods);
      console.log("Top clients:", combinedStats.topClients);
      setDashboardStats(combinedStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all data on component mount
  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const loadTokenLockData = async () => {
    try {
      const { normalLocks, lpLocks } = await getUserLocks();
      console.log("Token lock data:", { normalLocks, lpLocks });

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

      return {
        tokenLocks: normalLocks || [],
        lpLocks: lpLocks || [],
        totalTokenLocks: normalLocks?.length || 0,
        totalLpLocks: lpLocks?.length || 0,
        unlockableTokens,
        unlockableLp,
        totalValueLocked: 0, // Would need price data
      };
    } catch (error) {
      console.error("Error loading token lock data:", error);
      return {
        tokenLocks: [],
        lpLocks: [],
        totalTokenLocks: 0,
        totalLpLocks: 0,
        unlockableTokens: 0,
        unlockableLp: 0,
        totalValueLocked: 0,
      };
    }
  };

  const loadVestingData = async () => {
    try {
      const schedules = await getUserSchedules();
      console.log("Vesting schedules data:", schedules);
      let vestingSchedulesData = [];

      if (
        schedules &&
        (schedules.recipientSchedules || schedules.senderSchedules)
      ) {
        const allScheduleIds = [
          ...(schedules.recipientSchedules || []),
          ...(schedules.senderSchedules || []),
        ];

        if (allScheduleIds.length > 0) {
          const detailedSchedules =
            await getDetailedScheduleInfo(allScheduleIds);
          vestingSchedulesData = detailedSchedules || [];
          console.log("Detailed vesting schedules:", vestingSchedulesData);
        }
      }

      const activeVesting = vestingSchedulesData.filter(
        (schedule) => !schedule.cancelled && schedule.vestedAmount > 0
      ).length;

      const completedVesting = vestingSchedulesData.filter(
        (schedule) =>
          !schedule.cancelled && schedule.vestedAmount >= schedule.totalAmount
      ).length;

      const cancelledVesting = vestingSchedulesData.filter(
        (schedule) => schedule.cancelled
      ).length;

      return {
        vestingSchedules: vestingSchedulesData,
        totalVestingSchedules: vestingSchedulesData.length,
        activeVesting,
        completedVesting,
        cancelledVesting,
        totalVestingValue: 0, // Would need price data
      };
    } catch (error) {
      console.error("Error loading vesting data:", error);
      return {
        vestingSchedules: [],
        totalVestingSchedules: 0,
        activeVesting: 0,
        completedVesting: 0,
        cancelledVesting: 0,
        totalVestingValue: 0,
      };
    }
  };

  const loadInvoiceData = async () => {
    try {
      // Load all invoice data directly
      const [sentData, receivedData, statsData] = await Promise.all([
        loadSentInvoices(),
        loadReceivedInvoices(),
        loadInvoiceStats(),
      ]);

      console.log("Invoice data loaded:", {
        sentInvoices: sentData,
        receivedInvoices: receivedData,
        invoiceStats: statsData,
      });

      // Convert amounts to USD for all invoices
      const convertInvoicesToUSD = async (invoices) => {
        if (!invoices || !Array.isArray(invoices)) return [];

        const convertedInvoices = await Promise.all(
          invoices.map(async (invoice) => {
            const currency = invoice.currency || "USD";
            const usdGrandTotal = await convertToUSD(
              invoice.grandTotal,
              currency
            );
            const usdTotalReceived = await convertToUSD(
              invoice.totalAmountReceived,
              currency
            );
            const usdRemainingAmount = await convertToUSD(
              invoice.remainingAmount,
              currency
            );

            return {
              ...invoice,
              usdGrandTotal,
              usdTotalReceived,
              usdRemainingAmount,
            };
          })
        );

        return convertedInvoices;
      };

      const convertedSentInvoices = await convertInvoicesToUSD(sentData);
      const convertedReceivedInvoices =
        await convertInvoicesToUSD(receivedData);

      // Calculate total USD values by converting each invoice individually
      const totalUsdValue = convertedSentInvoices.reduce((sum, invoice) => {
        const usdAmount = invoice.usdGrandTotal || 0;
        return sum + usdAmount;
      }, 0);
      const totalUsdPaid = convertedSentInvoices.reduce((sum, invoice) => {
        const usdAmount = invoice.usdTotalReceived || 0;
        return sum + usdAmount;
      }, 0);
      const totalUsdPending = convertedSentInvoices
        .filter((invoice) => invoice.invoiceStatus === "Awaiting Payment")
        .reduce((sum, invoice) => {
          const usdAmount = invoice.usdGrandTotal || 0;
          return sum + usdAmount;
        }, 0);
      const totalUsdOverdue = convertedSentInvoices
        .filter((invoice) => invoice.invoiceStatus === "Overdue")
        .reduce((sum, invoice) => {
          const usdAmount = invoice.usdGrandTotal || 0;
          return sum + usdAmount;
        }, 0);

      return {
        sentInvoices: convertedSentInvoices,
        receivedInvoices: convertedReceivedInvoices,
        totalInvoices: statsData?.totalInvoices || 0,
        paidInvoices: statsData?.paidInvoices || 0,
        pendingInvoices: statsData?.pendingInvoices || 0,
        overdueInvoices: statsData?.overdueInvoices || 0,
        totalInvoiceValue: totalUsdValue,
        totalPaidAmount: totalUsdPaid,
        totalPendingAmount: totalUsdPending,
        totalOverdueAmount: totalUsdOverdue,
        currency: "USD", // Always show USD for converted amounts
        currencyStats: statsData?.currencyStats || [],
        originalCurrency: statsData?.currency || "USD",
      };
    } catch (error) {
      console.error("Error loading invoice data:", error);
      return {
        sentInvoices: [],
        receivedInvoices: [],
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalInvoiceValue: 0,
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        totalOverdueAmount: 0,
        currency: "USD",
        currencyStats: [],
        originalCurrency: "USD",
      };
    }
  };

  // Generate analytics data
  const generateRecentActivity = (data) => {
    console.log("Generating recent activity with data:", data);
    const allItems = [
      ...(Array.isArray(data?.tokenLocks)
        ? data.tokenLocks.map((lock) => ({
            ...lock,
            type: "token-lock",
            category: "Token Lock",
          }))
        : []),
      ...(Array.isArray(data?.lpLocks)
        ? data.lpLocks.map((lock) => ({
            ...lock,
            type: "lp-lock",
            category: "LP Lock",
          }))
        : []),
      ...(Array.isArray(data?.vestingSchedules)
        ? data.vestingSchedules.map((schedule) => ({
            ...schedule,
            type: "vesting",
            category: "Vesting",
          }))
        : []),
      ...(Array.isArray(data?.sentInvoices)
        ? data.sentInvoices.map((invoice) => ({
            ...invoice,
            type: "invoice-sent",
            category: "Invoice Sent",
            invoiceDate: invoice.issueDate || invoice.createdAt,
            invoiceNumber: invoice.invoiceNumber,
            grandTotal: invoice.grandTotal,
            clientEmail: invoice.client?.email,
          }))
        : []),
      ...(Array.isArray(data?.receivedInvoices)
        ? data.receivedInvoices.map((invoice) => ({
            ...invoice,
            type: "invoice-received",
            category: "Invoice Received",
            invoiceDate: invoice.issueDate || invoice.createdAt,
            invoiceNumber: invoice.invoiceNumber,
            grandTotal: invoice.grandTotal,
            clientEmail: invoice.client?.email,
          }))
        : []),
    ];
    console.log("All items for recent activity:", allItems);

    return allItems
      .sort((a, b) => {
        let aTime, bTime;

        if (a.type === "vesting") {
          aTime = Number(a.startTime || 0);
        } else if (a.type.includes("invoice")) {
          aTime = new Date(
            a.invoiceDate || a.issueDate || a.createdAt
          ).getTime();
        } else {
          aTime = Number(a.lockDate || a.tgeDate || 0);
        }

        if (b.type === "vesting") {
          bTime = Number(b.startTime || 0);
        } else if (b.type.includes("invoice")) {
          bTime = new Date(
            b.invoiceDate || b.issueDate || b.createdAt
          ).getTime();
        } else {
          bTime = Number(b.lockDate || b.tgeDate || 0);
        }

        return bTime - aTime;
      })
      .slice(0, 10);
  };

  const generateMonthlyActivity = (data) => {
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      // Count activities for this month
      const monthStart = date.getTime() / 1000;
      const monthEnd =
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime() / 1000;

      const tokenLocksCount = (data?.tokenLocks || []).filter((lock) => {
        const lockTime = Number(lock.lockDate || lock.createdAt || 0);
        return lockTime >= monthStart && lockTime <= monthEnd;
      }).length;

      const vestingCount = (data?.vestingSchedules || []).filter((schedule) => {
        const scheduleTime = Number(
          schedule.createdAt || schedule.startTime || 0
        );
        return scheduleTime >= monthStart && scheduleTime <= monthEnd;
      }).length;

      const invoiceCount = (data?.sentInvoices || []).filter((invoice) => {
        const invoiceTime =
          new Date(invoice.createdAt || invoice.invoiceDate).getTime() / 1000;
        return invoiceTime >= monthStart && invoiceTime <= monthEnd;
      }).length;

      // Calculate total USD value for invoices in this month
      const invoiceValue = (data?.sentInvoices || [])
        .filter((invoice) => {
          const invoiceTime =
            new Date(invoice.createdAt || invoice.invoiceDate).getTime() / 1000;
          return invoiceTime >= monthStart && invoiceTime <= monthEnd;
        })
        .reduce((sum, invoice) => {
          return sum + (invoice.usdGrandTotal || invoice.grandTotal || 0);
        }, 0);

      months.push({
        month: monthName,
        tokenLocks: tokenLocksCount,
        vesting: vestingCount,
        invoices: invoiceCount,
        total: tokenLocksCount + vestingCount + invoiceCount,
        totalValue: invoiceValue, // Add USD value
      });
    }

    return months;
  };

  const generatePaymentMethodStats = (data) => {
    console.log("Generating payment method stats with data:", data);
    const methods = {};

    (data?.sentInvoices || []).forEach((invoice) => {
      if (invoice.paymentMethod) {
        methods[invoice.paymentMethod] =
          (methods[invoice.paymentMethod] || 0) + 1;
      }
    });

    const result = Object.entries(methods).map(([method, count]) => ({
      name: method,
      value: count,
      color: getPaymentMethodColor(method),
    }));
    console.log("Payment method stats result:", result);
    return result;
  };

  const generateTopClientsStats = (data) => {
    console.log("Generating top clients stats with data:", data);
    const clients = {};

    (data?.sentInvoices || []).forEach((invoice) => {
      if (invoice.clientEmail) {
        if (!clients[invoice.clientEmail]) {
          clients[invoice.clientEmail] = {
            count: 0,
            totalValue: 0,
            name: invoice.client?.name || "Unknown",
          };
        }
        clients[invoice.clientEmail].count += 1;
        clients[invoice.clientEmail].totalValue +=
          invoice.usdGrandTotal || invoice.grandTotal || 0;
      }
    });

    const result = Object.entries(clients)
      .map(([email, data]) => ({
        email,
        count: data.count,
        totalValue: data.totalValue,
        name: data.name,
      }))
      .sort((a, b) => b.totalValue - a.totalValue) // Sort by USD value instead of count
      .slice(0, 5);
    console.log("Top clients stats result:", result);
    return result;
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      USDC: "#2775CA",
      USDT: "#26A17B",
      "Bank Transfer": "#8B5CF6",
      Crypto: "#F59E0B",
      Other: "#6B7280",
    };
    return colors[method] || "#6B7280";
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    let date;

    // Handle different timestamp formats
    if (typeof timestamp === "number") {
      // If it's a number, check if it's Unix timestamp (seconds) or milliseconds
      if (timestamp < 10000000000) {
        // Unix timestamp in seconds, convert to milliseconds
        date = new Date(timestamp * 1000);
      } else {
        // Already in milliseconds
        date = new Date(timestamp);
      }
    } else if (typeof timestamp === "string") {
      // ISO string or other string format
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else {
      return "N/A";
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-US", {
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

  // Convert amount to USD
  const convertToUSD = async (amount, currency) => {
    if (!amount || !currency || currency === "USD") {
      return amount || 0;
    }

    // Check if we already have the conversion rate cached
    if (usdConversions[currency]) {
      return amount * usdConversions[currency];
    }

    try {
      const convertedAmount = await convertCurrency(amount, currency, "USD");
      // Cache the conversion rate for future use
      setUsdConversions((prev) => ({
        ...prev,
        [currency]: convertedAmount / amount,
      }));
      return convertedAmount;
    } catch (error) {
      console.error(`Error converting ${currency} to USD:`, error);
      return amount; // Return original amount if conversion fails
    }
  };

  // Format currency amount with USD conversion

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
      <div className="w-full max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#97CBDC] to-[#018ABD]">
            VPay Dashboard
          </h1>
          <p className="text-[#97CBDC]/70 mt-2 text-lg">
            Connect your wallet to access your comprehensive platform overview
          </p>
        </motion.div>

        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center mx-auto mb-8">
            <Shield className="w-16 h-16 text-[#97CBDC]/50" />
          </div>
          <h2 className="text-3xl font-bold text-[#97CBDC] mb-6">
            Connect Your Wallet
          </h2>
          <p className="text-[#97CBDC]/70 max-w-2xl mx-auto mb-8 text-lg">
            Access your complete financial overview including invoices, payroll,
            token locks, and comprehensive analytics
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link
              to="/create-invoice"
              className="px-8 py-4 bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-xl transition-colors font-medium text-lg"
            >
              Create Invoice
            </Link>
            <Link
              to="/payroll"
              className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-xl transition-colors font-medium text-lg"
            >
              Manage Payroll
            </Link>
            <Link
              to="/lock"
              className="px-8 py-4 bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] rounded-xl transition-colors font-medium text-lg"
            >
              Token Locks
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="animate-pulse">
            <div className="h-10 bg-[#1D2538]/70 rounded mb-4"></div>
            <div className="h-6 bg-[#1D2538]/70 rounded w-96 mx-auto"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-[#1D2538]/70 rounded-xl"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-80 bg-[#1D2538]/70 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#97CBDC] to-[#018ABD]">
          VPay Dashboard
        </h1>
        <p className="text-[#97CBDC]/70 mt-2 text-lg">
          Comprehensive overview of your financial activities
        </p>
        <button
          onClick={loadDashboardData}
          className="mt-4 flex items-center gap-2 text-sm text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Invoice Metrics */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                {dashboardStats.totalInvoices}
              </div>
              <div className="text-sm text-[#97CBDC]/70">Total Invoices</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">Paid</span>
              <span className="text-sm font-medium text-green-400">
                {dashboardStats.paidInvoices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">Pending</span>
              <span className="text-sm font-medium text-yellow-400">
                {dashboardStats.pendingInvoices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">Overdue</span>
              <span className="text-sm font-medium text-red-400">
                {dashboardStats.overdueInvoices}
              </span>
            </div>
          </div>
          <Link
            to="/invoices"
            className="mt-4 flex items-center justify-between text-sm text-[#018ABD] hover:text-[#97CBDC] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Financial Overview */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                $
                {(dashboardStats.totalPaidAmount || 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </div>
              <div className="text-sm text-[#97CBDC]/70">Total Revenue</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#97CBDC]/70">Pending</span>
              <span className="text-sm font-medium text-[#97CBDC]">
                $
                {(dashboardStats.totalPendingAmount || 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#97CBDC]/70">Overdue</span>
              <span className="text-sm font-medium text-[#97CBDC]">
                $
                {(dashboardStats.totalOverdueAmount || 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#97CBDC]/70">Currency</span>
              <span className="text-sm font-medium text-[#97CBDC]">
                {dashboardStats.currency}{" "}
                {dashboardStats.originalCurrency &&
                dashboardStats.originalCurrency !== dashboardStats.currency
                  ? `(converted from ${dashboardStats.originalCurrency})`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Payroll Overview */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#8B5CF6]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#A855F7]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                {dashboardStats.totalVestingSchedules}
              </div>
              <div className="text-sm text-[#97CBDC]/70">Payroll Schedules</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">Active</span>
              <span className="text-sm font-medium text-blue-400">
                {dashboardStats.activeVesting}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">Completed</span>
              <span className="text-sm font-medium text-green-400">
                {dashboardStats.completedVesting}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">Cancelled</span>
              <span className="text-sm font-medium text-red-400">
                {dashboardStats.cancelledVesting}
              </span>
            </div>
          </div>
          <Link
            to="/payroll"
            className="mt-4 flex items-center justify-between text-sm text-[#8B5CF6] hover:text-[#97CBDC] transition-colors"
          >
            <span>Manage Payroll</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Token Locks Overview */}
        <div className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6 hover:border-[#018ABD]/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#F59E0B]/20 to-[#F97316]/20 flex items-center justify-center">
              <LockClosed className="w-6 h-6 text-[#97CBDC]" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#97CBDC]">
                {dashboardStats.totalTokenLocks + dashboardStats.totalLpLocks}
              </div>
              <div className="text-sm text-[#97CBDC]/70">Total Locks</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#97CBDC]/70">Token Locks</span>
              <span className="text-sm font-medium text-[#97CBDC]">
                {dashboardStats.totalTokenLocks}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#97CBDC]/70">LP Locks</span>
              <span className="text-sm font-medium text-[#97CBDC]">
                {dashboardStats.totalLpLocks}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">Unlockable</span>
              <span className="text-sm font-medium text-green-400">
                {dashboardStats.unlockableTokens + dashboardStats.unlockableLp}
              </span>
            </div>
          </div>
          <Link
            to="/lock"
            className="mt-4 flex items-center justify-between text-sm text-[#F59E0B] hover:text-[#97CBDC] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Payment Methods Pie Chart */}
        <motion.div
          className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-[#97CBDC]" />
            <h3 className="text-lg font-semibold text-[#97CBDC]">
              Payment Methods
            </h3>
          </div>
          {dashboardStats.paymentMethods &&
          dashboardStats.paymentMethods.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dashboardStats.paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardStats.paymentMethods.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1D2538",
                      border: "1px solid #475B74",
                      borderRadius: "8px",
                      color: "#97CBDC",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-[#97CBDC]/30 mx-auto mb-2" />
                <p className="text-[#97CBDC]/50">No payment data available</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Monthly Activity Chart */}
        <motion.div
          className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#97CBDC]" />
            <h3 className="text-lg font-semibold text-[#97CBDC]">
              Monthly Activity
            </h3>
          </div>
          {dashboardStats.monthlyActivity &&
          dashboardStats.monthlyActivity.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardStats.monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475B74" />
                  <XAxis dataKey="month" stroke="#97CBDC" />
                  <YAxis stroke="#97CBDC" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1D2538",
                      border: "1px solid #475B74",
                      borderRadius: "8px",
                      color: "#97CBDC",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="invoices"
                    stackId="1"
                    stroke="#018ABD"
                    fill="#018ABD"
                    fillOpacity={0.6}
                    name="Invoices"
                  />
                  <Area
                    type="monotone"
                    dataKey="vesting"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    name="Vesting"
                  />
                  <Area
                    type="monotone"
                    dataKey="tokenLocks"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Token Locks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-[#97CBDC]/30 mx-auto mb-2" />
                <p className="text-[#97CBDC]/50">No activity data available</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Vesting Status Pie Chart */}
        <motion.div
          className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#97CBDC]" />
            <h3 className="text-lg font-semibold text-[#97CBDC]">
              Vesting Status
            </h3>
          </div>
          {dashboardStats.totalVestingSchedules > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      {
                        name: "Active",
                        value: dashboardStats.activeVesting,
                        color: "#3B82F6",
                      },
                      {
                        name: "Completed",
                        value: dashboardStats.completedVesting,
                        color: "#10B981",
                      },
                      {
                        name: "Cancelled",
                        value: dashboardStats.cancelledVesting,
                        color: "#EF4444",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      {
                        name: "Active",
                        value: dashboardStats.activeVesting,
                        color: "#3B82F6",
                      },
                      {
                        name: "Completed",
                        value: dashboardStats.completedVesting,
                        color: "#10B981",
                      },
                      {
                        name: "Cancelled",
                        value: dashboardStats.cancelledVesting,
                        color: "#EF4444",
                      },
                    ].map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1D2538",
                      border: "1px solid #475B74",
                      borderRadius: "8px",
                      color: "#97CBDC",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 text-[#97CBDC]/30 mx-auto mb-2" />
                <p className="text-[#97CBDC]/50">No vesting data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          className="lg:col-span-2 bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="p-6 border-b border-[#475B74]/30">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#97CBDC]" />
              <h3 className="text-lg font-semibold text-[#97CBDC]">
                Recent Activity
              </h3>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {dashboardStats.recentActivity &&
            dashboardStats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.recentActivity.slice(0, 8).map((item) => (
                  <motion.div
                    key={`${item.type}-${item.id || Math.random()}`}
                    className="flex items-center justify-between p-4 bg-[#0a0a20]/60 backdrop-blur-sm border border-[#475B74]/30 rounded-xl hover:border-[#018ABD]/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.random() * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
                        {item.type === "vesting" ? (
                          <Users className="w-5 h-5 text-[#97CBDC]" />
                        ) : item.type.includes("invoice") ? (
                          <FileText className="w-5 h-5 text-[#97CBDC]" />
                        ) : (
                          <LockClosed className="w-5 h-5 text-[#97CBDC]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#97CBDC]">
                            {item.category}
                          </span>
                          {getStatusBadge(item)}
                        </div>
                        <div className="text-xs text-[#97CBDC]/70">
                          {item.type === "vesting"
                            ? `Recipient: ${formatAddress(item.recipient)}`
                            : item.type.includes("invoice")
                              ? `Invoice #${item.invoiceNumber || "N/A"}`
                              : `Token: ${formatAddress(item.token)}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#97CBDC]">
                        {formatDate(
                          item.type === "vesting"
                            ? item.startTime
                            : item.type.includes("invoice")
                              ? item.invoiceDate ||
                                item.issueDate ||
                                item.createdAt
                              : item.lockDate || item.tgeDate || item.createdAt
                        )}
                      </div>
                      <div className="text-xs text-[#97CBDC]/70">
                        {item.type === "vesting"
                          ? getTimeRemaining(item.startTime, "vesting")
                          : item.type.includes("invoice")
                            ? formatCurrency(
                                item.usdGrandTotal || item.grandTotal || 0,
                                "USD"
                              )
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
                  Start creating invoices, managing payroll, or locking tokens
                  to see your activity here
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions & Top Clients */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className="w-5 h-5 text-[#97CBDC]" />
              <h3 className="text-lg font-semibold text-[#97CBDC]">
                Quick Actions
              </h3>
            </div>
            <div className="space-y-3">
              <Link
                to="/create-invoice"
                className="block w-full p-3 bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-lg transition-colors font-medium text-center"
              >
                Create Invoice
              </Link>
              <Link
                to="/payroll"
                className="block w-full p-3 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-lg transition-colors font-medium text-center"
              >
                Manage Payroll
              </Link>
              <Link
                to="/lock"
                className="block w-full p-3 bg-gradient-to-r from-[#F59E0B] to-[#F97316] hover:from-[#D97706] hover:to-[#EA580C] text-white rounded-lg transition-colors font-medium text-center"
              >
                Token Locks
              </Link>
              <Link
                to="/invoices"
                className="block w-full p-3 bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] rounded-lg transition-colors font-medium text-center"
              >
                View All Invoices
              </Link>
            </div>
          </motion.div>

          {/* Top Clients */}
          <motion.div
            className="bg-gradient-to-br from-[#1D2538]/90 to-[#1D2538]/70 backdrop-blur-sm border border-[#475B74]/30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-[#97CBDC]" />
              <h3 className="text-lg font-semibold text-[#97CBDC]">
                Top Clients
              </h3>
            </div>
            {dashboardStats.topClients &&
            dashboardStats.topClients.length > 0 ? (
              <div className="space-y-3">
                {dashboardStats.topClients.map((client, index) => (
                  <div
                    key={client.email}
                    className="flex items-center justify-between p-3 bg-[#0a0a20]/60 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-[#97CBDC]">
                          {client.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#97CBDC] truncate max-w-32">
                          {client.name || client.email}
                        </p>
                        <p className="text-xs text-[#97CBDC]/70">
                          {client.count} invoice{client.count !== 1 ? "s" : ""}{" "}
                          • {formatCurrency(client.totalValue || 0, "USD")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#97CBDC]/70">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="w-8 h-8 text-[#97CBDC]/30 mx-auto mb-2" />
                <p className="text-sm text-[#97CBDC]/50">No client data</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
