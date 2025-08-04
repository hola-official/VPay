import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useState, useCallback } from "react";
import { tokenLock } from "../lib/tokenLock";

export const useTokenLocker = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [operationStates, setOperationStates] = useState({});

  // Helper function to update operation state
  const updateOperationState = useCallback((operation, state) => {
    setOperationStates((prev) => ({
      ...prev,
      [operation]: state,
    }));
  }, []);

  // Read contract functions
  const { data: totalLockCount } = useReadContract({
    address: tokenLock.address,
    abi: tokenLock.abi,
    functionName: "getTotalLockCount",
  });

  const { data: userLpLockCount } = useReadContract({
    address: tokenLock.address,
    abi: tokenLock.abi,
    functionName: "lpLockCountForUser",
    args: [address],
    enabled: !!address,
  });

  const { data: userNormalLockCount } = useReadContract({
    address: tokenLock.address,
    abi: tokenLock.abi,
    functionName: "normalLockCountForUser",
    args: [address],
    enabled: !!address,
  });

  const { data: userTotalLockCount } = useReadContract({
    address: tokenLock.address,
    abi: tokenLock.abi,
    functionName: "totalLockCountForUser",
    args: [address],
    enabled: !!address,
  });

  // Lock function - for normal locks
  const lock = useCallback(
    async ({
      owner,
      token,
      isLpToken,
      amount,
      unlockDate,
      description = "",
      decimals = 18,
    }) => {
      try {
        updateOperationState("lock", { loading: true, error: null });

        const amountWei = parseUnits(amount.toString(), decimals);
        const unlockTimestamp = Math.floor(
          new Date(unlockDate).getTime() / 1000
        );

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "lock",
          args: [
            owner || address,
            token,
            isLpToken,
            amountWei,
            BigInt(unlockTimestamp),
            description,
          ],
        });

        updateOperationState("lock", { loading: false, error: null });
        return { success: true };
      } catch (err) {
        updateOperationState("lock", { loading: false, error: err.message });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi, address]
  );

  // Vesting lock function
  const vestingLock = useCallback(
    async ({
      owner,
      token,
      isLpToken,
      amount,
      tgeDate,
      tgeBps,
      cycle,
      cycleBps,
      description = "",
      decimals = 18,
    }) => {
      try {
        updateOperationState("vestingLock", { loading: true, error: null });

        const amountWei = parseUnits(amount.toString(), decimals);
        const tgeTimestamp = Math.floor(new Date(tgeDate).getTime() / 1000);

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "vestingLock",
          args: [
            owner || address,
            token,
            isLpToken,
            amountWei,
            BigInt(tgeTimestamp),
            BigInt(tgeBps),
            BigInt(cycle),
            BigInt(cycleBps),
            description,
          ],
        });

        updateOperationState("vestingLock", { loading: false, error: null });
        return { success: true };
      } catch (err) {
        updateOperationState("vestingLock", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi, address]
  );

  // Multiple vesting lock function
  const multipleVestingLock = useCallback(
    async ({
      owners,
      amounts,
      token,
      isLpToken,
      tgeDate,
      tgeBps,
      cycle,
      cycleBps,
      description = "",
      decimals = 18,
    }) => {
      try {
        updateOperationState("multipleVestingLock", {
          loading: true,
          error: null,
        });

        const amountsWei = amounts.map((amount) =>
          parseUnits(amount.toString(), decimals)
        );
        const tgeTimestamp = Math.floor(new Date(tgeDate).getTime() / 1000);

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "multipleVestingLock",
          args: [
            owners,
            amountsWei,
            token,
            isLpToken,
            BigInt(tgeTimestamp),
            BigInt(tgeBps),
            BigInt(cycle),
            BigInt(cycleBps),
            description,
          ],
        });

        updateOperationState("multipleVestingLock", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("multipleVestingLock", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi]
  );

  // Unlock function
  const unlock = useCallback(
    async (lockId) => {
      try {
        updateOperationState("unlock", { loading: true, error: null });

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "unlock",
          args: [BigInt(lockId)],
        });

        updateOperationState("unlock", { loading: false, error: null });
        return { success: true };
      } catch (err) {
        updateOperationState("unlock", { loading: false, error: err.message });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi]
  );

  // Edit lock function
  const editLock = useCallback(
    async ({ lockId, newAmount, newUnlockDate, decimals = 18 }) => {
      try {
        updateOperationState("editLock", { loading: true, error: null });

        const newAmountWei = newAmount
          ? parseUnits(newAmount.toString(), decimals)
          : 0n;
        const newUnlockTimestamp = newUnlockDate
          ? BigInt(Math.floor(new Date(newUnlockDate).getTime() / 1000))
          : 0n;

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "editLock",
          args: [BigInt(lockId), newAmountWei, newUnlockTimestamp],
        });

        updateOperationState("editLock", { loading: false, error: null });
        return { success: true };
      } catch (err) {
        updateOperationState("editLock", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi]
  );

  // Edit lock description function
  const editLockDescription = useCallback(
    async (lockId, description) => {
      try {
        updateOperationState("editLockDescription", {
          loading: true,
          error: null,
        });

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "editLockDescription",
          args: [BigInt(lockId), description],
        });

        updateOperationState("editLockDescription", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("editLockDescription", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi]
  );

  // Transfer lock ownership function
  const transferLockOwnership = useCallback(
    async (lockId, newOwner) => {
      try {
        updateOperationState("transferLockOwnership", {
          loading: true,
          error: null,
        });

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "transferLockOwnership",
          args: [BigInt(lockId), newOwner],
        });

        updateOperationState("transferLockOwnership", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("transferLockOwnership", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi]
  );

  // Renounce lock ownership function
  const renounceLockOwnership = useCallback(
    async (lockId) => {
      try {
        updateOperationState("renounceLockOwnership", {
          loading: true,
          error: null,
        });

        await writeContract({
          address: tokenLock.address,
          abi: tokenLock.abi,
          functionName: "renounceLockOwnership",
          args: [BigInt(lockId)],
        });

        updateOperationState("renounceLockOwnership", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("renounceLockOwnership", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, tokenLock.address, tokenLock.abi]
  );

  // Get lock by ID function
  const getLockById = useCallback(
    (lockId) => {
      return useReadContract({
        address: tokenLock.address,
        abi: tokenLock.abi,
        functionName: "getLockById",
        args: [BigInt(lockId)],
      });
    },
    [tokenLock.address, tokenLock.abi]
  );

  // Get withdrawable tokens function
  const getWithdrawableTokens = useCallback(
    (lockId) => {
      return useReadContract({
        address: tokenLock.address,
        abi: tokenLock.abi,
        functionName: "withdrawableTokens",
        args: [BigInt(lockId)],
      });
    },
    [tokenLock.address, tokenLock.abi]
  );

  // Get user LP locks function
  const getUserLpLocks = useCallback(() => {
    return useReadContract({
      address: tokenLock.address,
      abi: tokenLock.abi,
      functionName: "lpLocksForUser",
      args: [address],
      enabled: !!address,
    });
  }, [tokenLock.address, tokenLock.abi, address]);

  // Get user normal locks function
  const getUserNormalLocks = useCallback(() => {
    return useReadContract({
      address: tokenLock.address,
      abi: tokenLock.abi,
      functionName: "normalLocksForUser",
      args: [address],
      enabled: !!address,
    });
  }, [tokenLock.address, tokenLock.abi, address]);

  // Get locks for token function
  const getLocksForToken = useCallback(
    (token, start = 0, end = 100) => {
      return useReadContract({
        address: tokenLock.address,
        abi: tokenLock.abi,
        functionName: "getLocksForToken",
        args: [token, BigInt(start), BigInt(end)],
      });
    },
    [tokenLock.address, tokenLock.abi]
  );

  // Get cumulative lock info functions
  const getCumulativeLpTokenLockInfo = useCallback(
    (start = 0, end = 100) => {
      return useReadContract({
        address: tokenLock.address,
        abi: tokenLock.abi,
        functionName: "getCumulativeLpTokenLockInfo",
        args: [BigInt(start), BigInt(end)],
      });
    },
    [tokenLock.address, tokenLock.abi]
  );

  const getCumulativeNormalTokenLockInfo = useCallback(
    (start = 0, end = 100) => {
      return useReadContract({
        address: tokenLock.address,
        abi: tokenLock.abi,
        functionName: "getCumulativeNormalTokenLockInfo",
        args: [BigInt(start), BigInt(end)],
      });
    },
    [tokenLock.address, tokenLock.abi]
  );

  // Utility function to format lock data
  const formatLockData = useCallback((lockData, decimals = 18) => {
    if (!lockData) return null;

    return {
      id: lockData.id?.toString(),
      token: lockData.token,
      owner: lockData.owner,
      amount: formatUnits(lockData.amount || 0n, decimals),
      lockDate: new Date(Number(lockData.lockDate || 0n) * 1000),
      tgeDate: new Date(Number(lockData.tgeDate || 0n) * 1000),
      tgeBps: lockData.tgeBps?.toString(),
      cycle: lockData.cycle?.toString(),
      cycleBps: lockData.cycleBps?.toString(),
      unlockedAmount: formatUnits(lockData.unlockedAmount || 0n, decimals),
      description: lockData.description,
      isVesting: Number(lockData.tgeBps || 0n) > 0,
    };
  }, []);

  return {
    // Write functions
    lock,
    vestingLock,
    multipleVestingLock,
    unlock,
    editLock,
    editLockDescription,
    transferLockOwnership,
    renounceLockOwnership,

    // Read functions
    getLockById,
    getWithdrawableTokens,
    getUserLpLocks,
    getUserNormalLocks,
    getLocksForToken,
    getCumulativeLpTokenLockInfo,
    getCumulativeNormalTokenLockInfo,

    // Utility functions
    formatLockData,

    // State data
    totalLockCount,
    userLpLockCount,
    userNormalLockCount,
    userTotalLockCount,

    // Transaction states
    isTransactionPending: isPending,
    isTransactionConfirming: isConfirming,
    isTransactionConfirmed: isConfirmed,
    transactionHash: hash,
    transactionError: error,

    // Operation-specific states
    operationStates,
  };
};
