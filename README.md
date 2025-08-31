# ThreatLens

A Security Operations Center (SOC) dashboard for monitoring and visualizing security events in real-time.

## Features

- **Failed Login Monitoring**: Track and analyze failed authentication attempts
- **Injection Attack Detection**: Monitor SQL injection, XSS, and command injection attempts
- **IP-based Activity Tracking**: Analyze security events by IP address with geolocation data
- **Real-time Dashboards**: Interactive charts and visualizations for security trends
- **Event Correlation**: Link related security events for better threat analysis
- **Alert Management**: Configurable alerts for critical security events

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Visualization**: Chart.js, D3.js
- **Real-time**: WebSockets
- **Authentication**: JWT

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup
1. Clone the repository
   ```bash
   git clone https://github.com/0bskuru5/ThreatLens.git
   cd ThreatLens
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your database and configuration settings
   ```

4. Set up the database
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Usage

1. Access the dashboard at `http://localhost:3000`
2. Log in with your credentials
3. Monitor security events in real-time
4. Configure alerts and thresholds
5. Analyze trends using interactive charts

## Project Structure

```
ThreatLens/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Dashboard pages
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   └── hooks/         # Custom React hooks
├── server/
│   ├── routes/        # API routes
│   ├── models/        # Database models
│   ├── middleware/    # Express middleware
│   └── services/      # Business logic
├── public/            # Static assets
├── tests/            # Test files
└── docs/             # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
