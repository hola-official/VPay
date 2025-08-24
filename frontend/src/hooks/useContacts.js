import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

const BASE_URL =
  import.meta.env.VITE_SERVER_URL ||
  "https://v-pay-backend.vercel.app/api/workers";

export function useContacts() {
  const { address: userAddress } = useAccount();
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Load contacts from API
  const loadContacts = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}?savedBy=${userAddress}`);
      setContacts(response.data || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load contacts"
      );
      console.error("Error loading contacts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Create a new contact
  const createContact = async (contactData) => {
    if (!userAddress) throw new Error("User address is required");

    setIsLoading(true);
    setError(null);

    try {
      const newContact = {
        ...contactData,
        savedBy: userAddress,
        isActive: contactData.isActive !== false,
      };

      console.log("Creating contact with data:", newContact);
      console.log("User address:", userAddress);

      const response = await makeRequest(`${BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(newContact),
      });

      console.log("Create contact response:", response);

      if (response.success && response.data) {
        setContacts((prev) => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create contact");
      }
    } catch (error) {
      console.error("Create contact error:", error);

      // Handle specific error messages
      let errorMessage = "Failed to create contact";
      if (error.message.includes("wallet address already exists")) {
        errorMessage = "A contact with this wallet address already exists";
      } else if (error.message.includes("email address already exists")) {
        errorMessage = "A contact with this email address already exists";
      } else if (
        error.message.includes("Invalid worker wallet address format")
      ) {
        errorMessage =
          "Invalid wallet address format. Must start with 0x and be 42 characters long";
      } else if (
        error.message.includes("Invalid savedBy wallet address format")
      ) {
        errorMessage = "Invalid user wallet address format";
      } else {
        errorMessage = error.message || "Failed to create contact";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing contact
  const updateContact = async (contactId, contactData) => {
    if (!userAddress) throw new Error("User address is required");

    setIsLoading(true);
    setError(null);

    try {
      const updatedContact = {
        ...contactData,
        savedBy: userAddress,
        isActive: true,
      };

      const response = await makeRequest(`${BASE_URL}/${contactId}`, {
        method: "PUT",
        body: JSON.stringify(updatedContact),
      });

      if (response.success && response.data) {
        setContacts((prev) =>
          prev.map((contact) =>
            (contact._id || contact.id) === contactId ? response.data : contact
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update contact");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update contact"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a contact
  const deleteContact = async (contactId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`${BASE_URL}/${contactId}`, {
        method: "DELETE",
      });

      if (response.success) {
        setContacts((prev) =>
          prev.filter((contact) => (contact._id || contact.id) !== contactId)
        );
        return true;
      } else {
        throw new Error(response.message || "Failed to delete contact");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete contact"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Search contacts
  const searchContacts = async (query) => {
    if (!query.trim()) return contacts;

    setIsLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `${BASE_URL}/search?q=${encodeURIComponent(query)}`
      );

      // Filter results to only show contacts saved by current user
      const userContacts = (response.data || []).filter(
        (contact) => contact.savedBy === userAddress
      );

      return userContacts;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to search contacts"
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Import contacts from CSV data
  const importContacts = async (csvData) => {
    if (!userAddress) throw new Error("User address is required");

    setIsLoading(true);
    setError(null);

    try {
      const lines = csvData.trim().split("\n");
      const newContacts = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        // Skip header
        try {
          const values = lines[i]
            .split(",")
            .map((v) => v.replace(/"/g, "").trim());

          if (values.length >= 2) {
            const contact = {
              fullName: values[0] || `Contact ${i}`,
              walletAddress: values[1],
              email: values[2] || `contact${i}@example.com`,
              label: values[3] || "",
              isActive:
                values[4] === "true" ||
                values[4] === "1" ||
                values[4] === "active" ||
                true,
            };

            // Validate address
            if (
              contact.walletAddress.startsWith("0x") &&
              contact.walletAddress.length === 42
            ) {
              // Check for duplicates in existing contacts
              const isDuplicate =
                contacts.some(
                  (c) =>
                    c.walletAddress.toLowerCase() ===
                    contact.walletAddress.toLowerCase()
                ) ||
                newContacts.some(
                  (c) =>
                    c.walletAddress.toLowerCase() ===
                    contact.walletAddress.toLowerCase()
                );

              if (!isDuplicate) {
                const createdContact = await createContact(contact);
                newContacts.push(createdContact);
              }
            } else {
              errors.push(`Line ${i + 1}: Invalid wallet address`);
            }
          }
        } catch (error) {
          errors.push(
            `Line ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (errors.length > 0) {
        console.warn("Import errors:", errors);
      }

      return {
        imported: newContacts.length,
        errors: errors.length,
        errorMessages: errors,
      };
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to import contacts"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Export contacts to CSV format
  const exportContacts = () => {
    const csvContent = [
      "Name,Address,Email,Label,Active",
      ...contacts.map(
        (contact) =>
          `"${contact.fullName}","${contact.walletAddress}","${contact.email || ""}","${contact.label || ""}","${contact.isActive !== false ? "true" : "false"}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get contacts count
  const getContactsCount = async () => {
    if (!userAddress) return 0;

    try {
      const response = await makeRequest(`${BASE_URL}/count/${userAddress}`);
      return response.data?.count || 0;
    } catch (error) {
      console.error("Error getting contacts count:", error);
      return contacts.length;
    }
  };

  // Load contacts when user address changes
  useEffect(() => {
    if (userAddress) {
      loadContacts();
    } else {
      setContacts([]);
    }
  }, [userAddress, loadContacts]);

  return {
    contacts,
    isLoading,
    error,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    importContacts,
    exportContacts,
    getContactsCount,
  };
}
