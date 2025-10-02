const { ethers } = require('ethers');
require('dotenv').config();

async function checkBothWallets() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');
        
        // Wallet del backend
        const backendWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const backendBalance = await provider.getBalance(backendWallet.address);
        
        // Todas las direcciones que hemos visto
        const addresses = [
            { name: 'BACKEND (.env)', address: backendWallet.address },
            { name: 'FRONTEND ACTUAL (logs)', address: '0x98e37B6F6153a88F458409e3C2543B254cd1582c' },
            { name: 'METAMASK Account 1', address: '0x98e37B6F6153a88F458409e3C2543B254cd1582c' }
        ];
        
        console.log('=== TODAS LAS WALLETS ===');
        
        for (const wallet of addresses) {
            const balance = await provider.getBalance(wallet.address);
            const ethBalance = ethers.formatEther(balance);
            console.log(`\n${wallet.name}:`);
            console.log(`Dirección: ${wallet.address}`);
            console.log(`Balance: ${ethBalance} ETH ${ethBalance > 0 ? '✅ TIENE ETH' : '❌ SIN ETH'}`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 RESUMEN:');
        
        // Encontrar cuál tiene ETH
        const walletWithEth = addresses.find(async (wallet) => {
            const balance = await provider.getBalance(wallet.address);
            return balance > 0;
        });
        
        const backendBal = await provider.getBalance(backendWallet.address);
        
        if (backendBal > 0) {
            console.log('✅ EL BACKEND TIENE ETH - La app debería funcionar');
            console.log('💡 PROBLEMA: Hay un bug en el código que impide usar el ETH del backend');
        } else {
            console.log('❌ EL BACKEND NO TIENE ETH');
            console.log('💡 SOLUCIÓN: Necesitas actualizar la PRIVATE_KEY en .env');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkBothWallets();