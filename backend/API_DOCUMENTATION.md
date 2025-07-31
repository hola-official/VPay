# VPay Web3 Worker Management API Documentation

## Overview
This API manages worker contacts for Web3 projects. Each worker has a wallet address, and workers are filtered by the connected wallet address (`savedBy`) from the frontend.

## Base URL
```
http://localhost:3000/api/workers
```

## Worker Schema
```json
{
  "fullName": "string (required)",
  "walletAddress": "string (required, unique, 0x format)",
  "email": "string (required, for notifications)",
  "label": "string (optional, worker position/label)",
  "savedBy": "string (required, connected wallet address)",
  "isActive": "boolean (default: true)"
}
```

## Endpoints

### 1. Create Worker
**POST** `/api/workers`

Creates a new worker contact.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "email": "john@example.com",
  "label": "Smart Contract Developer",
  "savedBy": "0x1234567890123456789012345678901234567890",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Worker created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "fullName": "John Doe",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "email": "john@example.com",
    "label": "Smart Contract Developer",
    "savedBy": "0x1234567890123456789012345678901234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Workers
**GET** `/api/workers`

Retrieves all workers with optional filtering.

**Query Parameters:**
- `savedBy` (optional): Filter by connected wallet address
- `isActive` (optional): Filter by active status (true/false)

**Examples:**
```
GET /api/workers                                    // Get all workers
GET /api/workers?savedBy=0x1234...                 // Get workers by wallet
GET /api/workers?isActive=true                      // Get only active workers
GET /api/workers?savedBy=0x1234...&isActive=true   // Combined filter
```

**Response:**
```json
{
  "success": true,
  "message": "Workers retrieved successfully",
  "count": 2,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "fullName": "John Doe",
      "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "email": "john@example.com",
      "label": "Smart Contract Developer",
      "savedBy": "0x1234567890123456789012345678901234567890",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Get Workers by Wallet Address
**GET** `/api/workers/wallet/:savedBy`

Retrieves workers filtered by a specific wallet address.

**Example:**
```
GET /api/workers/wallet/0x1234567890123456789012345678901234567890
```

**Response:**
```json
{
  "success": true,
  "message": "Workers saved by wallet 0x1234567890123456789012345678901234567890 retrieved successfully",
  "count": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "fullName": "John Doe",
      "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "email": "john@example.com",
      "label": "Smart Contract Developer",
      "savedBy": "0x1234567890123456789012345678901234567890",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4. Search Workers
**GET** `/api/workers/search`

Searches workers by name, wallet address, email, or label.

**Query Parameters:**
- `q` (optional): Search term
- `savedBy` (optional): Filter by wallet address
- `isActive` (optional): Filter by active status

**Examples:**
```
GET /api/workers/search?q=john                      // Search for "john"
GET /api/workers/search?q=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6  // Search by wallet
GET /api/workers/search?q=developer&savedBy=0x1234...  // Combined search
```

**Response:**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "count": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "fullName": "John Doe",
      "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "email": "john@example.com",
      "label": "Smart Contract Developer",
      "savedBy": "0x1234567890123456789012345678901234567890",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5. Get Worker by ID
**GET** `/api/workers/:id`

Retrieves a specific worker by their ID.

**Example:**
```
GET /api/workers/60f7b3b3b3b3b3b3b3b3b3b3
```

**Response:**
```json
{
  "success": true,
  "message": "Worker retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "fullName": "John Doe",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "email": "john@example.com",
    "label": "Smart Contract Developer",
    "savedBy": "0x1234567890123456789012345678901234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Update Worker
**PUT** `/api/workers/:id`

Updates an existing worker by their ID.

**Request Body:**
```json
{
  "fullName": "John Updated",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "email": "john.updated@example.com",
  "label": "Senior Smart Contract Developer",
  "savedBy": "0x1234567890123456789012345678901234567890",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Worker updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "fullName": "John Updated",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "email": "john.updated@example.com",
    "label": "Senior Smart Contract Developer",
    "savedBy": "0x1234567890123456789012345678901234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 7. Delete Worker
**DELETE** `/api/workers/:id`

Deletes a worker by their ID.

**Example:**
```
DELETE /api/workers/60f7b3b3b3b3b3b3b3b3b3b3
```

**Response:**
```json
{
  "success": true,
  "message": "Worker deleted successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "fullName": "John Doe",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "email": "john@example.com",
    "label": "Smart Contract Developer",
    "savedBy": "0x1234567890123456789012345678901234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 8. Get Active Workers Count
**GET** `/api/workers/count/:savedBy`

Gets the count of active workers for a specific wallet address.

**Example:**
```
GET /api/workers/count/0x1234567890123456789012345678901234567890
```

**Response:**
```json
{
  "success": true,
  "message": "Active workers count retrieved successfully",
  "data": {
    "count": 5,
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Full name, wallet address, email, and savedBy wallet address are required"
}
```

### 400 Invalid Wallet Address
```json
{
  "success": false,
  "message": "Invalid worker wallet address format"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Worker not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Worker with this wallet address already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Frontend Integration Examples

### Web3 Integration with Ethers.js
```javascript
import { ethers } from 'ethers';

// Connect wallet and get workers
const getWorkersByWallet = async (signer) => {
  const address = await signer.getAddress();
  
  const response = await fetch(`/api/workers?savedBy=${address}`);
  return response.json();
};

// Create new worker
const createWorker = async (workerData, signer) => {
  const savedBy = await signer.getAddress();
  
  const response = await fetch('/api/workers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...workerData,
      savedBy
    })
  });
  return response.json();
};

// Search workers
const searchWorkers = async (query, signer = null) => {
  const params = new URLSearchParams({ q: query });
  if (signer) {
    const address = await signer.getAddress();
    params.append('savedBy', address);
  }
  
  const response = await fetch(`/api/workers/search?${params}`);
  return response.json();
};
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const useWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address } = useAccount();

  useEffect(() => {
    const fetchWorkers = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/workers?savedBy=${address}`);
        const data = await response.json();
        
        if (data.success) {
          setWorkers(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to fetch workers');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [address]);

  return { workers, loading, error };
};
```

### Web3Modal Integration
```javascript
import { Web3Modal } from '@web3modal/react';
import { useAccount, useConnect } from 'wagmi';

const WorkerManagement = () => {
  const { address, isConnected } = useAccount();
  const { workers, loading } = useWorkers();

  const createWorker = async (workerData) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const response = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...workerData,
        savedBy: address
      })
    });

    return response.json();
  };

  return (
    <div>
      {!isConnected ? (
        <Web3Modal />
      ) : (
        <div>
          <h2>My Workers ({workers.length})</h2>
          {workers.map(worker => (
            <div key={worker._id}>
              <h3>{worker.fullName}</h3>
              <p>Wallet: {worker.walletAddress}</p>
              <p>Email: {worker.email}</p>
              <p>Position: {worker.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Testing

Run the test suite:
```bash
cd backend
node test-api.js
```

This will test all endpoints with sample Web3 wallet addresses and worker data.

## Key Features

✅ **Web3 Wallet Integration** - Filter by connected wallet address
✅ **Worker Management** - CRUD operations for worker contacts
✅ **Wallet Address Validation** - Ensures proper 0x format
✅ **Search Functionality** - Search by name, wallet, email, or label
✅ **Active Status Tracking** - Track active/inactive workers
✅ **Notification Ready** - Email field for sending notifications
✅ **Web3 Frontend Ready** - Compatible with ethers.js, wagmi, Web3Modal 