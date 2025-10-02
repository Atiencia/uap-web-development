import { ethers } from 'ethers';

// ABI del contrato FaucetToken (funciones principales)
const FAUCET_TOKEN_ABI = [
  // Funciones del Faucet
  "function claimTokens() external",
  "function hasAddressClaimed(address _address) external view returns (bool)",
  "function getFaucetUsers() external view returns (address[])",
  "function getFaucetAmount() external view returns (uint256)",
  
  // Funciones ERC20
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)"
];

class BlockchainService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      console.warn('⚠️ Missing environment variables. Backend will run in DEMO mode.');
      console.warn('   Set RPC_URL, PRIVATE_KEY, and CONTRACT_ADDRESS for full functionality.');
      
      // Usar valores por defecto para modo demo
      this.provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      this.wallet = new ethers.Wallet('0x0000000000000000000000000000000000000000000000000000000000000001', this.provider);
      this.contract = new ethers.Contract(
        '0x3e2117c19a921507ead57494bbf29032f33c7412',
        FAUCET_TOKEN_ABI,
        this.wallet
      );
      return;
    }

    // Configurar provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Configurar wallet
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Configurar contrato
    this.contract = new ethers.Contract(contractAddress, FAUCET_TOKEN_ABI, this.wallet);
  }

  async claimTokens(userAddress: string): Promise<string> {
    try {
      console.log(`Claiming tokens for address: ${userAddress}`);
      
      // Verificar si ya reclamó tokens
      const hasClaimed = await this.hasAddressClaimed(userAddress);
      if (hasClaimed) {
        throw new Error('Address has already claimed tokens');
      }

      // Ejecutar transacción
      const tx = await this.contract.claimTokens();
      console.log(`Transaction submitted: ${tx.hash}`);
      
      // Esperar confirmación
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error claiming tokens:', error);
      throw new Error(`Failed to claim tokens: ${error.message}`);
    }
  }

  async hasAddressClaimed(address: string): Promise<boolean> {
    try {
      return await this.contract.hasAddressClaimed(address);
    } catch (error: any) {
      console.error('Error checking if address claimed:', error);
      throw new Error(`Failed to check claim status: ${error.message}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address);
      return ethers.formatUnits(balance, 18); // Asumiendo 18 decimales
    } catch (error: any) {
      console.error('Error getting balance:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getFaucetUsers(): Promise<string[]> {
    try {
      return await this.contract.getFaucetUsers();
    } catch (error: any) {
      console.error('Error getting faucet users:', error);
      throw new Error(`Failed to get faucet users: ${error.message}`);
    }
  }

  async getFaucetAmount(): Promise<string> {
    try {
      const amount = await this.contract.getFaucetAmount();
      return ethers.formatUnits(amount, 18);
    } catch (error: any) {
      console.error('Error getting faucet amount:', error);
      throw new Error(`Failed to get faucet amount: ${error.message}`);
    }
  }

  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.decimals(),
        this.contract.totalSupply()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      };
    } catch (error: any) {
      console.error('Error getting token info:', error);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }
}

export default BlockchainService;