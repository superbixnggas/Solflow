import { FC, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import { connectWallet } from '../lib/api';
import toast from 'react-hot-toast';

const WalletConnect: FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const handleWalletConnect = async () => {
      if (connected && publicKey) {
        try {
          toast.loading('Menghubungkan wallet...', { id: 'wallet-connect' });
          
          const result = await connectWallet(publicKey.toString());
          
          if (result.success) {
            toast.success('Wallet terhubung!', { id: 'wallet-connect' });
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error connecting wallet:', error);
          toast.error('Gagal menghubungkan wallet', { id: 'wallet-connect' });
        }
      }
    };

    handleWalletConnect();
  }, [connected, publicKey, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-3">
              CoinFlow Solana
            </h1>
            <p className="text-purple-200 text-lg mb-2">
              Portfolio Optimizer
            </p>
            <p className="text-gray-300 text-sm">
              Kelola dan rebalance portfolio Solana Anda secara otomatis
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Non-Custodial
              </h3>
              <p className="text-gray-300 text-sm">
                Anda tetap memegang kendali penuh atas aset
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Auto-Rebalance
              </h3>
              <p className="text-gray-300 text-sm">
                Rebalancing otomatis berdasarkan target alokasi
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Jupiter Integration
              </h3>
              <p className="text-gray-300 text-sm">
                Best execution price via Jupiter aggregator
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-blue-500 hover:!from-purple-600 hover:!to-blue-600 !rounded-xl !px-8 !py-3 !text-lg !font-semibold !transition-all !shadow-lg hover:!shadow-xl" />
          </div>

          <p className="text-gray-400 text-xs text-center mt-6">
            Supported: Phantom, Solflare
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
