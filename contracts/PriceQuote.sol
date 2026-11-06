// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PriceQuote
 * @dev Decentralized quotation management contract deployed on BOT Chain.
 * Allows freelancers and clients to record, accept, reject, and cancel price quotations
 * with cryptographic document integrity verification and state immutability.
 */
contract PriceQuote {
    enum QuotationStatus {
        Pending,
        Accepted,
        Rejected,
        Cancelled
    }

    struct Quotation {
        uint256 id;
        address creator;
        address client;
        uint256 amount;          // Stored in smallest currency unit (e.g., cents or wei)
        string currency;         // Currency code: e.g., "USD", "EUR", "tBOT", "USDT"
        uint256 expiryTimestamp; // Expiry Unix timestamp in seconds
        bytes32 documentHash;    // Cryptographic hash (SHA-256 or Keccak-256) of off-chain document
        string docUri;           // Optional off-chain storage pointer / IPFS URI
        QuotationStatus status;  // Current status
        uint256 createdAt;       // Creation timestamp
        uint256 updatedAt;       // Last state transition timestamp
        string rejectReason;     // Optional reason provided upon rejection
    }

    // State Variables
    uint256 private _quotationIdCounter;
    mapping(uint256 => Quotation) private _quotations;

    // Wallet association index mappings
    mapping(address => uint256[]) private _creatorQuotations;
    mapping(address => uint256[]) private _clientQuotations;

    // Events
    event QuotationCreated(
        uint256 indexed quotationId,
        address indexed creator,
        address indexed client,
        uint256 amount,
        string currency,
        uint256 expiryTimestamp,
        bytes32 documentHash,
        string docUri,
        uint256 createdAt
    );

    event QuotationAccepted(
        uint256 indexed quotationId,
        address indexed client,
        uint256 timestamp
    );

    event QuotationRejected(
        uint256 indexed quotationId,
        address indexed client,
        string reason,
        uint256 timestamp
    );

    event QuotationCancelled(
        uint256 indexed quotationId,
        address indexed creator,
        uint256 timestamp
    );

    // Modifiers
    modifier quotationExists(uint256 _quotationId) {
        require(_quotationId > 0 && _quotationId <= _quotationIdCounter, "PriceQuote: Quotation does not exist");
        _;
    }

    /**
     * @notice Creates a new price quotation
     * @param _client The wallet address of the assigned client
     * @param _amount The price in smallest currency unit
     * @param _currency The currency ticker/code (e.g. "USD", "tBOT")
     * @param _expiryTimestamp Expiry timestamp in seconds
     * @param _documentHash SHA-256 or Keccak-256 hash of the complete off-chain quotation document
     * @param _docUri Optional URI/storage locator for the off-chain document
     * @return quotationId The generated unique quotation identifier
     */
    function createQuotation(
        address _client,
        uint256 _amount,
        string calldata _currency,
        uint256 _expiryTimestamp,
        bytes32 _documentHash,
        string calldata _docUri
    ) external returns (uint256) {
        require(_client != address(0), "PriceQuote: Invalid client address");
        require(_client != msg.sender, "PriceQuote: Creator cannot be client");
        require(_amount > 0, "PriceQuote: Amount must be greater than zero");
        require(bytes(_currency).length > 0 && bytes(_currency).length <= 12, "PriceQuote: Invalid currency code");
        require(_expiryTimestamp > block.timestamp, "PriceQuote: Expiry must be in the future");
        require(_documentHash != bytes32(0), "PriceQuote: Document hash required");

        _quotationIdCounter++;
        uint256 newId = _quotationIdCounter;

        Quotation storage q = _quotations[newId];
        q.id = newId;
        q.creator = msg.sender;
        q.client = _client;
        q.amount = _amount;
        q.currency = _currency;
        q.expiryTimestamp = _expiryTimestamp;
        q.documentHash = _documentHash;
        q.docUri = _docUri;
        q.status = QuotationStatus.Pending;
        q.createdAt = block.timestamp;
        q.updatedAt = block.timestamp;

        _creatorQuotations[msg.sender].push(newId);
        _clientQuotations[_client].push(newId);

        emit QuotationCreated(
            newId,
            msg.sender,
            _client,
            _amount,
            _currency,
            _expiryTimestamp,
            _documentHash,
            _docUri,
            block.timestamp
        );

        return newId;
    }

    /**
     * @notice Allows the assigned client to accept a pending quotation
     * @param _quotationId The ID of the quotation to accept
     */
    function acceptQuotation(uint256 _quotationId) external quotationExists(_quotationId) {
        Quotation storage q = _quotations[_quotationId];

        require(msg.sender == q.client, "PriceQuote: Only assigned client can accept");
        require(q.status == QuotationStatus.Pending, "PriceQuote: Quotation is not pending");
        require(block.timestamp <= q.expiryTimestamp, "PriceQuote: Quotation has expired");

        q.status = QuotationStatus.Accepted;
        q.updatedAt = block.timestamp;

        emit QuotationAccepted(_quotationId, msg.sender, block.timestamp);
    }

    /**
     * @notice Allows the assigned client to reject a pending quotation
     * @param _quotationId The ID of the quotation to reject
     * @param _reason Optional reason text for rejection
     */
    function rejectQuotation(uint256 _quotationId, string calldata _reason) external quotationExists(_quotationId) {
        Quotation storage q = _quotations[_quotationId];

        require(msg.sender == q.client, "PriceQuote: Only assigned client can reject");
        require(q.status == QuotationStatus.Pending, "PriceQuote: Quotation is not pending");

        q.status = QuotationStatus.Rejected;
        q.rejectReason = _reason;
        q.updatedAt = block.timestamp;

        emit QuotationRejected(_quotationId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Allows the creator to cancel an unanswered (pending) quotation
     * @param _quotationId The ID of the quotation to cancel
     */
    function cancelQuotation(uint256 _quotationId) external quotationExists(_quotationId) {
        Quotation storage q = _quotations[_quotationId];

        require(msg.sender == q.creator, "PriceQuote: Only creator can cancel");
        require(q.status == QuotationStatus.Pending, "PriceQuote: Quotation is not pending");

        q.status = QuotationStatus.Cancelled;
        q.updatedAt = block.timestamp;

        emit QuotationCancelled(_quotationId, msg.sender, block.timestamp);
    }

    /**
     * @notice Returns total number of quotations created
     */
    function getTotalQuotations() external view returns (uint256) {
        return _quotationIdCounter;
    }

    /**
     * @notice Retrieves full quotation details by ID
     * @param _quotationId The quotation identifier
     */
    function getQuotation(uint256 _quotationId) external view quotationExists(_quotationId) returns (Quotation memory) {
        return _quotations[_quotationId];
    }

    /**
     * @notice Returns whether a quotation is expired based on current block timestamp
     */
    function isExpired(uint256 _quotationId) external view quotationExists(_quotationId) returns (bool) {
        return block.timestamp > _quotations[_quotationId].expiryTimestamp;
    }

    /**
     * @notice Retrieves all quotation IDs created by a given address
     * @param _creator The creator's wallet address
     */
    function getQuotationsByCreator(address _creator) external view returns (uint256[] memory) {
        return _creatorQuotations[_creator];
    }

    /**
     * @notice Retrieves all quotation IDs assigned to a given client address
     * @param _client The client's wallet address
     */
    function getQuotationsByClient(address _client) external view returns (uint256[] memory) {
        return _clientQuotations[_client];
    }

    /**
     * @notice Retrieves all quotation IDs associated with a wallet (as creator or client)
     * @param _wallet The wallet address
     */
    function getQuotationsForWallet(address _wallet) external view returns (uint256[] memory) {
        uint256[] storage created = _creatorQuotations[_wallet];
        uint256[] storage received = _clientQuotations[_wallet];

        uint256 total = created.length + received.length;
        uint256[] memory combined = new uint256[](total);

        uint256 idx = 0;
        for (uint256 i = 0; i < created.length; i++) {
            combined[idx++] = created[i];
        }
        for (uint256 j = 0; j < received.length; j++) {
            combined[idx++] = received[j];
        }

        return combined;
    }

    /**
     * @notice Batch fetches quotation structs for given IDs
     * @param _ids Array of quotation IDs
     */
    function getQuotationsBatch(uint256[] calldata _ids) external view returns (Quotation[] memory) {
        Quotation[] memory batch = new Quotation[](_ids.length);
        for (uint256 i = 0; i < _ids.length; i++) {
            uint256 qId = _ids[i];
            if (qId > 0 && qId <= _quotationIdCounter) {
                batch[i] = _quotations[qId];
            }
        }
        return batch;
    }
}

