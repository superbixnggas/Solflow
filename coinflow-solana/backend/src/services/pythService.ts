import axios from 'axios';
import logger from '../utils/logger';

interface PriceData {
  [tokenMint: string]: number;
}

// Token mint to Pyth Price Feed ID mapping
const TOKEN_PRICE_FEEDS: { [key: string]: string } = {
  'So11111111111111111111111111111111111111112': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b', // USDT
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': '0xc2289a6a43d2ce728c89b98de0c2cd82d3e5a95f2a1e9cc71e0b50c2c8d8e3e9', // mSOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': '0x3f5a0b0f0d5d7b1e3e0c4b3a4b5d7e2d7b0d9c7e1b8f5a4d3c2b1a0e9f8d7c6', // BONK
};

export class PythService {
  private apiUrl: string;
  private priceCache: Map<string, { price: number; timestamp: number }>;
  private cacheDuration: number = 30000; // 30 seconds

  constructor() {
    this.apiUrl = process.env.PYTH_API_URL || 'https://hermes.pyth.network/v2';
    this.priceCache = new Map();
  }

  async getPrice(tokenMint: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.priceCache.get(tokenMint);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.price;
      }

      const priceFeedId = TOKEN_PRICE_FEEDS[tokenMint];
      if (!priceFeedId) {
        logger.warn(`No Pyth price feed for token: ${tokenMint}`);
        return 0;
      }

      const response = await axios.get(
        `${this.apiUrl}/updates/price/latest`,
        {
          params: {
            ids: [priceFeedId],
          },
        }
      );

      const priceData = response.data.parsed?.[0];
      if (!priceData) {
        throw new Error('Invalid price data from Pyth');
      }

      const price = Number(priceData.price.price) * Math.pow(10, priceData.price.expo);

      // Cache the price
      this.priceCache.set(tokenMint, { price, timestamp: Date.now() });

      return price;
    } catch (error) {
      logger.error(`Error fetching price for ${tokenMint}:`, error);
      // Fallback to 0 if price not available
      return 0;
    }
  }

  async getPrices(tokenMints: string[]): Promise<PriceData> {
    const prices: PriceData = {};
    
    await Promise.all(
      tokenMints.map(async (mint) => {
        prices[mint] = await this.getPrice(mint);
      })
    );

    return prices;
  }

  clearCache() {
    this.priceCache.clear();
  }
}

export default new PythService();
