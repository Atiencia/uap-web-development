import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { faucetApi, FaucetStatusResponse, FaucetInfoResponse } from '../services/api';
import toast from 'react-hot-toast';

const FaucetComponent: React.FC = () => {
  const { isAuthenticated, userAddress } = useAuth();
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfoResponse | null>(null);
  const [userStatus, setUserStatus] = useState<FaucetStatusResponse | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar información del faucet y estado del usuario
  useEffect(() => {
    const loadFaucetData = async () => {
      try {
        setIsLoading(true);
        
        // Siempre cargar info general del faucet
        const info = await faucetApi.getInfo();
        setFaucetInfo(info);

        // Solo cargar estado del usuario si está autenticado
        if (isAuthenticated && userAddress) {
          try {
            const status = await faucetApi.getStatus(userAddress);
            setUserStatus(status);
          } catch (error: any) {
            console.error('Error loading user status:', error);
            if (error.response?.status !== 403) {
              toast.error('Error al cargar el estado del usuario');
            }
          }
        }
      } catch (error: any) {
        console.error('Error de carga faucet data:', error);
        if (error.code === 'NETWORK_ERROR') {
          toast.error('Error de conexión. Verifica que el backend esté ejecutándose.');
        } else {
          toast.error('Error al cargar la información del faucet');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFaucetData();
  }, [isAuthenticated, userAddress]);

  const handleClaimTokens = async () => {
    if (!isAuthenticated || !userAddress) {
      toast.error('Por favor inicia sesión primero');
      return;
    }

    if (userStatus?.hasClaimed) {
      toast.error('Ya has reclamado tus tokens');
      return;
    }

    setIsClaiming(true);
    
    try {
      toast.loading('Reclamando tokens...', { id: 'claim-process' });
      
      const result = await faucetApi.claim();
      
      toast.success(
        `¡Tokens reclamados exitosamente! TX: ${result.txHash.substring(0, 10)}...`,
        { id: 'claim-process', duration: 6000 }
      );

      // Recargar estado del usuario
      if (userAddress) {
        const updatedStatus = await faucetApi.getStatus(userAddress);
        setUserStatus(updatedStatus);
      }

      // Recargar info del faucet
      const updatedInfo = await faucetApi.getInfo();
      setFaucetInfo(updatedInfo);

    } catch (error: any) {
      console.error('Error claiming tokens:', error);
      
      if (error.response?.status === 409) {
        toast.error('Ya has reclamado tus tokens', { id: 'claim-process' });
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error, { id: 'claim-process' });
      } else {
        toast.error('Error al reclamar tokens. Por favor intenta de nuevo.', { id: 'claim-process' });
      }
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="faucet-section">
        <div className="loading">Cargando información del faucet...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="faucet-section">
        <h3>🚰 Faucet Token</h3>
        <p>Por favor conecta tu wallet e inicia sesión para reclamar tokens.</p>
        {faucetInfo && (
          <div className="token-info">
            <h4>Información del Token</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Nombre:</span>
                <span className="value">{faucetInfo.token.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Símbolo:</span>
                <span className="value">{faucetInfo.token.symbol}</span>
              </div>
              <div className="info-item">
                <span className="label">Cantidad del Faucet:</span>
                <span className="value">{parseFloat(faucetInfo.faucet.amount).toLocaleString()} tokens</span>
              </div>
              <div className="info-item">
                <span className="label">Total de Usuarios:</span>
                <span className="value">{faucetInfo.faucet.totalUsers}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="faucet-section">
      <h3>Faucet Token</h3>
      
      {faucetInfo && (
        <div className="token-info">
          <h4>Información del Token</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Nombre:</span>
              <span className="value">{faucetInfo.token.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Símbolo:</span>
              <span className="value">{faucetInfo.token.symbol}</span>
            </div>
            <div className="info-item">
              <span className="label">Cantidad del Faucet:</span>
              <span className="value">{parseFloat(faucetInfo.faucet.amount).toLocaleString()} tokens</span>
            </div>
            <div className="info-item">
              <span className="label">Total de Usuarios:</span>
              <span className="value">{faucetInfo.faucet.totalUsers}</span>
            </div>
          </div>
        </div>
      )}

      {userStatus && (
        <div className="user-status">
          <h4>Tu Estado</h4>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Tu Saldo:</span>
              <span className="value">{parseFloat(userStatus.balance).toLocaleString()} tokens</span>
            </div>
            <div className="status-item">
              <span className="label">Estado de Reclamo:</span>
              <span className={`status ${userStatus.hasClaimed ? 'claimed' : 'available'}`}>
                {userStatus.hasClaimed ? '✅ Ya Reclamado' : '🎁 Disponible para Reclamar'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="claim-section">
        <button
          onClick={handleClaimTokens}
          disabled={isClaiming || userStatus?.hasClaimed}
          className={`btn btn-claim ${userStatus?.hasClaimed ? 'disabled' : 'btn-primary'}`}
        >
          {isClaiming ? 'Reclamando...' : userStatus?.hasClaimed ? 'Ya Reclamado' : 'Reclamar Tokens'}
        </button>
        
        {userStatus?.hasClaimed && (
          <p className="claim-message">
            Ya has reclamado tus tokens. Cada dirección solo puede reclamar una vez.
          </p>
        )}
      </div>
    </div>
  );
};

export default FaucetComponent;