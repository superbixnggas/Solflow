// Edge Function untuk Rebalance Plan Generation
// Menganalisis deviasi portfolio dan membuat rencana trading

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { walletAddress } = await req.json();

        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }

        console.log('Generating rebalance plan for wallet:', walletAddress);

        const supabaseUrl = 'https://quote-api.jup.ag/v6';
        
        // Token addresses mapping
        const TOKEN_ADDRESSES = {
            'SOL': 'So11111111111111111111111111111111111111112',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
            'MNGO': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
            'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE'
        };

        // Get current portfolio from portfolio-fetch edge function
        const portfolioResponse = await fetch('http://localhost:54321/functions/v1/portfolio-fetch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress
            })
        });

        if (!portfolioResponse.ok) {
            throw new Error('Failed to fetch current portfolio');
        }

        const portfolioData = await portfolioResponse.json();
        const currentPortfolio = portfolioData.data;

        // Get target allocation
        const targetResponse = await fetch(`http://localhost:54321/functions/v1/target-allocation?walletAddress=${walletAddress}`, {
            method: 'GET'
        });

        let targetAllocations = [];
        if (targetResponse.ok) {
            const targetData = await targetResponse.json();
            targetAllocations = targetData.data.targets;
        }

        // If no target allocation exists, create default targets
        if (targetAllocations.length === 0) {
            targetAllocations = currentPortfolio.tokens.slice(0, 5).map(token => ({
                token_address: token.mint,
                symbol: token.symbol,
                target_percentage: 100 / Math.min(currentPortfolio.tokens.length, 5),
                threshold_percentage: 5.0
            }));
        }

        // Calculate deviations
        const deviations = [];
        let totalValue = currentPortfolio.totalValue;

        for (const token of currentPortfolio.tokens) {
            const currentValue = token.value;
            const currentPercentage = (currentValue / totalValue) * 100;
            
            const target = targetAllocations.find(t => t.token_address === token.mint) || 
                          targetAllocations.find(t => t.symbol === token.symbol);
            
            if (!target) continue;

            const targetPercentage = target.target_percentage;
            const threshold = target.threshold_percentage;
            const deviation = currentPercentage - targetPercentage;
            const needsRebalance = Math.abs(deviation) > threshold;

            deviations.push({
                token: token.symbol,
                tokenMint: token.mint,
                currentPercentage: currentPercentage,
                targetPercentage: targetPercentage,
                deviation: deviation,
                threshold: threshold,
                needsRebalance: needsRebalance,
                currentValue: currentValue,
                targetValue: (targetPercentage / 100) * totalValue,
                amountToChange: ((targetPercentage - currentPercentage) / 100) * totalValue
            });
        }

        const needsRebalance = deviations.some(d => d.needsRebalance);

        if (!needsRebalance) {
            return new Response(JSON.stringify({
                data: {
                    walletAddress,
                    needsRebalance: false,
                    deviations: deviations,
                    message: 'Portfolio is balanced within threshold'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate rebalance plan
        const rebalanceActions = [];
        const toRebalance = deviations.filter(d => d.needsRebalance);
        const overAllocated = toRebalance.filter(d => d.amountToChange < 0);
        const underAllocated = toRebalance.filter(d => d.amountToChange > 0);

        let totalEstimatedFees = 0;
        let totalSwaps = 0;

        // Create swap pairs
        for (const from of overAllocated) {
            for (const to of underAllocated) {
                if (Math.abs(from.amountToChange) < 0.1 || to.amountToChange < 0.1) continue; // Skip small amounts
                
                try {
                    const amountInLamports = Math.round(Math.abs(from.amountToChange) * 1000000); // Convert to lamports for better precision
                    
                    // Get Jupiter quote
                    const quoteParams = new URLSearchParams({
                        inputMint: from.tokenMint,
                        outputMint: to.tokenMint,
                        amount: amountInLamports.toString(),
                        slippageBps: '50'
                    });

                    const quoteResponse = await fetch(`${supabaseUrl}/quote?${quoteParams}`);
                    
                    if (!quoteResponse.ok) continue;
                    
                    const quote = await quoteResponse.json();
                    
                    // Calculate price impact
                    const inputAmount = parseFloat(quote.inAmount) / Math.pow(10, quote.inputMintDecimals || 9);
                    const outputAmount = parseFloat(quote.outAmount) / Math.pow(10, quote.outputMintDecimals || 6);
                    const priceImpact = Math.abs((inputAmount / outputAmount) - 1) * 100;

                    // Estimate fees
                    const estimatedFee = outputAmount * 0.003; // 0.3% total fee estimate
                    
                    rebalanceActions.push({
                        fromToken: from.token,
                        fromMint: from.tokenMint,
                        toToken: to.token,
                        toMint: to.tokenMint,
                        amount: inputAmount,
                        expectedOutput: outputAmount,
                        priceImpact: priceImpact,
                        jupiterQuote: {
                            route: quote.routePlan,
                            priceImpact: quote.priceImpactPct || 0,
                            swapMode: quote.swapMode
                        },
                        estimatedFees: estimatedFee,
                        priority: Math.abs(from.amountToChange) + Math.abs(to.amountToChange)
                    });

                    totalEstimatedFees += estimatedFee;
                    totalSwaps++;
                    
                } catch (error) {
                    console.warn(`Error getting quote for ${from.token} -> ${to.token}:`, error.message);
                }
            }
        }

        // Sort by priority (largest changes first)
        rebalanceActions.sort((a, b) => b.priority - a.priority);

        const result = {
            data: {
                walletAddress,
                needsRebalance: true,
                deviations: deviations,
                rebalanceActions: rebalanceActions,
                totalSwaps: totalSwaps,
                totalEstimatedFees: totalEstimatedFees,
                estimatedSlippage: rebalanceActions.length > 0 ? 
                    rebalanceActions.reduce((sum, action) => sum + action.priceImpact, 0) / rebalanceActions.length : 0,
                planGeneratedAt: new Date().toISOString(),
                planExpiry: new Date(Date.now() + 300000).toISOString() // 5 minutes
            }
        };

        console.log('Rebalance plan generated successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Rebalance plan error:', error);

        const errorResponse = {
            error: {
                code: 'REBALANCE_PLAN_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});