import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  fetchSentQuotations, 
  cancelQuotationOnChain 
} from '../services/contractService';
import { logTransaction } from '../services/storageService';
import QuotationCard from '../components/QuotationCard';
import { 
  ArrowUpRight, 
  PlusCircle, 
  Search, 
  Filter, 
  Loader2, 
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function SentQuotationsPage({ setActivePage, setViewingQuoteId }) {
  const { account, signer, provider, isCorrectNetwork, connectWallet, networkConfig } = useWeb3();

  const [quotes, setQuotes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);

  const loadQuotes = useCallback(async () => {
    if (!account) return;
    setIsLoading(true);
    setError(null);

    try {
      const list = await fetchSentQuotations(provider, account);
      setQuotes(list.reverse()); // latest first
    } catch (err) {
      console.error('Failed to load sent quotations:', err);
      setError(err.reason || err.message || 'Error fetching sent quotations');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleCancel = async (quotationId) => {
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

      await loadQuotes();
    } catch (err) {
      console.error('Cancel failed:', err);
      let msg = err.reason || err.message || 'Cancel transaction failed';
      if (msg.includes('user rejected')) msg = 'Transaction rejected in wallet.';
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  // Filtering
  const filteredQuotes = quotes.filter((q) => {
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING' && q.status === 0 && !q.isExpired) ||
      (filterStatus === 'ACCEPTED' && q.status === 1) ||
      (filterStatus === 'REJECTED' && q.status === 2) ||
      (filterStatus === 'CANCELLED' && q.status === 3) ||
      (filterStatus === 'EXPIRED' && q.isExpired);

    const matchesSearch =
      searchQuery === '' ||
      q.id.toString().includes(searchQuery) ||
      q.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.currency.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Wallet className="w-12 h-12 text-teal-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-sm text-slate-400 mb-6">Connect your Web3 wallet to view quotations you have created.</p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono uppercase mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>Freelancer Outbox</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Sent Quotations</h1>
          <p className="text-sm text-slate-400 mt-1">Quotations created and anchored to BOT Chain by your wallet.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadQuotes}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActivePage('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold text-xs hover:from-teal-300 hover:to-cyan-300"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Quote</span>
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

      {/* Filters and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'CANCELLED', label: 'Cancelled' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or client 0x..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-teal-400 outline-none font-mono"
          />
        </div>
      </div>

      {/* Quotations Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading sent quotations from BOT Chain...</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-slate-800 text-center">
          <p className="text-sm text-slate-400 mb-4">
            {quotes.length === 0
              ? "You haven't sent any quotations yet."
              : 'No quotations match the selected filters.'}
          </p>
          {quotes.length === 0 && (
            <button
              onClick={() => setActivePage('create')}
              className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400"
            >
              Create Quotation Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.map((q) => (
            <QuotationCard
              key={q.id}
              quotation={q}
              currentAccount={account}
              onViewDetails={(id) => {
                setViewingQuoteId(id);
                setActivePage('details');
              }}
              onCancel={handleCancel}
              isCancelling={cancellingId === q.id}
            />
          ))}
        </div>
      )}

    </div>
  );
}

