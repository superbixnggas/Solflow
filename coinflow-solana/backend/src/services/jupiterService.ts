import axios from 'axios';
import logger from '../utils/logger';

interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: any[];
}

export class JupiterService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';
  }

  async getQuote(params: JupiterQuoteParams): Promise<JupiterQuoteResponse | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/quote`, {
        params: {
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          slippageBps: params.slippageBps || 50, // 0.5% default slippage
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting Jupiter quote:', error);
      return null;
    }
  }

  async getSwapInstructions(quoteResponse: any, userPublicKey: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/swap-instructions`, {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: 'auto',
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting swap instructions:', error);
      throw new Error('Failed to get swap instructions from Jupiter');
    }
  }

  async getBestRoute(
    fromMint: string,
    toMint: string,
    amount: number
  ): Promise<JupiterQuoteResponse | null> {
    return this.getQuote({
      inputMint: fromMint,
      outputMint: toMint,
      amount,
      slippageBps: 50,
    });
  }
}

export default new JupiterService();
