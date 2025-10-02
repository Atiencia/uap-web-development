import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor para agregar token JWT a las requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Agregar información adicional al error para mejor manejo
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.message = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
      error.code = 'NETWORK_ERROR';
    } else if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('userAddress');
      error.message = 'Sesión expirada. Por favor conecta tu wallet nuevamente.';
    } else if (error.response?.status === 403) {
      error.message = 'Acceso denegado. Verifica tus permisos.';
    } else if (error.response?.status === 404) {
      error.message = 'Recurso no encontrado.';
    } else if (error.response?.status >= 500) {
      error.message = 'Error interno del servidor. Por favor intenta más tarde.';
    } else if (error.response?.data?.error) {
      // Usar el mensaje de error del backend si está disponible
      error.message = error.response.data.error;
    }
    
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  token: string;
  address: string;
  expiresIn?: string;
}

export interface SiweMessageResponse {
  message: string;
  address: string;
}

export interface FaucetStatusResponse {
  address: string;
  hasClaimed: boolean;
  balance: string;
  faucetAmount: string;
  totalUsers: number;
  users: string[];
}

export interface FaucetInfoResponse {
  token: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  };
  faucet: {
    amount: string;
    totalUsers: number;
    contractAddress: string;
  };
}

export interface ClaimResponse {
  success: boolean;
  txHash: string;
  message: string;
}

// Auth APIs
export const authApi = {
  getMessage: async (address: string): Promise<SiweMessageResponse> => {
    try {
      const response = await api.post('/auth/message', { address });
      return response.data;
    } catch (error) {
      throw new Error('Error al generar el mensaje de autenticación. Verifica tu dirección.');
    }
  },

  signIn: async (message: string, signature: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/signin', { message, signature });
      return response.data;
    } catch (error) {
      throw new Error('Error al iniciar sesión. La firma puede ser inválida.');
    }
  },

  verify: async (token: string): Promise<{ valid: boolean; address: string }> => {
    try {
      const response = await api.post('/auth/verify', { token });
      return response.data;
    } catch (error) {
      throw new Error('Error al verificar el token de autenticación.');
    }
  }
};

// Faucet APIs
export const faucetApi = {
  claim: async (): Promise<ClaimResponse> => {
    try {
      const response = await api.post('/faucet/claim');
      return response.data;
    } catch (error) {
      throw new Error('Error al reclamar tokens. Verifica que no hayas reclamado recientemente.');
    }
  },

  getStatus: async (address: string): Promise<FaucetStatusResponse> => {
    try {
      const response = await api.get(`/faucet/status/${address}`);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener el estado del faucet para tu dirección.');
    }
  },

  getInfo: async (): Promise<FaucetInfoResponse> => {
    try {
      const response = await api.get('/faucet/info');
      return response.data;
    } catch (error) {
      throw new Error('Error al cargar la información del faucet. Intenta nuevamente.');
    }
  },

  getUsers: async (): Promise<{ users: string[]; total: number }> => {
    try {
      const response = await api.get('/faucet/users');
      return response.data;
    } catch (error) {
      throw new Error('Error al cargar la lista de usuarios. Intenta nuevamente.');
    }
  }
};

export default api;