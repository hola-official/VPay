import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Users, CheckCircle, Loader2, Calendar, Settings, FileText, HelpCircle, Plus, Minus } from "lucide-react"
import { useTokenLock } from "@/hooks/useTokenLock"
import { useTokenInfo } from "@/hooks/useTokenInfo"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import ContactSelector from "@/components/ContactSelector"

export default function TokenLockForm() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState("single") // 'single', 'multiple'
  const [showHelp, setShowHelp] = useState(false)

  // Token selection state
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSelection, setTokenSelection] = useState("custom")
  const [predefinedTokens] = useState({
    usdt: {
      address: "0xC9592d8D3AA150d62E9638C5588264abFc5D9976",
      name: "Tether USD",
      symbol: "USDT",
      icon: "/usdt.png",
    },
    usdc: {
      address: "0xae6c13C19ff16110BAD54E54280ec1014994631f",
      name: "USD Coin",
      symbol: "USDC",
      icon: "/usdc.png",
    },
  })

  // Single lock state
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [unlockTime, setUnlockTime] = useState("")
  const [lockTitle, setLockTitle] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")

  // Multiple locks state
  const [recipients, setRecipients] = useState([
    { address: "", amount: "", unlockTime: "", title: "", email: "", error: "" },
  ])
  const [csvInput, setCsvInput] = useState("")
  const [showCsvInput, setShowCsvInput] = useState(false)

  // Validation states
  const [errors, setErrors] = useState({})
  const [showTooltip, setShowTooltip] = useState("")

  // Hook instances
  const tokenLock = useTokenLock()
  const { tokenInfo, isLoadingToken, tokenError, fetchTokenInfo } = useTokenInfo(tokenAddress, address)

  // Set minimum date (current time + 5 minutes)
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5)
  const minDateTime = now.toISOString().slice(0, 16)

  // Fetch token info when address changes
  useEffect(() => {
    if (tokenAddress && tokenAddress.length === 42) {
      fetchTokenInfo()
    }
  }, [tokenAddress, fetchTokenInfo])

  const handleTokenAddressChange = (e) => {
    const value = e.target.value
    setTokenAddress(value)

    if (tokenSelection !== "custom") {
      setTokenSelection("custom")
    }

    // Validate address
    if (value && !value.startsWith("0x")) {
      setErrors((prev) => ({
        ...prev,
        tokenAddress: "Address must start with 0x",
      }))
    } else if (value && value.length !== 42) {
      setErrors((prev) => ({
        ...prev,
        tokenAddress: "Address must be 42 characters long",
      }))
    } else {
      setErrors((prev) => ({ ...prev, tokenAddress: "" }))
    }
  }

  const validateSingleLock = () => {
    const newErrors = {}

    if (!tokenAddress) newErrors.tokenAddress = "Token address is required"
    if (!recipient) newErrors.recipient = "Recipient address is required"
    if (!amount || Number.parseFloat(amount) <= 0) newErrors.amount = "Valid amount is required"
    if (!unlockTime) newErrors.unlockTime = "Unlock time is required"

    if (unlockTime && new Date(unlockTime).getTime() <= Date.now()) {
      newErrors.unlockTime = "Unlock time must be in the future"
    }

    if (recipient && (!recipient.startsWith("0x") || recipient.length !== 42)) {
      newErrors.recipient = "Invalid recipient address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateSingleLock = async () => {
    if (!validateSingleLock()) return

    try {
      const result = await tokenLock.performTokenLock(tokenAddress, tokenInfo.decimals, recipient, amount, unlockTime, {
        lockTitle,
        recipientEmail,
      })

      if (result.success) {
        // Reset form
        setRecipient("")
        setAmount("")
        setUnlockTime("")
        setLockTitle("")
        setRecipientEmail("")
      }
    } catch (error) {
      console.error("Error creating lock:", error)
    }
  }

  const handleCreateMultipleLocks = async () => {
    if (!tokenAddress || recipients.length === 0) return

    const validRecipients = recipients.filter((r) => r.address && r.amount && r.unlockTime && !r.error)
    if (validRecipients.length === 0) return

    try {
      const addresses = validRecipients.map((r) => r.address)
      const amounts = validRecipients.map((r) => r.amount)
      const unlockTimes = validRecipients.map((r) => r.unlockTime)
      const titles = validRecipients.map((r) => r.title || "")
      const emails = validRecipients.map((r) => r.email || "")

      const hash = await tokenLock.createMultipleLocks(
        tokenAddress,
        addresses,
        amounts,
        unlockTimes,
        tokenInfo.decimals,
        titles,
        emails,
      )

      if (hash) {
        // Reset form
        setRecipients([{ address: "", amount: "", unlockTime: "", title: "", email: "", error: "" }])
      }
    } catch (error) {
      console.error("Error creating multiple locks:", error)
    }
  }

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "", unlockTime: "", title: "", email: "", error: "" }])
  }

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...recipients]
    newRecipients[index][field] = value

    // Validate
    if (field === "address") {
      if (value && (!value.startsWith("0x") || value.length !== 42)) {
        newRecipients[index].error = "Invalid address format"
      } else {
        newRecipients[index].error = ""
      }
    } else if (field === "amount") {
      if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
        newRecipients[index].error = "Invalid amount"
      } else {
        newRecipients[index].error = ""
      }
    } else if (field === "unlockTime") {
      if (value && new Date(value).getTime() <= Date.now()) {
        newRecipients[index].error = "Unlock time must be in the future"
      } else {
        newRecipients[index].error = ""
      }
    }

    setRecipients(newRecipients)
  }

  const parseCsvInput = () => {
    try {
      const lines = csvInput.trim().split("\n")
      const newRecipients = lines
        .map((line) => {
          const [address, amount, unlockTime, title = "", email = ""] = line.split(",").map((s) => s.trim())
          return {
            address: address || "",
            amount: amount || "",
            unlockTime: unlockTime || "",
            title,
            email,
            error: "",
          }
        })
        .filter((r) => r.address || r.amount || r.unlockTime)

      if (newRecipients.length > 0) {
        setRecipients(newRecipients)
        setCsvInput("")
        setShowCsvInput(false)
      }
    } catch (error) {
      console.error("Error parsing CSV:", error)
    }
  }

  const formatAmount = (amount, decimals) => {
    try {
      return Number(formatUnits(BigInt(amount), decimals)).toLocaleString()
    } catch (error) {
      return Number(amount).toLocaleString()
    }
  }

  const getTotalAmount = () => {
    return recipients.reduce((total, recipient) => {
      const amount = Number(recipient.amount.replace(/,/g, "")) || 0
      return total + amount
    }, 0)
  }

  // Handle contact selection for single recipient
  const handleSingleContactSelect = (contact) => {
    setRecipient(contact.walletAddress)
    if (contact.email) {
      setRecipientEmail(contact.email)
    }
    if (contact.fullName && !lockTitle) {
      setLockTitle(`Token Lock for ${contact.fullName}`)
    }
  }

  // Handle contact selection for multiple recipients
  const handleMultipleContactSelect = (contact, index) => {
    const newRecipients = [...recipients]
    newRecipients[index].address = contact.walletAddress
    newRecipients[index].email = contact.email || ""
    newRecipients[index].title = contact.fullName
    newRecipients[index].error = ""
    setRecipients(newRecipients)
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
            whileHover={{ scale: 1.05 }}
          >
            <Lock className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-[#97CBDC]">Token Lock</h1>
            <p className="text-[#97CBDC]/70">Lock tokens with time-based release</p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/50 text-[#97CBDC] hover:bg-[#0a0a20] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm">Help</span>
        </button>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-[#0a0a20]/80 border border-[#475B74]/50 overflow-hidden"
          >
            <h3 className="text-lg font-medium text-[#97CBDC] mb-2">Token Lock</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <h4 className="font-medium text-[#97CBDC] mb-2">Single Lock</h4>
                <p className="text-sm text-[#97CBDC]/80">
                  Lock tokens for one recipient with a specific unlock time. Perfect for individual agreements or
                  personal token storage.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1D2538]/50 border border-[#475B74]/30">
                <h4 className="font-medium text-[#97CBDC] mb-2">Multiple Locks</h4>
                <p className="text-sm text-[#97CBDC]/80">
                  Create multiple token locks at once with different recipients, amounts, and unlock times. Great for
                  team distributions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-[#0a0a20]/40 p-1 rounded-xl">
        <motion.button
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "single" ? "bg-[#1D2538] text-[#97CBDC] shadow-lg" : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <Lock className="w-5 h-5" />
          <span className="font-medium">Single Lock</span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("multiple")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
            activeTab === "multiple"
              ? "bg-[#1D2538] text-[#97CBDC] shadow-lg"
              : "text-[#97CBDC]/70 hover:bg-[#1D2538]/30"
          } transition-all`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Multiple Locks</span>
        </motion.button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "single" && (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <SingleLockForm
              tokenAddress={tokenAddress}
              tokenSelection={tokenSelection}
              predefinedTokens={predefinedTokens}
              tokenInfo={tokenInfo}
              isLoadingToken={isLoadingToken}
              tokenError={tokenError}
              recipient={recipient}
              amount={amount}
              unlockTime={unlockTime}
              lockTitle={lockTitle}
              recipientEmail={recipientEmail}
              errors={errors}
              showTooltip={showTooltip}
              minDateTime={minDateTime}
              tokenLock={tokenLock}
              onTokenSelectionChange={setTokenSelection}
              onTokenAddressChange={handleTokenAddressChange}
              onRecipientChange={setRecipient}
              onAmountChange={setAmount}
              onUnlockTimeChange={setUnlockTime}
              onLockTitleChange={setLockTitle}
              onRecipientEmailChange={setRecipientEmail}
              onShowTooltip={setShowTooltip}
              onCreateLock={handleCreateSingleLock}
              onContactSelect={handleSingleContactSelect}
            />
          </motion.div>
        )}

        {activeTab === "multiple" && (
          <motion.div
            key="multiple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <MultipleLockForm
              tokenAddress={tokenAddress}
              tokenSelection={tokenSelection}
              predefinedTokens={predefinedTokens}
              tokenInfo={tokenInfo}
              isLoadingToken={isLoadingToken}
              recipients={recipients}
              csvInput={csvInput}
              showCsvInput={showCsvInput}
              errors={errors}
              minDateTime={minDateTime}
              tokenLock={tokenLock}
              onTokenSelectionChange={setTokenSelection}
              onTokenAddressChange={handleTokenAddressChange}
              onAddRecipient={addRecipient}
              onRemoveRecipient={removeRecipient}
              onUpdateRecipient={updateRecipient}
              onCsvInputChange={setCsvInput}
              onShowCsvInputChange={setShowCsvInput}
              onParseCsvInput={parseCsvInput}
              onCreateLocks={handleCreateMultipleLocks}
              onContactSelect={handleMultipleContactSelect}
              getTotalAmount={getTotalAmount}
              formatAmount={formatAmount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Single Lock Form Component
function SingleLockForm({
  tokenAddress,
  tokenSelection,
  predefinedTokens,
  tokenInfo,
  isLoadingToken,
  tokenError,
  recipient,
  amount,
  unlockTime,
  lockTitle,
  recipientEmail,
  errors,
  showTooltip,
  minDateTime,
  tokenLock,
  onTokenSelectionChange,
  onTokenAddressChange,
  onRecipientChange,
  onAmountChange,
  onUnlockTimeChange,
  onLockTitleChange,
  onRecipientEmailChange,
  onShowTooltip,
  onCreateLock,
  onContactSelect,
}) {
  return (
    <div className="p-6 rounded-3xl border border-[#475B74]/50 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] shadow-lg space-y-6">
      {/* Token Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Select Token <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(predefinedTokens).map(([key, token]) => (
            <motion.div
              key={key}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                tokenSelection === key
                  ? "border-[#018ABD] bg-[#018ABD]/10"
                  : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
              }`}
              onClick={() => {
                onTokenSelectionChange(key)
                onTokenAddressChange({ target: { value: token.address } })
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="tokenSelection"
                  checked={tokenSelection === key}
                  onChange={() => {}}
                  className="text-[#018ABD] focus:ring-[#018ABD]/50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <img src={token.icon || "/placeholder.svg"} alt={token.symbol} className="w-8 h-8" />
                    <div>
                      <div className="text-sm font-medium text-[#97CBDC]">{token.symbol}</div>
                      <div className="text-xs text-[#97CBDC]/70">{token.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              tokenSelection === "custom"
                ? "border-[#018ABD] bg-[#018ABD]/10"
                : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
            }`}
            onClick={() => {
              onTokenSelectionChange("custom")
              onTokenAddressChange({ target: { value: "" } })
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="tokenSelection"
                checked={tokenSelection === "custom"}
                onChange={() => {}}
                className="text-[#018ABD] focus:ring-[#018ABD]/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#475B74] to-[#475B74] flex items-center justify-center text-white text-xs font-bold">
                    ?
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#97CBDC]">Custom Token</div>
                    <div className="text-xs text-[#97CBDC]/70">Enter token address</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Custom Token Address Input */}
        <AnimatePresence>
          {tokenSelection === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="relative">
                <input
                  value={tokenAddress}
                  onChange={onTokenAddressChange}
                  placeholder="0x..."
                  className={`w-full bg-[#0a0a20]/80 border ${
                    errors.tokenAddress ? "border-red-500" : tokenInfo ? "border-green-500" : "border-[#475B74]/50"
                  } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                />
                {isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#97CBDC]/70 animate-spin" />
                  </div>
                )}
                {tokenInfo && !isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.tokenAddress && <p className="text-sm text-red-500">{errors.tokenAddress}</p>}
              {tokenError && <p className="text-sm text-red-500">{tokenError}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Info Display */}
        <AnimatePresence>
          {tokenInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center text-[#97CBDC] font-medium">
                  {tokenInfo.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#97CBDC]">{tokenInfo.name}</div>
                  <div className="text-xs text-[#97CBDC]/70">
                    {tokenInfo.symbol} • {tokenInfo.decimals} decimals
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">Your Balance:</div>
                  <div className="text-[#97CBDC] font-medium">{Number(tokenInfo.balance).toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">Total Supply:</div>
                  <div className="text-[#97CBDC] font-medium">{Number(tokenInfo.totalSupply).toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipient and Amount */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#97CBDC]">
            Recipient Address <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <ContactSelector
              onSelect={onContactSelect}
              placeholder="Search contacts or enter address..."
              showEmail={true}
              showLabel={true}
            />
            <input
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder="0x... or use contact selector above"
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.recipient ? "border-red-500" : recipient ? "border-[#018ABD]" : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50`}
            />
          </div>
          {errors.recipient && <p className="text-sm text-red-500">{errors.recipient}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-[#97CBDC]">
              Amount <span className="text-red-500">*</span>
            </label>
            {tokenInfo && (
              <button
                type="button"
                onClick={() => onAmountChange(tokenInfo.balance)}
                className="text-xs px-2 py-1 rounded-md bg-[#018ABD]/20 text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
              >
                Use Max: {Number(tokenInfo.balance).toLocaleString()}
              </button>
            )}
          </div>
          <div className="relative">
            <input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="100000"
              className={`w-full bg-[#0a0a20]/80 border ${
                errors.amount ? "border-red-500" : amount ? "border-[#018ABD]" : "border-[#475B74]/50"
              } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50`}
            />
            {tokenInfo && amount && !errors.amount && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 text-sm">
                {tokenInfo.symbol}
              </div>
            )}
          </div>
          {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
        </div>
      </div>

      {/* Unlock Time */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Unlock Time <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            value={unlockTime}
            onChange={(e) => onUnlockTimeChange(e.target.value)}
            min={minDateTime}
            className={`w-full bg-[#0a0a20]/80 border ${
              errors.unlockTime ? "border-red-500" : unlockTime ? "border-[#018ABD]" : "border-[#475B74]/50"
            } rounded-xl p-3 text-[#97CBDC] focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 w-5 h-5" />
        </div>
        {errors.unlockTime && <p className="text-sm text-red-500">{errors.unlockTime}</p>}
      </div>

      {/* Optional Settings */}
      <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
        <h3 className="text-sm font-medium text-[#97CBDC] mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Optional Settings
        </h3>

        <div className="space-y-4">
          {/* Lock Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#97CBDC]">Lock Title</label>
            <input
              value={lockTitle}
              onChange={(e) => onLockTitleChange(e.target.value)}
              placeholder="My Token Lock"
              className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
            />
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#97CBDC]">Recipient Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={onCreateLock}
          disabled={
            tokenLock.isProcessing ||
            !tokenAddress ||
            !recipient ||
            !amount ||
            !unlockTime ||
            Object.values(errors).some((error) => error)
          }
          className="px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] transition-all duration-300 shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {tokenLock.isProcessing ? (
            <span className="flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {tokenLock.isApproving ? "Approving..." : "Creating Lock..."}
            </span>
          ) : (
            "Create Token Lock"
          )}
        </motion.button>
      </div>
    </div>
  )
}

// Multiple Lock Form Component
function MultipleLockForm({
  tokenAddress,
  tokenSelection,
  predefinedTokens,
  tokenInfo,
  isLoadingToken,
  recipients,
  csvInput,
  showCsvInput,
  errors,
  minDateTime,
  tokenLock,
  onTokenSelectionChange,
  onTokenAddressChange,
  onAddRecipient,
  onRemoveRecipient,
  onUpdateRecipient,
  onCsvInputChange,
  onShowCsvInputChange,
  onParseCsvInput,
  onCreateLocks,
  onContactSelect,
  getTotalAmount,
  formatAmount,
}) {
  return (
    <div className="p-6 rounded-3xl border border-[#475B74]/50 bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] shadow-lg space-y-6">
      {/* Token Selection - Same as Single Lock */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#97CBDC]">
          Select Token <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(predefinedTokens).map(([key, token]) => (
            <motion.div
              key={key}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                tokenSelection === key
                  ? "border-[#018ABD] bg-[#018ABD]/10"
                  : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
              }`}
              onClick={() => {
                onTokenSelectionChange(key)
                onTokenAddressChange({ target: { value: token.address } })
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="tokenSelection"
                  checked={tokenSelection === key}
                  onChange={() => {}}
                  className="text-[#018ABD] focus:ring-[#018ABD]/50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <img src={token.icon || "/placeholder.svg"} alt={token.symbol} className="w-8 h-8" />
                    <div>
                      <div className="text-sm font-medium text-[#97CBDC]">{token.symbol}</div>
                      <div className="text-xs text-[#97CBDC]/70">{token.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              tokenSelection === "custom"
                ? "border-[#018ABD] bg-[#018ABD]/10"
                : "border-[#475B74]/50 bg-[#0a0a20]/50 hover:border-[#018ABD]/50"
            }`}
            onClick={() => {
              onTokenSelectionChange("custom")
              onTokenAddressChange({ target: { value: "" } })
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="tokenSelection"
                checked={tokenSelection === "custom"}
                onChange={() => {}}
                className="text-[#018ABD] focus:ring-[#018ABD]/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#475B74] to-[#475B74] flex items-center justify-center text-white text-xs font-bold">
                    ?
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#97CBDC]">Custom Token</div>
                    <div className="text-xs text-[#97CBDC]/70">Enter token address</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Custom Token Address Input */}
        <AnimatePresence>
          {tokenSelection === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="relative">
                <input
                  value={tokenAddress}
                  onChange={onTokenAddressChange}
                  placeholder="0x..."
                  className={`w-full bg-[#0a0a20]/80 border ${
                    errors.tokenAddress ? "border-red-500" : tokenInfo ? "border-green-500" : "border-[#475B74]/50"
                  } rounded-xl p-3 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50 pr-10`}
                />
                {isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#97CBDC]/70 animate-spin" />
                  </div>
                )}
                {tokenInfo && !isLoadingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.tokenAddress && <p className="text-sm text-red-500">{errors.tokenAddress}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Info Display */}
        <AnimatePresence>
          {tokenInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center text-[#97CBDC] font-medium">
                  {tokenInfo.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#97CBDC]">{tokenInfo.name}</div>
                  <div className="text-xs text-[#97CBDC]/70">
                    {tokenInfo.symbol} • {tokenInfo.decimals} decimals
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">Your Balance:</div>
                  <div className="text-[#97CBDC] font-medium">{Number(tokenInfo.balance).toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0a0a20]/50">
                  <div className="text-[#97CBDC]/70 text-xs mb-1">Total Supply:</div>
                  <div className="text-[#97CBDC] font-medium">{Number(tokenInfo.totalSupply).toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipients Management */}
      <div className="p-4 rounded-xl bg-[#0a0a20]/50 border border-[#475B74]/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#97CBDC] flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recipients ({recipients.length})
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onShowCsvInputChange(!showCsvInput)}
              className="px-3 py-1.5 text-xs bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg text-[#97CBDC] hover:bg-[#0a0a20] hover:border-[#018ABD]/50 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              CSV Import
            </button>
            <button
              type="button"
              onClick={onAddRecipient}
              className="px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Recipient
            </button>
          </div>
        </div>

        {/* CSV Input Section */}
        <AnimatePresence>
          {showCsvInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#97CBDC]">
                  CSV Format: address,amount,unlockTime,title,email (one per line)
                </label>
                <button
                  type="button"
                  onClick={() => onShowCsvInputChange(false)}
                  className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
                >
                  ×
                </button>
              </div>
              <textarea
                value={csvInput}
                onChange={(e) => onCsvInputChange(e.target.value)}
                placeholder={`0x1234...abcd,1000,2024-12-31T23:59,Team Member 1,member1@example.com
0x5678...efgh,2000,2024-12-31T23:59,Team Member 2,member2@example.com
0x9abc...ijkl,1500,2024-12-31T23:59,Team Member 3,member3@example.com`}
                className="w-full h-20 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={onParseCsvInput}
                  className="px-3 py-1.5 text-xs bg-[#018ABD]/20 border border-[#018ABD]/50 rounded-lg text-[#018ABD] hover:bg-[#018ABD]/30 transition-colors"
                >
                  Import CSV
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipients List */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {recipients.map((recipient, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[#97CBDC]/70 min-w-[60px]">#{index + 1}</span>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(index)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors ml-auto"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Contact Selector for each recipient */}
              <div className="mb-2">
                <ContactSelector
                  onSelect={(contact) => onContactSelect(contact, index)}
                  placeholder={`Search contacts for recipient ${index + 1}...`}
                  showEmail={true}
                  showLabel={true}
                  className="mb-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">Address *</label>
                  <input
                    value={recipient.address}
                    onChange={(e) => onUpdateRecipient(index, "address", e.target.value)}
                    placeholder="0x... or use contact selector above"
                    className={`w-full bg-[#0a0a20]/80 border ${
                      recipient.error && recipient.error.includes("address")
                        ? "border-red-500"
                        : recipient.address
                          ? "border-[#018ABD]"
                          : "border-[#475B74]/50"
                    } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">Amount *</label>
                  <div className="relative">
                    <input
                      value={recipient.amount}
                      onChange={(e) => onUpdateRecipient(index, "amount", e.target.value)}
                      placeholder="1000"
                      className={`w-full bg-[#0a0a20]/80 border ${
                        recipient.error && recipient.error.includes("amount")
                          ? "border-red-500"
                          : recipient.amount
                            ? "border-[#018ABD]"
                            : "border-[#475B74]/50"
                      } rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50 pr-12`}
                    />
                    {tokenInfo && recipient.amount && !recipient.error && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70 text-xs">
                        {tokenInfo.symbol}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">Unlock Time *</label>
                  <input
                    type="datetime-local"
                    value={recipient.unlockTime}
                    onChange={(e) => onUpdateRecipient(index, "unlockTime", e.target.value)}
                    min={minDateTime}
                    className={`w-full bg-[#0a0a20]/80 border ${
                      recipient.error && recipient.error.includes("time")
                        ? "border-red-500"
                        : recipient.unlockTime
                          ? "border-[#018ABD]"
                          : "border-[#475B74]/50"
                    } rounded-lg p-2 text-sm text-[#97CBDC] focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">Title (Optional)</label>
                  <input
                    value={recipient.title}
                    onChange={(e) => onUpdateRecipient(index, "title", e.target.value)}
                    placeholder="Team Member"
                    className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#97CBDC]/70 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) => onUpdateRecipient(index, "email", e.target.value)}
                    placeholder="member@example.com"
                    className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-lg p-2 text-sm text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-1 focus:ring-[#018ABD]/50"
                  />
                </div>
              </div>
              {recipient.error && <p className="text-xs text-red-500 mt-1">{recipient.error}</p>}
            </motion.div>
          ))}
        </div>

        {/* Total Summary */}
        {recipients.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-[#0a0a20]/80 border border-[#475B74]/30">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#97CBDC]/70">Total Amount:</span>
              <span className="text-[#97CBDC] font-medium">
                {getTotalAmount().toLocaleString()} {tokenInfo?.symbol || "tokens"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={onCreateLocks}
          disabled={
            tokenLock.isProcessing ||
            !tokenAddress ||
            recipients.length === 0 ||
            recipients.some((r) => !r.address || !r.amount || !r.unlockTime || r.error)
          }
          className="px-8 py-3 h-12 text-white font-medium rounded-xl bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] transition-all duration-300 shadow-lg shadow-[#004581]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {tokenLock.isProcessing ? (
            <span className="flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {tokenLock.isApproving ? "Approving..." : "Creating Locks..."}
            </span>
          ) : (
            `Create ${recipients.length} Token Lock${recipients.length > 1 ? "s" : ""}`
          )}
        </motion.button>
      </div>
    </div>
  )
}
