import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Plus, X } from "lucide-react";

export function ContactSelector({
  contacts,
  onSelectContact,
  selectedContacts,
  onRemoveContact,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium">
            Selected Recipients
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedContacts.map((contact) => (
              <Badge
                key={contact._id}
                className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1 flex items-center space-x-2"
              >
                <User className="w-3 h-3" />
                <span>
                  {contact.fullName ||
                    `${contact.walletAddress.slice(0, 6)}...${contact.walletAddress.slice(-4)}`}
                </span>
                <button
                  onClick={() => onRemoveContact(contact._id)}
                  className="ml-1 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Contact Search */}
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="w-full h-12 border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:text-white border-dashed rounded-xl bg-transparent justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add from Contacts
        </Button>

        {isOpen && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 backdrop-blur-xl bg-slate-900/90 border-slate-700/50 shadow-2xl max-h-64 overflow-hidden">
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContacts.some(
                    (sc) => sc._id === contact._id
                  );
                  return (
                    <button
                      key={contact._id}
                      onClick={() => {
                        if (!isSelected) {
                          onSelectContact(contact);
                        }
                        setIsOpen(false);
                      }}
                      disabled={isSelected}
                      className={`w-full p-3 text-left hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 last:border-b-0 ${
                        isSelected ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {contact.fullName || "Unnamed Contact"}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {contact.walletAddress?.slice(0, 6)}...
                            {contact.walletAddress?.slice(-4)}
                          </p>
                          {contact.label && (
                            <p className="text-blue-400 text-xs">
                              {contact.label}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-400">
                  {searchQuery
                    ? `No contacts found for "${searchQuery}"`
                    : "No contacts found"}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
