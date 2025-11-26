import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import solanaService from '../services/solanaService';
import pythService from '../services/pythService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;

    // Validate public key
    const isValid = await solanaService.validatePublicKey(publicKey);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid public key format',
      });
    }

    // Fetch current token balances
    const tokenAccounts = await solanaService.getTokenAccounts(publicKey);
    const tokenMints = tokenAccounts.map(t => t.mint);
    const prices = await pythService.getPrices(tokenMints);

    let totalValue = 0;
    const portfolioData = [];

    for (const token of tokenAccounts) {
      const priceUSD = prices[token.mint] || 0;
      const valueUSD = token.balance * priceUSD;
      totalValue += valueUSD;

      portfolioData.push({
        tokenMint: token.mint,
        tokenSymbol: token.mint.substring(0, 8),
        balance: token.balance,
        priceUSD,
        valueUSD,
        percentage: 0,
      });
    }

    // Calculate percentages
    portfolioData.forEach(item => {
      item.percentage = totalValue > 0 ? (item.valueUSD / totalValue) * 100 : 0;
    });

    // Update database
    for (const data of portfolioData) {
      await prisma.portfolioData.upsert({
        where: {
          publicKey_tokenMint: {
            publicKey,
            tokenMint: data.tokenMint,
          },
        },
        update: {
          balance: data.balance,
          priceUSD: data.priceUSD,
          valueUSD: data.valueUSD,
          percentage: data.percentage,
          updatedAt: new Date(),
        },
        create: {
          publicKey,
          ...data,
        },
      });
    }

    res.json({
      success: true,
      tokens: portfolioData,
      totalValue,
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
    });
  }
};

export const setTargetAllocation = async (req: Request, res: Response) => {
  try {
    const { publicKey, targets } = req.body;

    if (!publicKey || !targets || !Array.isArray(targets)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
      });
    }

    // Validate total percentage is 100
    const totalPercentage = targets.reduce((sum, t) => sum + t.targetPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Target allocations must sum to 100%',
      });
    }

    // Validate public key
    const isValid = await solanaService.validatePublicKey(publicKey);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid public key format',
      });
    }

    // Delete existing targets and create new ones
    await prisma.targetAllocation.deleteMany({
      where: { publicKey },
    });

    for (const target of targets) {
      await prisma.targetAllocation.create({
        data: {
          publicKey,
          tokenMint: target.tokenMint,
          tokenSymbol: target.tokenSymbol,
          targetPercentage: target.targetPercentage,
          threshold: target.threshold || 5, // Default 5% threshold
        },
      });
    }

    logger.info(`Target allocation set for wallet: ${publicKey}`);

    res.json({
      success: true,
      message: 'Target allocation saved successfully',
    });
  } catch (error) {
    logger.error('Error setting target allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save target allocation',
    });
  }
};

export const getTargetAllocation = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;

    const targets = await prisma.targetAllocation.findMany({
      where: { publicKey },
    });

    res.json({
      success: true,
      targets,
    });
  } catch (error) {
    logger.error('Error fetching target allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch target allocation',
    });
  }
};
