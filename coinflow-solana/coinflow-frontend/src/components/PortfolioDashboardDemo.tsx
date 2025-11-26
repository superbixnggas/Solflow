import { FC, useState } from 'react';

// Mock data
const mockTokens = [
  {
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    balance: 42.5,
    priceUSD: 98.45,
    valueUSD: 4184.13,
    percentage: 41.8,
  },
  {
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    balance: 3500,
    priceUSD: 1.00,
    valueUSD: 3500.00,
    percentage: 35.0,
  },
  {
    tokenMint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    tokenSymbol: 'mSOL',
    balance: 18.2,
    priceUSD: 107.32,
    valueUSD: 1953.22,
    percentage: 19.5,
  },
  {
    tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    tokenSymbol: 'BONK',
    balance: 12500000,
    priceUSD: 0.000029,
    valueUSD: 362.50,
    percentage: 3.7,
  },
];

const PortfolioDashboardDemo: FC = () => {
  const [tokens] = useState(mockTokens);
  const [totalValue] = useState(10000);
  const [lastUpdate] = useState(new Date());

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          <strong>Demo Mode:</strong> Data ini adalah contoh untuk demonstrasi interface. Dalam mode production, data akan diambil secara real-time dari Solana blockchain.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Anda</h2>
          <p className="text-gray-600 text-sm mt-1">
            Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <p className="text-purple-200 text-sm">
          4 tokens
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
              {tokens.map((token) => (
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
                      {token.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDashboardDemo;
