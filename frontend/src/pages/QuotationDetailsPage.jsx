import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { 
  fetchQuotationById, 
  cancelQuotationOnChain, 
  QuotationStatusColors 
} from '../services/contractService';
import { 
  getStoredDocument, 
  logTransaction, 
  downloadQuotationJson 
} from '../services/storageService';
import DocumentVerificationBadge from '../components/DocumentVerificationBadge';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Clock, 
  Calendar, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Ban, 
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function QuotationDetailsPage({ quoteId, setActivePage, setViewingQuoteId }) {
  const { account, signer, provider, isCorrectNetwork, networkConfig } = useWeb3();

  const [quotation, setQuotation] = useState(null);
  const [offChainDoc, setOffChainDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadQuotation = useCallback(async () => {
    if (!quoteId) return;
    setIsLoading(true);
    setError(null);

    try {
      const q = await fetchQuotationById(provider, quoteId);
      setQuotation(q);
      const stored = getStoredDocument(quoteId);
      setOffChainDoc(stored);
    } catch (err) {
      console.error('Failed to load quotation:', err);
      setError(err.reason || err.message || 'Error loading quotation from BOT Chain');
    } finally {
      setIsLoading(false);
    }
  }, [quoteId, provider]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  const isCreator = Boolean(
    account && 
    quotation && 
    account.toLowerCase() === quotation.creator.toLowerCase()
  );

  const isClient = Boolean(
    account && 
    quotation && 
    account.toLowerCase() === quotation.client.toLowerCase()
  );

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?review=${quoteId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCancel = async () => {
    if (!signer || !isCreator || quotation?.status !== 0) return;
    if (!window.confirm('Are you sure you want to cancel this quotation? This cannot be undone.')) return;

    setIsCancelling(true);
    setError(null);

    try {
      const res = await cancelQuotationOnChain(signer, quotation.id);

      logTransaction({
        txHash: res.txHash,
        action: 'QuotationCancelled',
        quotationId: quotation.id,
        from: account,
        network: `${networkConfig.chainName} (${networkConfig.chainId})`,
      });

      await loadQuotation();
    } catch (err) {
      console.error('Cancellation failed:', err);
      let msg = err.reason || err.message || 'Cancel transaction failed';
      if (msg.includes('user rejected')) msg = 'Transaction rejected in wallet.';
      setError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const statusStyle = quotation ? QuotationStatusColors[quotation.statusName] : QuotationStatusColors.Pending;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">Loading Quotation #{quoteId}...</h3>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Quotation Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => setActivePage('dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      
      {/* Back button & top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Review page link */}
          <button
            onClick={() => {
              setViewingQuoteId(quotation.id);
              setActivePage('review');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 transition-all"
          >
            <span>Open Client Review View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Copy Share Link */}
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {/* Download JSON */}
          {offChainDoc && (
            <button
              onClick={() => downloadQuotationJson(quotation.id, offChainDoc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Download signed JSON document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Details Box */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                #{quotation.id.toString().padStart(4, '0')}
              </span>
              <span className="text-xs text-slate-400 font-mono">Created {quotation.createdAtDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {offChainDoc?.title || `Quotation #${quotation.id}`}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
              {quotation.statusName}
            </div>

            {isCreator && quotation.status === 0 && !quotation.isExpired && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition-all disabled:opacity-50"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                <span>Cancel Quotation</span>
              </button>
            )}
          </div>
        </div>

        {/* Pricing & Key Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Quotation Value</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-mono">{quotation.amountFormatted}</span>
              <span className="text-xs font-mono font-bold text-teal-400">{quotation.currency}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Delivery Period</span>
            <div className="mt-1 flex items-center gap-2 text-white font-bold text-lg">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>{offChainDoc?.deliveryPeriod || 'Standard'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Expiry Date</span>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <div>
                <span className={`font-bold text-sm ${quotation.isExpired ? 'text-orange-400' : 'text-white'}`}>
                  {new Date(quotation.expiryTimestamp * 1000).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {quotation.isExpired ? 'Expired' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scope and description */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scope & Description</h3>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {offChainDoc?.description || 'Off-chain document payload not stored on this device. Cryptographic verification remains active below.'}
          </div>
        </div>

        {/* Cryptographic Document Proof */}
        <DocumentVerificationBadge
          document={offChainDoc}
          onChainHash={quotation.documentHash}
        />

        {/* Parties Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Freelancer Address (Creator):</span>
            <div className="text-teal-300 font-bold break-all select-all">{quotation.creator}</div>
            {isCreator && <span className="inline-block mt-1 text-[10px] text-teal-400 font-sans font-semibold">(Your Connected Wallet)</span>}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Client Address (Recipient):</span>
            <div className="text-slate-200 font-bold break-all select-all">{quotation.client}</div>
            {isClient && <span className="inline-block mt-1 text-[10px] text-teal-400 font-sans font-semibold">(Your Connected Wallet)</span>}
          </div>
        </div>

        {/* Status reason if rejected */}
        {quotation.status === 2 && quotation.rejectReason && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs">
            <span className="font-bold text-rose-300 uppercase tracking-wider block mb-1">Rejection Reason:</span>
            <p className="text-slate-300 italic">"{quotation.rejectReason}"</p>
          </div>
        )}

        {/* Blockchain Audit Footnote */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <span>Target Network: BOT Chain Testnet (968)</span>
          <a
            href="https://scan.bohr.life"
            target="_blank"
            rel="noreferrer"
            className="hover:text-teal-400 transition-colors flex items-center gap-1"
          >
            <span>Bohr Block Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>

    </div>
  );
}

