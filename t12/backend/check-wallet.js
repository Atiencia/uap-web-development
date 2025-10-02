const { ethers } = require('ethers');
require('dotenv').config();

async function checkWallet() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('=== INFORMACIÓN DE LA WALLET ===');
        console.log('Dirección:', wallet.address);
        
        const balance = await provider.getBalance(wallet.address);
        console.log('Balance ETH:', ethers.formatEther(balance));
        console.log('Balance Wei:', balance.toString());
        
        const network = await provider.getNetwork();
        console.log('Red:', network.name, '(ChainID:', network.chainId.toString(), ')');
        
        if (balance === BigInt(0)) {
            console.log('\n🚨 PROBLEMA: La wallet no tiene ETH para pagar gas!');
            console.log('\n� FAUCETS RECOMENDADOS (que SÍ funcionan):');
            console.log('1. 🔥 Chainlink: https://faucets.chain.link/sepolia');
            console.log('2. 🚀 QuickNode: https://faucet.quicknode.com/ethereum/sepolia');
            console.log('3. ⚡ Infura: https://www.infura.io/faucet/sepolia');
            console.log('\n📋 USA ESTA DIRECCIÓN:', wallet.address);
            console.log('\n⏰ Después de obtener ETH, ejecuta: node check-wallet.js');
        } else {
            console.log('\n✅ La wallet tiene fondos suficientes');
            console.log('🎉 ¡Ya puedes reclamar tokens!');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkWallet();