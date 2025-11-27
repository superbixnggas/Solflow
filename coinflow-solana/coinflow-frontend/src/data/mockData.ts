// Mock data for CoinFlow Solana Edition

export interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  icon: string;
  color: string;
}

export interface PortfolioSummary {
  totalValue: number;
  numberOfTokens: number;
  change24h: number;
  totalPnL: number;
}

export interface TargetAllocation {
  token: string;
  current: number;
  target: number;
  threshold: number;
}

export interface RebalanceAction {
  fromToken: string;
  toToken: string;
  amount: number;
  estimatedPriceImpact: number;
  jupiterQuote: {
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
  };
  feeEstimate: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'swap';
  tokenPair: string;
  amount: number;
  priceImpact: number;
  status: 'success' | 'pending' | 'failed';
  hash: string;
}

// Solana ecosystem tokens
export const tokens: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    balance: 15.2,
    price: 98.45,
    change24h: 5.67,
    icon: '⚪',
    color: '#9945FF'
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    balance: 1250,
    price: 4.32,
    change24h: -2.34,
    icon: '🔵',
    color: '#00D4AA'
  },
  {
    symbol: 'SRM',
    name: 'Serum',
    balance: 850,
    price: 1.85,
    change24h: 1.23,
    icon: '🟡',
    color: '#F5F5F5'
  },
  {
    symbol: 'STEP',
    name: 'Step Finance',
    balance: 5000,
    price: 0.45,
    change24h: -1.78,
    icon: '🟢',
    color: '#14F195'
  },
  {
    symbol: 'MNGO',
    name: 'Mango Markets',
    balance: 750,
    price: 2.15,
    change24h: 3.45,
    icon: '🟠',
    color: '#FF6B35'
  },
  {
    symbol: 'ORCA',
    name: 'Orca',
    balance: 320,
    price: 12.5,
    change24h: 0.87,
    icon: '🐋',
    color: '#0DBF7C'
  },
  {
    symbol: 'USD',
    name: 'USD Coin',
    balance: 2500,
    price: 1.0,
    change24h: 0.02,
    icon: '💵',
    color: '#2774AE'
  }
];

// Calculate portfolio summary
export const getPortfolioSummary = (): PortfolioSummary => {
  const totalValue = tokens.reduce((sum, token) => sum + (token.balance * token.price), 0);
  const numberOfTokens = tokens.length;
  
  // Calculate weighted 24h change
  const weightedChange = tokens.reduce((sum, token) => {
    const tokenValue = token.balance * token.price;
    return sum + (token.change24h * tokenValue);
  }, 0);
  const change24h = totalValue > 0 ? (weightedChange / totalValue) : 0;
  
  // Mock total PnL (simulate profit/loss)
  const totalPnL = totalValue * (change24h / 100);
  
  return {
    totalValue,
    numberOfTokens,
    change24h,
    totalPnL
  };
};

// Target allocations
export const targetAllocations: TargetAllocation[] = [
  { token: 'SOL', current: 45.2, target: 40, threshold: 5 },
  { token: 'RAY', current: 18.5, target: 20, threshold: 3 },
  { token: 'SRM', current: 12.1, target: 15, threshold: 3 },
  { token: 'STEP', current: 8.7, target: 10, threshold: 2 },
  { token: 'MNGO', current: 6.2, target: 7, threshold: 2 },
  { token: 'ORCA', current: 5.8, target: 5, threshold: 1 },
  { token: 'USD', current: 3.5, target: 3, threshold: 1 }
];

// Mock rebalance plan
export const rebalancePlan: RebalanceAction[] = [
  {
    fromToken: 'SOL',
    toToken: 'RAY',
    amount: 125.5,
    estimatedPriceImpact: 0.12,
    jupiterQuote: {
      inAmount: '1.275',
      outAmount: '29.05',
      priceImpactPct: 0.15
    },
    feeEstimate: 0.002
  },
  {
    fromToken: 'SOL',
    toToken: 'SRM',
    amount: 89.2,
    estimatedPriceImpact: 0.08,
    jupiterQuote: {
      inAmount: '0.905',
      outAmount: '48.2',
      priceImpactPct: 0.09
    },
    feeEstimate: 0.002
  }
];

// Mock transaction history
export const transactionHistory: Transaction[] = [
  {
    id: '1',
    date: '2025-11-27 06:30:15',
    type: 'swap',
    tokenPair: 'SOL → RAY',
    amount: 2.5,
    priceImpact: 0.08,
    status: 'success',
    hash: '5KqGV7h...8f3n'
  },
  {
    id: '2',
    date: '2025-11-26 14:22:08',
    type: 'buy',
    tokenPair: 'MNGO',
    amount: 150,
    priceImpact: 0.15,
    status: 'success',
    hash: '4KmFV8h...2g7p'
  },
  {
    id: '3',
    date: '2025-11-26 09:15:32',
    type: 'sell',
    tokenPair: 'SRM',
    amount: 200,
    priceImpact: -0.05,
    status: 'success',
    hash: '3LnDP9k...6h9t'
  },
  {
    id: '4',
    date: '2025-11-25 16:45:21',
    type: 'swap',
    tokenPair: 'STEP → ORCA',
    amount: 850,
    priceImpact: 0.22,
    status: 'pending',
    hash: '2MmCL7m...5k8r'
  },
  {
    id: '5',
    date: '2025-11-25 11:33:44',
    type: 'buy',
    tokenPair: 'SOL',
    amount: 5.2,
    priceImpact: 0.03,
    status: 'success',
    hash: '1NnBK6l...4f2d'
  }
];

// Color scheme for Solana theme
export const colors = {
  primary: '#9945FF', // Solana Purple
  secondary: '#14F195', // Solana Green
  accent: '#F5F5F5', // Light Gray
  background: '#0B0C10', // Dark
  success: '#00D084', // Green
  warning: '#FFB800', // Yellow
  error: '#FF3366', // Red
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    muted: '#71717A'
  }
};

// Portfolio value simulation
export const simulatePriceUpdate = () => {
  tokens.forEach(token => {
    const volatility = 0.05; // 5% max change
    const change = (Math.random() - 0.5) * volatility * 2;
    token.change24h = token.change24h + change;
    token.price = token.price * (1 + change / 100);
  });
};

// Utility function to format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Utility function to format percentage
export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Utility function to format address
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};