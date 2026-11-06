import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  FileText, 
  ShieldCheck, 
  Coins, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  Lock, 
  Layers, 
  ExternalLink,
  Wallet,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  const { account, connectWallet, networkConfig } = useWeb3();

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center pt-8 pb-14">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-teal-500/20 via-cyan-500/10 to-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Live on BOT Chain Testnet &bull; Chain ID 968</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Decentralized Quotations for <span className="gradient-text">Modern Web3 Freelancers</span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Create, anchor, and manage verifiable price quotations on BOT Chain. Clients review and accept using their Web3 wallets with guaranteed tamper-proof integrity.
        </p>

        {/* Call to actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActivePage('create')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 active:scale-[0.98] transition-all shadow-xl shadow-teal-500/25"
          >
            <FileText className="w-5 h-5" />
            <span>Create Price Quotation</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {account ? (
            <button
              onClick={() => setActivePage('dashboard')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all"
            >
              <span>Go to Freelancer Dashboard</span>
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all"
            >
              <Wallet className="w-4 h-4 text-teal-400" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>

        {/* Live Network Pill stats */}
        <div className="mt-12 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 p-2 rounded-2xl glass-panel">
          <div className="p-3 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Network</span>
            <span className="text-sm font-bold text-teal-300 font-mono">BOT Chain Bohr</span>
          </div>
          <div className="p-3 text-center border-l border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Chain ID</span>
            <span className="text-sm font-bold text-white font-mono">968 (0x3c8)</span>
          </div>
          <div className="p-3 text-center border-l border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Native Token</span>
            <span className="text-sm font-bold text-white font-mono">BOT (18 dec)</span>
          </div>
          <div className="p-3 text-center border-l border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">Total Supply</span>
            <span className="text-sm font-bold text-teal-300 font-mono">{networkConfig.totalSupply}</span>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Freelancers & Clients Choose PriceQuote</h2>
          <p className="text-slate-400 text-sm mt-2">Zero token lockups. Pure cryptographic certainty.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cryptographic Document Integrity</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Full service scopes and line items stay off-chain for privacy, while deterministic Keccak-256 hashes are anchored directly to BOT Chain blocks.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Wallet-Enforced Approvals</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Only the explicitly assigned client wallet address can accept or reject proposals on-chain. Unauthorized modifications are mathematically impossible.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Payment & Escrow Bloat</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No locked funds, no token deposits, no token taxes, no NFT wrapping. PriceQuote focuses strictly on legally evidential status commitments on-chain.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section className="max-w-7xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-teal-400 text-xs font-mono font-bold tracking-wider uppercase">Simple 4-Step Process</span>
          <h2 className="text-3xl font-extrabold text-white mt-2">How PriceQuote Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm mb-3">01</span>
              <h4 className="font-bold text-white text-base mb-1">Create & Hash</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter client wallet, price, deliverables, and expiry. The client computes a Keccak-256 fingerprint in real-time.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm mb-3">02</span>
              <h4 className="font-bold text-white text-base mb-1">Anchor on BOT Chain</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record the quotation metadata and cryptographic hash to the smart contract, emitting a permanent event on Bohr testnet.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm mb-3">03</span>
              <h4 className="font-bold text-white text-base mb-1">Share Client Link</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send the unique quotation link to your client. The review page automatically verifies document integrity against the blockchain.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm mb-3">04</span>
              <h4 className="font-bold text-white text-base mb-1">Client Accepts on-Chain</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Client connects their designated wallet and submits an Accept or Reject transaction directly to the contract.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Network and Explorer Reference */}
      <section className="max-w-4xl mx-auto p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
          <div>
            <span className="text-white font-bold">BOT Chain Testnet RPC:</span>
            <span className="ml-2 text-teal-300">https://rpc.bohr.life</span>
          </div>
        </div>
        <a
          href="https://scan.bohr.life"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          <span>Open Bohr Block Explorer</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </section>
    </div>
  );
}

