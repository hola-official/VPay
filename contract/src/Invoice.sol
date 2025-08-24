// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract InvoicePayment is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _receiptTokenIds;
    
    struct PaymentRecord {
        string invoiceId; // MongoDB ObjectId as string
        address payer;
        address payee;
        uint256 amount;
        address tokenAddress;
        uint256 timestamp;
        bool isRecurring;
    }
    
    mapping(uint256 => PaymentRecord) public paymentRecords;
    mapping(string => uint256[]) public invoicePayments; // MongoDB ID -> NFT token IDs
    mapping(address => bool) public supportedTokens;
    
    uint256 public platformFeePercent = 250; // 2.5% in basis points
    address public platformFeeRecipient;
    
    event PaymentMade(
        string indexed invoiceId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        address tokenAddress,
        uint256 receiptTokenId,
        bool isRecurring
    );
    
    constructor(
        address _platformFeeRecipient,
        address[] memory _supportedTokens
    ) ERC721("InvoiceReceipts", "RECEIPT") {
        platformFeeRecipient = _platformFeeRecipient;
        
        for(uint i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
        }
    }
    
    function makePayment(
        string memory _invoiceId,
        address _payee,
        uint256 _amount,
        address _tokenAddress,
        bool _isRecurring,
        string memory _receiptMetadata
    ) external nonReentrant returns (uint256) {
        require(_amount > 0, "Amount must be greater than 0");
        require(supportedTokens[_tokenAddress], "Token not supported");
        require(_payee != address(0), "Invalid payee address");
        
        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");
        
        // Calculate platform fee
        uint256 platformFee = (_amount * platformFeePercent) / 10000;
        uint256 payeeAmount = _amount - platformFee;
        
        // Transfer tokens
        require(token.transferFrom(msg.sender, _payee, payeeAmount), "Transfer to payee failed");
        if (platformFee > 0) {
            require(token.transferFrom(msg.sender, platformFeeRecipient, platformFee), "Platform fee transfer failed");
        }
        
        // Mint NFT receipt
        _receiptTokenIds.increment();
        uint256 receiptId = _receiptTokenIds.current();
        _safeMint(msg.sender, receiptId);
        
        // Store payment record
        paymentRecords[receiptId] = PaymentRecord({
            invoiceId: _invoiceId,
            payer: msg.sender,
            payee: _payee,
            amount: _amount,
            tokenAddress: _tokenAddress,
            timestamp: block.timestamp,
            isRecurring: _isRecurring
        });
        
        // Link payment to invoice
        invoicePayments[_invoiceId].push(receiptId);
        
        // Store receipt metadata
        _setTokenURI(receiptId, _receiptMetadata);
        
        emit PaymentMade(_invoiceId, msg.sender, _payee, _amount, _tokenAddress, receiptId, _isRecurring);
        
        return receiptId;
    }
    
    function getInvoicePaymentReceipts(string memory _invoiceId) external view returns (uint256[] memory) {
        return invoicePayments[_invoiceId];
    }
    
    function getPaymentRecord(uint256 _receiptId) external view returns (PaymentRecord memory) {
        require(_exists(_receiptId), "Receipt does not exist");
        return paymentRecords[_receiptId];
    }
    
    // Admin functions
    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }
    
    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }
    
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
    
    function updatePlatformFeeRecipient(address _newRecipient) external onlyOwner {
        platformFeeRecipient = _newRecipient;
    }
    
    // Override to use stored metadata
    mapping(uint256 => string) private _tokenURIs;
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
}