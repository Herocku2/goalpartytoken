const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("📊 Estado completo de la preventa GOAL...");
  
  // Leer configuración
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const { GoalToken, USDTMock, StandardizedPresale } = deploymentInfo.presale.contracts;
  
  const [user] = await ethers.getSigners();
  
  // Conectar a contratos
  const presale = await ethers.getContractAt("StandardizedPresale", StandardizedPresale);
  const goal = await ethers.getContractAt("TokenFacet", GoalToken);
  const usdt = await ethers.getContractAt("USDTMock", USDTMock);
  
  try {
    console.log("\n🏪 INFORMACIÓN GENERAL DE LA PREVENTA");
    console.log("=" .repeat(50));
    
    // 1. Información básica
    const totalRaised = await presale.totalRaised();
    const immediateDelivery = await presale.immediateDelivery();
    const releaseTime = await presale.releaseTime();
    const paused = await presale.paused();
    
    console.log("📈 Total recaudado:", ethers.formatEther(totalRaised), "USDT");
    console.log("🚀 Entrega inmediata:", immediateDelivery ? "SÍ" : "NO");
    console.log("⏰ Estado:", paused ? "PAUSADA" : "ACTIVA");
    
    if (!immediateDelivery && releaseTime > 0) {
      const currentTime = Math.floor(Date.now() / 1000);
      const canClaim = currentTime >= releaseTime;
      console.log("📅 Liberación de vesting:", new Date(releaseTime * 1000).toLocaleString());
      console.log("🎯 ¿Se puede reclamar?:", canClaim ? "SÍ" : "NO");
      
      if (!canClaim) {
        const timeLeft = releaseTime - currentTime;
        const daysLeft = Math.floor(timeLeft / (24 * 60 * 60));
        const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
        console.log("⏳ Tiempo restante:", `${daysLeft} días y ${hoursLeft} horas`);
      }
    }
    
    // 2. Límites y configuración
    console.log("\n💰 LÍMITES Y CONFIGURACIÓN");
    console.log("=" .repeat(50));
    
    const minPurchase = await presale.minPurchase();
    const maxPurchase = await presale.maxPurchase();
    const hardCap = await presale.hardCapPayment();
    
    console.log("🔻 Compra mínima:", ethers.formatEther(minPurchase), "USDT");
    console.log("🔺 Compra máxima:", ethers.formatEther(maxPurchase), "USDT");
    console.log("🎯 Hard cap:", ethers.formatEther(hardCap), "USDT");
    console.log("📊 Progreso:", ((Number(totalRaised) / Number(hardCap)) * 100).toFixed(2), "%");
    
    // 3. Tiers de precios
    console.log("\n💎 TIERS DE PRECIOS");
    console.log("=" .repeat(50));
    
    const tiersCount = await presale.tiersCount();
    
    for (let i = 0; i < tiersCount; i++) {
      const tier = await presale.tiers(i);
      console.log(`Tier ${i + 1}:`);
      console.log(`   💵 Desde: ${ethers.formatEther(tier.minSpend)} USDT`);
      console.log(`   💰 Precio: ${ethers.formatEther(tier.pricePerToken)} USDT por GOAL`);
      
      // Calcular cuántos GOAL se obtienen por 100 USDT en este tier
      const goalPer100USDT = (100 * 1e18) / Number(tier.pricePerToken);
      console.log(`   🎯 Por 100 USDT: ${(goalPer100USDT / 1e11).toFixed(2)} GOAL`);
      console.log("");
    }
    
    // 4. Balances del contrato
    console.log("🏦 BALANCES DEL CONTRATO");
    console.log("=" .repeat(50));
    
    const contractGoalBalance = await goal.balanceOf(StandardizedPresale);
    const contractUsdtBalance = await usdt.balanceOf(StandardizedPresale);
    
    console.log("🎯 GOAL disponibles:", ethers.formatUnits(contractGoalBalance, 7));
    console.log("💵 USDT en contrato:", ethers.formatEther(contractUsdtBalance));
    
    // 5. Información del usuario actual
    console.log("\n👤 TU INFORMACIÓN");
    console.log("=" .repeat(50));
    
    const userGoalBalance = await goal.balanceOf(user.address);
    const userUsdtBalance = await usdt.balanceOf(user.address);
    const userVestedBalance = await presale.vestedBalance(user.address);
    
    console.log("🔑 Tu dirección:", user.address);
    console.log("🎯 Tu balance GOAL:", ethers.formatUnits(userGoalBalance, 7));
    console.log("💵 Tu balance USDT:", ethers.formatEther(userUsdtBalance));
    console.log("⏰ Tokens en vesting:", ethers.formatUnits(userVestedBalance, 7));
    
    // 6. Simulaciones de compra
    console.log("\n🧮 SIMULACIONES DE COMPRA");
    console.log("=" .repeat(50));
    
    const testAmounts = [
      ethers.parseEther("50"),
      ethers.parseEther("150"),
      ethers.parseEther("1500")
    ];
    
    for (const amount of testAmounts) {
      try {
        const preview = await presale.preview(amount);
        console.log(`💰 Invirtiendo ${ethers.formatEther(amount)} USDT:`);
        console.log(`   🎯 Recibirías: ${ethers.formatUnits(preview.tokensOut, 7)} GOAL`);
        console.log(`   💎 Tier aplicado: ${Number(preview.tierIndex) + 1}`);
        console.log(`   💵 Precio: ${ethers.formatEther(preview.appliedPrice)} USDT por GOAL`);
        console.log("");
      } catch (error) {
        console.log(`❌ Error simulando ${ethers.formatEther(amount)} USDT:`, error.message);
      }
    }
    
    // 7. Enlaces útiles
    console.log("🔗 ENLACES ÚTILES");
    console.log("=" .repeat(50));
    console.log("🎯 GOAL Token:", `https://testnet.bscscan.com/address/${GoalToken}`);
    console.log("💵 USDT Mock:", `https://testnet.bscscan.com/address/${USDTMock}`);
    console.log("🏪 Preventa:", `https://testnet.bscscan.com/address/${StandardizedPresale}`);
    
  } catch (error) {
    console.error("❌ Error obteniendo estado:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });