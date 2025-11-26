import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import solanaService from '../services/solanaService';
import pythService from '../services/pythService';
import jupiterService from '../services/jupiterService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class RebalanceWorker {
  private cronSchedule: string;
  private isRunning: boolean = false;

  constructor(cronSchedule: string = '*/5 * * * *') {
    this.cronSchedule = cronSchedule;
  }

  start() {
    logger.info(`Starting rebalance worker with schedule: ${this.cronSchedule}`);

    cron.schedule(this.cronSchedule, async () => {
      if (this.isRunning) {
        logger.warn('Previous rebalance check still running, skipping...');
        return;
      }

      this.isRunning = true;
      await this.checkAllPortfolios();
      this.isRunning = false;
    });

    logger.info('Rebalance worker started successfully');
  }

  async checkAllPortfolios() {
    try {
      logger.info('Starting portfolio rebalance check...');

      // Get all wallets with target allocations
      const wallets = await prisma.userWallet.findMany({
        include: {
          targets: true,
        },
      });

      const walletsWithTargets = wallets.filter(w => w.targets.length > 0);

      logger.info(`Checking ${walletsWithTargets.length} wallets with target allocations`);

      for (const wallet of walletsWithTargets) {
        try {
          await this.checkWalletRebalance(wallet.publicKey);
        } catch (error) {
          logger.error(`Error checking wallet ${wallet.publicKey}:`, error);
        }
      }

      logger.info('Portfolio rebalance check completed');
    } catch (error) {
      logger.error('Error in checkAllPortfolios:', error);
    }
  }

  async checkWalletRebalance(publicKey: string) {
    try {
      // Fetch current portfolio
      const tokenAccounts = await solanaService.getTokenAccounts(publicKey);
      const tokenMints = tokenAccounts.map(t => t.mint);
      const prices = await pythService.getPrices(tokenMints);

      let totalValue = 0;
      const currentPortfolio: any[] = [];

      for (const token of tokenAccounts) {
        const priceUSD = prices[token.mint] || 0;
        const valueUSD = token.balance * priceUSD;
        totalValue += valueUSD;

        currentPortfolio.push({
          tokenMint: token.mint,
          balance: token.balance,
          priceUSD,
          valueUSD,
          percentage: 0,
          decimals: token.decimals,
        });
      }

      currentPortfolio.forEach(item => {
        item.percentage = totalValue > 0 ? (item.valueUSD / totalValue) * 100 : 0;
      });

      // Update portfolio data in database
      for (const item of currentPortfolio) {
        await prisma.portfolioData.upsert({
          where: {
            publicKey_tokenMint: {
              publicKey,
              tokenMint: item.tokenMint,
            },
          },
          update: {
            balance: item.balance,
            priceUSD: item.priceUSD,
            valueUSD: item.valueUSD,
            percentage: item.percentage,
            updatedAt: new Date(),
          },
          create: {
            publicKey,
            tokenMint: item.tokenMint,
            tokenSymbol: item.tokenMint.substring(0, 8),
            balance: item.balance,
            priceUSD: item.priceUSD,
            valueUSD: item.valueUSD,
            percentage: item.percentage,
          },
        });
      }

      // Check if rebalance is needed
      const targets = await prisma.targetAllocation.findMany({
        where: { publicKey },
      });

      let needsRebalance = false;

      for (const target of targets) {
        const current = currentPortfolio.find(p => p.tokenMint === target.tokenMint);
        const currentPercentage = current ? current.percentage : 0;
        const deviation = Math.abs(currentPercentage - target.targetPercentage);

        if (deviation > target.threshold) {
          needsRebalance = true;
          break;
        }
      }

      if (needsRebalance) {
        logger.info(`Wallet ${publicKey} needs rebalancing`);
        // Note: Actual rebalance execution requires user approval
        // This worker only monitors and logs
      }
    } catch (error) {
      logger.error(`Error checking wallet ${publicKey}:`, error);
      throw error;
    }
  }
}

// For standalone execution
if (require.main === module) {
  const schedule = process.env.REBALANCE_CRON_SCHEDULE || '*/5 * * * *';
  const worker = new RebalanceWorker(schedule);
  worker.start();

  // Keep process alive
  process.on('SIGINT', () => {
    logger.info('Shutting down rebalance worker...');
    process.exit(0);
  });
}

export default RebalanceWorker;
