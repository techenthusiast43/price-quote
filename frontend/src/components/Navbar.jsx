import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  FileText, 
  Wallet, 
  LogOut, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  LayoutDashboard, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { 
    account, 
    balance, 
    chainId, 
    isConnecting, 
    isCorrectNetwork, 
    connectWallet, 
    disconnectWallet, 
    switchToBotChain,
    networkConfig 
  } = useWeb3();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Quote', icon: PlusCircle },
    { id: 'sent', label: 'My Sent', icon: ArrowUpRight },
    { id: 'received', label: 'My Received', icon: ArrowDownLeft },
    { id: 'history', label: 'Tx History', icon: Clock },
  ];

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#0A0E17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActivePage('landing')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
              <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Price<span className="text-teal-400">Quote</span></span>
                <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  dApp
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                on BOT Chain <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Network & Wallet */}
          <div className="flex items-center gap-3">
            {/* BOT Chain Network Status */}
            <div className="hidden lg:flex items-center">
              {isCorrectNetwork ? (
                <a
                  href={networkConfig.blockExplorerUrls[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono hover:bg-emerald-500/20 transition-colors"
                  title="Connected to BOT Chain Testnet (Chain ID 968)"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  BOT Chain (968)
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : account ? (
                <button
                  onClick={switchToBotChain}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Switch to BOT Chain
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  BOT Chain (968)
                </div>
              )}
            </div>

            {/* Wallet Button */}
            {account ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-mono font-medium text-slate-200">
                      {formatAddress(account)}
                    </span>
                    <span className="text-[10px] text-teal-400/90 font-mono">
                      {balance} BOT
                    </span>
                  </div>
                </div>

                <button
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 hover:from-teal-400 hover:to-cyan-400 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-800/80 overflow-x-auto gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}

