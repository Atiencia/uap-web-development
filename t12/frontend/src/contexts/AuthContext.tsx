import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  userAddress: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Verificar token existente al cargar
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedAddress = localStorage.getItem('userAddress');
      
      if (token && savedAddress && isConnected && address?.toLowerCase() === savedAddress.toLowerCase()) {
        try {
          const result = await authApi.verify(token);
          if (result.valid) {
            setIsAuthenticated(true);
            setUserAddress(result.address);
          } else {
            // Token inválido, limpiar
            localStorage.removeItem('authToken');
            localStorage.removeItem('userAddress');
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userAddress');
        }
      } else if (token) {
        // Limpiar si no coincide la dirección
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAddress');
      }
    };

    checkExistingAuth();
  }, [address, isConnected]);

  // Limpiar autenticación si se desconecta la wallet
  useEffect(() => {
    if (!isConnected) {
      setIsAuthenticated(false);
      setUserAddress(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userAddress');
    }
  }, [isConnected]);

  const signIn = async () => {
    if (!address || !isConnected) {
      toast.error('Por favor conecta tu wallet primero');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Obtener mensaje SIWE
      toast.loading('Generando mensaje para firmar...', { id: 'siwe-process' });
      const { message } = await authApi.getMessage(address);
      
      // 2. Firmar mensaje
      toast.loading('Por favor firma el mensaje en tu wallet...', { id: 'siwe-process' });
      const signature = await signMessageAsync({ message });
      
      // 3. Enviar firma al backend
      toast.loading('Verificando firma...', { id: 'siwe-process' });
      const authResult = await authApi.signIn(message, signature);
      
      // 4. Guardar token y estado
      localStorage.setItem('authToken', authResult.token);
      localStorage.setItem('userAddress', authResult.address);
      setIsAuthenticated(true);
      setUserAddress(authResult.address);
      
      toast.success('¡Sesión iniciada exitosamente!', { id: 'siwe-process' });
      
    } catch (error: any) {
      console.error('Error en sign in:', error);
      
      if (error.name === 'UserRejectedRequestError') {
        toast.error('Firma rechazada por el usuario', { id: 'siwe-process' });
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error, { id: 'siwe-process' });
      } else if (error.message?.includes('network')) {
        toast.error('Error de conexión con el servidor. Verifica que el backend esté ejecutándose.', { id: 'siwe-process' });
      } else {
        toast.error('Error al iniciar sesión. Por favor intenta de nuevo.', { id: 'siwe-process' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setUserAddress(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userAddress');
    toast.success('Sesión cerrada exitosamente');
  };

  const value: AuthContextType = {
    isAuthenticated,
    userAddress,
    signIn,
    signOut,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};