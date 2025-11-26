import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import logger from '../utils/logger';

export class SolanaService {
  private connection: Connection;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getConnection(): Promise<Connection> {
    return this.connection;
  }

  async validatePublicKey(publicKeyString: string): Promise<boolean> {
    try {
      new PublicKey(publicKeyString);
      return true;
    } catch {
      return false;
    }
  }

  async getTokenAccounts(walletPublicKey: string) {
    try {
      const publicKey = new PublicKey(walletPublicKey);
      
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokens = tokenAccounts.value
        .map((accountInfo) => {
          const parsedInfo = accountInfo.account.data as ParsedAccountData;
          const tokenData = parsedInfo.parsed.info;
          
          return {
            mint: tokenData.mint,
            balance: tokenData.tokenAmount.uiAmount || 0,
            decimals: tokenData.tokenAmount.decimals,
          };
        })
        .filter((token) => token.balance > 0);

      // Add SOL balance
      const solBalance = await this.connection.getBalance(publicKey);
      tokens.push({
        mint: 'So11111111111111111111111111111111111111112', // Wrapped SOL mint
        balance: solBalance / 1e9,
        decimals: 9,
      });

      return tokens;
    } catch (error) {
      logger.error('Error fetching token accounts:', error);
      throw new Error('Failed to fetch token accounts from Solana');
    }
  }

  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status?.value?.confirmationStatus === 'confirmed' || 
             status?.value?.confirmationStatus === 'finalized';
    } catch (error) {
      logger.error('Error verifying transaction:', error);
      return false;
    }
  }
}

export default new SolanaService();
