import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletContextProvider } from './context/WalletContext';
import WalletConnectReal from './components/WalletConnectReal';
import PortfolioDashboardReal from './components/PortfolioDashboardReal';
import TargetAllocationReal from './components/TargetAllocationReal';
import RebalanceViewReal from './components/RebalanceViewReal';
import TransactionHistory from './components/TransactionHistory';

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0B0C10',
              color: '#FFFFFF',
              border: '1px solid #9945FF',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#14F195',
                secondary: '#FFFFFF',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#FF3366',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<WalletConnectReal />} />
          <Route path="/dashboard" element={<PortfolioDashboardReal />} />
          <Route path="/targets" element={<TargetAllocationReal />} />
          <Route path="/rebalance" element={<RebalanceViewReal />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WalletContextProvider>
  );
}

export default App;