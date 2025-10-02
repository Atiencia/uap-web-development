import express from 'express';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Store temporal para mensajes SIWE (en producción usar Redis)
const messageStore = new Map<string, { message: string; timestamp: number }>();

// Limpiar mensajes expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of messageStore.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) { // 5 minutos
      messageStore.delete(address);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/auth/message
 * Genera un mensaje SIWE para ser firmado por el usuario
 */
router.post('/message', (req, res) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Valid address is required' });
    }

    // Validar formato de dirección Ethereum
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    const message = new SiweMessage({
      domain: req.get('host') || 'localhost:5000',
      address,
      statement: 'Sign in to Faucet Token DApp',
      uri: `${req.protocol}://${req.get('host')}`,
      version: '1',
      chainId: 11155111, // Sepolia
      nonce: Math.random().toString(36).substring(2, 15), // Nonce random
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
    });

    const messageString = message.prepareMessage();
    
    // Guardar mensaje temporalmente
    messageStore.set(address.toLowerCase(), {
      message: messageString,
      timestamp: Date.now()
    });

    console.log(`Generated SIWE message for address: ${address}`);

    res.json({ 
      message: messageString,
      address: address.toLowerCase()
    });

  } catch (error: any) {
    console.error('Error generating SIWE message:', error);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

/**
 * POST /api/auth/signin
 * Verifica la firma SIWE y genera JWT
 */
router.post('/signin', async (req, res) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      return res.status(400).json({ error: 'Message and signature are required' });
    }

    // Parsear mensaje SIWE
    const siweMessage = new SiweMessage(message);
    const address = siweMessage.address.toLowerCase();

    // Verificar que el mensaje esté en el store
    const storedData = messageStore.get(address);
    if (!storedData || storedData.message !== message) {
      return res.status(400).json({ error: 'Invalid or expired message' });
    }

    // Verificar la firma
    const verificationResult = await siweMessage.verify({ signature });
    
    if (!verificationResult.success) {
      console.error('SIWE verification failed:', verificationResult.error);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Limpiar mensaje usado
    messageStore.delete(address);

    // Generar JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { address },
      jwtSecret,
      { 
        expiresIn: '24h',
        issuer: 'faucet-backend',
        audience: 'faucet-frontend'
      }
    );

    console.log(`Successful authentication for address: ${address}`);

    res.json({ 
      token, 
      address,
      expiresIn: '24h'
    });

  } catch (error: any) {
    console.error('Error in signin:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/verify
 * Verifica si un JWT es válido
 */
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({ 
        valid: true, 
        address: decoded.address 
      });
    });

  } catch (error: any) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

export default router;