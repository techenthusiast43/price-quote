import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  User, 
  ExternalLink, 
  Copy, 
  Check, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';
import { QuotationStatusColors } from '../services/contractService';
import DocumentVerificationBadge from './DocumentVerificationBadge';
import { getStoredDocument } from '../services/storageService';

export default function QuotationCard({ 
  quotation, 
  currentAccount, 
  onViewDetails, 
  onCancel, 
  isCancelling = false 
}) {
  const [copied, setCopied] = useState(false);
  const offChainDoc = getStoredDocument(quotation.id);

  const statusStyle = QuotationStatusColors[quotation.statusName] || QuotationStatusColors.Pending;
  const isCreator = currentAccount && quotation.creator.toLowerCase() === currentAccount.toLowerCase();
  const isClient = currentAccount && quotation.client.toLowerCase() === currentAccount.toLowerCase();

  const formatAddr = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const copyShareLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?review=${quotation.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onViewDetails(quotation.id)}
      className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer relative group flex flex-col justify-between overflow-hidden"
    >
      {/* Top Bar: ID and Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-teal-400 border border-slate-700">
              #{quotation.id.toString().padStart(4, '0')}
            </span>
            <DocumentVerificationBadge 
              document={offChainDoc} 
              onChainHash={quotation.documentHash} 
              compact={true} 
            />
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
            {quotation.statusName}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-lg text-white group-hover:text-teal-300 transition-colors line-clamp-1 mb-1">
          {offChainDoc?.title || `Quotation #${quotation.id}`}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {offChainDoc?.description || 'Cryptographically verified quotation anchored on BOT Chain.'}
        </p>

        {/* Price & Currency */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Quotation Value</span>
            <span className="text-xl font-extrabold text-white tracking-tight font-mono">
              {quotation.amountFormatted}
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            {quotation.currency}
          </span>
        </div>

        {/* Parties metadata */}
        <div className="space-y-1.5 text-xs text-slate-400 font-mono mb-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Freelancer:
            </span>
            <span className={isCreator ? 'text-teal-300 font-medium' : 'text-slate-300'}>
              {isCreator ? 'You' : formatAddr(quotation.creator)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Client:
            </span>
            <span className={isClient ? 'text-teal-300 font-medium' : 'text-slate-300'}>
              {isClient ? 'You' : formatAddr(quotation.client)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Expires:
            </span>
            <span className={quotation.isExpired ? 'text-orange-400 font-semibold' : 'text-slate-300'}>
              {new Date(quotation.expiryTimestamp * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={copyShareLink}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Copy client review link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
        </button>

        <div className="flex items-center gap-2">
          {isCreator && quotation.status === 0 && !quotation.isExpired && onCancel && (
            <button
              onClick={() => onCancel(quotation.id)}
              disabled={isCancelling}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={() => onViewDetails(quotation.id)}
            className="flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all"
          >
            <span>Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

