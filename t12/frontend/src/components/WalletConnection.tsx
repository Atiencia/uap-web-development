import React from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const WalletConnection: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, isPending, error } = useConnect({
    mutation: {
      onError: (error) => {
        console.error('Error connecting wallet:', error);
        
        // Manejar diferentes tipos de errores específicamente
        if (error.message.includes('User rejected')) {
          toast.error('Conexión cancelada por el usuario');
        } else if (error.message.includes('No injected provider')) {
          toast.error('No se encontró ninguna wallet instalada');
        } else if (error.message.includes('Already processing')) {
          toast.error('Ya hay una conexión en proceso');
        } else {
          toast.error('Error al conectar la wallet. Por favor intenta de nuevo.');
        }
      },
      onSuccess: () => {
        toast.success('¡Wallet conectada exitosamente!');
      }
    }
  });
  const { isAuthenticated, signIn, signOut, isLoading } = useAuth();

  const handleConnect = async () => {
    try {
      // Verificar si hay una wallet disponible
      if (typeof window.ethereum === 'undefined') {
        toast.error('No se encontró ninguna wallet. Instala MetaMask, Trust Wallet u otra wallet compatible.', {
          duration: 6000
        });
        return;
      }

      connect({ connector: injected() });
    } catch (err) {
      // Los errores ya se manejan en el hook useConnect
      console.error('Error en handleConnect:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isWalletAvailable = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  if (!isConnected) {
    return (
      <div className="wallet-section">
        <h3>Conectar Wallet</h3>
        <p>Conecta tu wallet compatible con Ethereum para interactuar con el Faucet Token</p>
        
        {!isWalletAvailable && (
          <div style={{background: '#fff3cd', padding: '10px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #ffeaa7'}}>
            <p style={{margin: '0', color: '#856404', fontSize: '14px'}}>
              ⚠️ <strong>Wallet no detectada</strong><br/>
              Para usar esta aplicación necesitas instalar una wallet compatible.<br/>
              <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" style={{color: '#0066cc'}}>
                👉 Descargar MetaMask aquí
              </a>
            </p>
          </div>
        )}
        
        <button 
          onClick={handleConnect}
          disabled={isPending || !isWalletAvailable}
          className="btn btn-primary"
          style={{
            opacity: !isWalletAvailable ? 0.5 : 1, 
            marginTop: '20px',
            marginBottom: '15px'
          }}
        >
          {isPending ? 'Conectando...' : !isWalletAvailable ? 'Instala una wallet primero' : '🦊 Conectar Wallet' }
        </button>
        
        <div style={{background: '#e7f3ff', padding: '10px', borderRadius: '5px', border: '1px solid #b3d9ff'}}>
          <p style={{margin: '0', color: '#0066cc', fontSize: '14px'}}>
            💡 <strong>Wallets compatibles:</strong><br/>
            MetaMask, Coinbase Wallet, Trust Wallet, Brave Wallet, y cualquier wallet EVM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-section">
      <h3>Wallet Conectado</h3>
      <div className="wallet-info">
        <p><strong>Dirección:</strong> {formatAddress(address!)}</p>
        <p><strong>Red:</strong> Sepolia Testnet</p>
      </div>
      
      <div className="wallet-actions">
        {!isAuthenticated ? (
          <button 
            onClick={signIn}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión con Ethereum'}
          </button>
        ) : (
          <div className="authenticated-actions">
            <p className="auth-status">✅ Autenticado</p>
            <div className="button-group">
              <button 
                onClick={signOut}
                className="btn btn-secondary"
              >
                Cerrar Sesión
              </button>
              <button 
                onClick={() => disconnect()}
                className="btn btn-danger"
              >
                Desconectar Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnection;