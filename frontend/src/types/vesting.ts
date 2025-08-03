export interface VestingSchedule {
  id: string;
  type: "investor" | "employee" | "lock";
  tokenSymbol: string;
  totalAmount: number;
  claimedAmount: number;
  nextUnlock: string;
  recipient: string;
  status: "active" | "completed" | "pending" | "cancelled";
  progress: number;
  createdDate: string;
  contractAddress?: string;
}

export interface VestingSettings {
  tgeDate: string;
  tgeBps: string;
  cycle: string;
  cycleBps: string;
  description: string;
}

export interface VestingPreview {
  initialRelease: number;
  cycleReleaseAmount: number;
  totalCycles: number;
  remainingAmount: number;
  totalDays: number;
}

export interface PayrollPreview {
  totalDuration: number;
  totalPayments: number;
  totalAmount: number;
  intervalDays: number;
  paymentAmount: number;
}
