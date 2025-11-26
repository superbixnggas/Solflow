import { FC } from 'react';
import { Link } from 'react-router-dom';

const WalletConnectDemo: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
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
            <p className="text-gray-300 text-sm mb-4">
              Kelola dan rebalance portfolio Solana Anda secara otomatis
            </p>
            
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                <strong>Demo Mode:</strong> Ini adalah versi demo tanpa integrasi wallet. Lihat dashboard demo untuk melihat fungsionalitas UI.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Jupiter Integration
              </h3>
              <p className="text-gray-300 text-sm">
                Best execution price via Jupiter aggregator
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Link
              to="/dashboard"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl px-8 py-4 text-lg font-semibold transition-all shadow-lg hover:shadow-xl text-white text-center"
            >
              Lihat Demo Dashboard
            </Link>
            
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Untuk versi production dengan wallet integration, deploy backend dan frontend sesuai deployment guide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectDemo;
