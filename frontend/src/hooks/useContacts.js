"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";

export function useContacts() {
  const { address } = useAccount();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  // Mock data for demonstration - replace with actual API calls
  const mockContacts = [
    {
      _id: "1",
      fullName: "Alice Johnson",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      email: "alice@example.com",
      label: "Developer",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      fullName: "Bob Smith",
      walletAddress: "0x8ba1f109551bD432803012645Hac136c22C57B",
      email: "bob@example.com",
      label: "Investor",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Load contacts from localStorage (mock implementation)
  const loadContacts = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const storageKey = `contacts_${address}`;
      const storedContacts = localStorage.getItem(storageKey);

      if (storedContacts) {
        const parsedContacts = JSON.parse(storedContacts);
        setContacts(parsedContacts);
        setActiveCount(parsedContacts.filter((c) => c.isActive).length);
      } else {
        // Use mock data for first time
        setContacts(mockContacts);
        setActiveCount(mockContacts.filter((c) => c.isActive).length);
        localStorage.setItem(storageKey, JSON.stringify(mockContacts));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load contacts";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Save contacts to localStorage
  const saveContactsToStorage = useCallback(
    (updatedContacts) => {
      if (!address) return;
      const storageKey = `contacts_${address}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedContacts));
    },
    [address]
  );

  // Create new contact
  const createContact = useCallback(
    async (contactData) => {
      setLoading(true);
      setError(null);

      if (!address) {
        toast.error("Wallet not connected");
        throw new Error("Wallet not connected");
      }

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newContact = {
          _id: Date.now().toString(),
          fullName: contactData.fullName || contactData.name,
          walletAddress: contactData.walletAddress || contactData.address,
          email: contactData.email || "",
          label: contactData.label || "",
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
        setActiveCount((prev) => prev + 1);
        saveContactsToStorage(updatedContacts);

        toast.success("Contact created successfully");
        return newContact;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create contact";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [address, contacts, saveContactsToStorage]
  );

  // Update contact
  const updateContact = useCallback(
    async (id, contactData) => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updatedContact = {
          _id: id,
          fullName: contactData.fullName || contactData.name,
          walletAddress: contactData.walletAddress || contactData.address,
          email: contactData.email || "",
          label: contactData.label || "",
          isActive:
            contactData.isActive !== undefined ? contactData.isActive : true,
          createdAt:
            contacts.find((c) => c._id === id)?.createdAt ||
            new Date().toISOString(),
        };

        const updatedContacts = contacts.map((contact) =>
          contact._id === id ? updatedContact : contact
        );

        setContacts(updatedContacts);
        saveContactsToStorage(updatedContacts);

        toast.success("Contact updated successfully");
        return updatedContact;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update contact";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contacts, saveContactsToStorage]
  );

  // Delete contact
  const deleteContact = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updatedContacts = contacts.filter(
          (contact) => contact._id !== id
        );
        setContacts(updatedContacts);
        setActiveCount((prev) => Math.max(0, prev - 1));
        saveContactsToStorage(updatedContacts);

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
    },
    [contacts, saveContactsToStorage]
  );

  // Search contacts
  const searchContacts = useCallback(
    async (query) => {
      if (!query.trim()) {
        await loadContacts();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        const storageKey = `contacts_${address}`;
        const storedContacts = localStorage.getItem(storageKey);
        const allContacts = storedContacts
          ? JSON.parse(storedContacts)
          : mockContacts;

        const filteredContacts = allContacts.filter(
          (contact) =>
            contact.fullName?.toLowerCase().includes(query.toLowerCase()) ||
            contact.walletAddress
              ?.toLowerCase()
              .includes(query.toLowerCase()) ||
            contact.email?.toLowerCase().includes(query.toLowerCase()) ||
            contact.label?.toLowerCase().includes(query.toLowerCase())
        );

        setContacts(filteredContacts);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search contacts";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [loadContacts, address]
  );

  // Get contact by ID
  const getContactById = useCallback(
    async (id) => {
      try {
        const contact = contacts.find((c) => c._id === id);
        if (!contact) {
          throw new Error("Contact not found");
        }
        return contact;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get contact";
        toast.error(errorMessage);
        throw err;
      }
    },
    [contacts]
  );

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    activeCount,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    loadContacts,
    getContactById,
  };
}
