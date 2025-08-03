"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Users, Trash2, Upload, Building2, BarChart2, HelpCircle, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TokenSelector } from "@/components/shared/TokenSelector"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Employee, PayrollSettings } from "@/types/employee"
import { useContactsContext } from "@/contexts/ContactsContext"
import type { Worker } from "@/services/api"

export default function CompanyPayrollTab() {
  const { contacts, loading } = useContactsContext()
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "1",
      walletAddress: "",
      position: "",
      department: "",
      salaryAmount: "",
      vestingSchedule: "MONTHLY",
      autoClaim: true,
      cancelPermission: "SENDER_ONLY",
      changeRecipientPermission: "SENDER_ONLY",
    },
  ])

  const [selectedToken, setSelectedToken] = useState("USDT")
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    startDate: "",
    endDate: "",
    unlockSchedule: "MONTHLY",
    companyName: "",
    payrollDescription: "",
  })

  const [showHelp, setShowHelp] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [payrollPreview, setPayrollPreview] = useState(null)

  // Set minimum date to today
  const today = new Date()
  today.setHours(today.getHours() + 1)
  const minDate = today.toISOString().slice(0, 16)

  const addEmployee = () => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      walletAddress: "",
      position: "",
      department: "",
      salaryAmount: "",
      vestingSchedule: "MONTHLY",
      autoClaim: true,
      cancelPermission: "SENDER_ONLY",
      changeRecipientPermission: "SENDER_ONLY",
    }
    setEmployees([...employees, newEmployee])
  }

  const removeEmployee = (id: string) => {
    if (employees.length > 1) {
      setEmployees(employees.filter((e) => e.id !== id))
    }
  }

  const updateEmployee = (id: string, field: keyof Employee, value: string | boolean) => {
    setEmployees(employees.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const selectContact = (employeeId: string, contact: Worker) => {
    updateEmployee(employeeId, "contactId", contact._id)
    updateEmployee(employeeId, "walletAddress", contact.walletAddress)
    updateEmployee(employeeId, "name", contact.fullName)
    updateEmployee(employeeId, "email", contact.email)
    // Also auto-fill position if the contact has a label that could be used as position
    if (contact.label) {
      updateEmployee(employeeId, "position", contact.label)
    }
  }

  const getTotalSalary = () => {
    return employees.reduce((sum, e) => sum + (Number.parseFloat(e.salaryAmount) || 0), 0)
  }

  const calculatePayrollPreview = () => {
    if (!payrollSettings.startDate || !payrollSettings.endDate || employees.length === 0) {
      setPayrollPreview(null)
      return
    }

    const startDate = new Date(payrollSettings.startDate)
    const endDate = new Date(payrollSettings.endDate)
    const totalDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    let intervalDays = 30 // Monthly default
    if (payrollSettings.unlockSchedule === "QUARTERLY") intervalDays = 90
    if (payrollSettings.unlockSchedule === "YEARLY") intervalDays = 365

    const totalPayments = Math.ceil(totalDuration / intervalDays)
    const totalAmount = getTotalSalary()

    setPayrollPreview({
      totalDuration,
      totalPayments,
      totalAmount,
      intervalDays,
      paymentAmount: totalAmount / totalPayments,
    })
  }

  useEffect(() => {
    calculatePayrollPreview()
  }, [payrollSettings, employees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      console.log("Company payroll created:", { employees, payrollSettings, selectedToken })
    }, 3000)
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("Processing CSV file:", file.name)
      // Handle CSV parsing here
    }
  }

  const formatSchedule = (schedule: string) => {
    switch (schedule) {
      case "MONTHLY":
        return "Monthly"
      case "QUARTERLY":
        return "Quarterly"
      case "YEARLY":
        return "Yearly"
      default:
        return schedule
    }
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
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Company Payroll</h1>
            <p className="text-sm sm:text-base text-gray-400 leading-tight">
              Create automated salary vesting schedules for your team members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            {employees.length} Employees
          </Badge>
          <Badge variant="outline" className="border-green-500/30 text-green-400">
            {getTotalSalary().toLocaleString()} {selectedToken}
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
            <h3 className="text-lg font-medium text-white mb-2">Company Payroll System</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-white" />
                  <h4 className="font-medium text-white">Automated Payroll</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Set up recurring salary payments with customizable vesting schedules. Employees receive their tokens
                  automatically based on the schedule.
                  <span className="block mt-2 font-medium">
                    Best for: Regular employee salaries, contractor payments
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-5 h-5 text-white" />
                  <h4 className="font-medium text-white">Flexible Permissions</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Configure who can cancel or modify payment schedules. Set auto-claim for seamless employee experience.
                  <span className="block mt-2 font-medium">
                    Features: Auto-claim, permission controls, batch processing
                  </span>
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
              <div className="ml-2 text-white font-medium">Company Setup</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${selectedToken && payrollSettings.companyName ? "bg-blue-500 text-white" : "bg-black/80 text-gray-500"
                  } text-sm font-medium`}
              >
                2
              </div>
              <div
                className={`ml-2 ${selectedToken && payrollSettings.companyName ? "text-white" : "text-gray-500"
                  } font-medium`}
              >
                Employee Details
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${employees.some((e) => e.walletAddress && e.salaryAmount)
                  ? "bg-blue-500 text-white"
                  : "bg-black/80 text-gray-500"
                  } text-sm font-medium`}
              >
                3
              </div>
              <div
                className={`ml-2 ${employees.some((e) => e.walletAddress && e.salaryAmount) ? "text-white" : "text-gray-500"
                  } font-medium`}
              >
                Review & Deploy
              </div>
            </div>
          </div>
          <div className="mt-2 h-1 bg-black/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{
                width: employees.some((e) => e.walletAddress && e.salaryAmount)
                  ? "100%"
                  : selectedToken && payrollSettings.companyName
                    ? "66%"
                    : "33%",
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Settings */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/20">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TokenSelector selectedToken={selectedToken} onTokenSelect={setSelectedToken} showBalance={true} />
              <div className="space-y-2">
                <Label className="text-white">Company Name *</Label>
                <Input
                  placeholder="Acme Corp"
                  value={payrollSettings.companyName}
                  onChange={(e) => setPayrollSettings((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white">Payroll Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={payrollSettings.startDate}
                  onChange={(e) => setPayrollSettings((prev) => ({ ...prev, startDate: e.target.value }))}
                  min={minDate}
                  className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Payroll End Date *</Label>
                <Input
                  type="datetime-local"
                  value={payrollSettings.endDate}
                  onChange={(e) => setPayrollSettings((prev) => ({ ...prev, endDate: e.target.value }))}
                  min={payrollSettings.startDate || minDate}
                  className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Payment Schedule *</Label>
                <Select
                  value={payrollSettings.unlockSchedule}
                  onValueChange={(value: "MONTHLY" | "QUARTERLY" | "YEARLY") =>
                    setPayrollSettings((prev) => ({ ...prev, unlockSchedule: value }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/80 backdrop-blur-xl border border-white/10">
                    <SelectItem value="MONTHLY" className="text-white hover:bg-white/10">
                      Monthly
                    </SelectItem>
                    <SelectItem value="QUARTERLY" className="text-white hover:bg-white/10">
                      Quarterly
                    </SelectItem>
                    <SelectItem value="YEARLY" className="text-white hover:bg-white/10">
                      Yearly
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label className="text-white">Payroll Description (optional)</Label>
              <Input
                placeholder="Q4 2024 Employee Compensation"
                value={payrollSettings.payrollDescription}
                onChange={(e) => setPayrollSettings((prev) => ({ ...prev, payrollDescription: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Employee Details
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
                  onClick={addEmployee}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {employees.map((employee, index) => (
                <div key={employee.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      Employee #{index + 1}
                    </h4>
                    {employees.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmployee(employee.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Employee Wallet Address *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="0x... or search contacts"
                            value={employee.walletAddress}
                            onChange={(e) => updateEmployee(employee.id, "walletAddress", e.target.value)}
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
                                      onSelect={() => {
                                        selectContact(employee.id, contact)
                                        // Force close the popover by triggering a state change
                                        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
                                      }}
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
                      {employee.name && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="border-green-500/30 text-green-400">
                            {employee.name} ({employee.email})
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Salary Amount *</Label>
                      <div className="relative">
                        <Input
                          placeholder="5000"
                          value={employee.salaryAmount}
                          onChange={(e) => updateEmployee(employee.id, "salaryAmount", e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 pr-16"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          {selectedToken}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Position</Label>
                      <Input
                        placeholder="Software Engineer"
                        value={employee.position}
                        onChange={(e) => updateEmployee(employee.id, "position", e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Department</Label>
                      <Input
                        placeholder="Engineering"
                        value={employee.department}
                        onChange={(e) => updateEmployee(employee.id, "department", e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Payment Schedule</Label>
                      <Select
                        value={employee.vestingSchedule}
                        onValueChange={(value: "MONTHLY" | "QUARTERLY" | "YEARLY") =>
                          updateEmployee(employee.id, "vestingSchedule", value)
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/80 backdrop-blur-xl border border-white/10">
                          <SelectItem value="MONTHLY" className="text-white hover:bg-white/10">
                            Monthly
                          </SelectItem>
                          <SelectItem value="QUARTERLY" className="text-white hover:bg-white/10">
                            Quarterly
                          </SelectItem>
                          <SelectItem value="YEARLY" className="text-white hover:bg-white/10">
                            Yearly
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Cancel Permission</Label>
                      <Select
                        value={employee.cancelPermission}
                        onValueChange={(value: "NONE" | "SENDER_ONLY" | "RECIPIENT_ONLY" | "BOTH") =>
                          updateEmployee(employee.id, "cancelPermission", value)
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/80 backdrop-blur-xl border border-white/10">
                          <SelectItem value="NONE" className="text-white hover:bg-white/10">
                            None
                          </SelectItem>
                          <SelectItem value="SENDER_ONLY" className="text-white hover:bg-white/10">
                            Company Only
                          </SelectItem>
                          <SelectItem value="RECIPIENT_ONLY" className="text-white hover:bg-white/10">
                            Employee Only
                          </SelectItem>
                          <SelectItem value="BOTH" className="text-white hover:bg-white/10">
                            Both
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        checked={employee.autoClaim}
                        onCheckedChange={(checked) => updateEmployee(employee.id, "autoClaim", checked)}
                      />
                      <Label className="text-white">Auto-claim</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payroll Preview */}
          {payrollPreview && (
            <div className="p-4 rounded-xl bg-black/50 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Payroll Preview
              </h3>

              {/* Visual Timeline */}
              <div className="mb-4">
                <div className="h-6 bg-black/80 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs text-white font-medium w-full">
                    {payrollPreview.totalPayments} Payments over {payrollPreview.totalDuration} days
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Start: {new Date(payrollSettings.startDate).toLocaleDateString()}</span>
                  <span>{formatSchedule(payrollSettings.unlockSchedule)} Payments</span>
                  <span>End: {new Date(payrollSettings.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Total Employees:</div>
                  <div className="text-white font-medium">{employees.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Total Amount:</div>
                  <div className="text-white font-medium">
                    {payrollPreview.totalAmount.toLocaleString()} {selectedToken}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Payment Frequency:</div>
                  <div className="text-white font-medium">{formatSchedule(payrollSettings.unlockSchedule)}</div>
                </div>
                <div className="p-3 rounded-lg bg-black/50">
                  <div className="text-gray-400 text-xs mb-1">Duration:</div>
                  <div className="text-white font-medium">{payrollPreview.totalDuration} days</div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {employees.some((e) => e.walletAddress && e.salaryAmount) && (
            <div className="p-3 rounded-lg bg-black/80 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-yellow-500">Important:</span> This will create vesting schedules for
                  all employees. Make sure all details are correct as some actions cannot be undone depending on the
                  permission settings.
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
                !payrollSettings.companyName ||
                !payrollSettings.startDate ||
                !payrollSettings.endDate ||
                !employees.some((e) => e.walletAddress && e.salaryAmount)
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
                  Creating Payroll Schedules...
                </span>
              ) : (
                `Deploy Company Payroll (${employees.length} employees)`
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
