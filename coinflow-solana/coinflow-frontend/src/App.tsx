import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import WalletConnectDemo from './components/WalletConnectDemo';
import PortfolioDashboardDemo from './components/PortfolioDashboardDemo';
import TargetAllocation from './components/TargetAllocation';
import RebalanceView from './components/RebalanceView';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<WalletConnectDemo />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <PortfolioDashboardDemo />
            </Layout>
          }
        />
        <Route
          path="/targets"
          element={
            <Layout>
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
              <p className="text-blue-900 text-sm">
                <strong>Demo Mode:</strong> Target allocation memerlukan backend API yang running. Lihat deployment guide untuk setup lengkap.
              </p>
            </div>
              <TargetAllocation />
            </Layout>
          }
        />
        <Route
          path="/rebalance"
          element={
            <Layout>
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
              <p className="text-blue-900 text-sm">
                <strong>Demo Mode:</strong> Rebalance execution memerlukan backend API dan wallet connection. Lihat deployment guide untuk setup lengkap.
              </p>
            </div>
              <RebalanceView />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
