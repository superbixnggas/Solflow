import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Play,
  ExternalLink,
  ArrowRight,
  Zap,
  Clock
} from 'lucide-react';

interface DeviationData {
  token: string;
  current: number;
  target: number;
  deviation: number;
  threshold: number;
  status: 'balanced' | 'warning' | 'critical';
  currentValue: number;
}

interface RebalanceAction {
  fromToken: string;
  toToken: string;
  amount: number;
  estimatedPriceImpact: number;
  jupiterQuote: {
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
  };
  feeEstimate: number;
}

const RebalanceViewReal: React.FC = () => {
  const { publicKey } = useWallet();
  const [deviations, setDeviations] = useState<DeviationData[]>([]);
  const [rebalancePlan, setRebalancePlan] = useState<RebalanceAction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [needsRebalance, setNeedsRebalance] = useState(false);

  // Fetch rebalance analysis
  const fetchRebalanceData = async () => {
    if (!publicKey) return;

    try {
      setRefreshing(true);
      
      const response = await apiClient.checkRebalance(publicKey);
      if (response.success && response.data) {
        const { deviations: devData, needsRebalance: needsRebal } = response.data;
        setDeviations(devData || []);
        setNeedsRebalance(needsRebal || false);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching rebalance data:', error);
      toast.error('Gagal memuat data rebalance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRebalanceData();
  }, [publicKey]);

  const handleGeneratePlan = async () => {
    if (!publicKey) return;

    try {
      setGeneratingPlan(true);
      
      const response = await apiClient.generateRebalancePlan(publicKey);
      if (response.success && response.data) {
        setRebalancePlan(response.data.plan || []);
        toast.success('Rencana rebalance berhasil dibuat!');
      } else {
        throw new Error(response.message || 'Gagal membuat rencana rebalance');
      }
    } catch (error) {
      console.error('Error generating rebalance plan:', error);
      toast.error('Gagal membuat rencana rebalance');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleExecute = async () => {
    if (!publicKey || !rebalancePlan) return;

    try {
      const response = await apiClient.executeRebalance({
        publicKey,
        plan: rebalancePlan
      });

      if (response.success) {
        toast.success('Rebalance berhasil dieksekusi!');
        setRebalancePlan(null);
        fetchRebalanceData(); // Refresh data after execution
      } else {
        throw new Error(response.message || 'Gagal mengeksekusi rebalance');
      }
    } catch (error) {
      console.error('Error executing rebalance:', error);
      toast.error('Gagal mengeksekusi rebalance');
    }
  };

  const handleRefresh = () => {
    fetchRebalanceData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'balanced':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'balanced':
        return 'status-success';
      case 'warning':
        return 'status-warning';
      case 'critical':
        return 'status-error';
      default:
        return 'status-pending';
    }
  };

  // Prepare chart data
  const comparisonData = deviations.map(dev => ({
    token: dev.token,
    current: dev.current,
    target: dev.target,
    deviation: Math.abs(dev.deviation)
  }));

  const deviationStatusData = deviations.map(dev => ({
    name: dev.token,
    value: Math.abs(dev.deviation),
    status: dev.status,
    color: dev.status === 'balanced' ? '#00D084' : 
           dev.status === 'warning' ? '#FFB800' : '#FF3366'
  }));

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-black to-[#9945FF]/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Silakan connect wallet terlebih dahulu</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-black to-[#9945FF]/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9945FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat data rebalance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-black to-[#9945FF]/20">
      {/* Header */}
      <div className="glass-nav sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="btn-ghost">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Rebalance Portfolio</h1>
                <p className="text-gray-400 text-sm">Analisis deviasi dan rencana rebalancing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-gray-400 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated: {lastUpdate.toLocaleTimeString('id-ID')}
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-ghost flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/dashboard" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/targets" className="btn-ghost">
            <CheckCircle className="w-4 h-4" />
            Target Allocation
          </Link>
          <Link to="/rebalance" className="btn-primary">
            <Zap className="w-4 h-4" />
            Rebalance
          </Link>
          <Link to="/history" className="btn-ghost">
            <ExternalLink className="w-4 h-4" />
            History
          </Link>
        </div>

        {/* Status Alert */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border mb-8 ${
            needsRebalance 
              ? 'border-yellow-500/50 bg-yellow-500/10' 
              : 'border-green-500/50 bg-green-500/10'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`${needsRebalance ? 'text-yellow-400' : 'text-green-400'}`}>
              {needsRebalance ? 
                <AlertTriangle className="w-8 h-8" /> : 
                <CheckCircle className="w-8 h-8" />
              }
            </div>
            <div>
              <h3 className={`text-xl font-bold ${needsRebalance ? 'text-yellow-400' : 'text-green-400'}`}>
                {needsRebalance ? 'Rebalance Diperlukan' : 'Portfolio Seimbang'}
              </h3>
              <p className="text-gray-300 mt-1">
                {needsRebalance 
                  ? 'Beberapa token melampaui threshold yang ditetapkan. Buat rencana rebalance untuk mengoptimasi portfolio.'
                  : 'Semua token dalam range target alokasi. Portfolio sudah seimbang.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current vs Target Allocation */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Current vs Target Allocation</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="token" 
                    stroke="#999"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#999"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`, 
                      name === 'current' ? 'Current' : 'Target'
                    ]}
                    labelStyle={{ color: '#fff' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Bar dataKey="current" fill="#9945FF" name="Current" />
                  <Bar dataKey="target" fill="#14F195" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Deviation Analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Deviation Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviationStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Deviation']}
                    labelStyle={{ color: '#fff' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm text-gray-300">Balanced</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-sm text-gray-300">Warning</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-sm text-gray-300">Critical</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Deviation Analysis Table */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card overflow-hidden mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Deviation Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-300">Token</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Current (%)</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Target (%)</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Deviation (%)</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Threshold</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {deviations.map((dev, index) => (
                  <motion.tr
                    key={dev.token}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {dev.token.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{dev.token}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right text-white">
                      {dev.current.toFixed(1)}%
                    </td>
                    
                    <td className="py-4 px-6 text-right text-gray-300">
                      {dev.target.toFixed(1)}%
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <span className={`font-medium ${
                        dev.deviation >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {dev.deviation >= 0 ? '+' : ''}{dev.deviation.toFixed(1)}%
                      </span>
                    </td>
                    
                    <td className="py-4 px-6 text-center text-gray-300">
                      ±{dev.threshold}%
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(dev.status)}
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(dev.status)}`}>
                          {dev.status === 'balanced' ? 'Seimbang' : 
                           dev.status === 'warning' ? 'Warning' : 'Critical'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Rebalance Plan Section */}
        {!rebalancePlan ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            {needsRebalance ? (
              <div className="card p-8">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">Rebalance Plan Diperlukan</h3>
                <p className="text-gray-400 mb-6">
                  Portfolio Anda memiliki deviasi yang melebihi threshold. Buat rencana rebalance untuk mengoptimalkan alokasi.
                </p>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  {generatingPlan ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Membuat Rencana...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Buat Rencana Rebalance
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="card p-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">Portfolio Seimbang</h3>
                <p className="text-gray-400">
                  Semua token dalam range target alokasi. Tidak perlu rebalance saat ini.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Rebalance Plan</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  {rebalancePlan.length} swap diperlukan
                </span>
              </div>
            </div>

            {/* Rebalance Actions Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-300">From Token → To Token</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-300">Amount to Swap</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-300">Estimated Price Impact</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-300">Jupiter Quote</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-300">Fee Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  {rebalancePlan.map((action, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#9945FF] rounded-full flex items-center justify-center text-white text-xs">
                            {action.fromToken.charAt(0)}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="w-6 h-6 bg-[#14F195] rounded-full flex items-center justify-center text-white text-xs">
                            {action.toToken.charAt(0)}
                          </div>
                          <span className="text-white font-medium">
                            {action.fromToken} → {action.toToken}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 text-right text-white">
                        {action.amount.toLocaleString('id-ID', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 4 
                        })}
                      </td>
                      
                      <td className="py-4 px-6 text-right">
                        <span className={`font-medium ${
                          action.estimatedPriceImpact > 1 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {action.estimatedPriceImpact.toFixed(2)}%
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 text-right text-gray-300">
                        <div>
                          <div className="text-xs">In: {action.jupiterQuote.inAmount} SOL</div>
                          <div className="text-xs">Out: {action.jupiterQuote.outAmount} {action.toToken}</div>
                          <div className="text-xs text-yellow-400">
                            Impact: {action.jupiterQuote.priceImpactPct.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 text-right text-green-400">
                        {action.feeEstimate.toFixed(4)} SOL
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Plan Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Swaps</p>
                <p className="text-white font-semibold text-xl">{rebalancePlan.length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Est. Total Fees</p>
                <p className="text-green-400 font-semibold text-xl">
                  {rebalancePlan.reduce((sum, a) => sum + a.feeEstimate, 0).toFixed(4)} SOL
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Max Price Impact</p>
                <p className="text-yellow-400 font-semibold text-xl">
                  {Math.max(...rebalancePlan.map(a => a.estimatedPriceImpact)).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setRebalancePlan(null)}
                className="btn-ghost"
              >
                Batal
              </button>
              <button
                onClick={handleExecute}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Eksekusi Rebalance
              </button>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass-card p-6"
        >
          <h4 className="text-white font-medium mb-4">Cara Kerja Rebalance:</h4>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Sistem menganalisis deviasi antara current dan target allocation</li>
            <li>• Deviasi berwarna hijau (&lt; threshold), kuning (warning zone), merah (critical zone)</li>
            <li>• Rencana rebalance dibuat dengan quotes terbaik dari Jupiter aggregator</li>
            <li>• Estimate fees dan price impact ditampilkan sebelum eksekusi</li>
            <li>• Semua transaksi dilakukan secara non-custodial dari wallet Anda</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default RebalanceViewReal;