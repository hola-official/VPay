import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Share2,
  BarChart2,
  Calendar,
  Clock,
  Percent,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAccount } from "wagmi";

export default function TokenLockSuccessModal({
  isOpen,
  onClose,
  status = "success",
  txHash,
  tokenAddress,
  amount,
  lockUntil,
  tokenInfo,
  error,
  isVesting = false,
  vestingDetails = null,
}) {
  const account = useAccount();
  const chainExplorer = account?.chain?.blockExplorers?.default.url;
  const [isCopied, setIsCopied] = useState(false);
  const [copyType, setCopyType] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // 'details' or 'schedule'

  // Reset copied state after 2 seconds
  useEffect(() => {
    let timeout;
    if (isCopied) {
      timeout = setTimeout(() => {
        setIsCopied(false);
        setCopyType("");
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCopied]);

  const copyToClipboard = (text, type) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setCopyType(type);
    }
  };

  // Format the date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Share lock on social media
  const shareLock = (platform) => {
    let shareText;

    if (isVesting && vestingDetails) {
      shareText = `I just created a vesting lock for ${Number(
        amount
      ).toLocaleString()} ${tokenInfo?.symbol || "tokens"} with ${
        vestingDetails.tgeBps / 100
      }% initial release and ${
        vestingDetails.cycleBps / 100
      }% per cycle! On Zentra launchpad`;
    } else {
      shareText = `I just locked ${Number(amount).toLocaleString()} ${
        tokenInfo?.symbol || "tokens"
      } until ${formatDate(lockUntil)}! On Zentra launchpad`;
    }

    const shareUrl = window.location.origin + "/token-lock";

    let shareLink = "";

    switch (platform) {
      case "twitter":
        shareLink = `https://x.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "telegram":
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        break;
      default:
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
    }

    window.open(shareLink, "_blank");
    setShowShareOptions(false);
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-b from-[#1D2538]/90 to-[#1D2538] rounded-3xl max-w-md w-full overflow-hidden border border-[#475B74]/50 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex justify-between items-center border-b border-[#475B74]/50 p-4">
            <h2 className="text-[#97CBDC] font-medium text-lg">
              {status === "success"
                ? isVesting
                  ? "Vesting Lock Successful"
                  : "Token Lock Successful"
                : status === "error"
                ? "Token Lock Failed"
                : "Processing Token Lock"}
            </h2>
            <button
              onClick={onClose}
              className="cursor-pointer text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col items-center text-center">
            {/* Status Icon with Animation */}
            <div className="relative mb-4">
              <motion.div
                className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 blur-md"
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              />
              {status === "success" ? (
                <motion.div
                  className="bg-gradient-to-r from-[#004581] to-[#018ABD] p-4 rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  {isVesting ? (
                    <BarChart2 className="h-12 w-12 text-white" />
                  ) : (
                    <CheckCircle className="h-12 w-12 text-white" />
                  )}
                </motion.div>
              ) : status === "error" ? (
                <motion.div
                  className="bg-gradient-to-r from-red-600 to-red-400 p-4 rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <XCircle className="h-12 w-12 text-white" />
                </motion.div>
              ) : (
                <div className="p-4">
                  <motion.div
                    className="h-12 w-12 rounded-full border-4 border-[#97CBDC] border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Title with Gradient Text */}
            <motion.h3
              className="text-xl font-bold bg-gradient-to-r from-[#018ABD] to-[#97CBDC] bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {status === "success"
                ? isVesting
                  ? "Vesting Lock Created Successfully!"
                  : "Tokens Locked Successfully!"
                : status === "error"
                ? "Lock Failed"
                : "Processing Your Lock"}
            </motion.h3>

            {/* Description */}
            <motion.p
              className="text-[#97CBDC]/80 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {status === "success" && amount
                ? isVesting
                  ? `${Number(amount).toLocaleString()} ${
                      tokenInfo?.symbol || "tokens"
                    } have been locked with a vesting schedule.`
                  : `${Number(amount).toLocaleString()} ${
                      tokenInfo?.symbol || "tokens"
                    } have been locked until ${formatDate(lockUntil)}.`
                : status === "error"
                ? error ||
                  "There was an error processing your token lock transaction."
                : "Please wait while we process your token lock transaction."}
            </motion.p>

            {/* Tabs for Details and Schedule (only for vesting) */}
            {status === "success" && isVesting && (
              <div className="w-full mb-4 border-b border-[#475B74]/50">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-4 cursor-pointer py-2 text-sm font-medium ${
                      activeTab === "details"
                        ? "text-[#97CBDC] border-b-2 border-[#018ABD]"
                        : "text-[#97CBDC]/70"
                    } focus:outline-none`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("schedule")}
                    className={`px-4 cursor-pointer py-2 text-sm font-medium ${
                      activeTab === "schedule"
                        ? "text-[#97CBDC] border-b-2 border-[#018ABD]"
                        : "text-[#97CBDC]/70"
                    } focus:outline-none`}
                  >
                    Vesting Schedule
                  </button>
                </div>
              </div>
            )}

            {/* Token Info Card */}
            {status === "success" && tokenInfo && activeTab === "details" && (
              <motion.div
                className="w-full mb-6 p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#004581]/20 to-[#018ABD]/20 flex items-center justify-center text-[#97CBDC]">
                    {tokenInfo.symbol?.slice(0, 2) || "??"}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-[#97CBDC]">
                      {tokenInfo.name || "Unknown Token"}
                    </div>
                    <div className="text-xs text-[#97CBDC]/70">
                      {tokenInfo.symbol || "???"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-left text-[#97CBDC]/70">
                    Amount Locked:
                  </div>
                  <div className="text-right text-[#97CBDC]">
                    {Number(amount).toLocaleString()}
                  </div>

                  {isVesting ? (
                    <>
                      <div className="text-left text-[#97CBDC]/70">
                        TGE Date:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {formatDate(lockUntil)}
                      </div>
                      <div className="text-left text-[#97CBDC]/70">
                        Initial Release:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {vestingDetails?.tgeBps
                          ? (vestingDetails.tgeBps / 100).toFixed(2)
                          : 0}
                        %
                      </div>
                      <div className="text-left text-[#97CBDC]/70">
                        Release Cycle:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {vestingDetails?.cycle
                          ? vestingDetails.cycle >= 86400
                            ? `${(vestingDetails.cycle / 86400).toFixed(
                                0
                              )} days`
                            : `${(vestingDetails.cycle / 3600).toFixed(
                                0
                              )} hours`
                          : "N/A"}
                      </div>
                      <div className="text-left text-[#97CBDC]/70">
                        Release Per Cycle:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {vestingDetails?.cycleBps
                          ? (vestingDetails.cycleBps / 100).toFixed(2)
                          : 0}
                        %
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-left text-[#97CBDC]/70">
                        Lock Until:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {formatDate(lockUntil)}
                      </div>
                      <div className="text-left text-[#97CBDC]/70">
                        Time Remaining:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {lockUntil && !isNaN(new Date(lockUntil).getTime())
                          ? formatDistanceToNow(new Date(lockUntil), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Vesting Schedule Card */}
            {status === "success" &&
              isVesting &&
              activeTab === "schedule" &&
              vestingDetails && (
                <motion.div
                  className="w-full mb-6 p-4 bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-medium text-[#97CBDC] mb-3 flex items-center">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Vesting Schedule
                  </h3>

                  <div className="space-y-4">
                    {/* Visual representation of vesting schedule */}
                    <div>
                      <div className="h-4 bg-[#0a0a20] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-[#004581] to-[#018ABD]"
                          style={{ width: `${vestingDetails.tgeBps / 100}%` }}
                          title="Initial Release"
                        ></div>
                        <div
                          className="h-full bg-[#018ABD]/50"
                          style={{
                            width: `${100 - vestingDetails.tgeBps / 100}%`,
                          }}
                          title="Vesting Period"
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-[#97CBDC]/70">
                        <span>TGE</span>
                        <span>Vesting Period</span>
                        <span>Complete</span>
                      </div>
                    </div>

                    {/* Vesting details */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex items-center text-[#97CBDC]/70">
                        <Calendar className="w-3 h-3 mr-1" />
                        TGE Date:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {formatDate(lockUntil)}
                      </div>

                      <div className="flex items-center text-[#97CBDC]/70">
                        <Percent className="w-3 h-3 mr-1" />
                        Initial Release:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {(vestingDetails.tgeBps / 100).toFixed(2)}% (
                        {Number(
                          (amount * vestingDetails.tgeBps) / 10000
                        ).toLocaleString()}{" "}
                        {tokenInfo?.symbol})
                      </div>

                      <div className="flex items-center text-[#97CBDC]/70">
                        <Clock className="w-3 h-3 mr-1" />
                        Release Cycle:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {vestingDetails.cycle >= 86400
                          ? `${(vestingDetails.cycle / 86400).toFixed(0)} days`
                          : `${(vestingDetails.cycle / 3600).toFixed(0)} hours`}
                      </div>

                      <div className="flex items-center text-[#97CBDC]/70">
                        <Percent className="w-3 h-3 mr-1" />
                        Per Cycle:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {(vestingDetails.cycleBps / 100).toFixed(2)}% (
                        {Number(
                          (amount * vestingDetails.cycleBps) / 10000
                        ).toLocaleString()}{" "}
                        {tokenInfo?.symbol})
                      </div>

                      <div className="flex items-center text-[#97CBDC]/70">
                        <BarChart2 className="w-3 h-3 mr-1" />
                        Total Cycles:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {vestingDetails.totalCycles}
                      </div>

                      <div className="flex items-center text-[#97CBDC]/70">
                        <Calendar className="w-3 h-3 mr-1" />
                        Est. Duration:
                      </div>
                      <div className="text-right text-[#97CBDC]">
                        {Math.ceil(
                          (vestingDetails.totalCycles * vestingDetails.cycle) /
                            86400
                        )}{" "}
                        days
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="pt-2">
                      <div className="relative h-12">
                        {/* TGE marker */}
                        <div className="absolute left-0 top-0 flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-[#018ABD]"></div>
                          <div className="h-8 border-l border-dashed border-[#475B74]/50"></div>
                          <div className="text-[10px] text-[#97CBDC]/70">
                            TGE
                          </div>
                        </div>

                        {/* Middle marker */}
                        <div className="absolute left-1/2 top-0 flex flex-col items-center transform -translate-x-1/2">
                          <div className="w-2 h-2 rounded-full bg-[#018ABD]/70"></div>
                          <div className="h-8 border-l border-dashed border-[#475B74]/50"></div>
                          <div className="text-[10px] text-[#97CBDC]/70">
                            {Math.ceil(vestingDetails.totalCycles / 2)} cycles
                          </div>
                        </div>

                        {/* End marker */}
                        <div className="absolute right-0 top-0 flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-[#018ABD]/50"></div>
                          <div className="h-8 border-l border-dashed border-[#475B74]/50"></div>
                          <div className="text-[10px] text-[#97CBDC]/70">
                            {vestingDetails.totalCycles} cycles
                          </div>
                        </div>

                        {/* Connecting line */}
                        <div className="absolute top-1 left-0 right-0 h-[1px] bg-[#475B74]/50"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Transaction Hash */}
            {txHash && (
              <motion.div
                className="w-full mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-left text-xs text-[#97CBDC] mb-1">
                  Transaction Hash:
                </div>
                <div className="bg-[#0a0a20]/80 border border-[#475B74]/50 rounded-xl p-3 flex items-center justify-between">
                  <p className="text-[#97CBDC] text-sm font-mono truncate">
                    {txHash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(txHash, "txHash")}
                    className="cursor-pointer ml-2 text-[#97CBDC] hover:text-white transition-colors"
                    aria-label="Copy transaction hash"
                  >
                    {isCopied && copyType === "txHash" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {status === "success" && (
                <div className="relative sm:col-span-2 mb-2">
                  <motion.button
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className="w-full cursor-pointer flex items-center justify-center bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] hover:text-white rounded-xl px-4 py-3 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Lock
                  </motion.button>

                  <AnimatePresence>
                    {showShareOptions && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#0a0a20] border border-[#475B74]/50 rounded-xl shadow-lg z-10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => shareLock("twitter")}
                            className="flex items-center justify-center cursor-pointer bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg px-3 py-2 transition-colors text-sm"
                          >
                            Twitter
                          </button>
                          <button
                            onClick={() => shareLock("telegram")}
                            className="flex items-center justify-center cursor-pointer bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] rounded-lg px-3 py-2 transition-colors text-sm"
                          >
                            Telegram
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {txHash && (
                <a
                  href={`${chainExplorer}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center cursor-pointer bg-gradient-to-r from-[#004581] to-[#018ABD] hover:from-[#003b6e] hover:to-[#0179a3] text-white rounded-xl px-4 py-3 transition-all duration-300 font-medium shadow-lg shadow-[#004581]/20"
                >
                  View Transaction
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              )}

              <button
                onClick={onClose}
                className="flex items-center justify-center cursor-pointer bg-[#0a0a20]/80 border border-[#475B74]/50 hover:bg-[#0a0a20] text-[#97CBDC] hover:text-white rounded-xl px-4 py-3 transition-colors font-medium"
              >
                {status === "success"
                  ? "View My Locks"
                  : status === "error"
                  ? "Try Again"
                  : "Continue"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
