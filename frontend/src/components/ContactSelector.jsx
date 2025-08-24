import { useState, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { createAvatar } from "@dicebear/core";
import { personas } from "@dicebear/collection";
import { Search, Users, Mail, ChevronDown, Check, Loader2 } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";

export default function ContactSelector({
  onSelect,
  placeholder = "Search contacts...",
  className = "",
  showEmail = false,
  showLabel = true,
}) {
  const DicebearPersonaAvatar = ({ address, size = 20 }) => {
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
        className="rounded-full flex-shrink-0"
      />
    );
  };
  const { contacts, isLoading, searchContacts } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter contacts based on search term
  useEffect(() => {
    const filterContacts = async () => {
      if (!searchTerm.trim()) {
        setFilteredContacts(contacts.slice(0, 10)); // Show first 10 contacts
        return;
      }

      setIsSearching(true);
      try {
        // Use API search for better performance
        const results = await searchContacts(searchTerm);
        setFilteredContacts(results.slice(0, 10)); // Limit to 10 results
      } catch {
        // Fallback to local filtering
        const filtered = contacts
          .filter((contact) => {
            const searchLower = searchTerm.toLowerCase();
            return (
              contact.fullName.toLowerCase().includes(searchLower) ||
              contact.walletAddress.toLowerCase().includes(searchLower) ||
              contact.email?.toLowerCase().includes(searchLower) ||
              contact.label?.toLowerCase().includes(searchLower)
            );
          })
          .slice(0, 10);
        setFilteredContacts(filtered);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(filterContacts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, contacts]);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setSearchTerm(contact.fullName);
    setIsOpen(false);
    onSelect(contact);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedContact(null);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!searchTerm) {
      setFilteredContacts(contacts.slice(0, 10));
    }
  };

  const clearSelection = () => {
    setSelectedContact(null);
    setSearchTerm("");
    setFilteredContacts(contacts.slice(0, 10));
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#97CBDC]/70">
          <Users className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 pl-10 pr-10 text-[#97CBDC] placeholder:text-[#97CBDC]/50 focus:outline-none focus:ring-2 focus:ring-[#018ABD]/50"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {(isLoading || isSearching) && (
            <Loader2 className="w-4 h-4 text-[#97CBDC]/70 animate-spin" />
          )}
          {selectedContact && !isLoading && !isSearching && (
            <button
              onClick={clearSelection}
              className="text-[#97CBDC]/70 hover:text-[#97CBDC] transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#97CBDC]/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#1D2538] border border-[#475B74]/50 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-4 text-center text-[#97CBDC]/70">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Searching contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-[#97CBDC]/70">
                {contacts.length === 0 ? (
                  <div>
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No contacts found</p>
                    <p className="text-xs mt-1">
                      Add contacts to use this feature
                    </p>
                  </div>
                ) : (
                  <div>
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No contacts match your search</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                {filteredContacts.map((contact) => (
                  <Motion.button
                    key={contact._id || contact.id}
                    onClick={() => handleContactSelect(contact)}
                    className="w-full px-4 py-3 text-left hover:bg-[#0a0a20]/50 transition-colors"
                    whileHover={{ backgroundColor: "rgba(10, 10, 32, 0.5)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <DicebearPersonaAvatar
                            address={contact.walletAddress}
                            size={18}
                          />
                          <span className="font-medium text-[#97CBDC] truncate">
                            {contact.fullName}
                          </span>
                          {showLabel && contact.label && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-[#018ABD]/20 text-[#018ABD] flex-shrink-0">
                              {contact.label}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#97CBDC]/70 font-mono truncate">
                          {contact.walletAddress}
                        </div>

                        {showEmail && contact.email && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3 text-[#97CBDC]/50" />
                            <span className="text-xs text-[#97CBDC]/70 truncate">
                              {contact.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Motion.button>
                ))}

                {contacts.length > 10 && filteredContacts.length === 10 && (
                  <div className="px-4 py-2 text-center text-xs text-[#97CBDC]/50 border-t border-[#475B74]/30">
                    Showing first 10 results. Type to search for more specific
                    contacts.
                  </div>
                )}
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
