import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { readContract, waitForTransaction, multicall } from "@wagmi/core";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";
import { toast } from "react-toastify";
import { config } from "@/lib/config";
import { TOKEN_LOCKER_ADDRESS, TOKEN_LOCKER_ABI } from "@/lib/tokenLock";

// Utility function for multicall
export async function multiChainMulticall(chainConfigs) {

  const results = {};

  // Execute multicall for each chain
  for (const chainConfig of chainConfigs) {
    const { chainId, calls } = chainConfig;

    if (!calls || calls.length === 0) continue;

    try {
      // Execute multicall for this chain
      const chainResults = await multicall(config, {
        chainId,
        contracts: calls,
      });

      results[chainId] = chainResults;
    } catch (error) {
      console.error(`Multicall failed for chain ${chainId}:`, error);
      results[chainId] = { error };
    }
  }

  return results;
}

export function useTokenLock() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isApproving, setIsApproving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState(null);
  const [approvalTxHash, setApprovalTxHash] = useState(null);
  const [lockStatus, setLockStatus] = useState({
    status: null, // 'success', 'error', 'pending', null
    txHash: null,
    error: null,
    timestamp: null,
    lockId: null,
  });

  const lockerContractAddress = TOKEN_LOCKER_ADDRESS;

  // Contract write hooks
  const { writeContractAsync: approveTokenAsync } = useWriteContract();
  const { writeContractAsync: lockTokenAsync } = useWriteContract();
  const { writeContractAsync: vestingLockAsync } = useWriteContract();
  const { writeContractAsync } = useWriteContract();

  // Transaction receipt hooks
  const { data: txReceipt, isLoading: isWaitingForReceipt } =
    useWaitForTransactionReceipt({
      hash: currentTxHash,
    });

  // Effect to handle transaction receipt updates
  useEffect(() => {
    if (txReceipt && currentTxHash) {
      const status = txReceipt.status === "success" ? "success" : "error";

      // Extract lockId from event logs if successful
      let lockId = null;
      if (status === "success") {
        // Find LockAdded event in the logs
        const lockAddedEvent = txReceipt.logs.find((log) => {
          try {
            // This is simplified and would need proper event parsing
            return log.topics[0] === "0x..."; // LockAdded event signature
          } catch (e) {
            return false;
          }
        });

        if (lockAddedEvent) {
          // Extract lockId from the event
          // This is simplified - you'd need proper event log parsing
          lockId = parseInt(lockAddedEvent.topics[1], 16);
        }
      }

      setLockStatus({
        status,
        txHash: currentTxHash,
        error: status === "error" ? "Transaction failed" : null,
        timestamp: Date.now(),
        lockId,
      });

      // Only reset isLocking if this was a locking transaction
      if (isLocking) setIsLocking(false);
      if (isEditing) setIsEditing(false);

      // Reset currentTxHash after processing
      setCurrentTxHash(null);
    }
  }, [txReceipt, currentTxHash, isLocking, isEditing]);

  // Function to check token allowance using multicall
  const checkTokenAllowance = useCallback(
    async (tokenAddress, amountInWei) => {
      try {
        if (!lockerContractAddress || !address) {
          throw new Error("Missing contract address or user address");
        }

        // Use multicall to fetch both token details and allowance in one request
        const calls = [
          {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, lockerContractAddress],
          },
          {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "decimals",
          },
          {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "symbol",
          },
        ];

        const results = await multicall(config, {
          contracts: calls,
          chainId,
        });

        const allowance = results[0].result;
        const decimals = results[1].result;
        const symbol = results[2].result;

        return {
          allowance,
          decimals,
          symbol,
          needsApproval: allowance < amountInWei,
        };
      } catch (error) {
        console.error("Error checking allowance:", error);
        throw new Error("Failed to check token allowance");
      }
    },
    [lockerContractAddress, address, chainId]
  );

  // Function to approve token spending with toast.promise
  const approveToken = useCallback(
    async (tokenAddress, amountInWei) => {
      try {
        setIsApproving(true);

        const approvalPromise = async () => {
          const hash = await approveTokenAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [lockerContractAddress, amountInWei],
          });

          setApprovalTxHash(hash);

          // Wait for transaction completion
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Approval transaction failed");
          }

          return receipt;
        };

        // Use toast.promise for the approval transaction
        await toast.promise(approvalPromise, {
          pending: "Approving token transfer...",
          success: "Token approved successfully",
          error: {
            render({ data }) {
              return `Error approving token: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return true;
      } catch (error) {
        console.error("Error approving token:", error);
        return false;
      } finally {
        setIsApproving(false);
        setApprovalTxHash(null);
      }
    },
    [lockerContractAddress, approveTokenAsync]
  );

  // Function to lock tokens with toast.promise (simplified - no LP detection)
  const lockToken = useCallback(
    async (
      tokenAddress,
      amount,
      unlockDate,
      description = "",
      isLpToken = false // Default to false, can be manually set if needed
    ) => {
      try {
        if (!lockerContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsLocking(true);
        setLockStatus({
          status: "pending",
          txHash: null,
          error: null,
          timestamp: Date.now(),
          lockId: null,
        });

        const lockPromise = async () => {
          // Call lock function
          const hash = await lockTokenAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "lock",
            args: [
              address, // owner
              tokenAddress,
              isLpToken,
              amount,
              unlockDate,
              description,
            ],
          });

          setCurrentTxHash(hash);
          setLockStatus((prev) => ({
            ...prev,
            txHash: hash,
          }));

          // Wait for transaction to complete
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Lock transaction failed");
          }

          return { hash, receipt };
        };

        // Use toast.promise for the locking transaction
        const result = await toast.promise(lockPromise, {
          pending: "Processing token lock...",
          success: "Tokens locked successfully!",
          error: {
            render({ data }) {
              return `Error locking tokens: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error locking tokens:", error);
        setLockStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          lockId: null,
        });
        return null;
      } finally {
        if (!currentTxHash) {
          setIsLocking(false);
        }
      }
    },
    [lockerContractAddress, lockTokenAsync, address]
  );

  // Function to lock tokens with vesting using toast.promise (simplified - no LP detection)
  const vestingLockToken = useCallback(
    async (
      tokenAddress,
      amount,
      tgeDate,
      tgeBps,
      cycle,
      cycleBps,
      description = "",
      isLpToken = false // Default to false, can be manually set if needed
    ) => {
      try {
        if (!lockerContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsLocking(true);
        setLockStatus({
          status: "pending",
          txHash: null,
          error: null,
          timestamp: Date.now(),
          lockId: null,
        });

        const vestingLockPromise = async () => {
          // Call vestingLock function
          const hash = await vestingLockAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "vestingLock",
            args: [
              address, // owner
              tokenAddress,
              isLpToken,
              amount,
              tgeDate,
              tgeBps,
              cycle,
              cycleBps,
              description,
            ],
          });

          setCurrentTxHash(hash);
          setLockStatus((prev) => ({
            ...prev,
            txHash: hash,
          }));

          // Wait for transaction to complete
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Vesting lock transaction failed");
          }

          return { hash, receipt };
        };

        // Use toast.promise for the vesting lock transaction
        const result = await toast.promise(vestingLockPromise, {
          pending: "Processing vesting token lock...",
          success: "Tokens locked with vesting successfully!",
          error: {
            render({ data }) {
              return `Error locking tokens with vesting: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error locking tokens with vesting:", error);
        setLockStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          lockId: null,
        });
        return null;
      } finally {
        if (!currentTxHash) {
          setIsLocking(false);
        }
      }
    },
    [lockerContractAddress, vestingLockAsync, address]
  );

  // Edit locked token with toast.promise
  const editLock = useCallback(
    async (lockId, newAmount = 0, newUnlockDate = 0) => {
      try {
        setIsEditing(true);

        let newUnlockTimestamp = 0;
        if (newUnlockDate) {
          newUnlockTimestamp = Math.floor(
            new Date(newUnlockDate).getTime() / 1000
          );
        }

        const editLockPromise = async () => {
          const hash = await writeContractAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "editLock",
            args: [lockId, newAmount, newUnlockTimestamp],
          });

          setCurrentTxHash(hash);

          // Wait for transaction to complete
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Edit lock transaction failed");
          }

          return { hash, receipt, lockId };
        };

        // Use toast.promise for the edit lock transaction
        const result = await toast.promise(editLockPromise, {
          pending: "Updating lock...",
          success: "Lock updated successfully!",
          error: {
            render({ data }) {
              return `Failed to edit lock: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error editing lock:", error);
        return null;
      } finally {
        if (!currentTxHash) setIsEditing(false);
      }
    },
    [lockerContractAddress, writeContractAsync]
  );

  // Update existing locked token description with toast.promise
  const editLockDescription = useCallback(
    async (lockId, description) => {
      try {
        const editDescriptionPromise = async () => {
          const hash = await writeContractAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "editLockDescription",
            args: [lockId, description],
          });

          // Wait for transaction to complete
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Edit description transaction failed");
          }

          return { hash, receipt, lockId, description };
        };

        // Use toast.promise for the edit description transaction
        const result = await toast.promise(editDescriptionPromise, {
          pending: "Updating lock description...",
          success: "Description updated successfully!",
          error: {
            render({ data }) {
              return `Failed to update description: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error updating description:", error);
        return null;
      }
    },
    [lockerContractAddress, writeContractAsync]
  );

  // Transfer locked token to another address-owner with toast.promise
  const transferLockOwnership = useCallback(
    async (lockId, newOwner) => {
      try {
        const transferOwnershipPromise = async () => {
          const hash = await writeContractAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "transferLockOwnership",
            args: [lockId, newOwner],
          });

          // Wait for transaction to complete
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Transfer ownership transaction failed");
          }

          return { hash, receipt, lockId, newOwner };
        };

        // Use toast.promise for the transfer ownership transaction
        const result = await toast.promise(transferOwnershipPromise, {
          pending: "Transferring lock ownership...",
          success: `Ownership transferred successfully to ${newOwner.substring(
            0,
            6
          )}...${newOwner.substring(newOwner.length - 4)}!`,
          error: {
            render({ data }) {
              return `Failed to transfer ownership: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error transferring ownership:", error);
        return null;
      }
    },
    [lockerContractAddress, writeContractAsync]
  );

  // A read function to check how many tokens can be withdrawn for a vesting lock
  const getWithdrawableTokens = useCallback(
    async (lockId) => {
      try {
        const withdrawable = await readContract(config, {
          address: lockerContractAddress,
          abi: TOKEN_LOCKER_ABI,
          functionName: "withdrawableTokens",
          args: [lockId],
        });

        return withdrawable;
      } catch (error) {
        console.error("Error checking withdrawable tokens:", error);
        return BigInt(0);
      }
    },
    [lockerContractAddress]
  );

  // For creating multiple vesting locks at once with toast.promise
  const multipleVestingLock = useCallback(
    async (
      owners,
      amounts,
      tokenAddress,
      tokenDecimals,
      tgeDate,
      tgeBps,
      cycle,
      cycleBps,
      description = "",
      isLpToken = false // Default to false, can be manually set if needed
    ) => {
      try {
        if (!lockerContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        // Convert amounts to wei
        const amountsInWei = amounts.map((amount) =>
          parseUnits(amount.toString(), tokenDecimals)
        );

        // Convert TGE date
        const tgeTimestamp = Math.floor(new Date(tgeDate).getTime() / 1000);

        // Calculate total amount for approval
        const totalAmount = amountsInWei.reduce(
          (sum, amount) => sum + amount,
          BigInt(0)
        );

        setIsLocking(true);
        setLockStatus({
          status: "pending",
          txHash: null,
          error: null,
          timestamp: Date.now(),
          lockId: null,
        });

        const multiLockPromise = async () => {
          // Step 1: Check if approval is needed
          const { needsApproval } = await checkTokenAllowance(
            tokenAddress,
            totalAmount
          );

          // Step 2: Approve token transfer if needed
          if (needsApproval) {
            const isApproved = await approveToken(tokenAddress, totalAmount);
            if (!isApproved) {
              throw new Error("Token approval failed or was rejected");
            }
          }

          // Step 3: Call multiple vesting lock
          const hash = await writeContractAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "multipleVestingLock",
            args: [
              owners,
              amountsInWei,
              tokenAddress,
              isLpToken,
              tgeTimestamp,
              tgeBps,
              cycle,
              cycleBps,
              description,
            ],
          });

          setCurrentTxHash(hash);
          setLockStatus((prev) => ({
            ...prev,
            txHash: hash,
          }));

          const receipt = await waitForTransaction(config, {
            hash: hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Multiple vesting locks transaction failed");
          }

          return { hash, receipt, count: owners.length };
        };

        // Use toast.promise for the multiple vesting locks transaction
        const result = await toast.promise(multiLockPromise, {
          pending: "Creating multiple vesting locks...",
          success: {
            render({ data }) {
              return `Successfully created ${data.count} vesting locks!`;
            },
          },
          error: {
            render({ data }) {
              return `Failed to create locks: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error creating multiple vesting locks:", error);
        setLockStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          lockId: null,
        });
        return null;
      } finally {
        if (!currentTxHash) {
          setIsLocking(false);
        }
      }
    },
    [
      lockerContractAddress,
      writeContractAsync,
      address,
      checkTokenAllowance,
      approveToken,
    ]
  );

  // Function to perform the full token locking process with toast.promise (simplified)
  const performTokenLock = useCallback(
    async (
      tokenAddress,
      tokenDecimals,
      amount,
      unlockDate,
      description = "",
      vestingOptions = null,
      isLpToken = false // Default to false, can be manually set if needed
    ) => {
      try {
        // Validate inputs
        if (!tokenAddress) {
          throw new Error("Token address is required");
        }

        if (!amount || parseFloat(amount) <= 0) {
          throw new Error("Invalid amount");
        }

        if (!unlockDate || new Date(unlockDate).getTime() <= Date.now()) {
          throw new Error("Unlock date must be in the future");
        }

        // Reset lock status
        setLockStatus({
          status: null,
          txHash: null,
          error: null,
          timestamp: null,
          lockId: null,
        });

        // Convert amount to wei format
        const amountInWei = parseUnits(amount.toString(), tokenDecimals);

        // Full token locking process as a promise
        const lockProcessPromise = async () => {
          // Step 1: Check if approval is needed
          const { needsApproval } = await checkTokenAllowance(
            tokenAddress,
            amountInWei
          );

          // Step 2: Approve token transfer if needed
          if (needsApproval) {
            const isApproved = await approveToken(tokenAddress, amountInWei);
            if (!isApproved) {
              throw new Error("Token approval failed or was rejected");
            }
          }

          // Step 3: Lock tokens (with or without vesting)
          let hash;
          if (vestingOptions) {
            const { tgeDate, tgeBps, cycle, cycleBps } = vestingOptions;
            const tgeTimestamp = Math.floor(new Date(tgeDate).getTime() / 1000);

            hash = await vestingLockToken(
              tokenAddress,
              amountInWei,
              tgeTimestamp,
              tgeBps,
              cycle,
              cycleBps,
              description,
              isLpToken
            );
          } else {
            const unlockTimestamp = Math.floor(
              new Date(unlockDate).getTime() / 1000
            );
            hash = await lockToken(
              tokenAddress,
              amountInWei,
              unlockTimestamp,
              description,
              isLpToken
            );
          }

          if (!hash) {
            throw new Error("Token locking failed or was rejected");
          }

          const receipt = await waitForTransaction(config, {
            hash: hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Transaction reverted");
          }

          return {
            hash,
            isLpToken,
            receipt,
            amount,
            tokenAddress,
          };
        };

        const result = await lockProcessPromise();

        const receipt = await waitForTransaction(config, {
          hash: result.hash,
        });

        if (receipt.status === "success") {
          return {
            success: true,
            hash: result.hash,
            isLpToken: result.isLpToken,
          };
        }
      } catch (error) {
        console.error("Error in token lock process:", error);
        setLockStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          lockId: null,
        });

        toast.error(`Lock failed: ${error.message || "Unknown error"}`);
        return {
          success: false,
          error: error.message || "Unknown error",
        };
      }
    },
    [checkTokenAllowance, approveToken, lockToken, vestingLockToken]
  );

  // Function to unlock tokens with toast.promise
  const unlockToken = useCallback(
    async (lockId) => {
      try {
        if (!lockerContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsLocking(true);
        setLockStatus({
          status: "pending",
          txHash: null,
          error: null,
          timestamp: Date.now(),
          lockId,
        });

        const unlockPromise = async () => {
          // Call unlock function
          const hash = await lockTokenAsync({
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "unlock",
            args: [lockId],
          });

          setCurrentTxHash(hash);
          setLockStatus((prev) => ({
            ...prev,
            txHash: hash,
          }));

          // Wait for transaction to complete
          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Unlock transaction failed");
          }

          return { hash, receipt, lockId };
        };

        // Use toast.promise for the unlock transaction
        const result = await toast.promise(unlockPromise, {
          pending: "Processing token unlock...",
          success: "Tokens unlocked successfully!",
          error: {
            render({ data }) {
              return `Error unlocking tokens: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error unlocking tokens:", error);
        setLockStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          lockId,
        });
        return null;
      } finally {
        if (!currentTxHash) {
          setIsLocking(false);
        }
      }
    },
    [lockerContractAddress, lockTokenAsync, address]
  );

  // Get user locks - OPTIMIZED WITH MULTICALL
  const getUserLocks = useCallback(async () => {
    try {
      if (!lockerContractAddress || !address) {
        return { normalLocks: [], lpLocks: [] };
      }

      const fetchLocksPromise = async () => {
        // Use multicall to fetch both normal and LP locks in a single call
        const calls = [
          {
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "normalLocksForUser",
            args: [address],
          },
          {
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "lpLocksForUser",
            args: [address],
          },
        ];

        const results = await multicall(config, {
          contracts: calls,
          chainId,
        });

        const normalLocks = results[0].result;
        const lpLocks = results[1].result;

        return {
          normalLocks,
          lpLocks,
          total: normalLocks.length + lpLocks.length,
        };
      };

      const result = await fetchLocksPromise();
      return result;
    } catch (error) {
      console.error("Error fetching user locks:", error);
      return { normalLocks: [], lpLocks: [] };
    }
  }, [lockerContractAddress, address, chainId]);

  // New function to fetch lock details across multiple chains
  const getMultiChainLocks = useCallback(
    async (targetChainIds = null) => {
      try {
        if (!address) {
          return { chains: {} };
        }

        // Get chains to query - use provided chains or all supported chains
        const chainsToQuery =
          targetChainIds ||
          Object.keys(TOKEN_LOCKER_ADDRESSES).map((id) => parseInt(id));

        // Prepare multicall configurations for each chain
        const chainConfigs = chainsToQuery
          .map((chainId) => {
            const contractAddress = TOKEN_LOCKER_ADDRESSES[chainId];
            if (!contractAddress) return null;

            return {
              chainId,
              calls: [
                {
                  address: contractAddress,
                  abi: TOKEN_LOCKER_ABI,
                  functionName: "normalLocksForUser",
                  args: [address],
                },
                {
                  address: contractAddress,
                  abi: TOKEN_LOCKER_ABI,
                  functionName: "lpLocksForUser",
                  args: [address],
                },
              ],
            };
          })
          .filter(Boolean);

        // Execute multicall across all chains
        const results = await multiChainMulticall(chainConfigs);

        // Process results into a more usable format
        const processedResults = {};

        for (const chainId in results) {
          const chainResults = results[chainId];
          if (chainResults.error) {
            processedResults[chainId] = {
              error: chainResults.error,
              normalLocks: [],
              lpLocks: [],
            };
          } else {
            processedResults[chainId] = {
              normalLocks: chainResults[0].result || [],
              lpLocks: chainResults[1].result || [],
              total:
                (chainResults[0].result?.length || 0) +
                (chainResults[1].result?.length || 0),
            };
          }
        }

        return { chains: processedResults };
      } catch (error) {
        console.error("Error fetching multi-chain locks:", error);
        return { chains: {} };
      }
    },
    [address]
  );

  // Get detailed info for multiple locks using multicall
  const getDetailedLockInfo = useCallback(
    async (lockIds) => {
      try {
        if (!lockerContractAddress || !lockIds || lockIds.length === 0) {
          return [];
        }

        // Prepare the calls for each lock ID
        const calls = lockIds.flatMap((lockId) => [
          {
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "getLockById",
            args: [lockId],
          },
          {
            address: lockerContractAddress,
            abi: TOKEN_LOCKER_ABI,
            functionName: "withdrawableTokens",
            args: [lockId],
          },
        ]);

        // Execute multicall
        const results = await multicall(config, {
          contracts: calls,
          chainId,
        });

        // Process results - for each lock we have getLockById and withdrawableTokens
        const detailedLocks = [];
        for (let i = 0; i < lockIds.length; i++) {
          const lockInfo = results[i * 2].result;
          const withdrawable = results[i * 2 + 1].result;

          if (lockInfo) {
            detailedLocks.push({
              ...lockInfo,
              withdrawable,
              lockId: lockIds[i],
            });
          }
        }

        return detailedLocks;
      } catch (error) {
        console.error("Error fetching detailed lock info:", error);
        return [];
      }
    },
    [lockerContractAddress, chainId]
  );

  // Clear lock status (useful for UI resets)
  const clearLockStatus = useCallback(() => {
    setLockStatus({
      status: null,
      txHash: null,
      error: null,
      timestamp: null,
      lockId: null,
    });
  }, []);

  return {
    // Main functions
    performTokenLock,
    unlockToken,
    multipleVestingLock, // Main function for creating multiple vesting locks

    // Individual lock functions
    lockToken,
    vestingLockToken,

    // Lock management
    editLock,
    editLockDescription,
    transferLockOwnership,

    // Data fetching
    getUserLocks,
    getMultiChainLocks,
    getDetailedLockInfo,
    getWithdrawableTokens,

    // Token operations
    checkTokenAllowance,
    approveToken,

    // State
    isApproving,
    isLocking,
    isEditing,
    isProcessing: isApproving || isLocking || isWaitingForReceipt,
    currentTxHash,
    txReceipt,
    lockStatus,

    // Utilities
    clearLockStatus,
  };
}
