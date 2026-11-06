import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from '../contracts/contractConfig.json';
import { getFallbackProvider } from '../services/contractService';

const Web3Context = createContext(null);

export const BOT_CHAIN_TESTNET = {
  chainId: Number(import.meta.env.VITE_BOT_CHAIN_CHAIN_ID || 968),
  chainIdHex: '0x3c8',
  chainName: 'BOT Chain Testnet',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: [import.meta.env.VITE_BOT_CHAIN_RPC_URL || 'https://rpc.bohr.life'],
  blockExplorerUrls: [import.meta.env.VITE_BOT_CHAIN_EXPLORER_URL || 'https://scan.bohr.life'],
  totalSupply: '150 Million',
};

export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || '';

export function Web3Provider({ children }) {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectNetwork = Number(chainId) === BOT_CHAIN_TESTNET.chainId;

  // Update wallet balance
  const updateBalance = useCallback(async (walletAddress, ethersProvider) => {
    if (!walletAddress || !ethersProvider) return;
    try {
      const bal = await ethersProvider.getBalance(walletAddress);
      setBalance(Number(ethers.formatEther(bal)).toFixed(4));
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    }
  }, []);

  // Initialize and listen to MetaMask / Injected provider
  const initProvider = useCallback(async (autoConnect = false) => {
    if (typeof window === 'undefined') return;

    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);

        // Check already connected accounts
        const accounts = await browserProvider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          const activeAccount = accounts[0];
          setAccount(activeAccount);
          const activeSigner = await browserProvider.getSigner();
          setSigner(activeSigner);
          updateBalance(activeAccount, browserProvider);
        } else if (autoConnect) {
          // Attempt connect
          await connectWallet();
        }
      } catch (err) {
        console.error('Error initializing web3 provider:', err);
      }
    } else {
      // Fallback read-only provider to BOT Chain Testnet
      const fallback = getFallbackProvider();
      setProvider(fallback);
      setChainId(BOT_CHAIN_TESTNET.chainId);
    }
  }, [updateBalance]);

  useEffect(() => {
    initProvider();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          setAccount('');
          setSigner(null);
          setBalance('0.00');
        } else {
          const newAccount = accounts[0];
          setAccount(newAccount);
          if (provider) {
            try {
              const newSigner = await provider.getSigner();
              setSigner(newSigner);
              updateBalance(newAccount, provider);
            } catch (e) {
              console.error(e);
            }
          }
        }
      };

      const handleChainChanged = (chainHex) => {
        const newChainId = parseInt(chainHex, 16);
        setChainId(newChainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [initProvider, provider, updateBalance]);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet detected. Please install MetaMask or a Web3 wallet.');
      alert('Please install MetaMask or a compatible Web3 wallet to connect.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (accounts && accounts.length > 0) {
        const activeAccount = accounts[0];
        setAccount(activeAccount);
        const activeSigner = await browserProvider.getSigner();
        setSigner(activeSigner);
        setProvider(browserProvider);

        const network = await browserProvider.getNetwork();
        const activeChainId = Number(network.chainId);
        setChainId(activeChainId);

        await updateBalance(activeAccount, browserProvider);

        // Check if on BOT Chain Testnet, if not prompt switch
        if (activeChainId !== BOT_CHAIN_TESTNET.chainId) {
          await switchToBotChain();
        }
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount('');
    setSigner(null);
    setBalance('0.00');
  };

  // Switch / Add BOT Chain Testnet
  const switchToBotChain = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BOT_CHAIN_TESTNET.chainIdHex }],
      });
    } catch (switchError) {
      // 4902 error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BOT_CHAIN_TESTNET.chainIdHex,
                chainName: BOT_CHAIN_TESTNET.chainName,
                rpcUrls: BOT_CHAIN_TESTNET.rpcUrls,
                nativeCurrency: BOT_CHAIN_TESTNET.nativeCurrency,
                blockExplorerUrls: BOT_CHAIN_TESTNET.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add BOT Chain network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        balance,
        provider: provider || getFallbackProvider(),
        signer,
        isConnecting,
        isCorrectNetwork,
        error,
        connectWallet,
        disconnectWallet,
        switchToBotChain,
        updateBalance: () => updateBalance(account, provider),
        contractAddress: contractConfig.contractAddress,
        networkConfig: BOT_CHAIN_TESTNET,
        reownProjectId: REOWN_PROJECT_ID,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

