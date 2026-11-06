import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { 
  fetchQuotationById, 
  acceptQuotationOnChain, 
  rejectQuotationOnChain,
  QuotationStatusColors 
} from '../services/contractService';
import { 
  getStoredDocument, 
  verifyDocumentIntegrity, 
  logTransaction,
  downloadQuotationJson 
} from '../services/storageService';
import DocumentVerificationBadge from '../components/DocumentVerificationBadge';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  ExternalLink,
  Loader2,
  Lock,
  Wallet
} from 'lucide-react';

export default function ClientReviewPage({ quoteId, setActivePage, setViewingQuoteId }) {
  const { account, signer, provider, isCorrectNetwork, connectWallet, switchToBotChain, networkConfig } = useWeb3();

  const [quotation, setQuotation] = useState(null);
  const [offChainDoc, setOffChainDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
      console.error('Failed to load quotation for review:', err);
      setError(err.reason || err.message || 'Could not load quotation details from blockchain');
    } finally {
      setIsLoading(false);
    }
  }, [quoteId, provider]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  // Client validation
  const isClientConnected = Boolean(
    account && 
    quotation && 
    account.toLowerCase() === quotation.client.toLowerCase()
  );

  const isWrongWallet = Boolean(
    account && 
    quotation && 
    account.toLowerCase() !== quotation.client.toLowerCase()
  );

  const canRespond = Boolean(
    isClientConnected && 
    isCorrectNetwork && 
    quotation?.status === 0 && 
    !quotation?.isExpired
  );

  // Handle Accept
  const handleAccept = async () => {
    if (!canRespond) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await acceptQuotationOnChain(signer, quotation.id);

      logTransaction({
        txHash: res.txHash,
        action: 'QuotationAccepted',
        quotationId: quotation.id,
        from: account,
        to: quotation.creator,
        amount: quotation.amount,
        currency: quotation.currency,
        network: `${networkConfig.chainName} (${networkConfig.chainId})`,
      });

      setActionSuccess({
        type: 'accepted',
        txHash: res.txHash,
        message: 'Quotation accepted successfully on BOT Chain!',
      });

      await loadQuotation();
    } catch (err) {
      console.error('Acceptance failed:', err);
      let msg = err.reason || err.message || 'Transaction failed';
      if (msg.includes('user rejected')) msg = 'Transaction rejected in wallet.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!canRespond) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await rejectQuotationOnChain(signer, quotation.id, rejectReason);

      logTransaction({
        txHash: res.txHash,
        action: 'QuotationRejected',
        quotationId: quotation.id,
        from: account,
        to: quotation.creator,
        amount: quotation.amount,
        currency: quotation.currency,
        network: `${networkConfig.chainName} (${networkConfig.chainId})`,
      });

      setShowRejectModal(false);
      setActionSuccess({
        type: 'rejected',
        txHash: res.txHash,
        message: 'Quotation rejected on BOT Chain.',
      });

      await loadQuotation();
    } catch (err) {
      console.error('Rejection failed:', err);
      let msg = err.reason || err.message || 'Transaction failed';
      if (msg.includes('user rejected')) msg = 'Transaction rejected in wallet.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusStyle = quotation ? QuotationStatusColors[quotation.statusName] : QuotationStatusColors.Pending;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">Loading Quotation #{quoteId} from BOT Chain...</h3>
        <p className="text-xs text-slate-400 mt-1">Verifying blockchain block state & document hash</p>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quotation Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => setActivePage('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
              Quotation Review
            </span>
            <span className="text-xs font-mono text-slate-400">ID #{quotation?.id}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {offChainDoc?.title || `Quotation #${quotation?.id}`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
            {quotation?.statusName}
          </div>

          {offChainDoc && (
            <button
              onClick={() => downloadQuotationJson(quotation.id, offChainDoc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
              title="Download signed JSON document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">{actionSuccess.message}</p>
              <a
                href={`https://scan.bohr.life/tx/${actionSuccess.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-teal-300 underline flex items-center gap-1 mt-0.5"
              >
                View on Bohr Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Wallet Connection Guard Notice */}
      {!account ? (
        <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-200 text-sm">
            <Wallet className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <span>Connect your Web3 wallet to verify your client identity and accept or reject this quotation.</span>
          </div>
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors flex-shrink-0"
          >
            Connect Wallet
          </button>
        </div>
      ) : isWrongWallet ? (
        <div className="mb-6 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-white mb-1">Assigned Client Wallet Required</p>
            <p>
              You are currently connected as <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300">{account}</code>.
            </p>
            <p className="mt-1">
              This quotation is strictly assigned to client wallet: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300 font-bold">{quotation?.client}</code>.
            </p>
            <p className="text-slate-400 mt-1">Please switch to the assigned client account in MetaMask to respond.</p>
          </div>
        </div>
      ) : null}

      {/* Main Quotation Review Box */}
      <div className="space-y-6">
        
        {/* Key Metrics: Price & Timeline Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Quoted Price</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{quotation?.amountFormatted}</span>
              <span className="text-xs font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10">
                {quotation?.currency}
              </span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Delivery Period</span>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              <span className="text-xl font-bold text-white">
                {offChainDoc?.deliveryPeriod || 'Per specifications'}
              </span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Expiry Date</span>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              <div>
                <span className={`text-base font-bold ${quotation?.isExpired ? 'text-orange-400' : 'text-white'}`}>
                  {quotation ? new Date(quotation.expiryTimestamp * 1000).toLocaleDateString() : ''}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {quotation?.isExpired ? 'Expired' : 'Active proposal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Service Specifications */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            <span>Service Scope & Description</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {offChainDoc?.description || 'No off-chain description stored locally. The on-chain cryptographic hash remains permanently valid and verifiable.'}
          </div>

          {/* Terms */}
          {offChainDoc?.terms && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Terms & Agreement</h4>
              <p className="text-xs text-slate-400 italic">
                "{offChainDoc.terms}"
              </p>
            </div>
          )}
        </div>

        {/* Cryptographic Proof Verification Card */}
        <DocumentVerificationBadge 
          document={offChainDoc} 
          onChainHash={quotation?.documentHash} 
        />

        {/* Parties metadata card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Freelancer (Creator Address):</span>
            <div className="text-teal-300 font-bold break-all select-all">{quotation?.creator}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Client (Assigned Recipient):</span>
            <div className="text-slate-200 font-bold break-all select-all">{quotation?.client}</div>
          </div>
        </div>

        {/* Rejection reason display if already rejected */}
        {quotation?.status === 2 && quotation?.rejectReason && (
          <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs">
            <span className="font-bold text-rose-300 uppercase tracking-wider block mb-1">Rejection Reason Provided:</span>
            <p className="text-slate-300 italic">"{quotation.rejectReason}"</p>
          </div>
        )}

        {/* Client Action Buttons (Accept / Reject) */}
        {quotation?.status === 0 && !quotation?.isExpired && (
          <div className="p-6 rounded-2xl glass-panel border border-teal-500/30 bg-teal-950/10">
            <h4 className="text-sm font-bold text-white mb-2">Respond to this Quotation</h4>
            <p className="text-xs text-slate-400 mb-5">
              By accepting, you commit your wallet signature on BOT Chain. No funds are transferred in this transaction.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleAccept}
                disabled={!canRespond || isProcessing}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Accept Quotation</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                disabled={!canRespond || isProcessing}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* Expired alert */}
        {quotation?.isExpired && quotation?.status === 0 && (
          <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span>This quotation expired on {quotation.expiryDate} and can no longer be accepted.</span>
          </div>
        )}

      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reject Quotation #{quotation.id}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please provide an optional reason for the freelancer. This will be recorded on BOT Chain.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Budget constraints, project timeline change, or modified scope..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-rose-400 outline-none resize-none mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

