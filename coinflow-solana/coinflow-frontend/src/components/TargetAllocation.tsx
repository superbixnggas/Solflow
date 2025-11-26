import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getPortfolio, setTargetAllocation, getTargetAllocation } from '../lib/api';
import toast from 'react-hot-toast';

interface Target {
  tokenMint: string;
  tokenSymbol: string;
  targetPercentage: number;
  threshold: number;
}

const TargetAllocation: FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<any[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) return;

      try {
        setLoading(true);
        
        // Fetch current portfolio
        const portfolioData = await getPortfolio(publicKey.toString());
        setTokens(portfolioData.tokens);

        // Fetch existing targets
        const targetData = await getTargetAllocation(publicKey.toString());
        
        if (targetData.targets && targetData.targets.length > 0) {
          setTargets(targetData.targets);
        } else {
          // Initialize with empty targets for all tokens
          setTargets(portfolioData.tokens.map((token: any) => ({
            tokenMint: token.tokenMint,
            tokenSymbol: token.tokenSymbol,
            targetPercentage: 0,
            threshold: 5,
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicKey]);

  const handleTargetChange = (tokenMint: string, value: number) => {
    setTargets(prev =>
      prev.map(t =>
        t.tokenMint === tokenMint ? { ...t, targetPercentage: value } : t
      )
    );
  };

  const handleThresholdChange = (tokenMint: string, value: number) => {
    setTargets(prev =>
      prev.map(t =>
        t.tokenMint === tokenMint ? { ...t, threshold: value } : t
      )
    );
  };

  const handleSave = async () => {
    if (!publicKey) return;

    const totalPercentage = targets.reduce((sum, t) => sum + t.targetPercentage, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error('Total alokasi harus 100%');
      return;
    }

    try {
      setSaving(true);
      await setTargetAllocation(publicKey.toString(), targets);
      toast.success('Target alokasi berhasil disimpan!');
    } catch (error) {
      console.error('Error saving targets:', error);
      toast.error('Gagal menyimpan target alokasi');
    } finally {
      setSaving(false);
    }
  };

  const totalPercentage = targets.reduce((sum, t) => sum + t.targetPercentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Target Alokasi</h2>
        <p className="text-gray-600 mt-1">
          Atur persentase target untuk setiap token dalam portfolio Anda
        </p>
      </div>

      {/* Total Percentage Indicator */}
      <div className={`p-4 rounded-lg border-2 ${isValidTotal ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total Alokasi:</span>
          <span className={`text-2xl font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
            {totalPercentage.toFixed(1)}%
          </span>
        </div>
        {!isValidTotal && (
          <p className="text-red-600 text-sm mt-2">
            Total harus 100%. Sisa: {(100 - totalPercentage).toFixed(1)}%
          </p>
        )}
      </div>

      {/* Targets Form */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        {targets.map((target) => (
          <div key={target.tokenMint} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{target.tokenSymbol}</h3>
                <p className="text-xs text-gray-500 font-mono">
                  {target.tokenMint.substring(0, 8)}...{target.tokenMint.substring(target.tokenMint.length - 8)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Target Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Persentase (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={target.targetPercentage}
                  onChange={(e) => handleTargetChange(target.tokenMint, parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={target.threshold}
                  onChange={(e) => handleThresholdChange(target.tokenMint, parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deviasi yang diizinkan sebelum rebalance
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={!isValidTotal || saving}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          <span>{saving ? 'Menyimpan...' : 'Simpan Target'}</span>
        </button>
      </div>
    </div>
  );
};

export default TargetAllocation;
