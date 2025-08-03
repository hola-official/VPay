import { Worker } from "@/services/api";
import { Contact } from "@/types/contact";

// Convert Worker to Contact for backward compatibility
export function workerToContact(worker: Worker): Contact {
  return {
    id: worker._id,
    name: worker.fullName,
    walletAddress: worker.walletAddress,
    email: worker.email,
    label: worker.label,
    isActive: worker.isActive,
  };
}

// Convert Contact to Worker for API calls
export function contactToWorker(
  contact: Contact
): Omit<Worker, "_id" | "createdAt" | "updatedAt"> {
  return {
    fullName: contact.name,
    walletAddress: contact.walletAddress,
    email: contact.email,
    label: contact.label,
    savedBy: "0x1234567890123456789012345678901234567890", // Mock wallet address
    isActive: contact.isActive,
  };
}

// Convert array of Workers to Contacts
export function workersToContacts(workers: Worker[]): Contact[] {
  return workers.map(workerToContact);
}

// Convert array of Contacts to Workers (for API calls)
export function contactsToWorkers(
  contacts: Contact[]
): Omit<Worker, "_id" | "createdAt" | "updatedAt">[] {
  return contacts.map(contactToWorker);
}
