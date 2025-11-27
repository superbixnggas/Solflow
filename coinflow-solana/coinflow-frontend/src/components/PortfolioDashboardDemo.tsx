import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Wallet, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Target, 
  History,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  tokens as currentTokens, 
  getPortfolioSummary, 
  targetAllocations, 
  simulatePriceUpdate, 
  formatCurrency, 
  formatPercentage, 
  formatAddress,
  colors 
} from '../data/mockData';

const PortfolioDashboardDemo: React.FC = () => {
  const [currentTokensState, setCurrentTokens] = useState(currentTokens);
  const [portfolioSummary, setPortfolioSummary] = useState(getPortfolioSummary());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [connectedWallet] = useState({
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    type: 'phantom'
  });
  const navigate = useNavigate();

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      handlePriceUpdate();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handlePriceUpdate = () => {
    setIsUpdating(true);
    
    // Simulate update delay
    setTimeout(() => {
      simulatePriceUpdate();
      setCurrentTokens([...currentTokensState]);
      setPortfolioSummary(getPortfolioSummary());
      setLastUpdate(new Date());
      setIsUpdating(false);
    }, 1000);
  };

  const handleDisconnect = () => {
    navigate('/');
  };

  // Prepare chart data
  const portfolioChartData = currentTokens.map(token => ({
    name: token.symbol,
    value: token.balance * token.price,
    percentage: ((token.balance * token.price) / portfolioSummary.totalValue * 100).toFixed(1),
    color: token.color
  }));

  const allocationComparisonData = targetAllocations.map(target => {
    const currentToken = currentTokens.find(t => t.symbol === target.token);
    return {
      token: target.token,
      current: currentToken ? ((currentToken.balance * currentToken.price) / portfolioSummary.totalValue * 100) : 0,
      target: target.target,
      deviation: currentToken ? (((currentToken.balance * currentToken.price) / portfolioSummary.totalValue * 100) - target.target) : 0
    };
  });

  const COLORS = ['#9945FF', '#14F195', '#FFB800', '#FF3366', '#00D084', '#FF6B35', '#2774AE'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-black to-[#9945FF]/20">
      {/* Header */}
      <div className="glass-nav sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 gradient-solana rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">CoinFlow Solana Edition</h1>
                <p className="text-gray-400 text-sm">Portfolio Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Wallet Info */}
              <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium text-sm">
                  {formatAddress(connectedWallet.address)}
                </span>
                <span className="text-xs text-gray-400 bg-[#9945FF]/20 px-2 py-1 rounded">
                  {connectedWallet.type}
                </span>
              </div>
              
              {/* Disconnect Button */}
              <button 
                onClick={handleDisconnect}
                className="btn-ghost flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/dashboard" className="btn-primary">
            <Activity className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/targets" className="btn-ghost">
            <Target className="w-4 h-4" />
            Target Allocation
          </Link>
          <Link to="/rebalance" className="btn-ghost">
            <TrendingUp className="w-4 h-4" />
            Rebalance
          </Link>
          <Link to="/history" className="btn-ghost">
            <History className="w-4 h-4" />
            History
          </Link>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Portfolio Value */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-gradient"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-[#9945FF] bg-[#9945FF]/20 p-3 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(portfolioSummary.totalValue)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Updated: {lastUpdate.toLocaleTimeString('id-ID')}</span>
            </div>
          </motion.div>

          {/* Number of Tokens */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-[#14F195] bg-[#14F195]/20 p-3 rounded-xl">
                <BarChart className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Number of Tokens</p>
                <p className="text-2xl font-bold text-white">{portfolioSummary.numberOfTokens}</p>
              </div>
            </div>
          </motion.div>

          {/* 24h Change */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${portfolioSummary.change24h >= 0 ? 'text-green-400' : 'text-red-400'} bg-white/10 p-3 rounded-xl`}>
                {portfolioSummary.change24h >= 0 ? 
                  <ArrowUpRight className="w-6 h-6" /> : 
                  <ArrowDownRight className="w-6 h-6" />
                }
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">24h Change</p>
                <p className={`text-2xl font-bold ${portfolioSummary.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(portfolioSummary.change24h)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Total P&L */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${portfolioSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} bg-white/10 p-3 rounded-xl`}>
                {portfolioSummary.totalPnL >= 0 ? 
                  <TrendingUp className="w-6 h-6" /> : 
                  <TrendingDown className="w-6 h-6" />
                }
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Total P&L</p>
                <p className={`text-2xl font-bold ${portfolioSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(portfolioSummary.totalPnL)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Portfolio Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {portfolioChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                    labelStyle={{ color: '#fff' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {portfolioChartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-300">{item.name}: {item.percentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Current vs Target Allocation */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Current vs Target Allocation</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocationComparisonData}>
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
        </div>

        {/* Portfolio Table */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Portfolio Details</h3>
            <button 
              onClick={handlePriceUpdate}
              disabled={isUpdating}
              className="btn-ghost flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Refresh'}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-300">Token Symbol & Icon</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Balance</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Price (USD)</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Value (USD)</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Percentage (%)</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">24h Change (%)</th>
                </tr>
              </thead>
              <tbody>
                {currentTokensState.map((token, index) => {
                  const tokenValue = token.balance * token.price;
                  const percentage = (tokenValue / portfolioSummary.totalValue * 100);
                  
                  return (
                    <motion.tr
                      key={token.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: token.color }}
                          >
                            {token.icon}
                          </div>
                          <div>
                            <div className="text-white font-medium">{token.symbol}</div>
                            <div className="text-gray-400 text-sm">{token.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-white">
                        {token.balance.toLocaleString('id-ID', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 4 
                        })}
                      </td>
                      <td className="py-4 px-6 text-right text-white">
                        {formatCurrency(token.price)}
                      </td>
                      <td className="py-4 px-6 text-right text-white font-medium">
                        {formatCurrency(tokenValue)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: token.color
                              }}
                            />
                          </div>
                          <span className="text-white text-sm font-medium w-12">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-medium ${
                          token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Demo Notice */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 glass-card p-6"
        >
          <div className="flex items-start gap-3">
            <div className="text-[#FFB800] mt-1">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Demo Interaktif</h4>
              <p className="text-gray-400 text-sm">
                Data ini adalah simulasi untuk demonstrasi. Dalam versi production, data akan diperbarui secara real-time 
                dari blockchain Solana setiap 30 detik. Jelajahi fitur target allocation dan rebalance di navigation tabs di atas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PortfolioDashboardDemo;