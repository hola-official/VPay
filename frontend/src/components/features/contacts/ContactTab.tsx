import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, User, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useContactsContext } from "@/contexts/ContactsContext"
import { toast } from "react-toastify"
import type { Worker } from "@/services/api"

export function ContactTab() {
  const { contacts, loading, createContact, updateContact, deleteContact, searchContacts } = useContactsContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Worker | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    fullName: "",
    walletAddress: "",
    email: "",
    label: "",
    isActive: true,
  })

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchContacts(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchContacts])

  const handleAddContact = async () => {
    // Validate required fields
    if (!newContact.fullName.trim()) {
      toast.error("Name is required")
      return
    }
    if (!newContact.walletAddress.trim()) {
      toast.error("Wallet address is required")
      return
    }
    if (!newContact.email.trim()) {
      toast.error("Email is required")
      return
    }

    // Validate wallet address format
    if (!newContact.walletAddress.startsWith("0x") || newContact.walletAddress.length !== 42) {
      toast.error("Invalid wallet address format. Must be a valid Ethereum address (0x...)")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newContact.email)) {
      toast.error("Invalid email format")
      return
    }

    try {
      await createContact(newContact)
      setNewContact({ fullName: "", walletAddress: "", email: "", label: "", isActive: true })
      setIsAddDialogOpen(false)
    } catch {
      // Error is handled by the hook
    }
  }

  const handleEditContact = (contact: Worker) => {
    setEditingContact(contact)
    setNewContact({
      fullName: contact.fullName,
      walletAddress: contact.walletAddress,
      email: contact.email,
      label: contact.label,
      isActive: contact.isActive,
    })
  }

  const handleUpdateContact = async () => {
    if (editingContact) {
      // Validate required fields
      if (!newContact.fullName.trim()) {
        toast.error("Name is required")
        return
      }
      if (!newContact.walletAddress.trim()) {
        toast.error("Wallet address is required")
        return
      }
      if (!newContact.email.trim()) {
        toast.error("Email is required")
        return
      }

      // Validate wallet address format
      if (!newContact.walletAddress.startsWith("0x") || newContact.walletAddress.length !== 42) {
        toast.error("Invalid wallet address format. Must be a valid Ethereum address (0x...)")
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newContact.email)) {
        toast.error("Invalid email format")
        return
      }

      try {
        await updateContact(editingContact._id, newContact)
        setEditingContact(null)
        setNewContact({ fullName: "", walletAddress: "", email: "", label: "", isActive: true })
      } catch {
        // Error is handled by the hook
      }
    }
  }

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContact(id)
    } catch {
      // Error is handled by the hook
    }
  }

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error("Failed to copy address:", err)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
          <p className="text-gray-400">Manage your saved wallet addresses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription className="text-gray-400">
                Save a wallet address for quick access in payments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="John Doe"
                  value={newContact.fullName}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input
                  placeholder="0x..."
                  value={newContact.walletAddress}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, walletAddress: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  placeholder="Developer, Investor, etc."
                  value={newContact.label}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, label: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newContact.isActive}
                  onCheckedChange={(checked) => setNewContact((prev) => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
              <Button
                onClick={handleAddContact}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-white">Loading contacts...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card
              key={contact._id}
              className="bg-black/20 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
                      {contact.fullName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{contact.fullName}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          contact.isActive ? "border-green-500/30 text-green-400" : "border-gray-500/30 text-gray-400"
                        }
                      >
                        {contact.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                      className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact._id)}
                      className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-gray-300 font-mono text-sm">{formatAddress(contact.walletAddress)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contact.walletAddress)}
                      className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      {copiedAddress === contact.walletAddress ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-gray-300 text-sm">{contact.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contact.email)}
                      className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    <Badge
                      variant="outline"
                      className={
                        contact.isActive ? "border-green-500/30 text-green-400" : "border-gray-500/30 text-gray-400"
                      }
                    >
                      {contact.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && contacts.length === 0 && (
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No contacts found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Add your first contact to get started"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription className="text-gray-400">Update contact information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newContact.fullName}
                onChange={(e) => setNewContact((prev) => ({ ...prev, fullName: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                value={newContact.walletAddress}
                onChange={(e) => setNewContact((prev) => ({ ...prev, walletAddress: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={newContact.label}
                onChange={(e) => setNewContact((prev) => ({ ...prev, label: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newContact.isActive}
                onCheckedChange={(checked) => setNewContact((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label>Active</Label>
            </div>
            <Button
              onClick={handleUpdateContact}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              Update Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
