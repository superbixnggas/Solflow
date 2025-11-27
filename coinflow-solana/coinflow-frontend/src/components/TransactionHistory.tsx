import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Search, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { transactionHistory, formatCurrency, formatAddress } from '../data/mockData';

const TransactionHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    return transactionHistory.filter(tx => {
      const matchesSearch = searchTerm === '' || 
        tx.tokenPair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, filterType, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'sell':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'swap':
        return <Repeat className="w-4 h-4" />;
      default:
        return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-400';
      case 'sell':
        return 'text-red-400';
      case 'swap':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'success':
        return `${baseClasses} status-success`;
      case 'pending':
        return `${baseClasses} status-pending`;
      case 'failed':
        return `${baseClasses} status-error`;
      default:
        return `${baseClasses} status-pending`;
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Token Pair', 'Amount', 'Price Impact', 'Status', 'Hash'],
      ...filteredTransactions.map(tx => [
        tx.date,
        tx.type,
        tx.tokenPair,
        tx.amount.toString(),
        tx.priceImpact.toString(),
        tx.status,
        tx.hash
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coinflow-transaction-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
                <h1 className="text-2xl font-bold gradient-text">Riwayat Transaksi</h1>
                <p className="text-gray-400 text-sm">Semua aktivitas trading dan swap</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filters and Search */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari token atau hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">Semua Tipe</option>
              <option value="buy">Beli</option>
              <option value="sell">Jual</option>
              <option value="swap">Swap</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">Semua Status</option>
              <option value="success">Berhasil</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>

            {/* Results count */}
            <div className="flex items-center text-gray-400 text-sm">
              <Filter className="w-4 h-4 mr-2" />
              {filteredTransactions.length} transaksi ditemukan
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-300">Tanggal & Waktu</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-300">Tipe</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-300">Pasangan Token</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Jumlah</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-300">Price Impact</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Status</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-300">Hash</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="text-sm text-white">{tx.date}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`flex items-center gap-2 ${getTypeColor(tx.type)}`}>
                        {getTypeIcon(tx.type)}
                        <span className="capitalize font-medium">{tx.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-medium">{tx.tokenPair}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-white">{tx.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`${tx.priceImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.priceImpact >= 0 ? '+' : ''}{tx.priceImpact.toFixed(3)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className={getStatusBadge(tx.status)}>
                        {getStatusIcon(tx.status)}
                        <span className="capitalize">{tx.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-400 text-sm font-mono">
                          {formatAddress(tx.hash)}
                        </span>
                        <button className="text-[#9945FF] hover:text-[#14F195] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Repeat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada transaksi ditemukan</p>
                <p className="text-sm">Coba ubah filter pencarian Anda</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-400">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-ghost disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#9945FF] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-ghost disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;