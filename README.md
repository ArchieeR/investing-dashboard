# Portfolio Manager

A comprehensive portfolio management application built with React, TypeScript, and Vite. Track your investments, manage allocations, and monitor performance across multiple portfolios with real-time price updates.

## Features

### 📊 Portfolio Management
- **Multiple Portfolios**: Manage separate portfolios (Main, ISA, SIPP, etc.)
- **Real-time Pricing**: Live price updates from Yahoo Finance API
- **Multi-currency Support**: Handle GBP, USD, EUR, and GBX currencies with automatic conversion
- **Asset Types**: Support for ETFs, Stocks, Crypto, Bonds, Funds, and more

### 🎯 Allocation & Targeting
- **Hierarchical Structure**: Organize holdings by Section → Theme → Individual holdings
- **Target Allocation**: Set target percentages for themes and track progress
- **Budget Management**: Set budget limits by section, theme, or account
- **Allocation Insights**: Visual breakdown and remaining budget calculations

### 📈 Analytics & Insights
- **Performance Tracking**: Day change, profit/loss calculations
- **Portfolio Breakdown**: Visual pie charts by section, theme, account, and asset type
- **Percentage Calculations**: Track holdings as % of portfolio, section, or theme
- **Target Delta**: See how far you are from target allocations

### 🔧 Advanced Features
- **Live Price Integration**: Automatic price updates with configurable intervals
- **Trade Recording**: Track buy/sell transactions with automatic cost basis updates
- **Backup & Restore**: Automatic backups with manual restore capabilities
- **Column Customization**: Show/hide columns based on your preferences
- **CSV Import/Export**: Import holdings from CSV files

### 🎨 User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Comfortable viewing in any environment
- **Keyboard Shortcuts**: Efficient navigation and data entry
- **Real-time Updates**: See changes immediately without page refreshes

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd portfolio-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
VITE_YAHOO_FINANCE_API_KEY=your_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser to `http://localhost:5173`

## Usage

### Adding Holdings
1. Click "Add Holding" to create a new investment entry
2. Fill in the details: name, ticker, exchange, quantity, price
3. Assign to a section and theme for organization
4. Set target percentages if desired

### Setting Up Targets
1. Go to Settings → Budget Management
2. Set target portfolio value
3. Allocate percentages to sections (e.g., Core 60%, Satellite 30%, Cash 10%)
4. Within each section, allocate percentages to themes
5. Set individual holding target percentages within themes

### Live Prices
1. Enable live prices in Settings
2. Ensure tickers are correctly formatted for your exchange
3. Prices update automatically based on your configured interval

### Backup & Restore
- Backups are created automatically when you make changes
- Access backups through the backup browser
- Restore previous states if needed

## Project Structure

```
src/
├── components/          # React components
│   ├── HoldingsGrid.tsx    # Main holdings table
│   ├── PortfolioBreakdown.tsx # Charts and analytics
│   └── ...
├── state/              # State management
│   ├── portfolioStore.ts   # Main portfolio state
│   ├── types.ts           # TypeScript interfaces
│   └── selectors.ts       # Derived data calculations
├── services/           # External services
│   └── yahooFinance.ts    # Price fetching
├── utils/              # Utility functions
│   ├── calculations.ts    # Financial calculations
│   └── csv.ts            # CSV import/export
└── hooks/              # Custom React hooks
```

## Configuration

### Environment Variables
- `VITE_YAHOO_FINANCE_API_KEY`: API key for Yahoo Finance (optional)
- `VITE_LIVE_PRICES_ENABLED`: Enable/disable live price updates

### Exchanges Supported
- **LSE**: London Stock Exchange
- **NYSE**: New York Stock Exchange  
- **NASDAQ**: NASDAQ
- **AMS**: Amsterdam (.AS)
- **XETRA**: Frankfurt (.DE)
- **VI**: Vienna (.VI)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] Mobile app version
- [ ] Additional data providers
- [ ] Advanced charting and analytics
- [ ] Portfolio comparison tools
- [ ] Tax reporting features
- [ ] API for third-party integrations

---

Built with ❤️ using React, TypeScript, and modern web technologies.