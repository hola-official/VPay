# VPay - Web3 Worker Management System

A comprehensive Web3 application for managing worker contacts with blockchain integration.

## 🏗️ Project Structure

```
VPay/
├── backend/          # Node.js/Express API server
├── frontend/         # React/TypeScript frontend
├── contract/         # Solidity smart contracts (Foundry)
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Foundry (for smart contracts)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Create and configure your .env file
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Smart Contracts
```bash
cd contract
forge install
forge build
```

## 📁 Backend API

The backend provides a RESTful API for managing worker contacts with Web3 integration.

### Key Features:
- ✅ Worker CRUD operations
- ✅ Wallet address validation
- ✅ Filter by connected wallet address
- ✅ Search functionality
- ✅ Active status tracking

### API Endpoints:
- `POST /api/workers` - Create worker
- `GET /api/workers` - Get all workers (with filters)
- `GET /api/workers/search` - Search workers
- `GET /api/workers/wallet/:address` - Get workers by wallet
- `GET /api/workers/count/:address` - Get active workers count
- `GET /api/workers/:id` - Get worker by ID
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

### Testing:
```bash
cd backend
node test-api.js
```

## 🎨 Frontend

React/TypeScript frontend with Web3 integration capabilities.

### Features:
- Modern React with TypeScript
- Web3 wallet integration ready
- Responsive design
- Component-based architecture

## 🔗 Smart Contracts

Solidity smart contracts built with Foundry framework.

### Contracts:
- `VestPayment.sol` - Payment vesting contract
- `TokenLocker.sol` - Token locking mechanism
- `Counter.sol` - Example contract

## 🔧 Environment Setup

### Backend (.env)
```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
node test-api.js
```

### Smart Contract Tests
```bash
cd contract
forge test
```

## 📚 API Documentation

Comprehensive API documentation is available in `backend/API_DOCUMENTATION.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository. 