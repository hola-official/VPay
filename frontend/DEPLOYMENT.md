# VPay Frontend Deployment Guide

## Environment Variables

Make sure to set these environment variables in your Vercel project:

- `VITE_REOWN_CLOUD_APP_ID`: Your Reown Cloud App ID
- `VITE_CROSSFI_TESTNET_RPC_URL`: CrossFi Testnet RPC URL (default: https://testnet-rpc.crossfi.com)

## Build Configuration

The project is configured to build successfully on Vercel with:

- Node.js 18+ (specified in package.json engines)
- Vite build with optimized chunking
- Static file serving with proper routing

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy - the build should complete successfully

## Troubleshooting

If you encounter build issues:

1. Check that all environment variables are set
2. Ensure Node.js version is 18 or higher
3. The build uses the default Vite minifier (not terser)
4. Manual chunking is configured for better performance 