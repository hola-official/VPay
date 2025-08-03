export interface Employee {
  id: string;
  contactId?: string;
  walletAddress: string;
  name?: string;
  email?: string;
  position: string;
  salary: string;
  startDate: string;
  endDate: string;
  department: string;
  vestingSchedule: "MONTHLY" | "QUARTERLY" | "YEARLY";
  autoClaim: boolean;
  cancelPermission: "NONE" | "SENDER_ONLY" | "RECIPIENT_ONLY" | "BOTH";
  changeRecipientPermission: "NONE" | "SENDER_ONLY" | "RECIPIENT_ONLY" | "BOTH";
}

export interface PayrollSettings {
  startDate: string;
  endDate: string;
  unlockSchedule: "MONTHLY" | "QUARTERLY" | "YEARLY";
  companyName: string;
  payrollDescription: string;
}
