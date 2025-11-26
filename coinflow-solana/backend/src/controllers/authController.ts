import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import solanaService from '../services/solanaService';
import pythService from '../services/pythService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const connectWallet = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'Public key is required',
      });
    }

    // Validate public key format
    const isValid = await solanaService.validatePublicKey(publicKey);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid public key format',
      });
    }

    // Check if wallet exists, create if not
    let wallet = await prisma.userWallet.findUnique({
      where: { publicKey },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: { publicKey },
      });
      logger.info(`New wallet connected: ${publicKey}`);
    }

    // Fetch initial portfolio data
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
        publicKey,
        tokenMint: token.mint,
        tokenSymbol: token.mint.substring(0, 8), // Placeholder, should be fetched from metadata
        balance: token.balance,
        priceUSD,
        valueUSD,
        percentage: 0, // Will be calculated after total
      });
    }

    // Calculate percentages
    portfolioData.forEach(item => {
      item.percentage = totalValue > 0 ? (item.valueUSD / totalValue) * 100 : 0;
    });

    // Save portfolio data
    for (const data of portfolioData) {
      await prisma.portfolioData.upsert({
        where: {
          publicKey_tokenMint: {
            publicKey: data.publicKey,
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
        create: data,
      });
    }

    res.json({
      success: true,
      data: portfolioData,
      message: 'Wallet connected successfully',
    });
  } catch (error) {
    logger.error('Error connecting wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect wallet',
    });
  }
};
