import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  fetchSentQuotations, 
  fetchReceivedQuotations,
  cancelQuotationOnChain 
} from '../services/contractService';
import { logTransaction } from '../services/storageService';
import QuotationCard from '../components/QuotationCard';
import { 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  TrendingUp, 
  DollarSign, 
  Loader2,
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function DashboardPage({ setActivePage, setViewingQuoteId }) {
  const { account, signer, provider, isCorrectNetwork, connectWallet, networkConfig } = useWeb3();

  const [sentQuotes, setSentQuotes] = useState([]);
  const [receivedQuotes, setReceivedQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!account) return;
    setIsLoading(true);
    setError(null);

    try {
      const [sent, received] = await Promise.all([
        fetchSentQuotations(provider, account),
        fetchReceivedQuotations(provider, account),
      ]);
      setSentQuotes(sent.reverse()); // latest first
      setReceivedQuotes(received.reverse());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.reason || err.message || 'Error fetching data from BOT Chain');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Cancel Quotation
  const handleCancelQuotation = async (quotationId) => {
    if (!signer || !isCorrectNetwork) return;
    setCancellingId(quotationId);
    setError(null);

    try {
      const res = await cancelQuotationOnChain(signer, quotationId);

      logTransaction({
        txHash: res.txHash,
        action: 'QuotationCancelled',
        quotationId,
        from: account,
        network: `${networkConfig.chainName} (${networkConfig.chainId})`,
      });

      await loadDashboardData();
    } catch (err) {
      console.error('Cancel failed:', err);
      let msg = err.reason || err.message || 'Cancel transaction failed';
      if (msg.includes('user rejected')) msg = 'Transaction rejected in wallet.';
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  // Compute metrics
  const totalSent = sentQuotes.length;
  const pendingSent = sentQuotes.filter((q) => q.status === 0 && !q.isExpired).length;
  const acceptedSent = sentQuotes.filter((q) => q.status === 1).length;
  const rejectedSent = sentQuotes.filter((q) => q.status === 2).length;
  const cancelledSent = sentQuotes.filter((q) => q.status === 3).length;

  const totalReceived = receivedQuotes.length;
  const pendingReceived = receivedQuotes.filter((q) => q.status === 0 && !q.isExpired).length;

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Web3 Wallet</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect your wallet to access your freelancer dashboard, track proposals, and manage quotations on BOT Chain.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold text-sm hover:from-teal-300 hover:to-cyan-300 transition-all shadow-lg shadow-teal-500/20"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Freelancer Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of your price quotations anchored on BOT Chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActivePage('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold text-xs hover:from-teal-300 hover:to-cyan-300 transition-all shadow-md shadow-teal-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Quote</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Sent */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Total Sent</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">{totalSent}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Pending Sent */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-mono block">Pending</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-300 font-mono">{pendingSent}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* Accepted Sent */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono block">Accepted</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-300 font-mono">{acceptedSent}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Rejected Sent */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-rose-400 font-mono block">Rejected</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-300 font-mono">{rejectedSent}</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
        </div>

        {/* Cancelled */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Cancelled</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-300 font-mono">{cancelledSent}</span>
            <Ban className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Received Pending */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-teal-400 font-mono block">Received (New)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-teal-300 font-mono">{pendingReceived}</span>
            <ArrowDownLeft className="w-4 h-4 text-teal-400" />
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div 
          onClick={() => setActivePage('sent')}
          className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">My Sent Quotations ({totalSent})</h3>
              <p className="text-xs text-slate-400">View and manage quotations you created for clients</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>

        <div 
          onClick={() => setActivePage('received')}
          className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">My Received Quotations ({totalReceived})</h3>
              <p className="text-xs text-slate-400">Review, accept or reject quotations sent to your wallet</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>

      </div>

      {/* Active Sent Quotations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Recent Sent Quotations</span>
            <span className="text-xs font-normal text-slate-400">({sentQuotes.length})</span>
          </h2>
          {sentQuotes.length > 3 && (
            <button
              onClick={() => setActivePage('sent')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300"
            >
              View All Sent &rarr;
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Querying BOT Chain contracts...</p>
          </div>
        ) : sentQuotes.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center">
            <p className="text-sm text-slate-400 mb-3">You haven't created any price quotations yet.</p>
            <button
              onClick={() => setActivePage('create')}
              className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
            >
              Create Your First Quotation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sentQuotes.slice(0, 6).map((q) => (
              <QuotationCard
                key={q.id}
                quotation={q}
                currentAccount={account}
                onViewDetails={(id) => {
                  setViewingQuoteId(id);
                  setActivePage('details');
                }}
                onCancel={handleCancelQuotation}
                isCancelling={cancellingId === q.id}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

