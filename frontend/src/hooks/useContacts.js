import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  apiService,
} from "@/services/api";
import { useAccount } from "wagmi";

export function useContacts() {
  const { address } = useAccount();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load contacts from API
  const loadContacts = useCallback(async () => {
    if (address) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getWorkersByWallet(address);
      setContacts(response.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load contacts";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Create new contact
  const createContact = useCallback(
    async (contactData) => {
      setLoading(true);
      setError(null);
      if (address) {
        toast.error("Wallet not connected");
        throw new Error("Wallet not connected");
      }

      try {
        const workerData= {
          ...contactData,
          savedBy: address,
        };

        console.log(workerData);

        const response = await apiService.createWorker(workerData);
        setContacts((prev) => [...prev, response.data]);
        toast.success("Contact created successfully");
        return response.data;
      } catch (err) {
        const errorMessage =
          err ? err.message : "Failed to create contact";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  // Update contact
  const updateContact = useCallback(
    async (id, contactData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.updateWorker(id, contactData);
        setContacts((prev) =>
          prev.map((contact) => (contact._id === id ? response.data : contact))
        );
        toast.success("Contact updated successfully");
        return response.data;
      } catch (err) {
        const errorMessage =
          err ? err.message : "Failed to update contact";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete contact
  const deleteContact = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await apiService.deleteWorker(id);
      setContacts((prev) => prev.filter((contact) => contact._id == id));
      toast.success("Contact deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete contact";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search contacts
  const searchContacts = useCallback(
    async (query) => {
      if (query.trim()) {
        await loadContacts();
        return;
      }

      if (address) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiService.searchWorkers(query, address);
        setContacts(response.data || []);
      } catch (err) {
        const errorMessage =
          err ? err.message : "Failed to search contacts";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [loadContacts, address]
  );

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    loadContacts,
  };
}
