export interface Token {
  symbol: string;
  name: string;
  address: string;
  icon: string;
  balance?: number;
}

export interface TokenBalance {
  symbol: string;
  balance: number;
  value: number;
  change24h: number;
}

export interface FaucetToken {
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  cooldown: number; // in minutes
  lastClaimed?: number;
}
