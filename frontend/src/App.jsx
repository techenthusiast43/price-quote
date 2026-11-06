import React, { useState, useEffect } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import NetworkAlert from './components/NetworkAlert';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CreateQuotationPage from './pages/CreateQuotationPage';
import QuotationDetailsPage from './pages/QuotationDetailsPage';
import ClientReviewPage from './pages/ClientReviewPage';
import SentQuotationsPage from './pages/SentQuotationsPage';
import ReceivedQuotationsPage from './pages/ReceivedQuotationsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import { ShieldCheck, ExternalLink, Heart } from 'lucide-react';

function MainLayout() {
  const [activePage, setActivePage] = useState('landing');
  const [viewingQuoteId, setViewingQuoteId] = useState(null);
  const { networkConfig } = useWeb3();

  // Check URL search params for direct links like ?review=1 or ?details=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('review') || params.get('quoteId');
    const detailsId = params.get('details');

    if (reviewId) {
      setViewingQuoteId(reviewId);
      setActivePage('review');
    } else if (detailsId) {
      setViewingQuoteId(detailsId);
      setActivePage('details');
    }
  }, []);

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'landing':
        return <LandingPage setActivePage={setActivePage} />;
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      case 'create':
        return <CreateQuotationPage setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      case 'details':
        return <QuotationDetailsPage quoteId={viewingQuoteId} setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      case 'review':
        return <ClientReviewPage quoteId={viewingQuoteId} setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      case 'sent':
        return <SentQuotationsPage setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      case 'received':
        return <ReceivedQuotationsPage setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      case 'history':
        return <TransactionHistoryPage setActivePage={setActivePage} setViewingQuoteId={setViewingQuoteId} />;
      default:
        return <LandingPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080C14] text-slate-100">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <NetworkAlert />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#06090F] py-8 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-200">PriceQuote dApp</span>
            <span className="text-slate-600">&bull;</span>
            <span>BOT Chain Bohr Testnet (Chain ID: 968)</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-400 transition-colors flex items-center gap-1"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://faucet.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-400 transition-colors flex items-center gap-1"
            >
              <span>Faucet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">Total Supply: 150M BOT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <MainLayout />
    </Web3Provider>
  );
}

