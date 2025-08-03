import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import { useContacts } from "@/hooks/useContacts"
import type { Worker } from "@/services/api"

interface ContactsContextType {
  contacts: Worker[]
  loading: boolean
  error: string | null
  createContact: (contactData: any) => Promise<Worker>
  updateContact: (id: string, contactData: any) => Promise<Worker>
  deleteContact: (id: string) => Promise<void>
  searchContacts: (query: string) => Promise<void>
  loadContacts: () => Promise<void>
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

interface ContactsProviderProps {
  children: ReactNode
}

export function ContactsProvider({ children }: ContactsProviderProps) {
  const contactsData = useContacts()

  return (
    <ContactsContext.Provider value={contactsData}>
      {children}
    </ContactsContext.Provider>
  )
}

export function useContactsContext() {
  const context = useContext(ContactsContext)
  if (context === undefined) {
    throw new Error("useContactsContext must be used within a ContactsProvider")
  }
  return context
} 