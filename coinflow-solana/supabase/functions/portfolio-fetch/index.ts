// Edge Function untuk mengambil data portfolio dari Solana blockchain
// Mengintegrasikan dengan Solana RPC dan Jupiter API untuk data real-time

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
        // Extract wallet address from request
        const { walletAddress } = await req.json();
        
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }

        console.log('Fetching portfolio data for wallet:', walletAddress);

        // Solana RPC endpoint (using public endpoint for demo, should use private in production)
        const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
        
        // Common Solana token addresses
        const TOKEN_MINTS = {
            'SOL': 'So11111111111111111111111111111111111111112',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
            'SRM': 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
            'MNGO': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
            'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
            'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            'STEP': 'StepNQoHHiS9MsGsnde4jC2d5nF6N8r2tKkJgYk4d7fY'
        };

        // Get token accounts for the wallet
        const tokenAccountsResponse = await fetch(SOLANA_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountsByOwner',
                params: [
                    walletAddress,
                    {
                        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
                    },
                    {
                        encoding: 'jsonParsed'
                    }
                ]
            })
        });

        if (!tokenAccountsResponse.ok) {
            throw new Error('Failed to fetch token accounts');
        }

        const tokenAccountsData = await tokenAccountsResponse.json();
        
        if (tokenAccountsData.error) {
            throw new Error(`RPC Error: ${tokenAccountsData.error.message}`);
        }

        // Process token accounts
        const tokens = [];
        
        for (const account of tokenAccountsData.result.value) {
            try {
                const tokenData = account.account.data.parsed.info;
                const tokenMint = tokenData.mint;
                const balance = parseFloat(tokenData.tokenAmount.uiAmountString || '0');
                
                // Skip tokens with 0 balance
                if (balance <= 0) continue;

                // Find token symbol
                let symbol = 'UNKNOWN';
                let name = 'Unknown Token';
                
                for (const [sym, mint] of Object.entries(TOKEN_MINTS)) {
                    if (mint === tokenMint) {
                        symbol = sym;
                        name = sym === 'SOL' ? 'Solana' : sym;
                        break;
                    }
                }

                tokens.push({
                    mint: tokenMint,
                    symbol: symbol,
                    name: name,
                    balance: balance,
                    decimals: tokenData.tokenAmount.decimals,
                    uiAmount: balance
                });

            } catch (error) {
                console.warn('Error processing token account:', error.message);
            }
        }

        // Get SOL balance
        const solBalanceResponse = await fetch(SOLANA_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'getBalance',
                params: [walletAddress]
            })
        });

        let solBalance = 0;
        if (solBalanceResponse.ok) {
            const solData = await solBalanceResponse.json();
            if (!solData.error) {
                solBalance = parseFloat(solData.result.value) / 1000000000; // Convert lamports to SOL
                
                if (solBalance > 0) {
                    tokens.unshift({
                        mint: TOKEN_MINTS.SOL,
                        symbol: 'SOL',
                        name: 'Solana',
                        balance: solBalance,
                        decimals: 9,
                        uiAmount: solBalance
                    });
                }
            }
        }

        // Get real-time prices using Jupiter API
        const priceData = {};
        
        // Get prices for all tokens we have
        const symbols = tokens.map(t => t.symbol).filter(s => s !== 'UNKNOWN');
        
        if (symbols.length > 0) {
            try {
                // Using Jupiter price API
                const priceResponse = await fetch('https://price.jup.ag/v4/price', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ids: symbols
                    })
                });

                if (priceResponse.ok) {
                    const priceResult = await priceResponse.json();
                    if (priceResult.data) {
                        for (const [symbol, priceInfo] of Object.entries(priceResult.data)) {
                            priceData[symbol] = {
                                price: priceInfo.price || 0,
                                change24h: priceInfo.change24h || 0,
                                source: 'jupiter'
                            };
                        }
                    }
                }
            } catch (error) {
                console.warn('Error fetching prices:', error.message);
            }
        }

        // Calculate portfolio value and add price data
        let totalValue = 0;
        const enrichedTokens = tokens.map(token => {
            const priceInfo = priceData[token.symbol] || { price: 0, change24h: 0 };
            const value = token.balance * priceInfo.price;
            totalValue += value;
            
            return {
                ...token,
                price: priceInfo.price,
                value: value,
                change24h: priceInfo.change24h,
                priceSource: priceInfo.source
            };
        });

        // Calculate 24h change
        let weightedChange24h = 0;
        enrichedTokens.forEach(token => {
            if (token.change24h && token.value > 0) {
                weightedChange24h += (token.change24h * token.value) / totalValue;
            }
        });

        const result = {
            data: {
                walletAddress,
                totalValue,
                numberOfTokens: enrichedTokens.length,
                change24h: weightedChange24h,
                totalPnL: totalValue * (weightedChange24h / 100),
                tokens: enrichedTokens,
                lastUpdated: new Date().toISOString()
            }
        };

        console.log('Portfolio data fetched successfully for:', walletAddress);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Portfolio fetch error:', error);

        const errorResponse = {
            error: {
                code: 'PORTFOLIO_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});