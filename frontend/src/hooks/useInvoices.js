import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";

const BASE_URL = "http://localhost:3000/api/invoices";
// "https://v-pay-backend.vercel.app/api/invoices";

export function useInvoices() {
  const { address: userAddress } = useAccount();
  const [sentInvoices, setSentInvoices] = useState([]);
  const [receivedInvoices, setReceivedInvoices] = useState([]);
  const [recurringInvoices, setRecurringInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Helper function to make API calls
  const makeRequest = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      console.error("Request URL:", url);
      throw error;
    }
  };

  // Load sent invoices (invoices created by the user)
  const loadSentInvoices = useCallback(
    async (status = null) => {
      if (!userAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        let url = `${BASE_URL}/sent?creatorId=${userAddress}`;
        if (status) {
          url += `&invoiceStatus=${status}`;
        }

        const response = await makeRequest(url);
        setSentInvoices(response.data || []);
        return response.data || [];
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load sent invoices"
        );
        console.error("Error loading sent invoices:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Load received invoices (invoices where user is client or payer)
  const loadReceivedInvoices = useCallback(
    async (status = null) => {
      if (!userAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        let url = `${BASE_URL}/received?payerWalletAddr=${userAddress}`;
        if (status) {
          url += `&invoiceStatus=${status}`;
        }

        const response = await makeRequest(url);
        setReceivedInvoices(response.data || []);
        return response.data || [];
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load received invoices"
        );
        console.error("Error loading received invoices:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Load recurring invoices
  const loadRecurringInvoices = useCallback(
    async (isActive = true) => {
      if (!userAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        const url = `${BASE_URL}/recurring?creatorId=${userAddress}&isActive=${isActive}`;
        const response = await makeRequest(url);
        setRecurringInvoices(response.data || []);
        return response.data || [];
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load recurring invoices"
        );
        console.error("Error loading recurring invoices:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Load invoice statistics
  const loadInvoiceStats = useCallback(async () => {
    if (!userAddress) {
      console.log("No user address, skipping stats load");
      return;
    }

    console.log("Loading stats for user:", userAddress);
    setIsLoading(true);
    setError(null);

    try {
      const url = `${BASE_URL}/stats/${userAddress}`;
      console.log("Making request to:", url);
      const response = await makeRequest(url);
      console.log("Stats response:", response);
      setStats(response.data);
      return response.data;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load invoice statistics"
      );
      console.error("Error loading invoice statistics:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Create a new invoice
  const createInvoice = async (invoiceData) => {
    if (!userAddress) throw new Error("User address is required");

    setIsLoading(true);
    setError(null);

    try {
      const newInvoice = {
        ...invoiceData,
        creatorId: userAddress,
      };

      console.log("Creating invoice with data:", newInvoice);

      const response = await makeRequest(`${BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(newInvoice),
      });

      if (response.success === true) {
        toast.success(response.message);
        setSentInvoices((prev) => [response.data, ...prev]);
        return response.data;
      } else {
        toast.error(response.message);
        throw new Error(response.message || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Create invoice error:", error);

      let errorMessage = "Failed to create invoice";
      if (error.message.includes("Invoice with this number already exists")) {
        errorMessage = "An invoice with this number already exists";
      } else if (
        error.message.includes("Invalid creator wallet address format")
      ) {
        errorMessage = "Invalid creator wallet address format";
      } else if (error.message.includes("Client email is required")) {
        errorMessage = "Client email is required";
      } else if (error.message.includes("Grand total is required")) {
        errorMessage = "Grand total is required";
      } else if (error.message.includes("Minimum payment required")) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || "Failed to create invoice";
      }

      toast.error(errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get invoice by ID
  const getInvoiceById = useCallback(async (invoiceId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${invoiceId}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get invoice"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update an existing invoice
  const updateInvoice = async (invoiceId, invoiceData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${invoiceId}`, {
        method: "PUT",
        body: JSON.stringify(invoiceData),
      });

      if (response.success && response.data) {
        // Update in all relevant lists
        setSentInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        setReceivedInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        setRecurringInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update invoice");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update invoice"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Pay an invoice
  const payInvoice = useCallback(async (invoiceId, paymentData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${invoiceId}/pay`, {
        method: "PUT",
        body: JSON.stringify(paymentData),
      });

      if (response.success && response.data) {
        // Update in all relevant lists
        setSentInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        setReceivedInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        setRecurringInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || "Failed to pay invoice");
      }
    } catch (error) {
      let errorMessage = "Failed to pay invoice";
      if (error.message.includes("Minimum payment required")) {
        errorMessage = error.message;
      } else if (error.message.includes("Transaction hash already exists")) {
        errorMessage = "This transaction has already been processed";
      } else if (
        error.message.includes("Invalid payer wallet address format")
      ) {
        errorMessage = "Invalid wallet address format";
      } else {
        errorMessage = error.message || "Failed to pay invoice";
      }

      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reject an invoice
  const rejectInvoice = useCallback(async (invoiceId, rejectReason) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${invoiceId}/reject`, {
        method: "PUT",
        body: JSON.stringify({ rejectReason }),
      });

      if (response.success && response.data) {
        // Update in all relevant lists
        setSentInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        setReceivedInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || "Failed to reject invoice");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to reject invoice"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop recurring invoice
  const stopRecurringInvoice = async (invoiceId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `${BASE_URL}/${invoiceId}/stop-recurring`,
        {
          method: "PUT",
        }
      );

      if (response.success && response.data) {
        setRecurringInvoices((prev) =>
          prev.map((invoice) =>
            invoice._id === invoiceId ? response.data : invoice
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || "Failed to stop recurring invoice");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to stop recurring invoice"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an invoice
  const deleteInvoice = async (invoiceId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${invoiceId}`, {
        method: "DELETE",
      });

      if (response.success) {
        // Remove from all relevant lists
        setSentInvoices((prev) =>
          prev.filter((invoice) => invoice._id !== invoiceId)
        );
        setReceivedInvoices((prev) =>
          prev.filter((invoice) => invoice._id !== invoiceId)
        );
        setRecurringInvoices((prev) =>
          prev.filter((invoice) => invoice._id !== invoiceId)
        );
        return true;
      } else {
        throw new Error(response.message || "Failed to delete invoice");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete invoice"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Search invoices
  const searchInvoices = async (query, filters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (filters.creatorId) params.append("creatorId", filters.creatorId);
      if (filters.invoiceStatus)
        params.append("invoiceStatus", filters.invoiceStatus);
      if (filters.paymentMethod)
        params.append("paymentMethod", filters.paymentMethod);

      const url = `${BASE_URL}/search?${params.toString()}`;
      const response = await makeRequest(url);

      // Filter results to only show invoices created by current user
      const userInvoices = (response.data || []).filter(
        (invoice) => invoice.creatorId === userAddress
      );

      return userInvoices;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to search invoices"
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get invoice chain (for recurring invoices)
  const getInvoiceChain = async (invoiceId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${invoiceId}/chain`);
      return response.data || [];
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get invoice chain"
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get transaction by hash
  const getTransactionByHash = async (txnHash) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/transaction/${txnHash}`);
      return response.data;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get transaction"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get NFT receipt by ID
  const getNFTReceiptById = async (nftReceiptId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `${BASE_URL}/nft-receipt/${nftReceiptId}`
      );
      return response.data;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get NFT receipt"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate recurring invoices
  const generateRecurringInvoices = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `${BASE_URL}/generate-recurring?creatorId=${userAddress}`
      );
      return response.results || [];
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate recurring invoices"
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Send overdue reminders
  const sendOverdueReminders = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `${BASE_URL}/send-overdue-reminders?creatorId=${userAddress}`
      );
      return response.results || [];
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send overdue reminders"
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get invoices by wallet address
  const getInvoicesByWallet = async (walletAddress) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/wallet/${walletAddress}`);
      return response.data || [];
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get invoices by wallet"
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load all invoice data when user address changes
  useEffect(() => {
    if (userAddress) {
      loadSentInvoices();
      loadReceivedInvoices();
      loadRecurringInvoices();
      loadInvoiceStats();
    } else {
      setSentInvoices([]);
      setReceivedInvoices([]);
      setRecurringInvoices([]);
      setStats(null);
    }
  }, [
    userAddress,
    loadSentInvoices,
    loadReceivedInvoices,
    loadRecurringInvoices,
    loadInvoiceStats,
  ]);

  return {
    // State
    invoices: sentInvoices, // For backward compatibility
    sentInvoices,
    receivedInvoices,
    recurringInvoices,
    isLoading,
    error,
    stats,

    // Actions
    loadSentInvoices,
    loadReceivedInvoices,
    loadRecurringInvoices,
    loadInvoiceStats,
    createInvoice,
    getInvoiceById,
    updateInvoice,
    payInvoice,
    rejectInvoice,
    stopRecurringInvoice,
    deleteInvoice,
    searchInvoices,
    getInvoiceChain,
    getTransactionByHash,
    getNFTReceiptById,
    generateRecurringInvoices,
    sendOverdueReminders,
    getInvoicesByWallet,
  };
}
