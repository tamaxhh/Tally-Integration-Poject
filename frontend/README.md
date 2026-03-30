# Tally Integration Frontend

A modern React dashboard for managing and visualizing Tally ERP data.

## Features

- **Dashboard**: Overview with key metrics and quick actions
- **Ledgers**: View and search all account ledgers
- **Vouchers**: Browse transaction vouchers with filtering
- **Reports**: Generate Trial Balance, P&L, and Balance Sheet reports
- **Settings**: Configure API settings and test connections
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** - Modern UI framework
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Tally API backend running on port 3000

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open http://localhost:3001 in your browser

### Configuration

The frontend connects to the backend API at `http://localhost:3000/api/v1` by default. You can configure this by setting the `REACT_APP_API_URL` environment variable:

```bash
REACT_APP_API_URL=http://localhost:3000/api/v1 npm start
```

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── Navbar.js
│   ├── contexts/
│   │   └── ApiContext.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Ledgers.js
│   │   ├── Vouchers.js
│   │   ├── Reports.js
│   │   └── Settings.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## API Integration

The frontend integrates with the following API endpoints:

- `GET /api/v1/ledgers` - Fetch all ledgers
- `GET /api/v1/vouchers` - Fetch all vouchers
- `GET /api/v1/reports/trial-balance` - Generate trial balance
- `GET /api/v1/reports/profit-loss` - Generate P&L statement
- `GET /api/v1/reports/balance-sheet` - Generate balance sheet
- `GET /api/v1/test-connection` - Test API connection

## Features Overview

### Dashboard
- Real-time connection status
- Key metrics display
- Quick action buttons
- Recent activity feed

### Ledgers
- Searchable ledger list
- Real-time data fetching
- Pagination support
- Export capabilities

### Vouchers
- Transaction history
- Date-based filtering
- Voucher type categorization
- Detailed view options

### Reports
- Interactive report generation
- Date range selection
- Multiple report types
- Export functionality

### Settings
- API configuration
- Connection testing
- Application information
- Troubleshooting guidance

## Styling

The application uses TailwindCSS for styling with custom utility classes:

- `.card` - Standard card component styling
- `.btn` - Base button styling
- `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger` - Button variants

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Connection Issues**: Ensure the backend API is running on port 3000
2. **CORS Errors**: Check backend CORS configuration
3. **API Key Errors**: Verify API key in settings matches backend configuration

### Debug Mode

Enable debug mode by setting `REACT_APP_DEBUG=true` in your environment variables.

## Production Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your web server

3. Configure environment variables for your production API URL

## License

This project is part of the Tally Integration Project.
