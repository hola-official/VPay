import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Users,
  Trash2,
  Calendar,
  DollarSign,
  Mail,
  Upload,
  TrendingUp,
  BarChart2,
  HelpCircle,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TokenSelector } from "@/components/shared/TokenSelector"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useContactsContext } from "@/contexts/ContactsContext"
import type { Worker } from "@/services/api"
import type { VestingSettings } from "@/types/vesting"
import type { Recipient } from "@/types/recipient"

export default function InvestorPaymentTab() {
  const { contacts, loading } = useContactsContext()
  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: "1",
      walletAddress: "",
      amount: "",
      email: "",
      contractTitle: "",
    },
  ])

  const [selectedToken, setSelectedToken] = useState("USDT")
  const [vestingSettings, setVestingSettings] = useState<VestingSettings>({
    tgeDate: "",
    tgeBps: "2000", // 20%
    cycle: "2592000", // 30 days
    cycleBps: "1000", // 10%
    description: "",
  })

  const [showHelp, setShowHelp] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vestingPreview, setVestingPreview] = useState(null)

  // Set minimum date to today
  const today = new Date()
  today.setHours(today.getHours() + 1)
  const minDate = today.toISOString().slice(0, 16)

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      walletAddress: "",
      amount: "",
      email: "",
      contractTitle: "",
    }
    setRecipients([...recipients, newRecipient])
  }

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((r) => r.id !== id))
    }
  }

  const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const selectContact = (recipientId: string, contact: Worker) => {
    updateRecipient(recipientId, "contactId", contact._id)
    updateRecipient(recipientId, "walletAddress", contact.walletAddress)
    updateRecipient(recipientId, "name", contact.fullName)
    updateRecipient(recipientId, "email", contact.email)
  }

  const getTotalAmount = () => {
    return recipients.reduce((sum, r) => sum + (Number.parseFloat(r.amount) || 0), 0)
  }

  const calculateVestingPreview = () => {
    if (!vestingSettings.tgeDate || !vestingSettings.tgeBps || !vestingSettings.cycle || !vestingSettings.cycleBps) {
      setVestingPreview(null)
      return
    }

    const totalAmount = getTotalAmount()
    const initialReleaseBps = Number(vestingSettings.tgeBps)
    const cycleReleaseBps = Number(vestingSettings.cycleBps)
    const initialRelease = (totalAmount * initialReleaseBps) / 10000
    const remainingAmount = totalAmount - initialRelease
    const cycleReleaseAmount = (totalAmount * cycleReleaseBps) / 10000

    let totalCycles = 0
    if (cycleReleaseAmount > 0) {
      totalCycles = Math.ceil(remainingAmount / cycleReleaseAmount)
    }

    setVestingPreview({
      initialRelease,
      cycleReleaseAmount,
      totalCycles,
      remainingAmount,
      totalDays: Math.ceil((totalCycles * Number(vestingSettings.cycle)) / 86400),
    })
  }

  useEffect(() => {
    calculateVestingPreview()
  }, [vestingSettings, recipients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      console.log("Investor payment created:", { recipients, vestingSettings, selectedToken })
    }, 3000)
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("Processing CSV file:", file.name)
      // Handle CSV parsing here
    }
  }

  const formatCycleDuration = (seconds: number) => {
    if (!seconds) return "N/A"
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""}`
    }
  }

  const setQuickTgePeriod = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setVestingSettings((prev) => ({ ...prev, tgeDate: date.toISOString().slice(0, 16) }))
  }

  const setCyclePreset = (days: number) => {
    const seconds = days * 86400
    setVestingSettings((prev) => ({ ...prev, cycle: seconds.toString() }))
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header with Help Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Investor Payments</h1>
            <p className="text-sm sm:text-base text-gray-400 leading-tight">
              Create vesting schedules for multiple investors with email notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            {recipients.length} Recipients
          </Badge>
          <Badge variant="outline" className="border-green-500/30 text-green-400">
            {getTotalAmount().toLocaleString()} {selectedToken}
          </Badge>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center justify-center cursor-pointer gap-1 px-3 py-1.5 rounded-lg bg-black/80 border border-white/20 text-white hover:bg-black/60 transition-colors flex-shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm whitespace-nowrap">Help</span>
          </button>
        </div>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-black/80 border border-white/20 overflow-hidden"
          >
            <h3 className="text-lg font-medium text-white mb-2">Investor Vesting System</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <h4 className="font-medium text-white">Multi-Investor Vesting</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Create vesting schedules for multiple investors simultaneously. Each investor gets their own
                  customizable vesting contract with email notifications.
                  <span className="block mt-2 font-medium">Best for: Seed rounds, Series A/B, token sales</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-5 h-5 text-white" />
                  <h4 className="font-medium text-white">Flexible Vesting</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Configure TGE (Token Generation Event) release percentage and periodic release cycles. Perfect for
                  investor protection and token distribution.
                  <span className="block mt-2 font-medium">Features: TGE release, periodic unlocks, email alerts</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-3 text-sm text-blue-400 hover:text-white transition-colors"
            >
              Got it, thanks!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="p-6 rounded-3xl border border-white/20 bg-gradient-to-b from-black/60 to-black/80 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium">
                1
              </div>
              <div className="ml-2 text-white font-medium">Token Setup</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${selectedToken && vestingSettings.tgeDate ? "bg-blue-500 text-white" : "bg-black/80 text-gray-500"
                  } text-sm font-medium`}
              >
                2
              </div>
              <div
                className={`ml-2 ${selectedToken && vestingSettings.tgeDate ? "text-white" : "text-gray-500"
                  } font-medium`}
              >
                Vesting Schedule
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${recipients.some((r) => r.walletAddress && r.amount)
                    ? "bg-blue-500 text-white"
                    : "bg-black/80 text-gray-500"
                  } text-sm font-medium`}
              >
                3
              </div>
              <div
                className={`ml-2 ${recipients.some((r) => r.walletAddress && r.amount) ? "text-white" : "text-gray-500"
                  } font-medium`}
              >
                Investor Details
              </div>
            </div>
          </div>
          <div className="mt-2 h-1 bg-black/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{
                width: recipients.some((r) => r.walletAddress && r.amount)
                  ? "100%"
                  : selectedToken && vestingSettings.tgeDate
                    ? "66%"
                    : "33%",
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Selection & Vesting Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Selection */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Token Setup
              </h3>
              <TokenSelector selectedToken={selectedToken} onTokenSelect={setSelectedToken} showBalance={true} />
            </div>

            {/* Vesting Settings */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Vesting Schedule
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">TGE Date *</Label>
                  <Input
                    type="datetime-local"
                    value={vestingSettings.tgeDate}
                    onChange={(e) => setVestingSettings((prev) => ({ ...prev, tgeDate: e.target.value }))}
                    min={minDate}
                    className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setQuickTgePeriod(1)}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      Tomorrow
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setQuickTgePeriod(7)}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      1 Week
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setQuickTgePeriod(30)}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      1 Month
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-white">TGE Release %</Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={vestingSettings.tgeBps}
                        onChange={(e) => setVestingSettings((prev) => ({ ...prev, tgeBps: e.target.value }))}
                        className="w-full h-2 bg-black/80 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="text-center text-white font-medium">
                        {(Number(vestingSettings.tgeBps) / 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Cycle Release %</Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={vestingSettings.cycleBps}
                        onChange={(e) => setVestingSettings((prev) => ({ ...prev, cycleBps: e.target.value }))}
                        className="w-full h-2 bg-black/80 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="text-center text-white font-medium">
                        {(Number(vestingSettings.cycleBps) / 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Release Cycle (seconds)</Label>
                  <Input
                    value={vestingSettings.cycle}
                    onChange={(e) => setVestingSettings((prev) => ({ ...prev, cycle: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                  />
                  <div className="text-sm text-gray-400">
                    Duration: {formatCycleDuration(Number(vestingSettings.cycle))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setCyclePreset(30)}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      Monthly
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCyclePreset(90)}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      Quarterly
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investor Details */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Investor Details
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10 bg-transparent"
                  onClick={() => document.getElementById("csv-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
                <input id="csv-upload" type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                <Button
                  type="button"
                  onClick={addRecipient}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Investor
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {recipients.map((recipient, index) => (
                <div key={recipient.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      Investor #{index + 1}
                    </h4>
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipient(recipient.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Investment Amount *</Label>
                      <div className="relative">
                        <Input
                          placeholder="10000"
                          value={recipient.amount}
                          onChange={(e) => updateRecipient(recipient.id, "amount", e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 pr-16"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          {selectedToken}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Investor Wallet Address *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="0x... or search contacts"
                            value={recipient.walletAddress}
                            onChange={(e) => updateRecipient(recipient.id, "walletAddress", e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                          />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 bg-black/80 backdrop-blur-xl border border-white/10">
                            <Command>
                              <CommandInput placeholder="Search contacts..." className="text-white" />
                              <CommandList>
                                <CommandEmpty className="text-gray-400 p-4">No contacts found.</CommandEmpty>
                                <CommandGroup>
                                  {contacts.map((contact) => (
                                                                      <CommandItem
                                    key={contact._id}
                                    onSelect={() => selectContact(recipient.id, contact)}
                                    className="text-white hover:bg-white/10 cursor-pointer p-3"
                                  >
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                                          {contact.fullName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium">{contact.fullName}</p>
                                          <p className="text-xs text-gray-400">{contact.email}</p>
                                          <p className="text-xs text-gray-500">
                                            {contact.walletAddress.slice(0, 8)}...{contact.walletAddress.slice(-6)}
                                          </p>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {recipient.name && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="border-green-500/30 text-green-400">
                            {recipient.name} ({recipient.email})
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Contract Title (optional)</Label>
                      <Input
                        placeholder="e.g., Seed Investment, Series A"
                        value={recipient.contractTitle}
                        onChange={(e) => updateRecipient(recipient.id, "contractTitle", e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address (optional)
                      </Label>
                      <Input
                        type="email"
                        placeholder="investor@example.com"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(recipient.id, "email", e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vesting Preview */}
          {vestingPreview && (
            <div className="p-4 rounded-xl bg-black/50 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Vesting Schedule Preview
              </h3>

              {/* Visual Timeline */}
              <div className="mb-4">
                <div className="h-6 bg-black/80 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${Number(vestingSettings.tgeBps) / 100}%`,
                      minWidth: "40px",
                    }}
                  >
                    {Number(vestingSettings.tgeBps) / 100 >= 10
                      ? `${(Number(vestingSettings.tgeBps) / 100).toFixed(0)}%`
                      : ""}
                  </div>
                  <div
                    className="h-full bg-blue-500/30 flex items-center justify-center text-xs text-white/90 font-medium"
                    style={{ width: `${100 - Number(vestingSettings.tgeBps) / 100}%` }}
                  >
                    {100 - Number(vestingSettings.tgeBps) / 100 >= 30 ? "Vesting Period" : ""}
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>TGE</span>
                  <span>{vestingPreview.totalDays} days</span>
                  <span>Complete</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Initial Release:</div>
                  <div className="text-white font-medium">
                    {vestingPreview.initialRelease.toLocaleString()} {selectedToken}
                  </div>
                  <div className="text-blue-400 text-xs">{(Number(vestingSettings.tgeBps) / 100).toFixed(2)}%</div>
                </div>
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Per Cycle:</div>
                  <div className="text-white font-medium">
                    {vestingPreview.cycleReleaseAmount.toLocaleString()} {selectedToken}
                  </div>
                  <div className="text-blue-400 text-xs">{(Number(vestingSettings.cycleBps) / 100).toFixed(2)}%</div>
                </div>
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Total Cycles:</div>
                  <div className="text-white font-medium">{vestingPreview.totalCycles}</div>
                </div>
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Duration:</div>
                  <div className="text-white font-medium">{vestingPreview.totalDays} days</div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {recipients.some((r) => r.walletAddress && r.amount) && (
            <div className="p-3 rounded-lg bg-black/80 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-yellow-500">Important:</span> This will create vesting schedules for
                  all investors. Make sure all details are correct as vesting schedules cannot be modified once
                  deployed.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <motion.button
              type="submit"
              disabled={
                isProcessing ||
                !selectedToken ||
                !vestingSettings.tgeDate ||
                !vestingSettings.tgeBps ||
                !vestingSettings.cycle ||
                !vestingSettings.cycleBps ||
                !recipients.some((r) => r.walletAddress && r.amount)
              }
              className="cursor-pointer px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <motion.div
                    className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Creating Investor Vesting Schedules...
                </span>
              ) : (
                `Deploy Investor Vesting (${recipients.length} investors)`
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
