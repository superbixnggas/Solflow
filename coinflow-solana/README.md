# CoinFlow Solana Edition - Portfolio Optimizer

Portfolio optimizer non-custodial untuk ekosistem Solana dengan fitur auto-rebalancing menggunakan Jupiter API.

## Fitur Utama

- **Non-Custodial**: Anda tetap memegang kendali penuh atas aset Anda
- **Real-time Portfolio Tracking**: Monitor semua SPL token dalam wallet Anda
- **Target Allocation**: Atur target persentase untuk setiap token
- **Auto-Rebalance**: Sistem otomatis memeriksa deviasi dan membuat rencana rebalance
- **Jupiter Integration**: Best execution price melalui Jupiter aggregator
- **Multi-Wallet Support**: Phantom, Backpack, Solflare

## Teknologi Stack

### Backend
- Node.js & Express.js
- Prisma ORM & PostgreSQL
- Solana Web3.js
- Jupiter API (quote & swap)
- Pyth Price API (harga real-time)
- Worker system dengan node-cron

### Frontend
- React 18 & TypeScript
- Tailwind CSS
- Solana Wallet Adapter
- React Router v6
- Axios & React Hot Toast

## Prerequisites

- Node.js 18+ dan pnpm
- PostgreSQL 14+
- Helius API key (untuk RPC yang lebih cepat)
- Redis (optional, untuk caching)

## Setup & Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd coinflow-solana
```

### 2. Backend Setup

```bash
cd backend
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan kredensial Anda
```

Konfigurasi `.env`:

```env
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/coinflow_solana?schema=public"
SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY"
NETWORK=mainnet-beta
JUPITER_API_URL="https://quote-api.jup.ag/v6"
PYTH_API_URL="https://hermes.pyth.network/v2"
```

Setup database:

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate
```

Jalankan backend:

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

### 3. Frontend Setup

```bash
cd coinflow-frontend
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env
```

Konfigurasi `.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_NETWORK=mainnet-beta
```

Jalankan frontend:

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm preview
```

## Struktur Project

```
coinflow-solana/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (Solana, Jupiter, Pyth)
│   │   ├── workers/         # Background workers
│   │   ├── utils/           # Utilities (logger)
│   │   └── index.ts         # Main server file
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── coinflow-frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── lib/             # API client & utilities
│   │   └── App.tsx          # Main app with routing
│   └── package.json
└── docs/
    └── deployment-guide.md  # Deployment instructions
```

## API Endpoints

### Authentication
- `POST /api/auth/connect` - Connect wallet dan inisialisasi portfolio

### Portfolio
- `GET /api/portfolio/:publicKey` - Get portfolio data
- `POST /api/portfolio/target` - Set target allocation
- `GET /api/portfolio/target/:publicKey` - Get target allocation

### Rebalance
- `GET /api/rebalance/check/:publicKey` - Check rebalance status
- `POST /api/rebalance/plan` - Create rebalance plan
- `POST /api/rebalance/execute` - Execute rebalance
- `POST /api/rebalance/confirm` - Confirm transaction

## Worker System

Worker berjalan otomatis setiap 5 menit untuk:
1. Fetch semua portfolio dengan target allocation
2. Update saldo dan harga terbaru
3. Hitung deviasi dari target
4. Log jika rebalance diperlukan

Untuk menjalankan worker secara standalone:

```bash
cd backend
pnpm worker
```

## Development

### Backend Development

```bash
cd backend
pnpm dev  # Auto-reload dengan tsx watch
```

### Frontend Development

```bash
cd coinflow-frontend
pnpm dev  # Vite dev server dengan HMR
```

### Database Management

```bash
# Open Prisma Studio
pnpm prisma:studio

# Create new migration
pnpm prisma:migrate

# Reset database
pnpm prisma migrate reset
```

## Production Deployment

Lihat [Deployment Guide](./docs/deployment-guide.md) untuk instruksi deployment lengkap.

## Security Considerations

- Private key tidak pernah dikirim ke backend
- Semua transaksi di-sign di frontend
- Backend hanya generate unsigned transactions
- Rate limiting untuk mencegah abuse
- Input validation di setiap endpoint

## Troubleshooting

### Backend tidak dapat connect ke Solana RPC
- Pastikan Helius API key valid
- Check network connectivity
- Gunakan public endpoint untuk testing

### Price tidak tersedia untuk token tertentu
- Pyth tidak support semua token
- Sistem akan return price 0 untuk token yang tidak support
- Tambahkan token ke mapping di `pythService.ts`

### Transaction gagal
- Check slippage tolerance
- Verify sufficient balance untuk fees
- Pastikan wallet approved transaction

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License

## Support

Untuk pertanyaan dan support, buka issue di GitHub repository.

---

**Disclaimer**: Aplikasi ini untuk tujuan edukatif. Gunakan dengan risiko Anda sendiri. Selalu lakukan riset sendiri sebelum melakukan transaksi crypto.
