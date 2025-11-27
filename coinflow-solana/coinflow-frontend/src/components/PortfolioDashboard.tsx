import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getPortfolio } from '../lib/api';
import toast from 'react-hot-toast';

interface Token {
  tokenMint: string;
  tokenSymbol: string;
  balance: number;
  priceUSD: number;
  valueUSD: number;
  percentage: number;
}

const PortfolioDashboard: FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPortfolio = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const data = await getPortfolio(publicKey.toString());
      setTokens(data.data?.tokens || []);
      setTotalValue(data.data?.totalValue || 0);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Gagal memuat portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();

    // Auto-refresh setiap 30 detik
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  if (loading && tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Anda</h2>
          <p className="text-gray-600 text-sm mt-1">
            Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button
          onClick={fetchPortfolio}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Total Value Card */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 shadow-xl">
        <p className="text-purple-100 text-sm font-medium mb-2">Total Nilai Portfolio</p>
        <p className="text-4xl font-bold text-white mb-1">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Tokens Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Alokasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada token ditemukan
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.tokenMint} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{token.tokenSymbol}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {token.tokenMint.substring(0, 4)}...{token.tokenMint.substring(token.tokenMint.length - 4)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-gray-900 font-medium">
                        {token.balance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-gray-900">
                        ${token.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-gray-900 font-medium">
                        ${token.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${token.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                          {token.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDashboard;
