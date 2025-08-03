import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LockIcon as LockClosed, Loader2, BarChart2, HelpCircle, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TokenSelector } from "@/components/shared/TokenSelector"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useContactsContext } from "@/contexts/ContactsContext"
import type { Worker } from "@/services/api"
import type { VestingPreview } from "@/types/vesting"

export function LockTab() {
  const { contacts } = useContactsContext()
  const [lockType, setLockType] = useState<"time" | "vesting">("time")
  const [formData, setFormData] = useState({
    amount: "",
    unlockDate: "",
    description: "",
    isLpToken: false,
    tgeDate: "",
    tgeBps: "2000",
    cycle: "86400",
    cycleBps: "1000",
    recipientAddress: "",
    recipientName: "",
    recipientEmail: "",
  })

  const [selectedToken, setSelectedToken] = useState("USDT")
  const [showHelp, setShowHelp] = useState(false)
  const [vestingDetails, setVestingDetails] = useState<VestingPreview | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Set minimum date to today
  const today = new Date()
  today.setHours(today.getHours() + 1)
  const minDate = today.toISOString().slice(0, 16)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateVestingSchedule = () => {
    if (!formData.amount || !formData.tgeBps || !formData.cycle || !formData.cycleBps) {
      setVestingDetails(null)
      return
    }

    const totalAmount = Number(formData.amount.replace(/,/g, ""))
    const initialReleaseBps = Number(formData.tgeBps)
    const cycleReleaseBps = Number(formData.cycleBps)
    const initialRelease = (totalAmount * initialReleaseBps) / 10000
    const remainingAmount = totalAmount - initialRelease
    const cycleReleaseAmount = (totalAmount * cycleReleaseBps) / 10000

    let totalCycles = 0
    if (cycleReleaseAmount > 0) {
      totalCycles = Math.ceil(remainingAmount / cycleReleaseAmount)
    }

    setVestingDetails({
      initialRelease,
      cycleReleaseAmount,
      totalCycles,
      remainingAmount,
      totalDays: Math.ceil((totalCycles * Number(formData.cycle)) / 86400),
    })
  }

  useEffect(() => {
    if (lockType === "vesting") {
      calculateVestingSchedule()
    }
  }, [formData.amount, formData.tgeBps, formData.cycle, formData.cycleBps, lockType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      console.log("Lock created:", { ...formData, selectedToken, lockType })
    }, 3000)
  }

  const setQuickLockPeriod = (months: number) => {
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    handleInputChange("unlockDate", date.toISOString().slice(0, 16))
  }

  const setCyclePreset = (days: number) => {
    const seconds = days * 86400
    handleInputChange("cycle", seconds.toString())
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

  const selectContact = (contact: Worker) => {
    handleInputChange("recipientAddress", contact.walletAddress)
    handleInputChange("recipientName", contact.fullName)
    handleInputChange("recipientEmail", contact.email)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with Help Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <LockClosed className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Token Lock & Vesting</h1>
            <p className="text-sm sm:text-base text-gray-400 leading-tight">
              Secure your tokens with time-release or gradual vesting schedules
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center justify-center cursor-pointer gap-1 px-3 py-1.5 rounded-lg bg-black/80 border border-white/20 text-white hover:bg-black/60 transition-colors flex-shrink-0 self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm whitespace-nowrap">Help</span>
        </button>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 overflow-hidden"
          >
            <h3 className="text-lg font-medium text-white mb-2">What's the difference?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <LockClosed className="w-5 h-5 text-white" />
                  <h4 className="font-medium text-white">Time Lock</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Locks your tokens until a specific date. All tokens will be released at once when the lock period
                  ends.
                  <span className="block mt-2 font-medium">Best for: Liquidity pools, simple token locks</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-5 h-5 text-white" />
                  <h4 className="font-medium text-white">Vesting</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Gradually releases tokens over time according to a schedule. Includes an initial release followed by
                  periodic releases.
                  <span className="block mt-2 font-medium">Best for: Team tokens, investor allocations</span>
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

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-black/40 p-1 rounded-xl">
        <motion.button
          onClick={() => setLockType("time")}
          className={`flex items-center justify-center cursor-pointer gap-2 px-6 py-3 rounded-lg ${lockType === "time"
            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
            : "bg-transparent text-gray-400 hover:bg-white/10"
            } transition-all flex-1`}
          whileHover={{ scale: lockType !== "time" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          <LockClosed className="w-5 h-5" />
          <span className="font-medium">Time Lock</span>
        </motion.button>
        <motion.button
          onClick={() => setLockType("vesting")}
          className={`flex items-center justify-center cursor-pointer gap-2 px-6 py-3 rounded-lg ${lockType === "vesting"
            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
            : "bg-transparent text-gray-400 hover:bg-white/10"
            } transition-all flex-1`}
          whileHover={{ scale: lockType !== "vesting" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="font-medium">Vesting</span>
        </motion.button>
      </div>

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
              <div className="ml-2 text-white font-medium">Token Details</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/80 text-gray-500 text-sm font-medium">
                2
              </div>
              <div className="ml-2 text-gray-500 font-medium">Lock Settings</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/80 text-gray-500 text-sm font-medium">
                3
              </div>
              <div className="ml-2 text-gray-500 font-medium">Review & Submit</div>
            </div>
          </div>
          <div className="mt-2 h-1 bg-black/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: "33%" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenSelector selectedToken={selectedToken} onTokenSelect={setSelectedToken} showBalance={true} />
            <div className="space-y-2">
              <Label className="text-white">Amount to lock *</Label>
              <Input
                placeholder="1000"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label className="text-white">Recipient Address (optional)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="0x... (defaults to your wallet)"
                  value={formData.recipientAddress}
                  onChange={(e) => handleInputChange("recipientAddress", e.target.value)}
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
                            onSelect={() => selectContact(contact)}
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
            {formData.recipientName && (
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                  Selected: {formData.recipientName} ({formData.recipientEmail})
                </div>
              </div>
            )}
          </div>

          {/* Lock Type Specific Fields */}
          {lockType === "time" && (
            <div className="p-4 rounded-xl bg-black/50 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <LockClosed className="w-4 h-4" />
                Lock Settings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Lock until *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.unlockDate}
                    onChange={(e) => handleInputChange("unlockDate", e.target.value)}
                    min={minDate}
                    className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setQuickLockPeriod(1)}
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    1 Month
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setQuickLockPeriod(6)}
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    6 Months
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setQuickLockPeriod(12)}
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    1 Year
                  </Button>
                </div>
              </div>
            </div>
          )}

          {lockType === "vesting" && (
            <div className="p-4 rounded-xl bg-black/50 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Vesting Schedule
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">TGE Date *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.tgeDate}
                      onChange={(e) => handleInputChange("tgeDate", e.target.value)}
                      min={minDate}
                      className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Initial Release % *</Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={formData.tgeBps}
                        onChange={(e) => handleInputChange("tgeBps", e.target.value)}
                        className="w-full h-2 bg-black/80 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0%</span>
                        <span className="text-white font-medium">{(Number(formData.tgeBps) / 100).toFixed(2)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Release Cycle *</Label>
                    <Input
                      value={formData.cycle}
                      onChange={(e) => handleInputChange("cycle", e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                    />
                    <div className="text-sm text-gray-400">Duration: {formatCycleDuration(Number(formData.cycle))}</div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setCyclePreset(1)}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        Daily
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCyclePreset(30)}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        Monthly
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Release Per Cycle % *</Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={formData.cycleBps}
                        onChange={(e) => handleInputChange("cycleBps", e.target.value)}
                        className="w-full h-2 bg-black/80 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0%</span>
                        <span className="text-white font-medium">{(Number(formData.cycleBps) / 100).toFixed(2)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vesting Preview */}
                <div>
                  {vestingDetails ? (
                    <div className="p-4 bg-black/80 border border-white/20 rounded-xl h-full">
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
                              width: `${Number(formData.tgeBps) / 100}%`,
                              minWidth: "40px",
                            }}
                          >
                            {Number(formData.tgeBps) / 100 >= 10
                              ? `${(Number(formData.tgeBps) / 100).toFixed(0)}%`
                              : ""}
                          </div>
                          <div
                            className="h-full bg-blue-500/30 flex items-center justify-center text-xs text-white/90 font-medium"
                            style={{ width: `${100 - Number(formData.tgeBps) / 100}%` }}
                          >
                            {100 - Number(formData.tgeBps) / 100 >= 30 ? "Vesting Period" : ""}
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>TGE</span>
                          <span>{vestingDetails.totalDays} days</span>
                          <span>Complete</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-black/50">
                          <span className="text-gray-400">Initial Release:</span>
                          <span className="text-white font-medium">
                            {vestingDetails.initialRelease.toLocaleString()} (
                            {(Number(formData.tgeBps) / 100).toFixed(2)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-black/50">
                          <span className="text-gray-400">Per Cycle:</span>
                          <span className="text-white font-medium">
                            {vestingDetails.cycleReleaseAmount.toLocaleString()} (
                            {(Number(formData.cycleBps) / 100).toFixed(2)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-black/50">
                          <span className="text-gray-400">Total Cycles:</span>
                          <span className="text-white font-medium">{vestingDetails.totalCycles}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-black/50">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white font-medium">{vestingDetails.totalDays} days</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/80 border border-white/20 rounded-xl h-full flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Fill in all fields to see the vesting schedule preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white">Description (optional)</Label>
            <Textarea
              placeholder="Optional description for this lock..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <motion.button
              type="submit"
              disabled={isProcessing || !formData.amount || !selectedToken}
              className="cursor-pointer px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {lockType === "time" ? "Locking Tokens..." : "Creating Vesting Schedule..."}
                </span>
              ) : (
                `${lockType === "time" ? "Lock" : "Create Vesting for"} ${selectedToken} Tokens`
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
