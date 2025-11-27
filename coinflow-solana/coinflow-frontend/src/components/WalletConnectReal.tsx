import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Target, Shield, RefreshCw, WalletConnect } from 'lucide-react';
import { useCoinFlowWallet } from '../context/WalletContext';

const WalletConnectReal: React.FC = () => {
  const { 
    wallet, 
    isConnected, 
    isConnecting, 
    publicKey, 
    walletType, 
    balance, 
    connect, 
    disconnect,
    walletIcon,
    formatAddress 
  } = useCoinFlowWallet();

  const handleWalletConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleContinueToDashboard = () => {
    // Navigation will be handled automatically via routing
    window.location.href = '/dashboard';
  };

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-time Portfolio Tracking",
      description: "Monitor semua token Solana Anda secara real-time dengan price updates setiap 30 detik",
      color: "text-[#14F195]"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Target Allocation Management",
      description: "Set target alokasi untuk setiap token dan atur threshold tolerance sesuai kebutuhan",
      color: "text-[#9945FF]"
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "Auto Rebalance System",
      description: "Otomatis rebalance portfolio ketika deviasi melebihi threshold dengan Jupiter integration",
      color: "text-[#FFB800]"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Non-Custodial Security",
      description: "Aset Anda tetap berada di wallet sendiri, tidak ada deposit atau transfer ke layanan kami",
      color: "text-[#00D084]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-black to-[#9945FF]/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#9945FF]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#14F195]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative container-custom py-20">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="w-24 h-24 gradient-solana rounded-full mx-auto mb-6 flex items-center justify-center pulse-glow">
                <Wallet className="w-12 h-12 text-white" />
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="gradient-text">CoinFlow Solana</span>
                <span className="block text-white text-3xl md:text-4xl font-semibold mt-2">Edition</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-2">Portfolio Optimizer untuk Ekosistem Solana</p>
              <p className="text-gray-400">Kelola, track, dan rebalance portfolio Solana Anda dengan teknologi terdepan</p>
            </motion.div>

            {/* Connected Wallet Info */}
            {isConnected && publicKey && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="glass-card p-6 mb-8 max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Wallet Terhubung</span>
                </div>
                
                <div className="flex items-center justify-center gap-3 mb-3">
                  {walletIcon && (
                    <img src={walletIcon} alt={walletType} className="w-8 h-8" />
                  )}
                  <span className="text-white font-mono">{formatAddress(publicKey)}</span>
                  <span className="text-xs text-gray-400 bg-[#9945FF]/20 px-2 py-1 rounded">
                    {walletType}
                  </span>
                </div>
                
                <div className="text-center">
                  <span className="text-gray-400 text-sm">Balance: </span>
                  <span className="text-white font-semibold">{balance.toFixed(4)} SOL</span>
                </div>
              </motion.div>
            )}

            {/* Wallet Connection Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-3xl mx-auto mb-16"
            >
              {!isConnected ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phantom Wallet */}
                  <button
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                    className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#AB9FF2] rounded-full mx-auto mb-3 flex items-center justify-center">
                        {isConnecting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <WalletConnect className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-1">Hubungkan Wallet</h3>
                      <p className="text-gray-400 text-sm">Phantom, Solflare, Backpack</p>
                    </div>
                  </button>

                  {/* Demo Mode Button */}
                  <Link
                    to="/dashboard"
                    className="group relative bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 hover:from-[#9945FF]/30 hover:to-[#14F195]/30 backdrop-blur-lg border border-[#9945FF]/30 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#9945FF] rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-1">Mode Demo</h3>
                      <p className="text-gray-400 text-sm">Lihat tanpa wallet</p>
                    </div>
                  </Link>

                  {/* Learn More */}
                  <div className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#FFB800] rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-1">Mengapa CoinFlow?</h3>
                      <p className="text-gray-400 text-sm">Teknologi terdepan</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">Wallet Anda Sudah Terhubung!</h3>
                    <p className="text-gray-400 mb-6">Siap untuk mulai mengelola portfolio Solana Anda?</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleContinueToDashboard}
                      className="btn-primary flex items-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Masuk Dashboard
                    </button>
                    
                    <button
                      onClick={handleDisconnect}
                      className="btn-ghost"
                    >
                      Putus Koneksi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Mengapa Memilih CoinFlow?</h2>
            <p className="text-gray-400 text-lg">Teknologi terdepan untuk optimasi portfolio Solana</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="card hover-lift group"
              >
                <div className="flex items-start gap-4">
                  <div className={`${feature.color} bg-white/10 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-16"
          >
            <div className="glass-card p-8 max-w-2xl mx-auto">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Keamanan Terjamin</h3>
              <p className="text-gray-400 mb-6">
                CoinFlow menggunakan arsitektur non-custodial. Aset Anda tetap berada di wallet Anda sendiri. 
                Kami hanya membantu analisis dan rekomendasi, tidak pernah memegang kendali atas dana Anda.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-400 font-semibold">Non-Custodial</div>
                  <div className="text-gray-400">Aset tetap di wallet Anda</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-semibold">Open Source</div>
                  <div className="text-gray-400">Kode dapat diverifikasi</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-semibold">Mainnet Ready</div>
                  <div className="text-gray-400">Siap untuk produksi</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectReal;