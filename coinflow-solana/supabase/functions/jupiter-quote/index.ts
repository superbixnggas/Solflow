// Edge Function untuk Jupiter API integration
// Mengambil quote harga real-time dan informasi trading

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
        const { 
            inputMint, 
            outputMint, 
            amount, 
            slippageBps = 50, // 0.5% default slippage
            onlyDirectRoutes = false,
            asLegacyTransaction = false 
        } = await req.json();

        // Validate required parameters
        if (!inputMint || !outputMint || !amount) {
            throw new Error('inputMint, outputMint, and amount are required');
        }

        console.log('Getting Jupiter quote:', {
            inputMint,
            outputMint, 
            amount,
            slippageBps
        });

        // Build Jupiter quote URL
        const params = new URLSearchParams({
            inputMint,
            outputMint, 
            amount: amount.toString(),
            slippageBps: slippageBps.toString(),
            onlyDirectRoutes: onlyDirectRoutes.toString(),
            asLegacyTransaction: asLegacyTransaction.toString()
        });

        // Get quote from Jupiter
        const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!quoteResponse.ok) {
            const errorText = await quoteResponse.text();
            throw new Error(`Jupiter quote failed: ${errorText}`);
        }

        const quote = await quoteResponse.json();
        console.log('Jupiter quote received:', quote);

        // Calculate price impact if possible
        let priceImpact = 0;
        if (quote.inAmount && quote.outAmount) {
            const inputPrice = quote.inAmount / Math.pow(10, quote.inputMintDecimals || 9);
            const outputPrice = quote.outAmount / Math.pow(10, quote.outputMintDecimals || 6);
            
            // Simple price impact calculation
            if (inputPrice > 0 && outputPrice > 0) {
                const marketRate = inputPrice / outputPrice;
                const executedRate = quote.amount / quote.outAmount;
                priceImpact = Math.abs((marketRate - executedRate) / marketRate) * 100;
            }
        }

        // Get price data for both tokens
        const tokenPrices = {};
        const mintList = [inputMint, outputMint];
        
        for (const mint of mintList) {
            try {
                const priceResponse = await fetch('https://price.jup.ag/v4/price', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ids: [mint]
                    })
                });

                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    if (priceData.data && priceData.data[mint]) {
                        tokenPrices[mint] = priceData.data[mint];
                    }
                }
            } catch (error) {
                console.warn(`Error fetching price for ${mint}:`, error.message);
            }
        }

        // Calculate additional metrics
        const estimatedOutputUSD = tokenPrices[outputMint]?.price * (quote.outAmount / Math.pow(10, quote.outputMintDecimals || 6)) || 0;
        const inputValueUSD = tokenPrices[inputMint]?.price * (quote.inAmount / Math.pow(10, quote.inputMintDecimals || 9)) || 0;
        
        // Estimate fees (simplified calculation)
        const estimatedFees = {
            swapFee: 0.001 * estimatedOutputUSD, // 0.1% swap fee
            networkFee: 0.0005, // Estimated network fee in SOL
            total: 0.001 * estimatedOutputUSD + 0.0005
        };

        const result = {
            data: {
                // Jupiter quote data
                quoteRoute: quote,
                inAmount: quote.inAmount,
                outAmount: quote.outAmount,
                inputMint: quote.inputMint,
                outputMint: quote.outputMint,
                otherAmountThreshold: quote.otherAmountThreshold,
                swapMode: quote.swapMode,
                
                // Calculated metrics
                priceImpact: priceImpact,
                estimatedOutputUSD: estimatedOutputUSD,
                inputValueUSD: inputValueUSD,
                slippageBps: slippageBps,
                
                // Token prices
                tokenPrices: tokenPrices,
                
                // Fee estimates
                estimatedFees: estimatedFees,
                
                // Route information
                routePlan: quote.routePlan || [],
                priceRoute: quote.priceRoute || null,
                
                // Timing and execution info
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 60000).toISOString(), // 1 minute expiry
                platformFees: quote.platformFees || [],
                
                // Jupiter metadata
                contextSlot: quote.contextSlot,
                swapper: quote.swapper || null
            }
        };

        console.log('Jupiter quote processed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Jupiter quote error:', error);

        const errorResponse = {
            error: {
                code: 'JUPITER_QUOTE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});