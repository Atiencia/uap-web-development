import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Configuración simple para evitar conflictos con MetaMask SDK
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    // Solo injected connector para máxima compatibilidad
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
});

export default config;