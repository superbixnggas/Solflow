// Edge Function untuk Target Allocation Management
// Menyimpan dan mengambil preferensi alokasi target dari database

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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (req.method === 'GET') {
            // Get target allocation for a wallet
            const url = new URL(req.url);
            const walletAddress = url.searchParams.get('walletAddress');

            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            console.log('Fetching target allocation for wallet:', walletAddress);

            // First, get or create portfolio
            const portfolioResponse = await fetch(`${supabaseUrl}/rest/v1/user_portfolios?wallet_address=eq.${walletAddress}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Accept': 'application/json'
                }
            });

            let portfolio;
            const portfolioData = await portfolioResponse.json();
            
            if (portfolioData.length === 0) {
                // Create new portfolio
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/user_portfolios`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        wallet_address: walletAddress
                    })
                });

                if (!createResponse.ok) {
                    throw new Error('Failed to create portfolio');
                }

                const newPortfolio = await createResponse.json();
                portfolio = newPortfolio[0];
            } else {
                portfolio = portfolioData[0];
            }

            // Get target allocations
            const targetsResponse = await fetch(`${supabaseUrl}/rest/v1/target_allocations?portfolio_id=eq.${portfolio.id}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Accept': 'application/json'
                }
            });

            const targets = await targetsResponse.json();

            return new Response(JSON.stringify({
                data: {
                    walletAddress,
                    portfolioId: portfolio.id,
                    targets: targets.length > 0 ? targets : [], // Return empty array if no targets set
                    hasExistingTargets: targets.length > 0
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (req.method === 'POST') {
            // Save target allocation
            const { walletAddress, targets } = await req.json();

            if (!walletAddress || !targets || !Array.isArray(targets)) {
                throw new Error('walletAddress and targets array are required');
            }

            console.log('Saving target allocation for wallet:', walletAddress);

            // Validate targets
            const totalPercentage = targets.reduce((sum, target) => sum + parseFloat(target.targetPercentage), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                throw new Error(`Total percentage must be 100%, got ${totalPercentage.toFixed(2)}%`);
            }

            // Get or create portfolio
            const portfolioResponse = await fetch(`${supabaseUrl}/rest/v1/user_portfolios?wallet_address=eq.${walletAddress}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Accept': 'application/json'
                }
            });

            let portfolio;
            const portfolioData = await portfolioResponse.json();
            
            if (portfolioData.length === 0) {
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/user_portfolios`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        wallet_address: walletAddress
                    })
                });

                const newPortfolio = await createResponse.json();
                portfolio = newPortfolio[0];
            } else {
                portfolio = portfolioData[0];
            }

            // Delete existing targets
            await fetch(`${supabaseUrl}/rest/v1/target_allocations?portfolio_id=eq.${portfolio.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            // Insert new targets
            const targetRecords = targets.map(target => ({
                portfolio_id: portfolio.id,
                token_address: target.tokenMint,
                symbol: target.tokenSymbol,
                target_percentage: parseFloat(target.targetPercentage),
                threshold_percentage: parseFloat(target.threshold) || 5.0,
                updated_at: new Date().toISOString()
            }));

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/target_allocations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(targetRecords)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to save targets: ${errorText}`);
            }

            const savedTargets = await insertResponse.json();

            return new Response(JSON.stringify({
                data: {
                    walletAddress,
                    portfolioId: portfolio.id,
                    targets: savedTargets,
                    savedAt: new Date().toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Method not allowed');
        }

    } catch (error) {
        console.error('Target allocation error:', error);

        const errorResponse = {
            error: {
                code: 'TARGET_ALLOCATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});