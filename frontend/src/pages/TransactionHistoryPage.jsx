import React, { useState, useEffect } from 'react';
import { getTransactionHistory } from '../services/storageService';
import { useWeb3 } from '../context/Web3Context';
import { 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  Ban, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export default function TransactionHistoryPage({ setViewingQuoteId, setActivePage }) {
  const { networkConfig } = useWeb3();
  const [history, setHistory] = useState([]);
  const [copiedTx, setCopiedTx] = useState(null);

  const loadHistory = () => {
    setHistory(getTransactionHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'QuotationCreated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
            <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
            Created
          </span>
        );
      case 'QuotationAccepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Accepted
          </span>
        );
      case 'QuotationRejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Rejected
          </span>
        );
      case 'QuotationCancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/30">
            <Ban className="w-3.5 h-3.5 text-slate-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono uppercase mb-1">
            <Clock className="w-4 h-4" />
            <span>Audit Trail</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Transaction History</h1>
          <p className="text-sm text-slate-400 mt-1">Audit log of your quotation interactions on BOT Chain.</p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Transactions Table / List */}
      {history.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-slate-800 text-center glass-panel">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Transactions Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you create, accept, reject or cancel quotations, your transaction receipts and explorer links will appear here.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Quote ID</th>
                  <th className="py-3.5 px-5">Tx Hash</th>
                  <th className="py-3.5 px-5">From</th>
                  <th className="py-3.5 px-5">Time</th>
                  <th className="py-3.5 px-5 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    
                    {/* Action */}
                    <td className="py-4 px-5">
                      {getActionBadge(tx.action)}
                    </td>

                    {/* Quote ID */}
                    <td className="py-4 px-5">
                      {tx.quotationId ? (
                        <button
                          onClick={() => {
                            setViewingQuoteId(tx.quotationId);
                            setActivePage('details');
                          }}
                          className="font-bold text-teal-400 hover:underline"
                        >
                          #{tx.quotationId.toString().padStart(4, '0')}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Tx Hash */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">
                          {tx.txHash ? `${tx.txHash.substring(0, 10)}...${tx.txHash.substring(tx.txHash.length - 6)}` : '-'}
                        </span>
                        {tx.txHash && (
                          <button
                            onClick={() => copyHash(tx.txHash)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy Tx Hash"
                          >
                            {copiedTx === tx.txHash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* From */}
                    <td className="py-4 px-5 text-slate-400">
                      {tx.from ? `${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}` : '-'}
                    </td>

                    {/* Time */}
                    <td className="py-4 px-5 text-slate-400 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>

                    {/* Explorer Link */}
                    <td className="py-4 px-5 text-right">
                      {tx.txHash ? (
                        <a
                          href={`https://scan.bohr.life/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline"
                        >
                          <span>BohrScan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

