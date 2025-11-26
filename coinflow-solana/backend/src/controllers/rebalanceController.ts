import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import solanaService from '../services/solanaService';
import pythService from '../services/pythService';
import jupiterService from '../services/jupiterService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface Deviation {
  tokenMint: string;
  tokenSymbol: string;
  currentPercentage: number;
  targetPercentage: number;
  deviation: number;
  needsRebalance: boolean;
}

export const checkRebalance = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;

    // Get current portfolio
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
        tokenSymbol: token.mint.substring(0, 8),
        balance: token.balance,
        priceUSD,
        valueUSD,
        percentage: 0,
      });
    }

    currentPortfolio.forEach(item => {
      item.percentage = totalValue > 0 ? (item.valueUSD / totalValue) * 100 : 0;
    });

    // Get target allocations
    const targets = await prisma.targetAllocation.findMany({
      where: { publicKey },
    });

    if (targets.length === 0) {
      return res.json({
        needsRebalance: false,
        deviations: [],
        currentPortfolio,
        message: 'No target allocation set',
      });
    }

    // Calculate deviations
    const deviations: Deviation[] = [];
    let needsRebalance = false;

    for (const target of targets) {
      const current = currentPortfolio.find(p => p.tokenMint === target.tokenMint);
      const currentPercentage = current ? current.percentage : 0;
      const deviation = currentPercentage - target.targetPercentage;

      const needsRebalanceForToken = Math.abs(deviation) > target.threshold;
      if (needsRebalanceForToken) {
        needsRebalance = true;
      }

      deviations.push({
        tokenMint: target.tokenMint,
        tokenSymbol: target.tokenSymbol,
        currentPercentage,
        targetPercentage: target.targetPercentage,
        deviation,
        needsRebalance: needsRebalanceForToken,
      });
    }

    res.json({
      needsRebalance,
      deviations,
      currentPortfolio,
      totalValue,
    });
  } catch (error) {
    logger.error('Error checking rebalance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check rebalance status',
    });
  }
};

export const createRebalancePlan = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body;

    // Get current portfolio and targets
    const checkResult = await checkRebalanceInternal(publicKey);
    
    if (!checkResult.needsRebalance) {
      return res.json({
        needsRebalance: false,
        message: 'Portfolio is already balanced',
      });
    }

    const { currentPortfolio, deviations, totalValue } = checkResult;

    // Calculate required swaps
    const swaps = [];
    const oversupply = deviations.filter(d => d.deviation > d.threshold);
    const undersupply = deviations.filter(d => d.deviation < -d.threshold);

    // Create rebalance plan
    const rebalancePlan = await prisma.rebalancePlan.create({
      data: {
        publicKey,
        status: 'pending',
        totalValue,
      },
    });

    // Generate swap plans
    for (const over of oversupply) {
      const overToken = currentPortfolio.find(p => p.tokenMint === over.tokenMint);
      if (!overToken) continue;

      const excessPercentage = over.deviation;
      const excessValue = (excessPercentage / 100) * totalValue;
      const excessAmount = excessValue / overToken.priceUSD;

      for (const under of undersupply) {
        if (Math.abs(under.deviation) < 0.01) continue;

        const underToken = currentPortfolio.find(p => p.tokenMint === under.tokenMint);
        const neededPercentage = Math.abs(under.deviation);
        const neededValue = (neededPercentage / 100) * totalValue;

        const swapValue = Math.min(excessValue, neededValue);
        const swapAmount = swapValue / overToken.priceUSD;

        // Get Jupiter quote
        const quote = await jupiterService.getQuote({
          inputMint: over.tokenMint,
          outputMint: under.tokenMint,
          amount: Math.floor(swapAmount * Math.pow(10, overToken.decimals || 9)),
        });

        if (quote) {
          const swap = await prisma.swapPlan.create({
            data: {
              rebalancePlanId: rebalancePlan.id,
              fromToken: over.tokenMint,
              fromSymbol: over.tokenSymbol,
              toToken: under.tokenMint,
              toSymbol: under.tokenSymbol,
              fromAmount: swapAmount,
              toAmount: Number(quote.outAmount) / Math.pow(10, underToken?.decimals || 9),
              priceImpact: quote.priceImpactPct || 0,
              jupiterQuote: JSON.stringify(quote),
            },
          });

          swaps.push(swap);

          // Update deviations
          over.deviation -= (swapValue / totalValue) * 100;
          under.deviation += (swapValue / totalValue) * 100;
        }
      }
    }

    const estimatedSlippage = swaps.reduce((sum, s) => sum + s.priceImpact, 0) / swaps.length;

    res.json({
      planId: rebalancePlan.id,
      swaps,
      estimatedSlippage,
      totalSwaps: swaps.length,
    });
  } catch (error) {
    logger.error('Error creating rebalance plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rebalance plan',
    });
  }
};

export const executeRebalance = async (req: Request, res: Response) => {
  try {
    const { publicKey, planId } = req.body;

    // Get rebalance plan
    const plan = await prisma.rebalancePlan.findUnique({
      where: { id: planId },
      include: { swaps: true },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Rebalance plan not found',
      });
    }

    if (plan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Plan already executed or failed',
      });
    }

    // Generate swap instructions for each swap
    const transactions = [];

    for (const swap of plan.swaps) {
      const quote = JSON.parse(swap.jupiterQuote);
      const swapInstructions = await jupiterService.getSwapInstructions(quote, publicKey);
      transactions.push(swapInstructions);
    }

    res.json({
      success: true,
      transactions,
      message: 'Transactions ready for signing',
    });
  } catch (error) {
    logger.error('Error executing rebalance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute rebalance',
    });
  }
};

export const confirmTransaction = async (req: Request, res: Response) => {
  try {
    const { publicKey, txSignature, planId } = req.body;

    // Verify transaction
    const isConfirmed = await solanaService.verifyTransaction(txSignature);

    if (isConfirmed) {
      // Update rebalance plan status
      await prisma.rebalancePlan.update({
        where: { id: planId },
        data: { status: 'executed' },
      });

      // Log transaction
      await prisma.transactionLog.create({
        data: {
          publicKey,
          txSignature,
          status: 'success',
          type: 'rebalance',
          details: JSON.stringify({ planId }),
        },
      });

      res.json({
        success: true,
        message: 'Rebalance executed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Transaction not confirmed',
      });
    }
  } catch (error) {
    logger.error('Error confirming transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm transaction',
    });
  }
};

// Helper function for internal use
async function checkRebalanceInternal(publicKey: string) {
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
      tokenSymbol: token.mint.substring(0, 8),
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

  const targets = await prisma.targetAllocation.findMany({
    where: { publicKey },
  });

  const deviations: any[] = [];
  let needsRebalance = false;

  for (const target of targets) {
    const current = currentPortfolio.find(p => p.tokenMint === target.tokenMint);
    const currentPercentage = current ? current.percentage : 0;
    const deviation = currentPercentage - target.targetPercentage;

    if (Math.abs(deviation) > target.threshold) {
      needsRebalance = true;
    }

    deviations.push({
      tokenMint: target.tokenMint,
      tokenSymbol: target.tokenSymbol,
      currentPercentage,
      targetPercentage: target.targetPercentage,
      deviation,
      threshold: target.threshold,
    });
  }

  return { needsRebalance, deviations, currentPortfolio, totalValue };
}
