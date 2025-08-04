import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";

export function TransactionStatus({
  isTransactionPending,
  isTransactionConfirming,
  isTransactionConfirmed,
  transactionHash,
  transactionError,
}) {
  useEffect(() => {
    if (isTransactionConfirmed) {
      toast.success("Transaction confirmed successfully!");
    }
    if (transactionError) {
      toast.error(`Transaction failed: ${transactionError.message}`);
    }
  }, [isTransactionConfirmed, transactionError]);

  if (
    !isTransactionPending &&
    !isTransactionConfirming &&
    !isTransactionConfirmed &&
    !transactionError
  ) {
    return null;
  }

  return (
    <Card className="p-4 bg-slate-800/40 border-slate-700/30 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isTransactionPending && (
            <>
              <Clock className="w-5 h-5 text-yellow-400 animate-spin" />
              <div>
                <p className="text-white font-medium">Transaction Pending</p>
                <p className="text-slate-400 text-sm">
                  Waiting for wallet confirmation...
                </p>
              </div>
            </>
          )}
          {isTransactionConfirming && (
            <>
              <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
              <div>
                <p className="text-white font-medium">Transaction Confirming</p>
                <p className="text-slate-400 text-sm">
                  Waiting for blockchain confirmation...
                </p>
              </div>
            </>
          )}
          {isTransactionConfirmed && (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Transaction Confirmed</p>
                <p className="text-slate-400 text-sm">
                  Your transaction was successful!
                </p>
              </div>
            </>
          )}
          {transactionError && (
            <>
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white font-medium">Transaction Failed</p>
                <p className="text-slate-400 text-sm">
                  {transactionError.message}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isTransactionPending && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Pending
            </Badge>
          )}
          {isTransactionConfirming && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Confirming
            </Badge>
          )}
          {isTransactionConfirmed && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Confirmed
            </Badge>
          )}
          {transactionError && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Failed
            </Badge>
          )}

          {transactionHash && (
            <Button
              size="sm"
              variant="ghost"
              className="text-blue-400 hover:text-blue-300"
              onClick={() =>
                window.open(
                  `https://test.xfiscan.com/tx/${transactionHash}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
