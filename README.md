# PaperTradeX - Stock Market Paper Trading Web App

A full-featured, mobile-first paper trading web application that allows users to practice stock trading with virtual money using live stock prices from Yahoo Finance.

## Features

### Dual Trading Modes
- **Live Market Mode**: Trade with real-time current stock prices
- **Previous Day Practice Mode**: Practice trading with yesterday's data at the same time (e.g., if it's 4 PM today, see yesterday's 4 PM prices)
  - Completely separate portfolio and balance from live mode
  - Perfect for testing strategies without any risk
  - Learn without knowing the outcome beforehand

### Real-Time Chart Modes
- **Live Mode**: Auto-updating line chart showing today's prices (refreshes every 10 seconds)
  - Blue animated line
  - Keeps last 60 data points visible
  - Smooth transitions as new prices arrive
- **Historical Mode**: Static chart of yesterday's complete intraday prices
  - Orange line
  - Shows full trading session with 1-minute intervals
- **Compare Mode**: Overlay both live and historical lines together
  - Compare current market behavior with yesterday's patterns
  - Perfect for identifying trends and patterns

### Core Features
- **User Authentication**: Secure signup/login with JWT authentication
- **Live Stock Data**: Real-time stock prices updated every 10 seconds
- **Stock Search**: Search stocks by symbol or company name
- **Interactive Charts**:
  - Real-time moving chart with Live/Historical/Compare modes
  - Historical price charts with multiple timeframes (1D, 1W, 1M, 1Y, ALL)
  - Beautiful gradient lines with animations
- **Paper Trading**: Buy and sell stocks with virtual cash ($100,000 starting balance in each mode)
- **Advanced Orders**: Set Stop Loss and Take Profit orders
- **Portfolio Management**: Track holdings, trades, and pending orders separately for each mode
- **Watchlist**: Follow your favorite stocks with real-time price updates
- **Deposit/Withdraw**: Manage your virtual cash balance in live mode
- **Mobile-First Design**: Responsive UI optimized for mobile devices with beautiful gradient themes

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Zustand for state management
- Lucide React for icons

### Backend
- Supabase (PostgreSQL database)
- Supabase Edge Functions (Deno)
- yahoo-finance2 for stock data
- Row Level Security (RLS) for data protection

### Authentication
- Supabase Auth with JWT
- Email/password authentication

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Environment variables are already configured in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Database Schema

The application uses the following tables:

### Live Trading Tables
- **profiles**: User profiles with virtual cash balance
- **holdings**: User stock holdings (symbol, quantity, avg price)
- **trades**: Trade history (buy/sell records)

### Practice Mode Tables
- **simulation_holdings**: Practice mode stock holdings
- **simulation_trades**: Practice mode trade history

### Shared Tables
- **watchlists**: User's favorite stocks
- **pending_orders**: Stop Loss/Take Profit orders
- **historical_sessions**: Historical simulation data

All tables are protected with Row Level Security (RLS) policies.

## Edge Functions

The following Supabase Edge Functions provide stock data:

- **live-price**: Fetch real-time price updates for live chart (returns price + timestamp)
- **stock-quote**: Fetch real-time stock quotes with full details
- **stock-quote-historical**: Fetch historical quotes with time-offset support for practice mode
- **stock-chart**: Fetch historical chart data with support for:
  - Current day with 1-minute intervals
  - Yesterday's complete trading session (mode=yesterday)
  - Multiple timeframes (1D, 1W, 1M, 1Y, ALL)
- **stock-search**: Search stocks by query

## Usage

### Sign Up
1. Click "Sign Up" on the login screen
2. Enter your email and password
3. You'll start with $100,000 virtual cash

### Switching Between Modes
- Use the toggle button in the Dashboard or Stock Details page to switch between:
  - **Live Mode** (Blue theme): Real-time trading with current prices
  - **Previous Mode** (Orange theme): Practice with yesterday's prices at the same time
- Each mode has its own separate:
  - Cash balance ($100,000 starting in each)
  - Stock holdings
  - Trade history

### Trading
1. Search for a stock using the search bar
2. View stock details, price, and chart
3. Toggle between Live or Previous Day mode
4. Click "Buy" or "Sell"
5. Enter quantity and optionally set Stop Loss/Take Profit (Live mode only)
6. Confirm the trade

### Portfolio
- View your holdings, trades, and pending orders
- Switch modes to see separate portfolios
- Track profit/loss on each trade
- Cancel pending Stop Loss/Take Profit orders

### Watchlist
- Add stocks to your watchlist by clicking the star icon
- View real-time prices for all watchlist stocks
- Remove stocks by clicking the trash icon

## Price Updates

- **Live Mode**: Stock prices automatically update every 10 seconds with current market data
- **Previous Day Mode**: Shows historical prices from yesterday at the same time of day
  - Example: If it's 2:30 PM today, you'll see yesterday's 2:30 PM prices
  - Updates every 10 seconds to maintain time synchronization

## Security

- All API calls require authentication
- Row Level Security ensures users can only access their own data
- Passwords are hashed with bcrypt
- JWT tokens for secure session management

## Key Differentiator: Dual Mode Trading

The standout feature of PaperTradeX is the **Previous Day Practice Mode**:

- **Risk-Free Learning**: Practice trading strategies with real historical data without knowing the outcome
- **Time-Synchronized**: Experience market conditions from yesterday at the exact same time of day
- **Separate Portfolios**: Your practice trades don't affect your live portfolio
- **Perfect for Beginners**: Test strategies, learn market dynamics, and build confidence before trading with live prices
- **Strategy Testing**: Backtest your trading decisions in a realistic environment

This dual-mode approach provides the perfect training ground for new traders while still offering experienced traders a full-featured live trading simulator.

## Future Enhancements

- Auto-execution of Stop Loss/Take Profit orders when price targets hit
- Portfolio performance analytics with charts
- Extended historical date range selection (practice with any past date)
- Trading competition leaderboards
- Social features (share trades, follow traders)
- Options trading
- Cryptocurrency support
- News integration for stocks
- Technical indicators on charts

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Login and SignUp components
│   ├── Dashboard/      # Dashboard and StockSearch
│   ├── Stock/          # StockDetails, StockChart, TradeModal
│   ├── Portfolio/      # Portfolio with trades and orders
│   ├── Watchlist/      # Watchlist component
│   ├── Profile/        # User profile
│   └── Layout/         # BottomNav navigation
├── contexts/           # AuthContext for authentication
├── lib/                # Supabase client configuration
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## License

MIT

## Acknowledgments

- Yahoo Finance for stock data
- Supabase for backend infrastructure
- Tailwind CSS for styling framework
