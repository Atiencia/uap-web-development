import React, { useState, useEffect } from 'react';
import { faucetApi } from '../services/api';
import toast from 'react-hot-toast';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const result = await faucetApi.getUsers();
        setUsers(result.users);
      } catch (error: any) {
        console.error('Error loading users:', error);
        const errorMessage = error.message || 'Error al cargar la lista de usuarios';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('¡Dirección copiada al portapapeles!');
  };

  if (isLoading) {
    return (
      <div className="users-section">
        <h3>👥 Usuarios del Faucet</h3>
        <div className="loading">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="users-section">
      <h3>👥 Usuarios del Faucet</h3>
      <p className="users-subtitle">
        Direcciones que han reclamado tokens del faucet ({users.length} total)
      </p>
      
      {users.length === 0 ? (
        <div className="no-users">
          <p>Ningún usuario ha reclamado tokens aún. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="users-list">
          {users.map((address, index) => (
            <div key={address} className="user-item">
              <span className="user-number">#{index + 1}</span>
              <span className="user-address" title={address}>
                {formatAddress(address)}
              </span>
              <button
                onClick={() => copyToClipboard(address)}
                className="copy-btn"
                title="Copiar dirección completa"
              >
                📋
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="users-stats">
        <p>
          <strong>Total de direcciones:</strong> {users.length}
        </p>
      </div>
    </div>
  );
};

export default UsersList;