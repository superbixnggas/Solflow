import { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Target, Shield, RefreshCw } from 'lucide-react';

const WalletConnectDemo: FC = () => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleWalletConnect = (walletType: string) => {
    setConnecting(walletType);
    setTimeout(() => {
      setConnecting(null);
      // Navigate to dashboard after "connection"
      navigate('/dashboard');
    }, 2000);
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

            {/* Demo Mode Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <div className="glass-card p-4 mb-8 max-w-2xl mx-auto">
                <p className="text-[#FFB800] text-sm">
                  <strong>Demo Interaktif:</strong> Klik wallet button untuk simulasi koneksi dan jelajahi semua fitur CoinFlow
                </p>
              </div>
            </motion.div>

            {/* Wallet Connection Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16"
            >
              {/* Phantom Wallet */}
              <button
                onClick={() => handleWalletConnect('phantom')}
                disabled={connecting !== null}
                className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#AB9FF2] rounded-full mx-auto mb-3 flex items-center justify-center">
                    {connecting === 'phantom' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mb-1">Phantom Wallet</h3>
                  <p className="text-gray-400 text-sm">Wallet terpopuler untuk Solana</p>
                </div>
              </button>

              {/* Backpack Wallet */}
              <button
                onClick={() => handleWalletConnect('backpack')}
                disabled={connecting !== null}
                className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#14F195] to-[#00D084] rounded-full mx-auto mb-3 flex items-center justify-center">
                    {connecting === 'backpack' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 12v8a2 2 0 01-2 2h-3v-10h5zM6 12v8a2 2 0 002 2h3V12H6z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mb-1">Backpack Wallet</h3>
                  <p className="text-gray-400 text-sm">Wallet advanced dengan DEX trading</p>
                </div>
              </button>

              {/* Solflare Wallet */}
              <button
                onClick={() => handleWalletConnect('solflare')}
                disabled={connecting !== null}
                className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#F7931E] rounded-full mx-auto mb-3 flex items-center justify-center">
                    {connecting === 'solflare' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mb-1">Solflare Wallet</h3>
                  <p className="text-gray-400 text-sm">Web & mobile wallet Solana</p>
                </div>
              </button>
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

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-16"
          >
            <div className="glass-card p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Siap Memulai?</h3>
              <p className="text-gray-400 mb-6">Jelajahi semua fitur CoinFlow dalam mode demo interaktif</p>
              <Link
                to="/dashboard"
                className="btn-primary inline-flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Masuk Dashboard Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectDemo;
