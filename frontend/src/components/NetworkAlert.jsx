import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function NetworkAlert() {
  const { account, chainId, isCorrectNetwork, switchToBotChain, networkConfig } = useWeb3();

  if (!account || isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 text-amber-200 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            You are connected to Chain ID <strong>{chainId || 'Unknown'}</strong>. PriceQuote operates on <strong>{networkConfig.chainName}</strong> (Chain ID: {networkConfig.chainId}).
          </span>
        </div>
        <button
          onClick={switchToBotChain}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-all flex-shrink-0"
        >
          Switch to BOT Chain Testnet
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

