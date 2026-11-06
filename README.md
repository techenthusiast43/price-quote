# PriceQuote &mdash; Decentralized Quotation Management on BOT Chain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network: BOT Chain Testnet](https://img.shields.io/badge/Network-BOT_Chain_Testnet_(968)-00F5D4)](https://scan.bohr.life)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0.svg)](https://docs.ethers.org/v6/)

**PriceQuote** is a lightweight, tamper-proof Web3 dApp engineered on **BOT Chain** for freelancers, agencies, and small businesses. It enables service providers to create verifiable price proposals and allows clients to review, accept, or reject quotations directly using their connected Web3 wallets. All milestone status transitions and document integrity proofs are permanently anchored to the BOT Chain blockchain.

---

## 🌟 Key Architecture & Principles

- **Zero Token & Escrow Overhead**: No intermediate token transfers, locked liquidity, fees, or NFT wrappers. PriceQuote focuses strictly on legally evidential state commitments.
- **Cryptographic Document Integrity**: Comprehensive service scopes, milestones, and deliverable descriptions remain off-chain for privacy and speed, while a deterministic **Keccak-256** document hash is anchored on-chain. Any tampering with off-chain quotes immediately breaks hash verification.
- **Wallet-Enforced Access Control**: Only the designated client wallet can accept or reject a quotation. Only the creator wallet can cancel an unanswered quotation.
- **Time-Bound Validity**: Smart contract prevents expired quotations from being accepted.
- **Auditability**: Emits dedicated events (`QuotationCreated`, `QuotationAccepted`, `QuotationRejected`, `QuotationCancelled`) and maintains indexed wallet associations for high-speed queries.

---

## 🌐 BOT Chain Network Parameters

| Parameter | BOT Chain Testnet (Bohr) | BOT Chain Mainnet |
| :--- | :--- | :--- |
| **Network Name** | BOT Chain Testnet (Bohr) | BOT Chain Mainnet |
| **Chain ID** | `968` (`0x3c8`) | `677` (`0x2a5`) |
| **Public RPC URL** | `https://rpc.bohr.life` | `https://rpc.botchain.ai` |
| **Native Token Symbol** | `BOT` (or `tBOT`) | `BOT` |
| **Token Decimals** | 18 | 18 |
| **Total Supply** | 150 Million | 150 Million |
| **Block Explorer** | [https://scan.bohr.life/](https://scan.bohr.life/) | [https://scan.botchain.ai/](https://scan.botchain.ai/) |
| **Faucet** | [https://faucet.botchain.ai/basic](https://faucet.botchain.ai/basic) | &mdash; |

---

## 📜 Smart Contract Overview (`contracts/PriceQuote.sol`)

The `PriceQuote` smart contract enforces strict state machine rules and gas-optimized indexed lookups:

### Quotation Data Structure
```solidity
enum QuotationStatus { Pending, Accepted, Rejected, Cancelled }

struct Quotation {
    uint256 id;
    address creator;
    address client;
    uint256 amount;          // Stored in smallest currency unit (e.g. cents or wei)
    string currency;         // "USD", "EUR", "tBOT", "USDT", etc.
    uint256 expiryTimestamp; // Unix timestamp in seconds
    bytes32 documentHash;    // Keccak-256 cryptographic digest of document
    string docUri;           // Optional off-chain URI
    QuotationStatus status;  // Pending (0), Accepted (1), Rejected (2), Cancelled (3)
    uint256 createdAt;
    uint256 updatedAt;
    string rejectReason;     // Optional reason provided upon client rejection
}
```

### Key Contract Functions
1. `createQuotation(address client, uint256 amount, string currency, uint256 expiryTimestamp, bytes32 documentHash, string docUri)`: Generates unique sequential ID and records quote.
2. `acceptQuotation(uint256 quotationId)`: Accessible **only** by assigned client wallet; ensures status is Pending and quotation is unexpired.
3. `rejectQuotation(uint256 quotationId, string reason)`: Accessible **only** by assigned client wallet; records rejection reason.
4. `cancelQuotation(uint256 quotationId)`: Accessible **only** by creator wallet for unanswered Pending quotations.
5. `getQuotation(uint256 quotationId)`: Returns complete Quotation struct.
6. `getQuotationsByCreator(address creator)`: Returns all quote IDs created by wallet.
7. `getQuotationsByClient(address client)`: Returns all quote IDs received by client wallet.
8. `getQuotationsBatch(uint256[] ids)`: High-performance single-RPC-call fetcher for frontend views.

---

## 💻 Frontend Pages & Features

The React frontend provides 9 dedicated pages with modern glassmorphism styling and responsive design:

1. **Landing Page**: Value proposition, 4-step workflow, live BOT Chain testnet status, and Quick Start buttons.
2. **Wallet Connection**: Auto-detects MetaMask/Web3 providers, displays BOT balance, and provides a 1-click **"Switch to BOT Chain Testnet"** tool with automated `wallet_addEthereumChain`.
3. **Freelancer Dashboard**: High-level metrics (Total Sent, Pending, Accepted, Rejected, Cancelled), quick actions, and recent activity.
4. **Create Quotation Page**: Comprehensive creation form with real-time EVM address validation, currency selection, price converter to smallest units, expiry picker, and **live cryptographic Keccak-256 document hash preview**.
5. **Quotation Details Page**: Detailed quote overview, on-chain verification indicator, timeline of state transitions, copyable review link, and JSON export.
6. **Client Quotation Review Page**: Purpose-built review view opened when client receives a quote link (`?review=:id`):
   - Enforces that only the assigned client wallet can interact.
   - Shows live countdown to expiry.
   - Verified document integrity badge.
   - Interactive **Accept** and **Reject** (with optional reason modal) buttons.
7. **My Received Quotations**: Filterable list (Pending, Accepted, Rejected, Expired) of quotes addressed to the connected wallet.
8. **My Sent Quotations**: Filterable list with copyable client links and cancellation actions for unanswered quotes.
9. **Transaction History**: Audit log of all quotation events with direct links to Bohr Explorer (`https://scan.bohr.life/tx/...`).

---

## 🚀 Quick Start & Deployment Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 1. Smart Contract Compilation & Testing

```bash
# Install root dependencies
npm install

# Compile Solidity contracts
npx hardhat compile

# Run full unit test suite (18 automated tests)
npx hardhat test
```

### 2. Deploy Contract to BOT Chain Testnet

1. Configure your deployer private key in `.env`:
```env
PRIVATE_KEY="0xYOUR_BOT_CHAIN_TESTNET_PRIVATE_KEY"
```

2. Run the deployment script:
```bash
npx hardhat run scripts/deploy.js --network botchain_testnet
```

The script will automatically compile the contract, deploy to BOT Chain Testnet, and synchronize the contract address and ABI into `deployed-contract.json` and `frontend/src/contracts/contractConfig.json`.

### 3. Launch the Frontend

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🦊 Adding BOT Chain Testnet to MetaMask

You can click the **"Switch to BOT Chain Testnet"** button in the app header, or manually enter the following parameters in MetaMask:

- **Network Name**: `BOT Chain Testnet`
- **New RPC URL**: `https://rpc.bohr.life`
- **Chain ID**: `968`
- **Currency Symbol**: `BOT`
- **Block Explorer URL**: `https://scan.bohr.life`

To request free testnet BOT tokens for gas, visit [faucet.botchain.ai](https://faucet.botchain.ai).

---

## 🔒 Security & Best Practices

- **Checks-Effects-Interactions**: Enforced throughout state machine transitions.
- **Role Verification**: Hard revert on `msg.sender != client` or `msg.sender != creator`.
- **Zero Token Risk**: The contract does not accept, hold, or transfer funds, completely eliminating smart contract reentrancy drain risks and token approval vulnerabilities.
- **Deterministic Hashing**: Document canonicalization ensures consistent hash outputs across platforms.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

