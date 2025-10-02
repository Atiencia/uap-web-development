import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import BlockchainService from '../services/blockchain';

const router = express.Router();
const blockchainService = new BlockchainService();

/**
 * POST /api/faucet/claim
 * Reclama tokens del faucet (requiere autenticación)
 */
router.post('/claim', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userAddress = req.user?.address;

    if (!userAddress) {
      return res.status(401).json({ error: 'User address not found in token' });
    }

    console.log(`Attempting to claim tokens for: ${userAddress}`);

    // Verificar si ya reclamó tokens
    const hasClaimed = await blockchainService.hasAddressClaimed(userAddress);
    if (hasClaimed) {
      return res.status(409).json({ 
        error: 'Address has already claimed tokens',
        hasClaimed: true
      });
    }

    // Reclamar tokens
    const txHash = await blockchainService.claimTokens(userAddress);

    console.log(`Tokens claimed successfully. TxHash: ${txHash}`);

    res.json({
      success: true,
      txHash,
      message: 'Tokens claimed successfully!'
    });

  } catch (error: any) {
    console.error('Error claiming tokens:', error);
    
    // Manejar errores específicos de blockchain
    if (error.message.includes('already claimed')) {
      return res.status(409).json({ 
        error: 'Tokens already claimed for this address',
        hasClaimed: true
      });
    }
    
    if (error.message.includes('insufficient funds')) {
      return res.status(503).json({ 
        error: 'Faucet is temporarily out of funds. Please try again later.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to claim tokens',
      message: error.message
    });
  }
});

/**
 * GET /api/faucet/status/:address
 * Obtiene el estado del faucet para una dirección específica
 */
router.get('/status/:address', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { address } = req.params;
    const userAddress = req.user?.address;

    // Validar que el usuario solo pueda consultar su propia dirección
    if (address.toLowerCase() !== userAddress?.toLowerCase()) {
      return res.status(403).json({ 
        error: 'You can only check your own address status' 
      });
    }

    // Validar formato de dirección
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    console.log(`Getting faucet status for: ${address}`);

    // Obtener información en paralelo
    const [hasClaimed, balance, faucetUsers, faucetAmount] = await Promise.all([
      blockchainService.hasAddressClaimed(address),
      blockchainService.getBalance(address),
      blockchainService.getFaucetUsers(),
      blockchainService.getFaucetAmount()
    ]);

    res.json({
      address: address.toLowerCase(),
      hasClaimed,
      balance,
      faucetAmount,
      totalUsers: faucetUsers.length,
      users: faucetUsers.map(addr => addr.toLowerCase())
    });

  } catch (error: any) {
    console.error('Error getting faucet status:', error);
    res.status(500).json({ 
      error: 'Failed to get faucet status',
      message: error.message
    });
  }
});

/**
 * GET /api/faucet/info
 * Obtiene información general del token y faucet
 */
router.get('/info', async (req, res) => {
  try {
    console.log('Getting faucet info...');

    const [tokenInfo, faucetAmount, faucetUsers] = await Promise.all([
      blockchainService.getTokenInfo(),
      blockchainService.getFaucetAmount(),
      blockchainService.getFaucetUsers()
    ]);

    res.json({
      token: {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply
      },
      faucet: {
        amount: faucetAmount,
        totalUsers: faucetUsers.length,
        contractAddress: process.env.CONTRACT_ADDRESS
      }
    });

  } catch (error: any) {
    console.error('Error getting faucet info:', error);
    res.status(500).json({ 
      error: 'Failed to get faucet info',
      message: error.message
    });
  }
});

/**
 * GET /api/faucet/users
 * Obtiene la lista de usuarios que han interactuado con el faucet
 */
router.get('/users', async (req, res) => {
  try {
    console.log('Getting faucet users...');

    const faucetUsers = await blockchainService.getFaucetUsers();

    res.json({
      users: faucetUsers.map(addr => addr.toLowerCase()),
      total: faucetUsers.length
    });

  } catch (error: any) {
    console.error('Error getting faucet users:', error);
    res.status(500).json({ 
      error: 'Failed to get faucet users',
      message: error.message
    });
  }
});

export default router;