import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { useWallet as useWalletAdapter } from '@solana/wallet-adapter-react';

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
    // Backpack wallet akan ditambahkan saat wallet-adapter mendukungnya
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
  const { wallet, connected, connecting, disconnecting, publicKey, connect, disconnect } = useWalletAdapter();
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
        // Connection cleanup is handled automatically by Solana Web3.js
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
// Export useWallet for compatibility
export const useWallet = () => {
  const {
    wallet,
    connected,
    connecting,
    disconnecting,
    publicKey,
    walletType,
    balance,
    connect,
    disconnect
  } = useWalletContext();
  
  return {
    wallet,
    connected,
    connecting,
    disconnecting,
    publicKey,
    walletType,
    balance,
    connect,
    disconnect
  };
};

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