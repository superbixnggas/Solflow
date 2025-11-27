import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend 
} from 'recharts';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Edit3,
  Target,
  TrendingUp,
  Settings
} from 'lucide-react';
import { 
  tokens as currentTokens, 
  targetAllocations, 
  getPortfolioSummary,
  formatCurrency,
  formatPercentage,
  colors as COLORS
} from '../data/mockData';

const COLOR_PALETTE = ['#9945FF', '#14F195', '#FFB800', '#FF3366', '#00D084', '#FF6B35', '#2774AE'];

interface TargetForm {
  token: string;
  target: number;
  threshold: number;
}

const TargetAllocation: React.FC = () => {
  const [targets, setTargets] = useState<TargetForm[]>(targetAllocations.map(t => ({
    token: t.token,
    target: t.target,
    threshold: t.threshold
  })));
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalTarget = targets.reduce((sum, t) => sum + t.target, 0);
  const isValidTotal = Math.abs(totalTarget - 100) < 0.01;

  // Prepare chart data for current vs target comparison
  const chartData = targets.map(target => {
    const currentToken = currentTokens.find(t => t.symbol === target.token);
    const currentPercentage = currentToken ? 
      ((currentToken.balance * currentToken.price) / getPortfolioSummary().totalValue * 100) : 0;
    
    return {
      token: target.token,
      current: currentPercentage,
      target: target.target,
      deviation: currentPercentage - target.target,
      threshold: target.threshold
    };
  });

  // Prepare pie chart data
  const pieChartData = targets.map((target, index) => ({
    name: target.token,
    value: target.target,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length]
  }));

  // Color coding for deviations
  const getDeviationColor = (deviation: number, threshold: number) => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation <= 2) return '#00D084'; // Green - within threshold
    if (absDeviation <= 5) return '#FFB800'; // Yellow - warning zone  
    return '#FF3366'; // Red - critical zone
  };

  const availableTokens = currentTokens.filter(token => 
    !targets.some(target => target.token === token.symbol)
  );

  const handleTargetChange = (index: number, field: keyof TargetForm, value: number) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const handleAddToken = () => {
    if (selectedToken) {
      setTargets([...targets, { token: selectedToken, target: 0, threshold: 5 }]);
      setSelectedToken('');
      setShowAddForm(false);
    }
  };

  const handleRemoveToken = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!isValidTotal) {
      return;
    }

    setSaving(true);
    // Simulate save delay
    setTimeout(() => {
      setSaving(false);
      // Show success message (would integrate with toast in real app)
      alert('Target allocation berhasil disimpan!');
    }, 1500);
  };

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
                <h1 className="text-2xl font-bold gradient-text">Target Allocation</h1>
                <p className="text-gray-400 text-sm">Atur target alokasi untuk setiap token</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Total Validation */}
              <div className={`px-4 py-2 rounded-lg border ${
                isValidTotal ? 'border-green-500/50 bg-green-500/20 text-green-400' : 
                'border-red-500/50 bg-red-500/20 text-red-400'
              }`}>
                <span className="text-sm font-medium">Total: {totalTarget.toFixed(1)}%</span>
              </div>
              
              <button
                onClick={handleSave}
                disabled={!isValidTotal || saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/dashboard" className="btn-ghost">
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/targets" className="btn-primary">
            <Target className="w-4 h-4" />
            Target Allocation
          </Link>
          <Link to="/rebalance" className="btn-ghost">
            <Settings className="w-4 h-4" />
            Rebalance
          </Link>
          <Link to="/history" className="btn-ghost">
            <TrendingUp className="w-4 h-4" />
            History
          </Link>
        </div>

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
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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

          {/* Target Allocation Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Target Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="target"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Target']}
                    labelStyle={{ color: '#fff' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-300">{entry.name}: {entry.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Target Allocation Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Target Allocation Form</h3>
            <button
              onClick={() => setShowAddForm(true)}
              disabled={availableTokens.length === 0}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Token
            </button>
          </div>

          {/* Add Token Form */}
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 glass-card"
            >
              <div className="flex items-center gap-4">
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="">Pilih token...</option>
                  {availableTokens.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddToken}
                  disabled={!selectedToken}
                  className="btn-primary"
                >
                  Tambah
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedToken('');
                  }}
                  className="btn-ghost"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Target List Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-300">Token</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Current</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Target (%)</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Threshold (%)</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Deviation</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target, index) => {
                  const deviationData = chartData.find(c => c.token === target.token);
                  const deviation = deviationData?.deviation || 0;
                  const deviationColor = getDeviationColor(deviation, target.threshold);
                  
                  return (
                    <motion.tr
                      key={target.token}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {target.token.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{target.token}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 text-center text-gray-300">
                        {deviationData?.current.toFixed(1)}%
                      </td>
                      
                      <td className="py-4 px-6 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={target.target}
                          onChange={(e) => handleTargetChange(index, 'target', parseFloat(e.target.value) || 0)}
                          className="input-field text-center w-20"
                        />
                      </td>
                      
                      <td className="py-4 px-6 text-center">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          step="0.5"
                          value={target.threshold}
                          onChange={(e) => handleTargetChange(index, 'threshold', parseFloat(e.target.value) || 1)}
                          className="input-field text-center w-20"
                        />
                      </td>
                      
                      <td className="py-4 px-6 text-center">
                        <span 
                          className="font-medium px-2 py-1 rounded text-sm"
                          style={{ color: deviationColor }}
                        >
                          {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setIsEditing(isEditing === target.token ? null : target.token)}
                            className="text-[#9945FF] hover:text-[#14F195] transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveToken(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Validation Warning */}
          {!isValidTotal && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 border border-red-500/50 bg-red-500/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">
                  Total alokasi harus 100%. Sisa: {(100 - totalTarget).toFixed(1)}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {isValidTotal && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 border border-green-500/50 bg-green-500/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">
                  Target allocation valid! Total: {totalTarget.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card p-6"
        >
          <h4 className="text-white font-medium mb-4">Cara Menggunakan Target Allocation:</h4>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Atur target persentase untuk setiap token (total harus 100%)</li>
            <li>• Threshold menentukan deviasi yang diizinkan sebelum rebalance dilakukan</li>
            <li>• Deviasi berwarna hijau (&lt;2%), kuning (2-5%), dan merah (&gt;5%)</li>
            <li>• Tambah atau hapus token sesuai kebutuhan portfolio Anda</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default TargetAllocation;