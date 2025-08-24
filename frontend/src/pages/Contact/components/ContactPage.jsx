import { useState, useEffect } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useAccount } from "wagmi";
import {
  Search,
  Users,
  User,
  Mail,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Save,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { createAvatar } from "@dicebear/core";
import { personas } from "@dicebear/collection";

export default function ContactPage() {
  const DicebearPersonaAvatar = ({ address, size = 80 }) => {
    const avatarUri = createAvatar(personas, {
      seed: (address || "").toLowerCase(),
      scale: 90,
      radius: 50,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    }).toDataUri();

    return (
      <img
        src={avatarUri}
        width={size}
        height={size}
        alt={`${address?.slice(0, 6) || ""}...${address?.slice(-4) || ""} avatar`}
        className="rounded-full"
      />
    );
  };
  const { address: userAddress } = useAccount();
  const {
    contacts,
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    importContacts,
    exportContacts,
  } = useContacts();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    fullName: "",
    walletAddress: "",
    email: "",
    label: "",
    isActive: true,
  });

  // Filter contacts based on search term
  useEffect(() => {
    const filterContacts = async () => {
      if (!searchTerm.trim()) {
        setFilteredContacts(contacts);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchContacts(searchTerm);
        setFilteredContacts(results);
      } catch {
        // Fallback to local filtering
        const filtered = contacts.filter((contact) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            contact.fullName.toLowerCase().includes(searchLower) ||
            contact.walletAddress.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower) ||
            contact.label?.toLowerCase().includes(searchLower)
          );
        });
        setFilteredContacts(filtered);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(filterContacts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, contacts, searchContacts]);

  const handleAddContact = () => {
    setFormData({
      fullName: "",
      walletAddress: "",
      email: "",
      label: "",
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleEditContact = (contact) => {
    setFormData({
      fullName: contact.fullName,
      walletAddress: contact.walletAddress,
      email: contact.email || "",
      label: contact.label || "",
      isActive: contact.isActive !== false,
    });
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleDeleteContact = async (contact) => {
    if (
      window.confirm(`Are you sure you want to delete ${contact.fullName}?`)
    ) {
      try {
        await deleteContact(contact._id || contact.id);
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userAddress || !formData) throw Error("User address is required");

    try {
      if (editingContact) {
        // console.log("editingContact", editingContact);
        // console.log("formData", formData);
        await updateContact(editingContact._id || editingContact.id, formData);
      } else {
        await createContact(formData);
      }

      setShowAddModal(false);
      setEditingContact(null);
      setFormData({
        fullName: "",
        walletAddress: "",
        email: "",
        label: "",
        isActive: true,
      });
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) return;

    setIsImporting(true);
    try {
      const result = await importContacts(importData);
      alert(`Imported ${result.imported} contacts successfully!`);
      setShowImportModal(false);
      setImportData("");
    } catch (error) {
      alert("Error importing contacts: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const validateWalletAddress = (address) => {
    return address.startsWith("0x") && address.length === 42;
  };
  console.log("contacts", contacts);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a20] to-[#1a1a3a] text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#97CBDC] mb-2">
            Contact Management
          </h1>
          <p className="text-[#97CBDC]/70">
            Manage your contacts and wallet addresses
          </p>
          {!userAddress && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400 text-sm">
                ⚠️ Please connect your wallet to manage contacts
              </p>
            </div>
          )}
        </div>

        {/* Stats and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1D2538]/50 border border-[#475B74]/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#97CBDC]/70 text-sm">Total Contacts</p>
                <p className="text-2xl font-bold text-[#97CBDC]">
                  {contacts.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-[#018ABD]" />
            </div>
          </div>

          <div className="bg-[#1D2538]/50 border border-[#475B74]/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#97CBDC]/70 text-sm">Active Contacts</p>
                <p className="text-2xl font-bold text-[#97CBDC]">
                  {contacts.filter((c) => c.isActive !== false).length}
                </p>
              </div>
              <User className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={handleAddContact}
              className="flex-1 bg-[#018ABD] hover:bg-[#018ABD]/80 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Contact
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-3 bg-[#1D2538] hover:bg-[#1D2538]/80 border border-[#475B74]/50 rounded-xl transition-colors"
              title="Import CSV"
            >
              <Upload className="w-5 h-5" />
            </button>

            <button
              onClick={exportContacts}
              className="px-4 py-3 bg-[#1D2538] hover:bg-[#1D2538]/80 border border-[#475B74]/50 rounded-xl transition-colors"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts by name, wallet address, or email..."
              className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-4 pl-12 pr-4 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
            />
            {(isLoading || isSearching) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-[#97CBDC]/70 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Contacts Grid */}
        <div className="bg-[#1D2538]/30 border border-[#475B74]/30 rounded-xl">
          {isLoading && contacts.length === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#97CBDC]" />
              <p className="text-[#97CBDC]/70">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-[#97CBDC]/50" />
              <h3 className="text-lg font-medium text-[#97CBDC] mb-2">
                No contacts found
              </h3>
              <p className="text-[#97CBDC]/70 mb-4">
                {searchTerm
                  ? "No contacts match your search"
                  : "Get started by adding your first contact"}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAddContact}
                  className="bg-[#018ABD] hover:bg-[#018ABD]/80 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Add Your First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredContacts.map((contact) => (
                  <Motion.div
                    key={contact._id || contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full rounded-xl bg-[#1D2538]/50 border border-[#475B74]/30 p-4 hover:bg-[#0a0a20]/40 hover:border-[#018ABD]/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0 items-center">
                        <div className="flex flex-col gap-3 mb-2 sm:mb-3">
                          <DicebearPersonaAvatar
                            address={contact.walletAddress}
                            size={80}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#97CBDC] text-sm sm:text-base truncate">
                              {contact.fullName}
                            </h3>
                            {contact.label && (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-[#018ABD]/20 text-[#018ABD] mt-1">
                                {contact.label}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#97CBDC]/70 text-xs sm:text-sm font-mono bg-[#0a0a20]/50 px-2 py-1 rounded-lg truncate">
                              {contact.walletAddress}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(contact.walletAddress)
                              }
                              className="text-[#97CBDC]/50 hover:text-[#97CBDC] transition-colors"
                              title="Copy address"
                            >
                              {copiedAddress === contact.walletAddress ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-[#97CBDC]/50" />
                              <span className="text-xs sm:text-sm text-[#97CBDC]/70 truncate">
                                {contact.email}
                              </span>
                            </div>
                          )}

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              contact.isActive !== false
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                contact.isActive !== false
                                  ? "bg-green-400"
                                  : "bg-gray-400"
                              }`}
                            />
                            {contact.isActive !== undefined &&
                            contact.isActive !== null
                              ? contact.isActive
                                ? "Active"
                                : "Inactive"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-start">
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="p-2 text-[#97CBDC]/70 hover:text-[#97CBDC] hover:bg-[#0a0a20]/50 rounded-lg transition-colors"
                          title="Edit contact"
                        >
                          <Edit className="w-4 h-4 cursor-pointer" />
                        </button>
                        <button
                          onClick={() => setDeletingContact(contact)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4 cursor-pointer" />
                        </button>
                      </div>
                    </div>
                  </Motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddModal && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1D2538] border border-[#475B74]/50 rounded-xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#97CBDC]">
                    {editingContact ? "Edit Contact" : "Add New Contact"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingContact(null);
                    }}
                    className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                  >
                    <X className="w-5 h-5 cursor-pointer" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                      className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                      Wallet Address *
                    </label>
                    <input
                      type="text"
                      value={formData.walletAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          walletAddress: e.target.value,
                        })
                      }
                      required
                      className={`w-full bg-[#0a0a20]/80 border rounded-lg p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 ${
                        formData.walletAddress &&
                        !validateWalletAddress(formData.walletAddress)
                          ? "border-red-500"
                          : "border-[#475B74]/50"
                      }`}
                      placeholder="0x..."
                    />
                    {formData.walletAddress &&
                      !validateWalletAddress(formData.walletAddress) && (
                        <p className="text-red-400 text-xs mt-1">
                          Invalid wallet address format
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                      Label
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                      className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
                      placeholder="e.g., Developer, Designer, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                      Active Status
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive === true}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              isActive: formData.isActive !== true ? true : false,
                            })
                          }
                          className="sr-only peer"
                          aria-checked={formData.isActive === true}
                        />
                        <div className="w-11 h-6 bg-[#475B74]/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#018ABD]/50 rounded-full peer-checked:bg-[#018ABD] transition-colors"></div>
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        <span className="ml-3 text-sm text-[#97CBDC]">
                          {formData.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </div>
                    <p className="text-[#97CBDC]/60 text-xs mt-1">
                      Active contacts will be available for selection in other
                      parts of the app
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingContact(null);
                      }}
                      className="flex-1 px-4 py-3 bg-[#1D2538] hover:bg-[#1D2538]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !formData.fullName ||
                        !formData.walletAddress ||
                        !formData.email ||
                        !validateWalletAddress(formData.walletAddress)
                      }
                      className="flex-1 px-4 py-3 bg-[#018ABD] hover:bg-[#018ABD]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {editingContact ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingContact && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1D2538] border border-[#475B74]/50 rounded-xl p-6 w-full max-w-md"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#97CBDC] mb-2">
                    Delete Contact
                  </h3>
                  <p className="text-[#97CBDC]/70 mb-6">
                    Are you sure you want to delete{" "}
                    <strong>{deletingContact.fullName}</strong>? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeletingContact(null)}
                      className="flex-1 px-4 py-3 bg-[#1D2538] hover:bg-[#1D2538]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await handleDeleteContact(deletingContact);
                        setDeletingContact(null);
                      }}
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        <AnimatePresence>
          {showImportModal && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1D2538] border border-[#475B74]/50 rounded-xl p-6 w-full max-w-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#97CBDC]">
                    Import Contacts
                  </h2>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportData("");
                    }}
                    className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#97CBDC] mb-2">
                      CSV Data
                    </label>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={8}
                      className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 resize-none font-mono text-sm"
                      placeholder="Paste CSV data here...&#10;Format: Name,Address,Email,Label,Active&#10;Example:&#10;John Doe,0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6,john@example.com,Developer,true"
                    />
                  </div>

                  <div className="text-xs text-[#97CBDC]/70 bg-[#0a0a20]/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">CSV Format:</p>
                    <p>Name, Address, Email, Label, Active</p>
                    <p className="mt-1">
                      Note: Address, Name, and Email are required. Label and
                      Active status are optional. Active can be "true", "1",
                      "active" for active contacts, or "false", "0", "inactive"
                      for inactive contacts.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportData("");
                      }}
                      className="flex-1 px-4 py-3 bg-[#1D2538] hover:bg-[#1D2538]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importData.trim() || isImporting}
                      className="flex-1 px-4 py-3 bg-[#018ABD] hover:bg-[#018ABD]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
