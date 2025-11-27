import { useState, useEffect, useCallback } from 'react';
import { portfolioService, priceService } from '../lib/supabase';
import { useCoinFlowWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';

// Types
interface PortfolioToken {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  value: number;
  change24h: number;
  decimals: number;
  uiAmount: number;
  priceSource?: string;
}

interface PortfolioData {
  walletAddress: string;
  totalValue: number;
  numberOfTokens: number;
  change24h: number;
  totalPnL: number;
  tokens: PortfolioToken[];
  lastUpdated: string;
}

interface UsePortfolioReturn {
  portfolio: PortfolioData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updatePrice: (mint: string, price: number) => void;
  refreshInterval: NodeJS.Timeout | null;
}

export const usePortfolio = (autoRefresh: boolean = true, refreshInterval: number = 30000): UsePortfolioReturn => {
  const { publicKey, isConnected } = useCoinFlowWallet();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!isConnected || !publicKey) {
      setPortfolio(null);
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching portfolio for wallet:', publicKey);
      
      const result = await portfolioService.fetchPortfolio(publicKey);
      
      if (result.success) {
        const data = result.data as PortfolioData;
        setPortfolio(data);
        
        // Update local storage for cache
        localStorage.setItem(`coinflow-portfolio-${publicKey}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        
        console.log('Portfolio fetched successfully:', data);
      } else {
        throw new Error(result.error || 'Failed to fetch portfolio');
      }
    } catch (err: any) {
      console.error('Error fetching portfolio:', err);
      setError(err.message || 'Failed to fetch portfolio');
      
      // Try to load from cache
      const cached = localStorage.getItem(`coinflow-portfolio-${publicKey}`);
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          // Use cache if it's less than 5 minutes old
          if (Date.now() - timestamp < 300000) {
            setPortfolio(cachedData);
            setError('Using cached data - ' + err.message);
          }
        } catch (cacheError) {
          console.error('Error parsing cached data:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected, publicKey]);

  // Update individual token price
  const updatePrice = useCallback((mint: string, newPrice: number) => {
    if (!portfolio) return;

    setPortfolio(prev => {
      if (!prev) return prev;
      
      const updatedTokens = prev.tokens.map(token => {
        if (token.mint === mint) {
          const newValue = token.balance * newPrice;
          return {
            ...token,
            price: newPrice,
            value: newValue,
            priceSource: 'manual'
          };
        }
        return token;
      });

      const newTotalValue = updatedTokens.reduce((sum, token) => sum + token.value, 0);
      
      return {
        ...prev,
        tokens: updatedTokens,
        totalValue: newTotalValue
      };
    });
  }, [portfolio]);

  // Manual refresh function
  const refetch = useCallback(async () => {
    await fetchPortfolio();
  }, [fetchPortfolio]);

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh || !publicKey || !isConnected) {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        setRefreshTimer(null);
      }
      return;
    }

    // Clear existing timer
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    // Set up new timer
    const timer = setInterval(fetchPortfolio, refreshInterval);
    setRefreshTimer(timer);

    // Cleanup function
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [autoRefresh, refreshInterval, publicKey, isConnected, fetchPortfolio]);

  // Initial fetch when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      fetchPortfolio();
    }
  }, [isConnected, publicKey, fetchPortfolio]);

  return {
    portfolio,
    loading,
    error,
    refetch,
    updatePrice,
    refreshInterval: refreshTimer
  };
};

// Hook for real-time price updates using WebSocket or polling
export const useLivePrices = (tokenMints: string[], enabled: boolean = true) => {
  const [prices, setPrices] = useState<Record<string, { price: number; change24h: number; timestamp: number }>>({});
  const [loading, setLoading] = useState(false);

  const updatePrices = useCallback(async () => {
    if (!enabled || tokenMints.length === 0) return;

    setLoading(true);
    try {
      const result = await priceService.getMultipleTokenPrices(tokenMints);
      if (result.success) {
        const updatedPrices: Record<string, { price: number; change24h: number; timestamp: number }> = {};
        
        Object.entries(result.prices).forEach(([mint, priceData]: [string, any]) => {
          updatedPrices[mint] = {
            price: priceData.price || 0,
            change24h: priceData.change24h || 0,
            timestamp: Date.now()
          };
        });

        setPrices(prev => ({ ...prev, ...updatedPrices }));
      }
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled, tokenMints]);

  // Update prices every 30 seconds
  useEffect(() => {
    if (enabled && tokenMints.length > 0) {
      updatePrices();
      const interval = setInterval(updatePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [enabled, tokenMints, updatePrices]);

  return { prices, loading, updatePrices };
};

// Hook for portfolio comparison and analytics
export const usePortfolioAnalytics = (portfolio: PortfolioData | null) => {
  const [analytics, setAnalytics] = useState<{
    diversification: number;
    largestHolding: PortfolioToken | null;
    riskScore: number;
    allocationDistribution: { [key: string]: number };
  } | null>(null);

  useEffect(() => {
    if (!portfolio || portfolio.tokens.length === 0) {
      setAnalytics(null);
      return;
    }

    // Calculate diversification score (Herfindahl-Hirschman Index)
    const totalValue = portfolio.totalValue;
    const concentrations = portfolio.tokens.map(token => Math.pow(token.value / totalValue, 2));
    const hhi = concentrations.reduce((sum, conc) => sum + conc, 0);
    const diversification = Math.max(0, (1 - hhi) * 100);

    // Find largest holding
    const largestHolding = portfolio.tokens.reduce((largest, current) => 
      current.value > (largest?.value || 0) ? current : largest, null
    );

    // Simple risk score based on concentration
    const largestHoldingPercentage = largestHolding ? (largestHolding.value / totalValue) * 100 : 0;
    const riskScore = Math.min(100, largestHoldingPercentage * 2);

    // Allocation distribution
    const allocationDistribution: { [key: string]: number } = {};
    portfolio.tokens.forEach(token => {
      const percentage = (token.value / totalValue) * 100;
      allocationDistribution[token.symbol] = percentage;
    });

    setAnalytics({
      diversification,
      largestHolding,
      riskScore,
      allocationDistribution
    });
  }, [portfolio]);

  return analytics;
};

// Hook for rebalance recommendations
export const useRebalanceRecommendations = (portfolio: PortfolioData | null) => {
  const [recommendations, setRecommendations] = useState<{
    needsRebalance: boolean;
    recommendedActions: Array<{
      action: 'buy' | 'sell' | 'hold';
      token: string;
      currentAllocation: number;
      targetAllocation: number;
      suggestedAmount: number;
      reason: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (!portfolio || portfolio.tokens.length === 0) {
      setRecommendations(null);
      return;
    }

    // Simple rebalance logic (in production, this would use target allocations)
    const recommendations = {
      needsRebalance: false,
      recommendedActions: [] as any[]
    };

    const totalValue = portfolio.totalValue;
    
    // Example: Suggest rebalancing if any token is > 40% of portfolio
    const largestToken = portfolio.tokens.reduce((largest, current) => 
      current.value > (largest?.value || 0) ? current : largest, null
    );

    if (largestToken && (largestToken.value / totalValue) * 100 > 40) {
      recommendations.needsRebalance = true;
      recommendations.recommendedActions.push({
        action: 'sell',
        token: largestToken.symbol,
        currentAllocation: (largestToken.value / totalValue) * 100,
        targetAllocation: 30,
        suggestedAmount: largestToken.value - (totalValue * 0.3),
        reason: `Concentration risk: ${largestToken.symbol} represents ${((largestToken.value / totalValue) * 100).toFixed(1)}% of portfolio`
      });
    }

    setRecommendations(recommendations);
  }, [portfolio]);

  return recommendations;
};