import { createContext, useContext } from "react"
import { useContacts } from "@/hooks/useContacts"


const ContactsContext = createContext(undefined)


export function ContactsProvider({ children }) {
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