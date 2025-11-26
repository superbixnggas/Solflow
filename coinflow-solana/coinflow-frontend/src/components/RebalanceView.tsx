import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { checkRebalance, createRebalancePlan, executeRebalance, confirmTransaction } from '../lib/api';
import toast from 'react-hot-toast';

interface Deviation {
  tokenMint: string;
  tokenSymbol: string;
  currentPercentage: number;
  targetPercentage: number;
  deviation: number;
  needsRebalance: boolean;
}

interface SwapPlan {
  id: string;
  fromToken: string;
  fromSymbol: string;
  toToken: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
}

const RebalanceView: FC = () => {
  const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [needsRebalance, setNeedsRebalance] = useState<boolean>(false);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [rebalancePlan, setRebalancePlan] = useState<any>(null);
  const [executing, setExecuting] = useState<boolean>(false);

  const checkRebalanceStatus = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const data = await checkRebalance(publicKey.toString());
      setNeedsRebalance(data.needsRebalance);
      setDeviations(data.deviations);
      setTotalValue(data.totalValue);
    } catch (error) {
      console.error('Error checking rebalance:', error);
      toast.error('Gagal memeriksa status rebalance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRebalanceStatus();
  }, [publicKey]);

  const handleCreatePlan = async () => {
    if (!publicKey) return;

    try {
      toast.loading('Membuat rencana rebalance...', { id: 'create-plan' });
      const plan = await createRebalancePlan(publicKey.toString());
      
      if (plan.needsRebalance === false) {
        toast.success('Portfolio sudah seimbang!', { id: 'create-plan' });
        return;
      }

      setRebalancePlan(plan);
      toast.success('Rencana rebalance berhasil dibuat!', { id: 'create-plan' });
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Gagal membuat rencana rebalance', { id: 'create-plan' });
    }
  };

  const handleExecutePlan = async () => {
    if (!publicKey || !rebalancePlan || !signAllTransactions) return;

    try {
      setExecuting(true);
      toast.loading('Mempersiapkan transaksi...', { id: 'execute' });

      // Get transaction payloads
      const result = await executeRebalance(publicKey.toString(), rebalancePlan.planId);
      
      if (!result.transactions || result.transactions.length === 0) {
        toast.error('Tidak ada transaksi untuk dieksekusi', { id: 'execute' });
        return;
      }

      toast.loading('Menunggu persetujuan wallet...', { id: 'execute' });

      // Sign all transactions
      const transactions = result.transactions.map((tx: any) => {
        if (tx.version) {
          return VersionedTransaction.deserialize(Buffer.from(tx.serialized, 'base64'));
        }
        return Transaction.from(Buffer.from(tx.serialized, 'base64'));
      });

      const signedTransactions = await signAllTransactions(transactions);

      toast.loading('Mengirim transaksi...', { id: 'execute' });

      // Send transactions
      const signatures = [];
      for (const tx of signedTransactions) {
        const signature = await connection.sendRawTransaction(tx.serialize());
        signatures.push(signature);
      }

      // Wait for confirmations
      toast.loading('Menunggu konfirmasi...', { id: 'execute' });
      await Promise.all(
        signatures.map(sig => connection.confirmTransaction(sig, 'confirmed'))
      );

      // Confirm with backend
      for (const signature of signatures) {
        await confirmTransaction(publicKey.toString(), signature, rebalancePlan.planId);
      }

      toast.success('Rebalance berhasil dieksekusi!', { id: 'execute' });
      
      // Refresh status
      setRebalancePlan(null);
      await checkRebalanceStatus();
    } catch (error) {
      console.error('Error executing rebalance:', error);
      toast.error('Gagal mengeksekusi rebalance', { id: 'execute' });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Rebalance Portfolio</h2>
          <p className="text-gray-600 mt-1">
            Analisis deviasi dan rencana rebalancing
          </p>
        </div>
        <button
          onClick={checkRebalanceStatus}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className={`p-6 rounded-xl ${needsRebalance ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-green-50 border-2 border-green-500'}`}>
        <div className="flex items-center space-x-3">
          {needsRebalance ? (
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {needsRebalance ? 'Rebalance Diperlukan' : 'Portfolio Seimbang'}
            </h3>
            <p className="text-sm text-gray-600">
              {needsRebalance 
                ? 'Beberapa token melampaui threshold yang ditetapkan'
                : 'Semua token dalam range target alokasi'}
            </p>
          </div>
        </div>
      </div>

      {/* Deviations Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Analisis Deviasi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Token</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Saat Ini</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Target</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Deviasi</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deviations.map((dev) => (
                <tr key={dev.tokenMint} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{dev.tokenSymbol}</td>
                  <td className="px-6 py-4 text-right">{dev.currentPercentage.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right">{dev.targetPercentage.toFixed(2)}%</td>
                  <td className={`px-6 py-4 text-right font-semibold ${dev.deviation > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {dev.deviation > 0 ? '+' : ''}{dev.deviation.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    {dev.needsRebalance ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Perlu Rebalance
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Seimbang
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Plan Button */}
      {needsRebalance && !rebalancePlan && (
        <div className="flex justify-center">
          <button
            onClick={handleCreatePlan}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Buat Rencana Rebalance
          </button>
        </div>
      )}

      {/* Rebalance Plan */}
      {rebalancePlan && (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rencana Rebalance</h3>
            <span className="text-sm text-gray-600">
              {rebalancePlan.totalSwaps} swap diperlukan
            </span>
          </div>

          {/* Swaps */}
          <div className="space-y-3">
            {rebalancePlan.swaps.map((swap: SwapPlan, index: number) => (
              <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {swap.fromSymbol} → {swap.toSymbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        {swap.fromAmount.toFixed(4)} → {swap.toAmount.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Price Impact</p>
                    <p className={`font-semibold ${swap.priceImpact > 1 ? 'text-red-600' : 'text-green-600'}`}>
                      {swap.priceImpact.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Slippage */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Estimasi Slippage Rata-rata: <span className="font-semibold">{rebalancePlan.estimatedSlippage.toFixed(2)}%</span>
            </p>
          </div>

          {/* Execute Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setRebalancePlan(null)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExecutePlan}
              disabled={executing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {executing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{executing ? 'Mengeksekusi...' : 'Eksekusi Rebalance'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RebalanceView;
