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
import {
  VESTING_MANAGER_ADDRESS,
  VESTING_MANAGER_ABI,
} from "@/lib/vestingManager";

// Enums matching the contract
export const CancelPermission = {
  NONE: 0,
  SENDER_ONLY: 1,
  RECIPIENT_ONLY: 2,
  BOTH: 3,
};

export const ChangeRecipientPermission = {
  NONE: 0,
  SENDER_ONLY: 1,
  RECIPIENT_ONLY: 2,
  BOTH: 3,
};

export const UnlockSchedule = {
  SECOND: 0,
  MINUTE: 1,
  HOUR: 2,
  DAILY: 3,
  WEEKLY: 4,
  BIWEEKLY: 5,
  MONTHLY: 6,
  QUARTERLY: 7,
  YEARLY: 8,
};

// Utility function for multicall across chains
export async function multiChainVestingMulticall(chainConfigs) {
  const results = {};

  for (const chainConfig of chainConfigs) {
    const { chainId, calls } = chainConfig;

    if (!calls || calls.length === 0) continue;

    try {
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

export function useVestingManager() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isApproving, setIsApproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState(null);
  const [approvalTxHash, setApprovalTxHash] = useState(null);
  const [vestingStatus, setVestingStatus] = useState({
    status: null, // 'success', 'error', 'pending', null
    txHash: null,
    error: null,
    timestamp: null,
    scheduleId: null,
  });

  const vestingContractAddress = VESTING_MANAGER_ADDRESS;

  // Contract write hooks
  const { writeContractAsync: approveTokenAsync } = useWriteContract();
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

      // Extract scheduleId from event logs if successful
      let scheduleId = null;
      if (status === "success") {
        // Find VestingScheduleCreated event in the logs
        const vestingCreatedEvent = txReceipt.logs.find((log) => {
          try {
            // This would need proper event parsing
            return log.topics[0] === "0x..."; // VestingScheduleCreated event signature
          } catch (e) {
            return false;
          }
        });

        if (vestingCreatedEvent) {
          // Extract scheduleId from the event
          scheduleId = parseInt(vestingCreatedEvent.topics[1], 16);
        }
      }

      setVestingStatus({
        status,
        txHash: currentTxHash,
        error: status === "error" ? "Transaction failed" : null,
        timestamp: Date.now(),
        scheduleId,
      });

      // Reset states
      if (isCreating) setIsCreating(false);
      if (isReleasing) setIsReleasing(false);
      if (isProcessing) setIsProcessing(false);

      setCurrentTxHash(null);
    }
  }, [txReceipt, currentTxHash, isCreating, isReleasing, isProcessing]);

  // Function to check token allowance
  const checkTokenAllowance = useCallback(
    async (tokenAddress, amountInWei) => {
      try {
        if (!vestingContractAddress || !address) {
          throw new Error("Missing contract address or user address");
        }

        const calls = [
          {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, vestingContractAddress],
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
    [vestingContractAddress, address, chainId]
  );

  // Function to approve token spending
  const approveToken = useCallback(
    async (tokenAddress, amountInWei) => {
      try {
        setIsApproving(true);

        const approvalPromise = async () => {
          const hash = await approveTokenAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [vestingContractAddress, amountInWei],
          });

          setApprovalTxHash(hash);

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Approval transaction failed");
          }

          return receipt;
        };

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
    [vestingContractAddress, approveTokenAsync]
  );

  // Create single vesting schedule
  const createVestingSchedule = useCallback(
    async (
      tokenAddress,
      recipient,
      amount,
      tokenDecimals,
      startTime,
      endTime,
      unlockSchedule,
      autoClaim = false,
      contractTitle = "",
      recipientEmail = "",
      cancelPermission = CancelPermission.BOTH,
      changeRecipientPermission = ChangeRecipientPermission.BOTH
    ) => {
      try {
        if (!vestingContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsCreating(true);
        setVestingStatus({
          status: "pending",
          txHash: null,
          error: null,
          timestamp: Date.now(),
          scheduleId: null,
        });

        const amountInWei = parseUnits(amount.toString(), tokenDecimals);
        const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

        const createSchedulePromise = async () => {
          // Check if approval is needed
          const { needsApproval } = await checkTokenAllowance(
            tokenAddress,
            amountInWei
          );

          // Approve token transfer if needed
          if (needsApproval) {
            const isApproved = await approveToken(tokenAddress, amountInWei);
            if (!isApproved) {
              throw new Error("Token approval failed or was rejected");
            }
          }

          // Create vesting schedule
          const hash = await writeContractAsync({
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "createVestingSchedule",
            args: [
              tokenAddress,
              recipient,
              amountInWei,
              startTimestamp,
              endTimestamp,
              unlockSchedule,
              autoClaim,
              contractTitle,
              recipientEmail,
              cancelPermission,
              changeRecipientPermission,
            ],
          });

          setCurrentTxHash(hash);
          setVestingStatus((prev) => ({
            ...prev,
            txHash: hash,
          }));

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Create vesting schedule transaction failed");
          }

          return { hash, receipt };
        };

        const result = await toast.promise(createSchedulePromise, {
          pending: "Creating vesting schedule...",
          success: "Vesting schedule created successfully!",
          error: {
            render({ data }) {
              return `Error creating vesting schedule: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error creating vesting schedule:", error);
        setVestingStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          scheduleId: null,
        });
        return null;
      } finally {
        if (!currentTxHash) {
          setIsCreating(false);
        }
      }
    },
    [
      vestingContractAddress,
      writeContractAsync,
      address,
      checkTokenAllowance,
      approveToken,
    ]
  );

  // Create multiple vesting schedules
  const createMultipleVestingSchedules = useCallback(
    async (
      tokenAddress,
      recipients,
      amounts,
      tokenDecimals,
      startTime,
      endTime,
      unlockSchedule,
      autoClaim = false,
      contractTitles = [],
      recipientEmails = [],
      cancelPermission = CancelPermission.BOTH,
      changeRecipientPermission = ChangeRecipientPermission.BOTH
    ) => {
      try {
        if (!vestingContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsCreating(true);
        setVestingStatus({
          status: "pending",
          txHash: null,
          error: null,
          timestamp: Date.now(),
          scheduleId: null,
        });

        const amountsInWei = amounts.map((amount) =>
          parseUnits(amount.toString(), tokenDecimals)
        );
        const totalAmount = amountsInWei.reduce(
          (sum, amount) => sum + amount,
          BigInt(0)
        );
        const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

        // Fill arrays if not provided
        const titles = contractTitles.length
          ? contractTitles
          : new Array(recipients.length).fill("");
        const emails = recipientEmails.length
          ? recipientEmails
          : new Array(recipients.length).fill("");

        const createMultipleSchedulesPromise = async () => {
          // Check if approval is needed
          const { needsApproval } = await checkTokenAllowance(
            tokenAddress,
            totalAmount
          );

          // Approve token transfer if needed
          if (needsApproval) {
            const isApproved = await approveToken(tokenAddress, totalAmount);
            if (!isApproved) {
              throw new Error("Token approval failed or was rejected");
            }
          }

          // Create multiple vesting schedules
          const hash = await writeContractAsync({
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "createMultipleVestingSchedules",
            args: [
              tokenAddress,
              recipients,
              amountsInWei,
              startTimestamp,
              endTimestamp,
              unlockSchedule,
              autoClaim,
              titles,
              emails,
              cancelPermission,
              changeRecipientPermission,
            ],
          });

          setCurrentTxHash(hash);
          setVestingStatus((prev) => ({
            ...prev,
            txHash: hash,
          }));

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error(
              "Create multiple vesting schedules transaction failed"
            );
          }

          return { hash, receipt, count: recipients.length };
        };

        const result = await toast.promise(createMultipleSchedulesPromise, {
          pending: "Creating multiple vesting schedules...",
          success: {
            render({ data }) {
              return `Successfully created ${data.count} vesting schedules!`;
            },
          },
          error: {
            render({ data }) {
              return `Failed to create schedules: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error creating multiple vesting schedules:", error);
        setVestingStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          scheduleId: null,
        });
        return null;
      } finally {
        if (!currentTxHash) {
          setIsCreating(false);
        }
      }
    },
    [
      vestingContractAddress,
      writeContractAsync,
      address,
      checkTokenAllowance,
      approveToken,
    ]
  );

  // Release tokens from vesting schedule
  const releaseTokens = useCallback(
    async (scheduleId) => {
      try {
        if (!vestingContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsReleasing(true);

        const releasePromise = async () => {
          const hash = await writeContractAsync({
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "release",
            args: [scheduleId],
          });

          setCurrentTxHash(hash);

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Release transaction failed");
          }

          return { hash, receipt, scheduleId };
        };

        const result = await toast.promise(releasePromise, {
          pending: "Releasing vested tokens...",
          success: "Tokens released successfully!",
          error: {
            render({ data }) {
              return `Error releasing tokens: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error releasing tokens:", error);
        return null;
      } finally {
        if (!currentTxHash) setIsReleasing(false);
      }
    },
    [vestingContractAddress, writeContractAsync, address]
  );

  // Release all tokens for a recipient
  const releaseAllTokens = useCallback(
    async (recipient) => {
      try {
        if (!vestingContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsReleasing(true);

        const releaseAllPromise = async () => {
          const hash = await writeContractAsync({
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "releaseAll",
            args: [recipient],
          });

          setCurrentTxHash(hash);

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Release all transaction failed");
          }

          return { hash, receipt, recipient };
        };

        const result = await toast.promise(releaseAllPromise, {
          pending: "Releasing all vested tokens...",
          success: "All tokens released successfully!",
          error: {
            render({ data }) {
              return `Error releasing tokens: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error releasing all tokens:", error);
        return null;
      } finally {
        if (!currentTxHash) setIsReleasing(false);
      }
    },
    [vestingContractAddress, writeContractAsync, address]
  );

  // Cancel vesting schedule
  const cancelVestingSchedule = useCallback(
    async (scheduleId) => {
      try {
        if (!vestingContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsProcessing(true);

        const cancelPromise = async () => {
          const hash = await writeContractAsync({
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "cancelVestingSchedule",
            args: [scheduleId],
          });

          setCurrentTxHash(hash);

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Cancel transaction failed");
          }

          return { hash, receipt, scheduleId };
        };

        const result = await toast.promise(cancelPromise, {
          pending: "Cancelling vesting schedule...",
          success: "Vesting schedule cancelled successfully!",
          error: {
            render({ data }) {
              return `Error cancelling schedule: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error cancelling vesting schedule:", error);
        return null;
      } finally {
        if (!currentTxHash) setIsProcessing(false);
      }
    },
    [vestingContractAddress, writeContractAsync, address]
  );

  // Change recipient of vesting schedule
  const changeRecipient = useCallback(
    async (scheduleId, newRecipient) => {
      try {
        if (!vestingContractAddress) {
          throw new Error("Unsupported chain");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        setIsProcessing(true);

        const changeRecipientPromise = async () => {
          const hash = await writeContractAsync({
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "changeRecipient",
            args: [scheduleId, newRecipient],
          });

          setCurrentTxHash(hash);

          const receipt = await waitForTransaction(config, {
            hash,
          });

          if (receipt.status !== "success") {
            throw new Error("Change recipient transaction failed");
          }

          return { hash, receipt, scheduleId, newRecipient };
        };

        const result = await toast.promise(changeRecipientPromise, {
          pending: "Changing recipient...",
          success: `Recipient changed successfully to ${newRecipient.substring(
            0,
            6
          )}...${newRecipient.substring(newRecipient.length - 4)}!`,
          error: {
            render({ data }) {
              return `Failed to change recipient: ${
                data?.message || "Transaction failed"
              }`;
            },
          },
        });

        return result.hash;
      } catch (error) {
        console.error("Error changing recipient:", error);
        return null;
      } finally {
        if (!currentTxHash) setIsProcessing(false);
      }
    },
    [vestingContractAddress, writeContractAsync, address]
  );

  // Process auto claims
  const processAutoClaims = useCallback(async () => {
    try {
      if (!vestingContractAddress) {
        throw new Error("Unsupported chain");
      }

      if (!address) {
        throw new Error("Wallet not connected");
      }

      setIsProcessing(true);

      const processAutoClaimsPromise = async () => {
        const hash = await writeContractAsync({
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "processAutoClaims",
          args: [],
        });

        setCurrentTxHash(hash);

        const receipt = await waitForTransaction(config, {
          hash,
        });

        if (receipt.status !== "success") {
          throw new Error("Process auto claims transaction failed");
        }

        return { hash, receipt };
      };

      const result = await toast.promise(processAutoClaimsPromise, {
        pending: "Processing auto claims...",
        success: "Auto claims processed successfully!",
        error: {
          render({ data }) {
            return `Failed to process auto claims: ${
              data?.message || "Transaction failed"
            }`;
          },
        },
      });

      return result.hash;
    } catch (error) {
      console.error("Error processing auto claims:", error);
      return null;
    } finally {
      if (!currentTxHash) setIsProcessing(false);
    }
  }, [vestingContractAddress, writeContractAsync, address]);

  // Get releasable amount for a schedule
  const getReleasableAmount = useCallback(
    async (scheduleId) => {
      try {
        if (!vestingContractAddress) {
          return BigInt(0);
        }

        const releasableAmount = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getReleasableAmount",
          args: [scheduleId],
          chainId,
        });

        return releasableAmount;
      } catch (error) {
        console.error("Error getting releasable amount:", error);
        return BigInt(0);
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get vested amount for a schedule
  const getVestedAmount = useCallback(
    async (scheduleId) => {
      try {
        if (!vestingContractAddress) {
          return BigInt(0);
        }

        const vestedAmount = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getVestedAmount",
          args: [scheduleId],
          chainId,
        });

        return vestedAmount;
      } catch (error) {
        console.error("Error getting vested amount:", error);
        return BigInt(0);
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get schedule by ID
  const getScheduleById = useCallback(
    async (scheduleId) => {
      try {
        if (!vestingContractAddress) {
          return null;
        }

        const schedule = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getScheduleById",
          args: [scheduleId],
          chainId,
        });

        return schedule;
      } catch (error) {
        console.error("Error getting schedule:", error);
        return null;
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get recipient schedules
  const getRecipientSchedules = useCallback(
    async (recipient) => {
      try {
        if (!vestingContractAddress) {
          return [];
        }

        const scheduleIds = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getRecipientSchedules",
          args: [recipient],
          chainId,
        });

        return scheduleIds;
      } catch (error) {
        console.error("Error getting recipient schedules:", error);
        return [];
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get sender schedules
  const getSenderSchedules = useCallback(
    async (sender) => {
      try {
        if (!vestingContractAddress) {
          return [];
        }

        const scheduleIds = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getSenderSchedules",
          args: [sender],
          chainId,
        });

        return scheduleIds;
      } catch (error) {
        console.error("Error getting sender schedules:", error);
        return [];
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get token schedules
  const getTokenSchedules = useCallback(
    async (tokenAddress) => {
      try {
        if (!vestingContractAddress) {
          return [];
        }

        const scheduleIds = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getTokenSchedules",
          args: [tokenAddress],
          chainId,
        });

        return scheduleIds;
      } catch (error) {
        console.error("Error getting token schedules:", error);
        return [];
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get all vested tokens
  const getAllVestedTokens = useCallback(async () => {
    try {
      if (!vestingContractAddress) {
        return [];
      }

      const tokens = await readContract(config, {
        address: vestingContractAddress,
        abi: VESTING_MANAGER_ABI,
        functionName: "getAllVestedTokens",
        args: [],
        chainId,
      });

      return tokens;
    } catch (error) {
      console.error("Error getting all vested tokens:", error);
      return [];
    }
  }, [vestingContractAddress, chainId]);

  // Get token vesting info
  const getTokenVestingInfo = useCallback(
    async (tokenAddress) => {
      try {
        if (!vestingContractAddress) {
          return null;
        }

        const tokenInfo = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "tokenVestingInfo",
          args: [tokenAddress],
          chainId,
        });

        return tokenInfo;
      } catch (error) {
        console.error("Error getting token vesting info:", error);
        return null;
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get user schedules (both as sender and recipient) - OPTIMIZED WITH MULTICALL
  const getUserSchedules = useCallback(async () => {
    try {
      if (!vestingContractAddress || !address) {
        return { recipientSchedules: [], senderSchedules: [] };
      }

      const calls = [
        {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getRecipientSchedules",
          args: [address],
        },
        {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getSenderSchedules",
          args: [address],
        },
      ];

      const results = await multicall(config, {
        contracts: calls,
        chainId,
      });

      const recipientSchedules = results[0].result || [];
      const senderSchedules = results[1].result || [];

      return {
        recipientSchedules,
        senderSchedules,
        total: recipientSchedules.length + senderSchedules.length,
      };
    } catch (error) {
      console.error("Error fetching user schedules:", error);
      return { recipientSchedules: [], senderSchedules: [] };
    }
  }, [vestingContractAddress, address, chainId]);

  // Get detailed schedule info for multiple schedules using multicall
  const getDetailedScheduleInfo = useCallback(
    async (scheduleIds) => {
      try {
        if (
          !vestingContractAddress ||
          !scheduleIds ||
          scheduleIds.length === 0
        ) {
          return [];
        }

        // Prepare the calls for each schedule ID
        const calls = scheduleIds.flatMap((scheduleId) => [
          {
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "getScheduleById",
            args: [scheduleId],
          },
          {
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "getReleasableAmount",
            args: [scheduleId],
          },
          {
            address: vestingContractAddress,
            abi: VESTING_MANAGER_ABI,
            functionName: "getVestedAmount",
            args: [scheduleId],
          },
        ]);

        // Execute multicall
        const results = await multicall(config, {
          contracts: calls,
          chainId,
        });

        // Process results - for each schedule we have getScheduleById, getReleasableAmount, and getVestedAmount
        const detailedSchedules = [];
        for (let i = 0; i < scheduleIds.length; i++) {
          const scheduleInfo = results[i * 3].result;
          const releasableAmount = results[i * 3 + 1].result;
          const vestedAmount = results[i * 3 + 2].result;

          if (scheduleInfo) {
            detailedSchedules.push({
              ...scheduleInfo,
              releasableAmount,
              vestedAmount,
              scheduleId: scheduleIds[i],
            });
          }
        }

        return detailedSchedules;
      } catch (error) {
        console.error("Error fetching detailed schedule info:", error);
        return [];
      }
    },
    [vestingContractAddress, chainId]
  );

  // Get multi-chain schedules
  const getMultiChainSchedules = useCallback(
    async (targetChainIds = null) => {
      try {
        if (!address) {
          return { chains: {} };
        }

        // Get chains to query - use provided chains or all supported chains
        const chainsToQuery =
          targetChainIds ||
          Object.keys(VESTING_MANAGER_ADDRESS).map((id) => parseInt(id));

        // Prepare multicall configurations for each chain
        const chainConfigs = chainsToQuery
          .map((chainId) => {
            const contractAddress = VESTING_MANAGER_ADDRESS[chainId];
            if (!contractAddress) return null;

            return {
              chainId,
              calls: [
                {
                  address: contractAddress,
                  abi: VESTING_MANAGER_ABI,
                  functionName: "getRecipientSchedules",
                  args: [address],
                },
                {
                  address: contractAddress,
                  abi: VESTING_MANAGER_ABI,
                  functionName: "getSenderSchedules",
                  args: [address],
                },
              ],
            };
          })
          .filter(Boolean);

        // Execute multicall across all chains
        const results = await multiChainVestingMulticall(chainConfigs);

        // Process results into a more usable format
        const processedResults = {};

        for (const chainId in results) {
          const chainResults = results[chainId];
          if (chainResults.error) {
            processedResults[chainId] = {
              error: chainResults.error,
              recipientSchedules: [],
              senderSchedules: [],
            };
          } else {
            processedResults[chainId] = {
              recipientSchedules: chainResults[0].result || [],
              senderSchedules: chainResults[1].result || [],
              total:
                (chainResults[0].result?.length || 0) +
                (chainResults[1].result?.length || 0),
            };
          }
        }

        return { chains: processedResults };
      } catch (error) {
        console.error("Error fetching multi-chain schedules:", error);
        return { chains: {} };
      }
    },
    [address]
  );

  // Get total schedule count
  const getTotalScheduleCount = useCallback(async () => {
    try {
      if (!vestingContractAddress) {
        return 0;
      }

      const count = await readContract(config, {
        address: vestingContractAddress,
        abi: VESTING_MANAGER_ABI,
        functionName: "getTotalScheduleCount",
        args: [],
        chainId,
      });

      return count;
    } catch (error) {
      console.error("Error getting total schedule count:", error);
      return 0;
    }
  }, [vestingContractAddress, chainId]);

  // Get unlock interval for a schedule type
  const getUnlockInterval = useCallback(
    async (unlockSchedule) => {
      try {
        if (!vestingContractAddress) {
          return BigInt(0);
        }

        const interval = await readContract(config, {
          address: vestingContractAddress,
          abi: VESTING_MANAGER_ABI,
          functionName: "getUnlockInterval",
          args: [unlockSchedule],
          chainId,
        });

        return interval;
      } catch (error) {
        console.error("Error getting unlock interval:", error);
        return BigInt(0);
      }
    },
    [vestingContractAddress, chainId]
  );

  // Clear vesting status (useful for UI resets)
  const clearVestingStatus = useCallback(() => {
    setVestingStatus({
      status: null,
      txHash: null,
      error: null,
      timestamp: null,
      scheduleId: null,
    });
  }, []);

  // Utility function to format unlock schedule for display
  const getUnlockScheduleText = useCallback((unlockSchedule) => {
    const scheduleTexts = {
      [UnlockSchedule.SECOND]: "Every Second",
      [UnlockSchedule.MINUTE]: "Every Minute",
      [UnlockSchedule.HOUR]: "Every Hour",
      [UnlockSchedule.DAILY]: "Daily",
      [UnlockSchedule.WEEKLY]: "Weekly",
      [UnlockSchedule.BIWEEKLY]: "Bi-weekly",
      [UnlockSchedule.MONTHLY]: "Monthly",
      [UnlockSchedule.QUARTERLY]: "Quarterly",
      [UnlockSchedule.YEARLY]: "Yearly",
    };
    return scheduleTexts[unlockSchedule] || "Unknown";
  }, []);

  // Utility function to format permission for display
  const getPermissionText = useCallback((permission) => {
    const permissionTexts = {
      [CancelPermission.NONE]: "None",
      [CancelPermission.SENDER_ONLY]: "Sender Only",
      [CancelPermission.RECIPIENT_ONLY]: "Recipient Only",
      [CancelPermission.BOTH]: "Both",
    };
    return permissionTexts[permission] || "Unknown";
  }, []);

  // Perform the full vesting schedule creation process
  const performVestingScheduleCreation = useCallback(
    async (
      tokenAddress,
      tokenDecimals,
      recipient,
      amount,
      startTime,
      endTime,
      unlockSchedule,
      options = {}
    ) => {
      try {
        // Validate inputs
        if (!tokenAddress) {
          throw new Error("Token address is required");
        }

        if (!recipient) {
          throw new Error("Recipient address is required");
        }

        if (!amount || parseFloat(amount) <= 0) {
          throw new Error("Invalid amount");
        }

        if (!startTime || new Date(startTime).getTime() <= Date.now()) {
          throw new Error("Start time must be in the future");
        }

        if (
          !endTime ||
          new Date(endTime).getTime() <= new Date(startTime).getTime()
        ) {
          throw new Error("End time must be after start time");
        }

        const {
          autoClaim = false,
          contractTitle = "",
          recipientEmail = "",
          cancelPermission = CancelPermission.BOTH,
          changeRecipientPermission = ChangeRecipientPermission.BOTH,
        } = options;

        // Reset vesting status
        setVestingStatus({
          status: null,
          txHash: null,
          error: null,
          timestamp: null,
          scheduleId: null,
        });

        const hash = await createVestingSchedule(
          tokenAddress,
          recipient,
          amount,
          tokenDecimals,
          startTime,
          endTime,
          unlockSchedule,
          autoClaim,
          contractTitle,
          recipientEmail,
          cancelPermission,
          changeRecipientPermission
        );

        if (!hash) {
          throw new Error("Vesting schedule creation failed or was rejected");
        }

        const receipt = await waitForTransaction(config, {
          hash: hash,
        });

        if (receipt.status === "success") {
          return {
            success: true,
            hash: hash,
          };
        }
      } catch (error) {
        console.error("Error in vesting schedule creation process:", error);
        setVestingStatus({
          status: "error",
          txHash: null,
          error: error.message || "Unknown error",
          timestamp: Date.now(),
          scheduleId: null,
        });

        toast.error(
          `Vesting creation failed: ${error.message || "Unknown error"}`
        );
        return {
          success: false,
          error: error.message || "Unknown error",
        };
      }
    },
    [createVestingSchedule]
  );

  return {
    // Main functions
    createVestingSchedule,
    createMultipleVestingSchedules,
    performVestingScheduleCreation,

    // Token operations
    releaseTokens,
    releaseAllTokens,
    processAutoClaims,

    // Schedule management
    cancelVestingSchedule,
    changeRecipient,

    // Data fetching - Single schedule
    getScheduleById,
    getReleasableAmount,
    getVestedAmount,

    // Data fetching - Multiple schedules
    getRecipientSchedules,
    getSenderSchedules,
    getTokenSchedules,
    getUserSchedules,
    getDetailedScheduleInfo,
    getMultiChainSchedules,

    // Data fetching - Token info
    getAllVestedTokens,
    getTokenVestingInfo,
    getTotalScheduleCount,

    // Utility functions
    getUnlockInterval,
    getUnlockScheduleText,
    getPermissionText,

    // Token operations
    checkTokenAllowance,
    approveToken,

    // State
    isApproving,
    isCreating,
    isReleasing,
    isProcessing:
      isApproving ||
      isCreating ||
      isReleasing ||
      isProcessing ||
      isWaitingForReceipt,
    currentTxHash,
    txReceipt,
    vestingStatus,

    // Utilities
    clearVestingStatus,

    // Constants for easy access
    CancelPermission,
    ChangeRecipientPermission,
    UnlockSchedule,
  };
}
