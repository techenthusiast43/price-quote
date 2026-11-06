import React, { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { 
  createQuotationOnChain, 
  convertToSmallestUnit 
} from '../services/contractService';
import { 
  createCanonicalDocument, 
  computeDocumentHash, 
  saveOffChainDocument, 
  logTransaction 
} from '../services/storageService';
import { 
  FileText, 
  Send, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function CreateQuotationPage({ setActivePage, setViewingQuoteId }) {
  const { account, signer, isCorrectNetwork, switchToBotChain, networkConfig } = useWeb3();

  // Form Fields
  const [clientAddress, setClientAddress] = useState('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [deliveryPeriod, setDeliveryPeriod] = useState('14 Days');
  const [expiryDate, setExpiryDate] = useState(() => {
    // Default 7 days in future
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [terms, setTerms] = useState('Standard payment terms upon completion. Subject to BOT Chain quotation state.');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Compute canonical document and hash on the fly
  const canonicalDoc = useMemo(() => {
    return createCanonicalDocument({
      title: serviceTitle,
      description: serviceDescription,
      deliveryPeriod,
      creator: account || ethers.ZeroAddress,
      client: clientAddress,
      amount: price || '0',
      currency,
      expiryTimestamp: expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : 0,
      terms,
    });
  }, [serviceTitle, serviceDescription, deliveryPeriod, account, clientAddress, price, currency, expiryDate, terms]);

  const documentHash = useMemo(() => {
    try {
      return computeDocumentHash(canonicalDoc);
    } catch {
      return ethers.ZeroHash;
    }
  }, [canonicalDoc]);

  // Form validation
  const validateForm = () => {
    if (!account) {
      throw new Error('Please connect your Web3 wallet first.');
    }
    if (!isCorrectNetwork) {
      throw new Error('Please switch to BOT Chain Testnet before submitting.');
    }
    if (!ethers.isAddress(clientAddress)) {
      throw new Error('Please enter a valid Ethereum/EVM client address.');
    }
    if (clientAddress.toLowerCase() === account.toLowerCase()) {
      throw new Error('Client address cannot be your own wallet address.');
    }
    if (!serviceTitle.trim()) {
      throw new Error('Please enter a service title.');
    }
    if (!serviceDescription.trim()) {
      throw new Error('Please enter a service description.');
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      throw new Error('Please enter a valid price greater than 0.');
    }
    if (!expiryDate) {
      throw new Error('Please select an expiry date.');
    }
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (expiryTimestamp <= now) {
      throw new Error('Expiry date must be in the future.');
    }
    return { expiryTimestamp, numPrice };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { expiryTimestamp } = validateForm();
      const amountInSmallest = convertToSmallestUnit(price, currency);

      // Submit to BOT Chain
      const result = await createQuotationOnChain(signer, {
        clientAddress: ethers.getAddress(clientAddress),
        amountInSmallestUnit: amountInSmallest,
        currency,
        expiryTimestamp,
        documentHash,
        docUri: '',
      });

      // Save off-chain document locally
      saveOffChainDocument(result.quotationId, canonicalDoc, result.txHash);

      // Log transaction
      logTransaction({
        txHash: result.txHash,
        action: 'QuotationCreated',
        quotationId: result.quotationId,
        from: account,
        to: clientAddress,
        amount: price,
        currency,
        network: `${networkConfig.chainName} (${networkConfig.chainId})`,
      });

      setCreatedResult({
        quotationId: result.quotationId,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        documentHash,
      });
    } catch (err) {
      console.error('Quotation creation error:', err);
      // Clean up common error messages
      let msg = err.reason || err.message || 'Transaction failed';
      if (msg.includes('user rejected')) {
        msg = 'Transaction rejected in wallet.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareableLink = () => {
    if (!createdResult) return;
    const link = `${window.location.origin}${window.location.pathname}?review=${createdResult.quotationId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 text-teal-400 text-xs font-mono font-semibold tracking-wider uppercase mb-1">
          <Sparkles className="w-4 h-4" />
          <span>New Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Create Price Quotation</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate an immutable quotation agreement anchored on BOT Chain with cryptographic document proof.
        </p>
      </div>

      {/* Creation Success Modal / Card */}
      {createdResult && (
        <div className="mb-8 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Quotation #{createdResult.quotationId} Recorded on BOT Chain!</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Confirmed
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Your quotation has been minted to block #{createdResult.blockNumber || 'latest'}. The client can now review and accept or reject using their wallet.
              </p>

              {/* Shareable Link Box */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs font-mono text-teal-300 truncate">
                  {`${window.location.origin}${window.location.pathname}?review=${createdResult.quotationId}`}
                </div>
                <button
                  onClick={copyShareableLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors flex-shrink-0"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Client Link'}</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={`https://scan.bohr.life/tx/${createdResult.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono underline"
                >
                  <span>View on Bohr Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => {
                    setViewingQuoteId(createdResult.quotationId);
                    setActivePage('details');
                  }}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 ml-auto"
                >
                  View Quotation Details &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white text-base font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          
          {/* Client Address */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-400" /> Client Wallet Address *
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Assigned Client only</span>
            </label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value.trim())}
              placeholder="0x71C... (Recipient's EVM wallet address)"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white font-mono placeholder:text-slate-600 transition-all outline-none"
            />
          </div>

          {/* Service Title */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-teal-400" /> Service Title *
            </label>
            <input
              type="text"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="e.g. Smart Contract Architecture & Security Audit"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder:text-slate-600 transition-all outline-none"
            />
          </div>

          {/* Service Description */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <span>Service Description & Deliverables *</span>
              <span className="text-[11px] text-slate-500 font-normal">Stored off-chain & verified via hash</span>
            </label>
            <textarea
              rows={4}
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Detailed breakdown of the scope of work, technical deliverables, milestones, and responsibilities..."
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder:text-slate-600 transition-all outline-none resize-y"
            />
          </div>

          {/* Price, Currency, and Delivery Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Price */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <DollarSign className="w-4 h-4 text-teal-400" /> Price *
              </label>
              <input
                type="number"
                step="any"
                min="0.0001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500.00"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white font-mono placeholder:text-slate-600 transition-all outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                Currency Selection *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white font-mono transition-all outline-none cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BOT">BOT (Native)</option>
                <option value="tBOT">tBOT (Testnet)</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>

            {/* Delivery Period */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-teal-400" /> Delivery Period *
              </label>
              <input
                type="text"
                value={deliveryPeriod}
                onChange={(e) => setDeliveryPeriod(e.target.value)}
                placeholder="e.g. 14 Days / 3 Weeks"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder:text-slate-600 transition-all outline-none"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-400" /> Quotation Expiry Date & Time *
              </span>
              <span className="text-[11px] text-slate-500">Quotation cannot be accepted after this</span>
            </label>
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white font-mono transition-all outline-none"
            />
          </div>

          {/* Live Cryptographic Fingerprint Preview */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-200">Real-Time Cryptographic Keccak-256 Hash</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Anchored to BOT Chain
              </span>
            </div>
            <div className="text-xs font-mono text-teal-300/80 break-all select-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              {documentHash}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Any character changed in the title, description, or price will generate a completely different hash, guaranteeing tamper-proof verification for both parties.
            </p>
          </div>

        </div>

        {/* Action Button */}
        <div>
          {!account ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between">
              <span>Please connect your wallet in the navigation bar to create quotations.</span>
            </div>
          ) : !isCorrectNetwork ? (
            <button
              type="button"
              onClick={switchToBotChain}
              className="w-full py-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <span>Switch to BOT Chain Testnet (Chain ID 968)</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-extrabold text-base text-slate-950 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 hover:from-teal-300 hover:to-cyan-300 active:scale-[0.99] transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting to BOT Chain...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Create Quotation on BOT Chain</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

