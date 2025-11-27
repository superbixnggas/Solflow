import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { WalletProvider, useWallet, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Types
interface WalletContextType {
  wallet: any | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: string | null;
  walletType: string | null;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({ children }) => {
  // Network configuration - change to mainnet-beta for production
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  // Wallet adapters
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new BackpackWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => console.error('Wallet error:', error)}>
        <WalletModalProvider>
          <WalletStateProvider>
            {children}
          </WalletStateProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const WalletStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wallet, connected, connecting, disconnecting, publicKey, connect, disconnect } = useWallet();
  const [balance, setBalance] = useState(0);
  const [connection, setConnection] = useState<Connection | null>(null);

  // Create connection when wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      const conn = new Connection(clusterApiUrl(WalletAdapterNetwork.Devnet), 'confirmed');
      setConnection(conn);
      
      // Fetch balance
      const fetchBalance = async () => {
        try {
          const balance = await conn.getBalance(publicKey);
          setBalance(balance / 1000000000); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };

      fetchBalance();
      
      // Set up balance change listener
      const subscriptionId = conn.onAccountChange(
        publicKey,
        (accountInfo) => {
          const newBalance = accountInfo.lamports / 1000000000;
          setBalance(newBalance);
        },
        'confirmed'
      );

      return () => {
        conn.removeAccountChangeListener(subscriptionId);
        conn.close();
      };
    } else {
      setConnection(null);
      setBalance(0);
    }
  }, [connected, publicKey]);

  const contextValue: WalletContextType = {
    wallet,
    connected,
    connecting,
    disconnecting,
    publicKey: publicKey?.toString() || null,
    walletType: wallet?.adapter?.name || null,
    balance,
    connect,
    disconnect
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
};

// Custom hooks for easy integration
export const useCoinFlowWallet = () => {
  const {
    wallet,
    connected,
    connecting,
    publicKey,
    walletType,
    balance,
    connect,
    disconnect
  } = useWalletContext();

  const getWalletIcon = () => {
    if (!wallet) return null;
    
    switch (walletType) {
      case 'Phantom':
        return 'https://phantom.app/img/phantom-mark.svg';
      case 'Solflare':
        return 'https://solflare.com/favicon.ico';
      case 'Backpack':
        return 'https://backpack.app/favicon.ico';
      default:
        return null;
    }
  };

  return {
    // Wallet state
    wallet,
    isConnected: connected,
    isConnecting: connecting,
    publicKey,
    walletType,
    balance,
    
    // Actions
    connect,
    disconnect,
    
    // Utilities
    walletIcon: getWalletIcon(),
    formatAddress: (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`,
  };
};