export const VESTING_MANAGER_ADDRESS = "0x90b87B7302484122327F8e96D46385cBdFfd0D8e";

export const VESTING_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelVestingSchedule",
    inputs: [
      {
        name: "_scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "changeRecipient",
    inputs: [
      {
        name: "_scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_newRecipient",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createMultipleVestingSchedules",
    inputs: [
      {
        name: "_token",
        type: "address",
        internalType: "address",
      },
      {
        name: "_recipients",
        type: "address[]",
        internalType: "address[]",
      },
      {
        name: "_amounts",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "_startTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_endTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_unlockSchedule",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.UnlockSchedule",
      },
      {
        name: "_autoClaim",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "_contractTitles",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "_recipientEmails",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "_cancelPermission",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.CancelPermission",
      },
      {
        name: "_changeRecipientPermission",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.ChangeRecipientPermission",
      },
    ],
    outputs: [
      {
        name: "scheduleIds",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createVestingSchedule",
    inputs: [
      {
        name: "_token",
        type: "address",
        internalType: "address",
      },
      {
        name: "_recipient",
        type: "address",
        internalType: "address",
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_startTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_endTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_unlockSchedule",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.UnlockSchedule",
      },
      {
        name: "_autoClaim",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "_contractTitle",
        type: "string",
        internalType: "string",
      },
      {
        name: "_recipientEmail",
        type: "string",
        internalType: "string",
      },
      {
        name: "_cancelPermission",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.CancelPermission",
      },
      {
        name: "_changeRecipientPermission",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.ChangeRecipientPermission",
      },
    ],
    outputs: [
      {
        name: "scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    inputs: [
      {
        name: "_token",
        type: "address",
        internalType: "address",
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllVestedTokens",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecipientSchedules",
    inputs: [
      {
        name: "_recipient",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReleasableAmount",
    inputs: [
      {
        name: "_scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getScheduleById",
    inputs: [
      {
        name: "_scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct MultiTokenVestingManager.VestingSchedule",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "token",
            type: "address",
            internalType: "address",
          },
          {
            name: "sender",
            type: "address",
            internalType: "address",
          },
          {
            name: "recipient",
            type: "address",
            internalType: "address",
          },
          {
            name: "totalAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "releasedAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "startTime",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "endTime",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "unlockSchedule",
            type: "uint8",
            internalType: "enum MultiTokenVestingManager.UnlockSchedule",
          },
          {
            name: "autoClaim",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "cancelled",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "contractTitle",
            type: "string",
            internalType: "string",
          },
          {
            name: "recipientEmail",
            type: "string",
            internalType: "string",
          },
          {
            name: "cancelPermission",
            type: "uint8",
            internalType: "enum MultiTokenVestingManager.CancelPermission",
          },
          {
            name: "changeRecipientPermission",
            type: "uint8",
            internalType:
              "enum MultiTokenVestingManager.ChangeRecipientPermission",
          },
          {
            name: "createdAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSenderSchedules",
    inputs: [
      {
        name: "_sender",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTokenSchedules",
    inputs: [
      {
        name: "_token",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalScheduleCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUnlockInterval",
    inputs: [
      {
        name: "_schedule",
        type: "uint8",
        internalType: "enum MultiTokenVestingManager.UnlockSchedule",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getVestedAmount",
    inputs: [
      {
        name: "_scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "processAutoClaims",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "release",
    inputs: [
      {
        name: "_scheduleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releaseAll",
    inputs: [
      {
        name: "_recipient",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setFeeRecipient",
    inputs: [
      {
        name: "_feeRecipient",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setVestingFeePercentage",
    inputs: [
      {
        name: "_feePercentage",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "tokenVestingInfo",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "totalVestedAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalReleasedAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "activeSchedulesCount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vestingFeePercentage",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RecipientChanged",
    inputs: [
      {
        name: "scheduleId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "oldRecipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newRecipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TokensReleased",
    inputs: [
      {
        name: "scheduleId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VestingFeeUpdated",
    inputs: [
      {
        name: "newFeePercentage",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VestingScheduleCancelled",
    inputs: [
      {
        name: "scheduleId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VestingScheduleCreated",
    inputs: [
      {
        name: "scheduleId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "recipient",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "startTime",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "endTime",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
];
