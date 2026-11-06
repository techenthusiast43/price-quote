import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, FileCode, Check, Copy, ExternalLink } from 'lucide-react';
import { computeDocumentHash } from '../services/storageService';

export default function DocumentVerificationBadge({ document, onChainHash, compact = false }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!onChainHash) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        No Hash
      </span>
    );
  }

  let isVerified = false;
  let computedHash = '';

  if (document) {
    try {
      computedHash = computeDocumentHash(document);
      isVerified = computedHash.toLowerCase() === onChainHash.toLowerCase();
    } catch (e) {
      console.warn('Verification calculation failed:', e);
    }
  }

  const copyHash = (hashText) => {
    navigator.clipboard.writeText(hashText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedHash = `${onChainHash.substring(0, 8)}...${onChainHash.substring(onChainHash.length - 6)}`;

  if (compact) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
          isVerified
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
            : document
            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
            : 'bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20'
        }`}
        title="Click to view cryptographic proof"
      >
        {isVerified ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : document ? (
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <FileCode className="w-3.5 h-3.5 text-teal-400" />
        )}
        <span>{isVerified ? 'Verified Match' : truncatedHash}</span>
      </button>
    );
  }

  return (
    <>
      <div className={`p-4 rounded-xl border ${
        isVerified 
          ? 'bg-emerald-950/20 border-emerald-500/30' 
          : document 
          ? 'bg-rose-950/20 border-rose-500/30' 
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-teal-500/20 text-teal-400'
            }`}>
              {isVerified ? <ShieldCheck className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Cryptographic Document Proof</h4>
                {isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Tamper-Proof Match
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVerified 
                  ? 'The off-chain quotation document precisely matches the immutable on-chain Keccak-256 hash.'
                  : 'Anchored on BOT Chain block state.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
          >
            Inspect Details
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="text-slate-500">On-Chain Hash:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-300">{truncatedHash}</span>
            <button
              onClick={() => copyHash(onChainHash)}
              className="p-1 hover:text-white transition-colors"
              title="Copy full hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Proof Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Cryptographic Verification Details</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 my-5 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">On-Chain Document Hash (Immutable):</label>
                <div className="p-3 bg-slate-900 rounded-lg text-teal-300 break-all select-all border border-slate-800">
                  {onChainHash}
                </div>
              </div>

              {computedHash && (
                <div>
                  <label className="text-slate-400 block mb-1">Computed Hash from Document Body:</label>
                  <div className={`p-3 rounded-lg break-all select-all border ${
                    isVerified 
                      ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-950/30 text-rose-300 border-rose-500/30'
                  }`}>
                    {computedHash}
                  </div>
                </div>
              )}

              {document && (
                <div>
                  <label className="text-slate-400 block mb-1">Canonical Off-Chain Document:</label>
                  <pre className="p-3 bg-slate-950 rounded-lg text-slate-300 overflow-x-auto max-h-48 border border-slate-800 text-[11px]">
                    {JSON.stringify(document, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className={`text-xs font-medium flex items-center gap-1.5 ${isVerified ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isVerified ? <ShieldCheck className="w-4 h-4" /> : null}
                {isVerified ? 'Integrity 100% Verified' : 'Document payload ready for comparison'}
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

