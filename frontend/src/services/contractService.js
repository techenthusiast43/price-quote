import { ethers } from 'ethers';
import contractConfig from '../contracts/contractConfig.json';

export const QuotationStatus = {
  0: 'Pending',
  1: 'Accepted',
  2: 'Rejected',
  3: 'Cancelled',
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
  Cancelled: 3,
};

export const QuotationStatusColors = {
  Pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  Accepted: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  Rejected: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  Cancelled: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
  },
  Expired: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
};

/**
 * Gets a read-only fallback provider for BOT Chain Testnet
 */
export function getFallbackProvider() {
  const rpcUrl = contractConfig.networks[968]?.rpcUrl || 'https://rpc.bohr.life';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Creates contract instance with provider or signer
 */
export function getContractInstance(providerOrSigner) {
  const address = contractConfig.contractAddress;
  if (!address || address === ethers.ZeroAddress) {
    throw new Error('PriceQuote contract address is not configured');
  }
  return new ethers.Contract(address, contractConfig.abi, providerOrSigner);
}

/**
 * Parse raw quotation tuple from smart contract
 */
export function parseQuotation(raw) {
  if (!raw || !raw.id) return null;

  const id = Number(raw.id);
  const expiryTimestamp = Number(raw.expiryTimestamp);
  const now = Math.floor(Date.now() / 1000);
  const rawStatus = Number(raw.status);
  let statusName = QuotationStatus[rawStatus] || 'Unknown';

  // Computed status check for expiration
  const isExpired = rawStatus === QuotationStatus.Pending && now > expiryTimestamp;
  if (isExpired) {
    statusName = 'Expired';
  }

  return {
    id,
    creator: raw.creator,
    client: raw.client,
    amount: raw.amount.toString(),
    amountFormatted: formatCurrencyAmount(raw.amount, raw.currency),
    currency: raw.currency,
    expiryTimestamp,
    expiryDate: new Date(expiryTimestamp * 1000).toLocaleString(),
    isExpired,
    documentHash: raw.documentHash,
    docUri: raw.docUri,
    status: rawStatus,
    statusName,
    createdAt: Number(raw.createdAt),
    createdAtDate: new Date(Number(raw.createdAt) * 1000).toLocaleString(),
    updatedAt: Number(raw.updatedAt),
    updatedAtDate: new Date(Number(raw.updatedAt) * 1000).toLocaleString(),
    rejectReason: raw.rejectReason || '',
  };
}

/**
 * Formats amount from smallest units according to currency
 */
export function formatCurrencyAmount(amountRaw, currency) {
  const amountStr = amountRaw ? amountRaw.toString() : '0';
  const curr = (currency || 'USD').toUpperCase();

  // If USD/EUR/GBP, assume 2 decimals (stored as cents)
  if (['USD', 'EUR', 'GBP'].includes(curr)) {
    const num = Number(amountStr) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(num);
  }

  // If BOT or standard 18 decimal crypto
  if (['BOT', 'TBOT', 'ETH'].includes(curr)) {
    try {
      const formatted = ethers.formatUnits(amountStr, 18);
      return `${formatted} ${curr}`;
    } catch {
      return `${amountStr} ${curr}`;
    }
  }

  // Default raw formatting
  return `${amountStr} ${curr}`;
}

/**
 * Converts user price input into smallest unit for contract storage
 */
export function convertToSmallestUnit(priceInput, currency) {
  const curr = (currency || 'USD').toUpperCase();
  const clean = parseFloat(priceInput);
  if (isNaN(clean) || clean <= 0) {
    throw new Error('Please enter a valid price greater than 0');
  }

  if (['USD', 'EUR', 'GBP'].includes(curr)) {
    // Round to 2 decimal places and multiply by 100 for cents
    return Math.round(clean * 100).toString();
  }

  if (['BOT', 'TBOT', 'ETH'].includes(curr)) {
    return ethers.parseUnits(clean.toString(), 18).toString();
  }

  // Default integer
  return Math.round(clean).toString();
}

/**
 * Contract interaction calls
 */
export async function createQuotationOnChain(signer, {
  clientAddress,
  amountInSmallestUnit,
  currency,
  expiryTimestamp,
  documentHash,
  docUri = '',
}) {
  const contract = getContractInstance(signer);
  const tx = await contract.createQuotation(
    clientAddress,
    amountInSmallestUnit,
    currency,
    expiryTimestamp,
    documentHash,
    docUri
  );
  const receipt = await tx.wait();

  // Parse QuotationCreated event from receipt
  let createdId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === 'QuotationCreated') {
        createdId = Number(parsed.args.quotationId);
        break;
      }
    } catch {
      // not an event from this contract
    }
  }

  return {
    txHash: receipt.hash,
    quotationId: createdId,
    blockNumber: receipt.blockNumber,
  };
}

export async function acceptQuotationOnChain(signer, quotationId) {
  const contract = getContractInstance(signer);
  const tx = await contract.acceptQuotation(quotationId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export async function rejectQuotationOnChain(signer, quotationId, reason = '') {
  const contract = getContractInstance(signer);
  const tx = await contract.rejectQuotation(quotationId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export async function cancelQuotationOnChain(signer, quotationId) {
  const contract = getContractInstance(signer);
  const tx = await contract.cancelQuotation(quotationId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export async function fetchQuotationById(providerOrSigner, quotationId) {
  const contract = getContractInstance(providerOrSigner);
  const raw = await contract.getQuotation(quotationId);
  return parseQuotation(raw);
}

export async function fetchQuotationsBatch(providerOrSigner, ids) {
  if (!ids || ids.length === 0) return [];
  const contract = getContractInstance(providerOrSigner);
  const rawList = await contract.getQuotationsBatch(ids);
  return rawList.map(parseQuotation).filter(Boolean);
}

export async function fetchSentQuotations(providerOrSigner, creatorAddress) {
  const contract = getContractInstance(providerOrSigner);
  const ids = await contract.getQuotationsByCreator(creatorAddress);
  const idNumbers = ids.map(Number);
  if (idNumbers.length === 0) return [];
  return fetchQuotationsBatch(providerOrSigner, idNumbers);
}

export async function fetchReceivedQuotations(providerOrSigner, clientAddress) {
  const contract = getContractInstance(providerOrSigner);
  const ids = await contract.getQuotationsByClient(clientAddress);
  const idNumbers = ids.map(Number);
  if (idNumbers.length === 0) return [];
  return fetchQuotationsBatch(providerOrSigner, idNumbers);
}

export async function fetchWalletQuotations(providerOrSigner, walletAddress) {
  const contract = getContractInstance(providerOrSigner);
  const ids = await contract.getQuotationsForWallet(walletAddress);
  const idNumbers = [...new Set(ids.map(Number))]; // unique IDs
  if (idNumbers.length === 0) return [];
  return fetchQuotationsBatch(providerOrSigner, idNumbers);
}

export async function fetchTotalQuotations(providerOrSigner) {
  const contract = getContractInstance(providerOrSigner);
  const total = await contract.getTotalQuotations();
  return Number(total);
}

