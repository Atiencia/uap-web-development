export interface User {
  address: string;
  isAuthenticated: boolean;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface FaucetInfo {
  amount: string;
  totalUsers: number;
  contractAddress: string;
}

export interface UserStatus {
  hasClaimed: boolean;
  balance: string;
  canClaim: boolean;
}

export interface Transaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  type: 'claim' | 'other';
}

export interface AppState {
  user: User | null;
  tokenInfo: TokenInfo | null;
  faucetInfo: FaucetInfo | null;
  userStatus: UserStatus | null;
  isLoading: boolean;
  error: string | null;
  transactions: Transaction[];
}