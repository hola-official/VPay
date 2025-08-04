"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, User } from "lucide-react";
import { ContactSelector } from "@/components/ContactSelector";
import { useState } from "react";

export function RecipientManager({ recipients, setRecipients, contacts }) {
  const [selectedContacts, setSelectedContacts] = useState([]);

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index, field, value) => {
    const updated = recipients.map((recipient, i) =>
      i === index ? { ...recipient, [field]: value } : recipient
    );
    setRecipients(updated);
  };

  const handleSelectContact = (contact) => {
    setSelectedContacts((prev) => [...prev, contact]);
    // Add contact as a new recipient using the correct field names
    setRecipients((prev) => [
      ...prev,
      { address: contact.walletAddress, amount: "" },
    ]);
  };

  const handleRemoveContact = (contactId) => {
    const contact = selectedContacts.find((c) => c._id === contactId);
    if (contact) {
      // Remove from selected contacts
      setSelectedContacts((prev) => prev.filter((c) => c._id !== contactId));
      // Remove from recipients
      setRecipients((prev) =>
        prev.filter((r) => r.address !== contact.walletAddress)
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Contact Selector */}
      {contacts && (
        <ContactSelector
          contacts={contacts.contacts || []}
          onSelectContact={handleSelectContact}
          selectedContacts={selectedContacts}
          onRemoveContact={handleRemoveContact}
        />
      )}

      {/* Manual Recipients */}
      {recipients.map((recipient, index) => (
        <Card
          key={index}
          className="p-3 sm:p-4 bg-slate-800/40 border-slate-700/30"
        >
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <Label className="text-slate-300 font-medium text-sm sm:text-base">
                Recipient {index + 1}
              </Label>
            </div>
            {recipients.length > 1 && (
              <Button
                onClick={() => removeRecipient(index)}
                size="sm"
                variant="ghost"
                className="ml-auto text-red-400 hover:text-red-300 hover:bg-red-500/10 w-fit"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs sm:text-sm">
                Wallet Address
              </Label>
              <Input
                placeholder="0x..."
                value={recipient.address}
                onChange={(e) =>
                  updateRecipient(index, "address", e.target.value)
                }
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs sm:text-sm">
                Amount
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={recipient.amount}
                onChange={(e) =>
                  updateRecipient(index, "amount", e.target.value)
                }
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-10 text-sm"
              />
            </div>
          </div>
        </Card>
      ))}

      <Button
        onClick={addRecipient}
        variant="outline"
        className="w-full h-10 sm:h-12 border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:text-white border-dashed rounded-xl bg-transparent text-sm sm:text-base"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Manual Recipient
      </Button>
    </div>
  );
}
