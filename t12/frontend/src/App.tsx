import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import config from './config/wagmi';
import { AuthProvider } from './contexts/AuthContext';
import WalletConnection from './components/WalletConnection';
import FaucetComponent from './components/FaucetComponent';
import UsersList from './components/UsersList';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="App">
            <header className="App-header">
              <h1>APP</h1>
              <p>¡Reclama tus tokens gratuitos en Sepolia!</p>
            </header>
            
            <main className="App-main">
              <div className="container">
                <div className="grid">
                  <div className="card">
                    <WalletConnection />
                  </div>
                  
                  <div className="card">
                    <FaucetComponent />
                  </div>
                  
                  <div className="card full-width">
                    <UsersList />
                  </div>
                </div>
              </div>
            </main>
            
            <footer className="App-footer">
              <p>
                Powered by{' '}
                <a href="https://wagmi.sh" target="_blank" rel="noopener noreferrer">
                  Wagmi
                </a>
                {' & '}
                <a href="https://docs.walletconnect.com/web3modal/about" target="_blank" rel="noopener noreferrer">
                  Web3Modal
                </a>
              </p>
              <p>
                Contract:{' '}
                <a 
                  href="https://sepolia.etherscan.io/address/0x3e2117c19a921507ead57494bbf29032f33c7412"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  0x3e21...7412
                </a>
              </p>
            </footer>
          </div>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#4caf50',
                },
              },
              error: {
                style: {
                  background: '#f44336',
                },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
