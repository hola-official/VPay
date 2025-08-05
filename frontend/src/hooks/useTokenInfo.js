import { useCallback, useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";
import { formatUnits } from "viem";

export function useTokenInfo(tokenAddress, userAddress) {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Contract read functions - only enable when needed
  const isValidAddress =
    tokenAddress && tokenAddress.length === 42 && tokenAddress.startsWith("0x");

  const name = useReadContract({
    address: isValidAddress ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "name",
    enabled: shouldFetch && isValidAddress,
  });

  const symbol = useReadContract({
    address: isValidAddress ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "symbol",
    enabled: shouldFetch && isValidAddress,
  });

  const decimals = useReadContract({
    address: isValidAddress ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "decimals",
    enabled: shouldFetch && isValidAddress,
  });

  const totalSupply = useReadContract({
    address: isValidAddress ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "totalSupply",
    enabled: shouldFetch && isValidAddress,
  });

  const balance = useReadContract({
    address: isValidAddress ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    enabled: shouldFetch && isValidAddress && Boolean(userAddress),
  });

  // Function to trigger the fetch
  const fetchTokenInfo = useCallback(() => {
    if (!isValidAddress) {
      setTokenInfo(null);
      setTokenError("Invalid token address");
      setIsLoadingToken(false);
      return;
    }

    setShouldFetch(true);
    setIsLoadingToken(true);
    setTokenError(null);
  }, [isValidAddress]);

  // Process the results when they're available
  useEffect(() => {
    if (!shouldFetch || !isValidAddress) return;

    const allLoaded =
      !name.isLoading &&
      !symbol.isLoading &&
      !decimals.isLoading &&
      !totalSupply.isLoading;
    const hasError =
      name.error || symbol.error || decimals.error || totalSupply.error;
    
    console.error(`Error while fetching token info: ${hasError}`)

    if (hasError) {
      setTokenError(
        "Failed to fetch token information. Please check the address."
      );
      setTokenInfo(null);
      setIsLoadingToken(false);
      setShouldFetch(false);
      return;
    }

    if (allLoaded && name.data && symbol.data && decimals.data) {
      try {
        // Process balance data with proper formatting
        let formattedBalance = "0";
        if (balance.data && decimals.data) {
          formattedBalance = formatUnits(balance.data, decimals.data);
        }

        setTokenInfo({
          name: name.data,
          symbol: symbol.data,
          decimal: decimals.data,
          balance: formattedBalance,
          totalSupply: totalSupply.data,
        });

        setIsLoadingToken(false);
        // Don't reset shouldFetch here, as we want to keep the data available
      } catch (error) {
        console.error("Error processing token data:", error);
        setTokenError("Error processing token data");
        setTokenInfo(null);
        setIsLoadingToken(false);
        setShouldFetch(false);
      }
    }
  }, [
    shouldFetch,
    isValidAddress,
    name.data,
    name.isLoading,
    name.error,
    symbol.data,
    symbol.isLoading,
    symbol.error,
    decimals.data,
    decimals.isLoading,
    decimals.error,
    balance.data,
    totalSupply.data,
    totalSupply.isLoading,
    totalSupply.error,
  ]);

  // Reset token info when address changes
  useEffect(() => {
    if (!shouldFetch) {
      setTokenInfo(null);
    }
  }, [tokenAddress, shouldFetch]);

  return {
    tokenInfo,
    setTokenInfo,
    isLoadingToken,
    tokenError,
    fetchTokenInfo,
  };
}
