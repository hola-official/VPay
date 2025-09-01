// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Gas-optimized library for payment operations
library PaymentLib {
    struct PaymentReceipt {
        uint128 receiptId; // Reduced from uint256 to uint128 (still supports huge numbers)
        address payer;
        address creator;
        address token;
        uint128 amount; // Reduced from uint256 to uint128 (sufficient for token amounts)
        string invoiceId;
        string metadataURI;
        uint64 timestamp; // Reduced from uint256 to uint64 (sufficient until year 2514)
        bytes32 transactionHash;
    }

    // Events defined in library to reduce contract size
    event PaymentMade(
        uint128 indexed receiptId,
        string indexed invoiceId,
        address indexed payer,
        address creator,
        address token,
        uint128 amount,
        string metadataURI
    );

    event BatchPaymentMade(
        string indexed invoiceId, address indexed payer, address creator, uint128 totalAmount, uint128[] receiptIds
    );

    // Pack multiple values into single storage slot to save gas
    function generateTxHash(
        address payer,
        address creator,
        address token,
        uint128 amount,
        string memory invoiceId,
        uint256 nonce
    ) internal view returns (bytes32) {
        return
            keccak256(abi.encodePacked(block.timestamp, payer, creator, token, amount, invoiceId, nonce, block.number));
    }

    function validatePayment(
        address creator,
        address payer,
        address token,
        uint128 amount,
        string memory invoiceId,
        string memory metadataURI
    ) internal pure {
        require(creator != address(0), "Invalid creator");
        require(creator != payer, "Cannot pay yourself");
        require(
            token == 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B || token == 0xc2132D05D31c914a87C6611C10748AEb04B58e8F,
            "Unsupported token"
        );
        require(amount > 0, "Amount must be > 0");
        require(bytes(invoiceId).length > 0, "Invoice ID required");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
    }
}

// Optimized storage library
library StorageLib {
    // Use packed structs for better storage efficiency
    struct PackedReceiptData {
        uint128 receiptId;
        uint128 amount;
        uint64 timestamp;
        address payer;
        address creator;
        address token;
        bytes32 transactionHash;
    }

    // More efficient way to store arrays - using mapping with length counter
    struct ReceiptArray {
        uint128[] ids;
        uint128 length;
    }

    function pushToArray(ReceiptArray storage arr, uint128 id) internal {
        arr.ids.push(id);
        unchecked {
            arr.length++;
        }
    }

    function getArrayLength(ReceiptArray storage arr) internal view returns (uint128) {
        return arr.length;
    }
}

contract InvoicePayment is ERC721, Ownable, ReentrancyGuard {
    using PaymentLib for *;
    using StorageLib for *;

    // Constants for supported tokens
    address private constant USDC = 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B;
    address private constant USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;

    // Use smaller data types where possible
    uint128 private _receiptIds;

    // Optimized storage mappings
    mapping(uint128 => PaymentLib.PaymentReceipt) public paymentReceipts;
    mapping(string => StorageLib.ReceiptArray) private invoiceToReceipts;
    mapping(address => StorageLib.ReceiptArray) private creatorReceipts;
    mapping(address => StorageLib.ReceiptArray) private payerReceipts;
    mapping(bytes32 => bool) public processedTransactions;

    constructor() ERC721("Invoice Payment Receipt", "IPR") Ownable(msg.sender) {}

    /**
     * @dev Make a single payment for an invoice
     * @param _creator Address of the invoice creator
     * @param _token Token address (USDC or USDT)
     * @param _amount Amount to pay
     * @param _invoiceId Off-chain invoice ID
     * @param _metadataURI IPFS URI for invoice metadata and image
     * @return Receipt ID for the payment
     */

    function makePayment(
        address _creator,
        address _token,
        uint128 _amount,
        string calldata _invoiceId, // Use calldata instead of memory for external functions
        string calldata _metadataURI
    ) external nonReentrant returns (uint128) {
        PaymentLib.validatePayment(_creator, msg.sender, _token, _amount, _invoiceId, _metadataURI);

        bytes32 txHash = PaymentLib.generateTxHash(msg.sender, _creator, _token, _amount, _invoiceId, 0);

        require(!processedTransactions[txHash], "Transaction processed");
        processedTransactions[txHash] = true;

        // Transfer tokens
        IERC20(_token).transferFrom(msg.sender, _creator, _amount);

        // Increment receipt ID
        uint128 newReceiptId;
        unchecked {
            newReceiptId = ++_receiptIds;
        }

        // Store receipt data
        paymentReceipts[newReceiptId] = PaymentLib.PaymentReceipt({
            receiptId: newReceiptId,
            payer: msg.sender,
            creator: _creator,
            token: _token,
            amount: _amount,
            invoiceId: _invoiceId,
            metadataURI: _metadataURI,
            timestamp: uint64(block.timestamp),
            transactionHash: txHash
        });

        // Update storage arrays
        invoiceToReceipts[_invoiceId].pushToArray(newReceiptId);
        creatorReceipts[_creator].pushToArray(newReceiptId);
        payerReceipts[msg.sender].pushToArray(newReceiptId);

        // Mint NFT
        _safeMint(msg.sender, newReceiptId);

        emit PaymentLib.PaymentMade(newReceiptId, _invoiceId, msg.sender, _creator, _token, _amount, _metadataURI);

        return newReceiptId;
    }

    /**
     * @dev Make multiple payments in a single transaction (useful for partial payments)
     * @param _creator Address of the invoice creator
     * @param _token Token address (USDC or USDT)
     * @param _amounts Array of amounts to pay (in USDC or USDT)
     * @param _invoiceId Off-chain invoice ID
     * @param _metadataURIs Array of IPFS URIs for each payment
     * @return Array of receipt IDs for each payment
     */
    function makeBatchPayment(
        address _creator,
        address _token,
        uint128[] calldata _amounts,
        string calldata _invoiceId,
        string[] calldata _metadataURIs
    ) external nonReentrant returns (uint128[] memory) {
        require(_creator != address(0), "Invalid creator");
        require(_creator != msg.sender, "Cannot pay yourself");
        require(_token == USDC || _token == USDT, "Unsupported token");

        uint256 length = _amounts.length;
        require(length > 0 && length <= 10, "Invalid amounts length");
        require(length == _metadataURIs.length, "Arrays length mismatch");
        require(bytes(_invoiceId).length > 0, "Invoice ID required");

        uint128[] memory receiptIds = new uint128[](length);
        uint128 totalAmount = 0;

        // Process all payments
        for (uint256 i = 0; i < length;) {
            require(_amounts[i] > 0, "Amount must be > 0");
            require(bytes(_metadataURIs[i]).length > 0, "Metadata URI required");

            unchecked {
                totalAmount += _amounts[i];
            }

            bytes32 txHash = PaymentLib.generateTxHash(msg.sender, _creator, _token, _amounts[i], _invoiceId, i);

            require(!processedTransactions[txHash], "Transaction processed");
            processedTransactions[txHash] = true;

            uint128 newReceiptId;
            unchecked {
                newReceiptId = ++_receiptIds;
            }
            receiptIds[i] = newReceiptId;

            // Store receipt
            paymentReceipts[newReceiptId] = PaymentLib.PaymentReceipt({
                receiptId: newReceiptId,
                payer: msg.sender,
                creator: _creator,
                token: _token,
                amount: _amounts[i],
                invoiceId: _invoiceId,
                metadataURI: _metadataURIs[i],
                timestamp: uint64(block.timestamp),
                transactionHash: txHash
            });

            // Update arrays
            invoiceToReceipts[_invoiceId].pushToArray(newReceiptId);
            creatorReceipts[_creator].pushToArray(newReceiptId);
            payerReceipts[msg.sender].pushToArray(newReceiptId);

            // Mint NFT
            _safeMint(msg.sender, newReceiptId);

            emit PaymentLib.PaymentMade(
                newReceiptId, _invoiceId, msg.sender, _creator, _token, _amounts[i], _metadataURIs[i]
            );

            unchecked {
                ++i;
            }
        }

        // Single token transfer for gas efficiency
        IERC20(_token).transferFrom(msg.sender, _creator, totalAmount);

        emit PaymentLib.BatchPaymentMade(_invoiceId, msg.sender, _creator, totalAmount, receiptIds);

        return receiptIds;
    }

    // Optimized view functions
    function getInvoicePayments(string calldata _invoiceId)
        external
        view
        returns (PaymentLib.PaymentReceipt[] memory)
    {
        StorageLib.ReceiptArray storage receiptArray = invoiceToReceipts[_invoiceId];
        uint128 length = receiptArray.getArrayLength();

        PaymentLib.PaymentReceipt[] memory receipts = new PaymentLib.PaymentReceipt[](length);

        for (uint128 i = 0; i < length;) {
            receipts[i] = paymentReceipts[receiptArray.ids[i]];
            unchecked {
                ++i;
            }
        }

        return receipts;
    }

    function getInvoiceTotalPaid(string calldata _invoiceId)
        external
        view
        returns (uint128 totalUSDC, uint128 totalUSDT)
    {
        StorageLib.ReceiptArray storage receiptArray = invoiceToReceipts[_invoiceId];
        uint128 length = receiptArray.getArrayLength();

        for (uint128 i = 0; i < length;) {
            PaymentLib.PaymentReceipt storage receipt = paymentReceipts[receiptArray.ids[i]];
            if (receipt.token == USDC) {
                unchecked {
                    totalUSDC += receipt.amount;
                }
            } else if (receipt.token == USDT) {
                unchecked {
                    totalUSDT += receipt.amount;
                }
            }
            unchecked {
                ++i;
            }
        }
    }

    function getCreatorReceipts(address _creator) external view returns (PaymentLib.PaymentReceipt[] memory) {
        StorageLib.ReceiptArray storage receiptArray = creatorReceipts[_creator];
        uint128 length = receiptArray.getArrayLength();

        PaymentLib.PaymentReceipt[] memory receipts = new PaymentLib.PaymentReceipt[](length);

        for (uint128 i = 0; i < length;) {
            receipts[i] = paymentReceipts[receiptArray.ids[i]];
            unchecked {
                ++i;
            }
        }

        return receipts;
    }

    function getPayerReceipts(address _payer) external view returns (PaymentLib.PaymentReceipt[] memory) {
        StorageLib.ReceiptArray storage receiptArray = payerReceipts[_payer];
        uint128 length = receiptArray.getArrayLength();

        PaymentLib.PaymentReceipt[] memory receipts = new PaymentLib.PaymentReceipt[](length);

        for (uint128 i = 0; i < length;) {
            receipts[i] = paymentReceipts[receiptArray.ids[i]];
            unchecked {
                ++i;
            }
        }

        return receipts;
    }

    function getReceiptById(uint128 _tokenId) external view returns (PaymentLib.PaymentReceipt memory) {
        require(_exists(uint256(_tokenId)), "Receipt does not exist");
        return paymentReceipts[_tokenId];
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Receipt does not exist");
        return paymentReceipts[uint128(_tokenId)].metadataURI;
    }

    function getCurrentReceiptId() external view returns (uint128) {
        return _receiptIds;
    }

    // Gas-efficient helper function to check if token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId <= _receiptIds && tokenId > 0;
    }

    // Emergency function for owner to update contract state if needed
    function emergencyPause() external onlyOwner {
        // Can be used to pause contract operations if needed
        // Implementation depends on requirements
    }
}
