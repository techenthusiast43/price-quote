import { ethers } from 'ethers';

const QUOTES_STORAGE_KEY = 'pricequote_documents_v1';
const TX_HISTORY_KEY = 'pricequote_tx_history_v1';

/**
 * Standard canonical JSON representation of a quotation document
 */
export function createCanonicalDocument({
  title,
  description,
  deliveryPeriod,
  creator,
  client,
  amount,
  currency,
  expiryTimestamp,
  terms,
  items,
}) {
  return {
    version: '1.0.0',
    app: 'PriceQuote',
    network: 'BOT Chain',
    title: (title || '').trim(),
    description: (description || '').trim(),
    deliveryPeriod: (deliveryPeriod || '').trim(),
    creator: (creator || '').toLowerCase(),
    client: (client || '').toLowerCase(),
    amount: amount.toString(),
    currency: (currency || 'USD').toUpperCase(),
    expiryTimestamp: Number(expiryTimestamp),
    terms: terms || 'Standard freelance service agreement. Subject to acceptance on BOT Chain.',
    items: items || [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Computes deterministic Keccak-256 hash of a quotation document.
 * Matches on-chain bytes32 format.
 */
export function computeDocumentHash(document) {
  // Sort keys for strict deterministic hashing
  const canonicalString = JSON.stringify(document, Object.keys(document).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalString));
}

/**
 * Verifies if an off-chain document matches an on-chain document hash
 */
export function verifyDocumentIntegrity(document, onChainHash) {
  if (!document || !onChainHash) {
    return { verified: false, reason: 'Missing document or on-chain hash' };
  }
  try {
    const computed = computeDocumentHash(document);
    const matches = computed.toLowerCase() === onChainHash.toLowerCase();
    return {
      verified: matches,
      computedHash: computed,
      onChainHash: onChainHash,
      reason: matches ? 'Cryptographic hash matches on-chain record perfectly' : 'Hash mismatch: Document content has been modified',
    };
  } catch (err) {
    return { verified: false, reason: err.message };
  }
}

/**
 * Stores off-chain quotation document locally
 */
export function saveOffChainDocument(quotationId, document, txHash = '') {
  try {
    const existing = getAllStoredDocuments();
    const idKey = quotationId.toString();
    const docHash = computeDocumentHash(document);

    existing[idKey] = {
      ...document,
      quotationId: idKey,
      documentHash: docHash,
      txHash,
      savedAt: Date.now(),
    };

    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(existing));
    return existing[idKey];
  } catch (e) {
    console.error('Failed to save off-chain document to storage', e);
    return null;
  }
}

/**
 * Retrieves a stored off-chain quotation document by quotation ID
 */
export function getStoredDocument(quotationId) {
  const all = getAllStoredDocuments();
  return all[quotationId.toString()] || null;
}

/**
 * Returns all stored off-chain documents
 */
export function getAllStoredDocuments() {
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read stored documents', e);
    return {};
  }
}

/**
 * Audit / Transaction history log management
 */
export function logTransaction({
  txHash,
  action,
  quotationId,
  from,
  to,
  amount,
  currency,
  status = 'Confirmed',
  network = 'BOT Chain Testnet (968)',
}) {
  try {
    const history = getTransactionHistory();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      txHash,
      action,
      quotationId: quotationId?.toString(),
      from,
      to,
      amount,
      currency,
      status,
      network,
      timestamp: Date.now(),
    };
    history.unshift(entry);
    // Keep last 100 transactions
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
    return entry;
  } catch (e) {
    console.error('Failed to log transaction', e);
  }
}

export function getTransactionHistory() {
  try {
    const raw = localStorage.getItem(TX_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Triggers browser download of a quotation JSON file
 */
export function downloadQuotationJson(quotationId, document) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(document, null, 2));
  const downloadAnchor = document.createElement ? document.createElement('a') : null;
  if (!downloadAnchor) return;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `PriceQuote_${quotationId}_doc.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

