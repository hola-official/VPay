import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useState, useCallback } from "react";
import { multiTokenVesting } from "../lib/multiTokenVesting";

// Enums matching the contract
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

export const useMultiTokenVesting = () => {
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

  // Read contract data
  const { data: totalScheduleCount } = useReadContract({
    address: multiTokenVesting.address,
    abi: multiTokenVesting.abi,
    functionName: "getTotalScheduleCount",
  });

  const { data: vestingFeePercentage } = useReadContract({
    address: multiTokenVesting.address,
    abi: multiTokenVesting.abi,
    functionName: "vestingFeePercentage",
  });

  const { data: allVestedTokens } = useReadContract({
    address: multiTokenVesting.address,
    abi: multiTokenVesting.abi,
    functionName: "getAllVestedTokens",
  });

  // Create single vesting schedule
  const createVestingSchedule = useCallback(
    async ({
      token,
      recipient,
      amount,
      startTime,
      endTime,
      unlockSchedule,
      autoClaim = false,
      contractTitle = "",
      recipientEmail = "",
      cancelPermission = CancelPermission.BOTH,
      changeRecipientPermission = ChangeRecipientPermission.BOTH,
      decimals = 18,
    }) => {
      try {
        updateOperationState("createVestingSchedule", {
          loading: true,
          error: null,
        });

        const amountWei = parseUnits(amount.toString(), decimals);
        const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "createVestingSchedule",
          args: [
            token,
            recipient,
            amountWei,
            BigInt(startTimestamp),
            BigInt(endTimestamp),
            unlockSchedule,
            autoClaim,
            contractTitle,
            recipientEmail,
            cancelPermission,
            changeRecipientPermission,
          ],
        });

        updateOperationState("createVestingSchedule", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("createVestingSchedule", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Create multiple vesting schedules
  const createMultipleVestingSchedules = useCallback(
    async ({
      token,
      recipients,
      amounts,
      startTime,
      endTime,
      unlockSchedule,
      autoClaim = false,
      contractTitles,
      recipientEmails,
      cancelPermission = CancelPermission.BOTH,
      changeRecipientPermission = ChangeRecipientPermission.BOTH,
      decimals = 18,
    }) => {
      try {
        updateOperationState("createMultipleVestingSchedules", {
          loading: true,
          error: null,
        });

        const amountsWei = amounts.map((amount) =>
          parseUnits(amount.toString(), decimals)
        );
        const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "createMultipleVestingSchedules",
          args: [
            token,
            recipients,
            amountsWei,
            BigInt(startTimestamp),
            BigInt(endTimestamp),
            unlockSchedule,
            autoClaim,
            contractTitles,
            recipientEmails,
            cancelPermission,
            changeRecipientPermission,
          ],
        });

        updateOperationState("createMultipleVestingSchedules", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("createMultipleVestingSchedules", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Release tokens from a specific schedule
  const release = useCallback(
    async (scheduleId) => {
      try {
        updateOperationState("release", { loading: true, error: null });

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "release",
          args: [BigInt(scheduleId)],
        });

        updateOperationState("release", { loading: false, error: null });
        return { success: true };
      } catch (err) {
        updateOperationState("release", { loading: false, error: err.message });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Release all available tokens for a recipient
  const releaseAll = useCallback(
    async (recipient) => {
      try {
        updateOperationState("releaseAll", { loading: true, error: null });

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "releaseAll",
          args: [recipient || address],
        });

        updateOperationState("releaseAll", { loading: false, error: null });
        return { success: true };
      } catch (err) {
        updateOperationState("releaseAll", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Cancel vesting schedule
  const cancelVestingSchedule = useCallback(
    async (scheduleId) => {
      try {
        updateOperationState("cancelVestingSchedule", {
          loading: true,
          error: null,
        });

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "cancelVestingSchedule",
          args: [BigInt(scheduleId)],
        });

        updateOperationState("cancelVestingSchedule", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("cancelVestingSchedule", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Change recipient of a vesting schedule
  const changeRecipient = useCallback(
    async (scheduleId, newRecipient) => {
      try {
        updateOperationState("changeRecipient", { loading: true, error: null });

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "changeRecipient",
          args: [BigInt(scheduleId), newRecipient],
        });

        updateOperationState("changeRecipient", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("changeRecipient", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Process auto claims
  const processAutoClaims = useCallback(async () => {
    try {
      updateOperationState("processAutoClaims", { loading: true, error: null });

      await writeContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "processAutoClaims",
        args: [],
      });

      updateOperationState("processAutoClaims", {
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      updateOperationState("processAutoClaims", {
        loading: false,
        error: err.message,
      });
      throw err;
    }
  }, [writeContract, multiTokenVesting.address, multiTokenVesting.abi]);

  // Read functions using useCallback to create stable references
  const getScheduleById = useCallback(
    (scheduleId) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "getScheduleById",
        args: [BigInt(scheduleId)],
        enabled: !!scheduleId,
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi]
  );

  const getReleasableAmount = useCallback(
    (scheduleId) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "getReleasableAmount",
        args: [BigInt(scheduleId)],
        enabled: !!scheduleId,
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi]
  );

  const getVestedAmount = useCallback(
    (scheduleId) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "getVestedAmount",
        args: [BigInt(scheduleId)],
        enabled: !!scheduleId,
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi]
  );

  const getRecipientSchedules = useCallback(
    (recipient) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "getRecipientSchedules",
        args: [recipient || address],
        enabled: !!(recipient || address),
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi, address]
  );

  const getSenderSchedules = useCallback(
    (sender) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "getSenderSchedules",
        args: [sender || address],
        enabled: !!(sender || address),
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi, address]
  );

  const getTokenSchedules = useCallback(
    (token) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "getTokenSchedules",
        args: [token],
        enabled: !!token,
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi]
  );

  const getTokenVestingInfo = useCallback(
    (token) => {
      return useReadContract({
        address: multiTokenVesting.address,
        abi: multiTokenVesting.abi,
        functionName: "tokenVestingInfo",
        args: [token],
        enabled: !!token,
      });
    },
    [multiTokenVesting.address, multiTokenVesting.abi]
  );

  // Utility functions
  const getUnlockInterval = useCallback((unlockSchedule) => {
    const intervals = {
      [UnlockSchedule.SECOND]: 1,
      [UnlockSchedule.MINUTE]: 60,
      [UnlockSchedule.HOUR]: 3600,
      [UnlockSchedule.DAILY]: 86400,
      [UnlockSchedule.WEEKLY]: 604800,
      [UnlockSchedule.BIWEEKLY]: 1209600,
      [UnlockSchedule.MONTHLY]: 2629746,
      [UnlockSchedule.QUARTERLY]: 7889238,
      [UnlockSchedule.YEARLY]: 31556952,
    };
    return intervals[unlockSchedule] || 86400;
  }, []);

  const getUnlockScheduleName = useCallback((unlockSchedule) => {
    const names = {
      [UnlockSchedule.SECOND]: "Second",
      [UnlockSchedule.MINUTE]: "Minute",
      [UnlockSchedule.HOUR]: "Hour",
      [UnlockSchedule.DAILY]: "Daily",
      [UnlockSchedule.WEEKLY]: "Weekly",
      [UnlockSchedule.BIWEEKLY]: "Bi-weekly",
      [UnlockSchedule.MONTHLY]: "Monthly",
      [UnlockSchedule.QUARTERLY]: "Quarterly",
      [UnlockSchedule.YEARLY]: "Yearly",
    };
    return names[unlockSchedule] || "Daily";
  }, []);

  const getCancelPermissionName = useCallback((permission) => {
    const names = {
      [CancelPermission.NONE]: "None",
      [CancelPermission.SENDER_ONLY]: "Sender Only",
      [CancelPermission.RECIPIENT_ONLY]: "Recipient Only",
      [CancelPermission.BOTH]: "Both",
    };
    return names[permission] || "None";
  }, []);

  const getChangeRecipientPermissionName = useCallback((permission) => {
    const names = {
      [ChangeRecipientPermission.NONE]: "None",
      [ChangeRecipientPermission.SENDER_ONLY]: "Sender Only",
      [ChangeRecipientPermission.RECIPIENT_ONLY]: "Recipient Only",
      [ChangeRecipientPermission.BOTH]: "Both",
    };
    return names[permission] || "None";
  }, []);

  // Format vesting schedule data
  const formatScheduleData = useCallback(
    (scheduleData, decimals = 18) => {
      if (!scheduleData) return null;

      return {
        id: scheduleData.id?.toString(),
        token: scheduleData.token,
        sender: scheduleData.sender,
        recipient: scheduleData.recipient,
        totalAmount: formatUnits(scheduleData.totalAmount || 0n, decimals),
        releasedAmount: formatUnits(
          scheduleData.releasedAmount || 0n,
          decimals
        ),
        startTime: new Date(Number(scheduleData.startTime || 0n) * 1000),
        endTime: new Date(Number(scheduleData.endTime || 0n) * 1000),
        unlockSchedule: Number(scheduleData.unlockSchedule || 0),
        unlockScheduleName: getUnlockScheduleName(
          Number(scheduleData.unlockSchedule || 0)
        ),
        autoClaim: scheduleData.autoClaim || false,
        cancelled: scheduleData.cancelled || false,
        contractTitle: scheduleData.contractTitle || "",
        recipientEmail: scheduleData.recipientEmail || "",
        cancelPermission: Number(scheduleData.cancelPermission || 0),
        cancelPermissionName: getCancelPermissionName(
          Number(scheduleData.cancelPermission || 0)
        ),
        changeRecipientPermission: Number(
          scheduleData.changeRecipientPermission || 0
        ),
        changeRecipientPermissionName: getChangeRecipientPermissionName(
          Number(scheduleData.changeRecipientPermission || 0)
        ),
        createdAt: new Date(Number(scheduleData.createdAt || 0n) * 1000),
      };
    },
    [
      getUnlockScheduleName,
      getCancelPermissionName,
      getChangeRecipientPermissionName,
    ]
  );

  // Format token vesting info
  const formatTokenVestingInfo = useCallback((tokenInfo, decimals = 18) => {
    if (!tokenInfo) return null;

    return {
      token: tokenInfo.token,
      totalVestedAmount: formatUnits(
        tokenInfo.totalVestedAmount || 0n,
        decimals
      ),
      totalReleasedAmount: formatUnits(
        tokenInfo.totalReleasedAmount || 0n,
        decimals
      ),
      activeSchedulesCount: Number(tokenInfo.activeSchedulesCount || 0),
    };
  }, []);

  // Calculate vesting progress
  const calculateVestingProgress = useCallback((scheduleData) => {
    if (!scheduleData) return 0;

    const now = Date.now();
    const start = Number(scheduleData.startTime || 0n) * 1000;
    const end = Number(scheduleData.endTime || 0n) * 1000;

    if (now < start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  }, []);

  // Owner functions
  const setVestingFeePercentage = useCallback(
    async (feePercentage) => {
      try {
        updateOperationState("setVestingFeePercentage", {
          loading: true,
          error: null,
        });

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "setVestingFeePercentage",
          args: [BigInt(feePercentage)],
        });

        updateOperationState("setVestingFeePercentage", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("setVestingFeePercentage", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  const setFeeRecipient = useCallback(
    async (feeRecipient) => {
      try {
        updateOperationState("setFeeRecipient", { loading: true, error: null });

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "setFeeRecipient",
          args: [feeRecipient],
        });

        updateOperationState("setFeeRecipient", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("setFeeRecipient", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  const emergencyWithdraw = useCallback(
    async (token, amount, decimals = 18) => {
      try {
        updateOperationState("emergencyWithdraw", {
          loading: true,
          error: null,
        });

        const amountWei = parseUnits(amount.toString(), decimals);

        await writeContract({
          address: multiTokenVesting.address,
          abi: multiTokenVesting.abi,
          functionName: "emergencyWithdraw",
          args: [token, amountWei],
        });

        updateOperationState("emergencyWithdraw", {
          loading: false,
          error: null,
        });
        return { success: true };
      } catch (err) {
        updateOperationState("emergencyWithdraw", {
          loading: false,
          error: err.message,
        });
        throw err;
      }
    },
    [writeContract, multiTokenVesting.address, multiTokenVesting.abi]
  );

  return {
    // Write functions
    createVestingSchedule,
    createMultipleVestingSchedules,
    release,
    releaseAll,
    cancelVestingSchedule,
    changeRecipient,
    processAutoClaims,

    // Owner functions
    setVestingFeePercentage,
    setFeeRecipient,
    emergencyWithdraw,

    // Read functions
    getScheduleById,
    getReleasableAmount,
    getVestedAmount,
    getRecipientSchedules,
    getSenderSchedules,
    getTokenSchedules,
    getTokenVestingInfo,

    // Utility functions
    getUnlockInterval,
    getUnlockScheduleName,
    getCancelPermissionName,
    getChangeRecipientPermissionName,
    formatScheduleData,
    formatTokenVestingInfo,
    calculateVestingProgress,

    // State data
    totalScheduleCount,
    vestingFeePercentage,
    allVestedTokens,

    // Transaction states
    isTransactionPending: isPending,
    isTransactionConfirming: isConfirming,
    isTransactionConfirmed: isConfirmed,
    transactionHash: hash,
    transactionError: error,

    // Operation-specific states
    operationStates,

    // Constants
    UnlockSchedule,
    CancelPermission,
    ChangeRecipientPermission,
  };
};
