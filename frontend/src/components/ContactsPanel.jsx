import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Tag,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { FormSection } from "@/components/FormSection";
import { HelpTooltip } from "@/components/HelpTooltip";
import { toast } from "react-toastify";

export function ContactsPanel({ contacts }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    walletAddress: "",
    email: "",
    label: "",
  });
  const [copiedAddress, setCopiedAddress] = useState("");

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopiedAddress(""), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  const openEtherscan = (address) => {
    window.open(`https://etherscan.io/address/${address}`, "_blank");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (contacts.searchContacts) {
      contacts.searchContacts(query);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      walletAddress: "",
      email: "",
      label: "",
    });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.walletAddress.trim()) {
      toast.error("Wallet address is required");
      return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
      toast.error("Invalid wallet address format");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingContact) {
        await contacts.updateContact(editingContact._id, formData);
      } else {
        await contacts.createContact(formData);
      }
      resetForm();
    } catch (error) {
      console.error("Failed to save contact:", error);
      // Error is already handled in the hook with toast
    }
  };

  const handleEdit = (contact) => {
    setFormData({
      fullName: contact.fullName || "",
      walletAddress: contact.walletAddress || "",
      email: contact.email || "",
      label: contact.label || "",
    });
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await contacts.deleteContact(contactId);
      } catch (error) {
        console.error("Failed to delete contact:", error);
        // Error is already handled in the hook with toast
      }
    }
  };

  const filteredContacts = searchQuery
    ? contacts.contacts.filter(
        (contact) =>
          contact.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.walletAddress
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.label?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts.contacts;

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Contacts</p>
              <p className="text-2xl font-bold text-white">
                {contacts.contacts?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Contacts</p>
              <p className="text-2xl font-bold text-white">
                {contacts.activeCount || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Search Results</p>
              <p className="text-2xl font-bold text-white">
                {filteredContacts?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Add Section */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50 shadow-2xl shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                Contact Management
              </span>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search contacts by name, address, email, or label..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>

          {/* Add/Edit Contact Form */}
          {showAddForm && (
            <FormSection
              title={editingContact ? "Edit Contact" : "Add New Contact"}
              description={
                editingContact
                  ? "Update contact information"
                  : "Add a new contact to your address book"
              }
              icon={editingContact ? Edit : Plus}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-slate-300 font-medium text-sm">
                        Full Name *
                      </Label>
                      <HelpTooltip content="Enter the full name of the contact person" />
                    </div>
                    <Input
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-slate-300 font-medium text-sm">
                        Wallet Address *
                      </Label>
                      <HelpTooltip content="Enter the Ethereum wallet address (0x...)" />
                    </div>
                    <Input
                      placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                      value={formData.walletAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          walletAddress: e.target.value,
                        })
                      }
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-slate-300 font-medium text-sm">
                        Email (Optional)
                      </Label>
                      <HelpTooltip content="Contact email address for notifications" />
                    </div>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-slate-300 font-medium text-sm">
                        Label (Optional)
                      </Label>
                      <HelpTooltip content="Add a label to categorize this contact (e.g., Developer, Investor)" />
                    </div>
                    <Input
                      placeholder="Smart Contract Developer"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="submit"
                    disabled={contacts.loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white h-10 sm:h-12"
                  >
                    {contacts.loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          {editingContact ? "Updating..." : "Creating..."}
                        </span>
                      </div>
                    ) : (
                      `${editingContact ? "Update" : "Create"} Contact`
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="border-slate-600/50 text-slate-300 hover:bg-slate-800/50 bg-transparent h-10 sm:h-12"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-xl text-slate-200 flex items-center space-x-2">
            <Users className="w-6 h-6 text-green-400" />
            <span>Your Contacts ({filteredContacts?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Loading contacts...</span>
            </div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {filteredContacts.map((contact) => (
                <Card
                  key={contact._id}
                  className="p-3 sm:p-4 bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60 transition-all duration-300"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                            {contact.fullName}
                          </h3>
                          {contact.label && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs mt-1">
                              <Tag className="w-3 h-3 mr-1" />
                              <span className="truncate">{contact.label}</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                          title="Edit contact"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact._id)}
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-slate-400 text-xs sm:text-sm">
                          Wallet Address
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-slate-300 bg-slate-800/50 px-2 py-1 rounded text-xs font-mono flex-1 truncate">
                          {contact.walletAddress?.slice(0, 6)}...
                          {contact.walletAddress?.slice(-4)}
                        </code>
                        <button
                          onClick={() => copyAddress(contact.walletAddress)}
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
                          title="Copy address"
                        >
                          {copiedAddress === contact.walletAddress ? (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => openEtherscan(contact.walletAddress)}
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
                          title="View on Etherscan"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    {contact.email && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <span className="text-slate-400 text-xs sm:text-sm">
                            Email
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs sm:text-sm truncate">
                          {contact.email}
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                      <Badge
                        className={
                          contact.isActive
                            ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs"
                        }
                      >
                        {contact.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-slate-500 text-xs">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-slate-400 text-lg font-medium mb-2">
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery
                  ? `No contacts match "${searchQuery}"`
                  : "Add your first contact to get started"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
