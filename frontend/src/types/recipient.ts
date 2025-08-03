export interface Recipient {
  id: string;
  contactId?: string;
  walletAddress: string;
  amount: string;
  name?: string;
  email?: string;
  contractTitle?: string;
}
