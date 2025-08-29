const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🎯 Script para reclamar tokens en vesting...");
  
  // Leer configuración
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const { GoalToken, StandardizedPresale } = deploymentInfo.presale.contracts;
  
  const [claimer] = await ethers.getSigners();
  console.log("🔑 Reclamando con la cuenta:", claimer.address);
  
  // Conectar a contratos
  const presale = await ethers.getContractAt("StandardizedPresale", StandardizedPresale);
  const goal = await ethers.getContractAt("TokenFacet", GoalToken);
  
  try {
    // 1. Verificar configuración de vesting
    console.log("\n📊 Verificando configuración de vesting...");
    const immediateDelivery = await presale.immediateDelivery();
    const releaseTime = await presale.releaseTime();
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("   Entrega inmediata:", immediateDelivery);
    console.log("   Tiempo actual:", new Date(currentTime * 1000).toLocaleString());
    console.log("   Tiempo de liberación:", new Date(releaseTime * 1000).toLocaleString());
    
    if (immediateDelivery) {
      console.log("⚠️  El vesting no está activado. Los tokens se entregan inmediatamente.");
      return;
    }
    
    // 2. Verificar si ya es tiempo de reclamar
    const canClaim = currentTime >= releaseTime;
    console.log("   ¿Se puede reclamar?:", canClaim);
    
    if (!canClaim) {
      const timeLeft = releaseTime - currentTime;
      const daysLeft = Math.floor(timeLeft / (24 * 60 * 60));
      const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
      
      console.log(`⏰ Tiempo restante: ${daysLeft} días y ${hoursLeft} horas`);
      console.log("❌ Aún no es tiempo de reclamar los tokens");
      return;
    }
    
    // 3. Verificar balance en vesting
    console.log("\n💰 Verificando balance en vesting...");
    const vestedBalance = await presale.vestedBalance(claimer.address);
    
    console.log("   Tokens en vesting:", ethers.formatUnits(vestedBalance, 7), "GOAL");
    
    if (vestedBalance == 0) {
      console.log("❌ No tienes tokens en vesting para reclamar");
      return;
    }
    
    // 4. Verificar balance actual de GOAL
    const goalBalanceBefore = await goal.balanceOf(claimer.address);
    console.log("   Balance GOAL actual:", ethers.formatUnits(goalBalanceBefore, 7));
    
    // 5. Reclamar tokens
    console.log("\n🎯 Reclamando tokens...");
    const claimTx = await presale.claim();
    await claimTx.wait();
    
    // 6. Verificar resultados
    const goalBalanceAfter = await goal.balanceOf(claimer.address);
    const newVestedBalance = await presale.vestedBalance(claimer.address);
    
    const tokensReceived = goalBalanceAfter - goalBalanceBefore;
    
    console.log("\n🎉 ¡Tokens reclamados exitosamente!");
    console.log("📈 Resultados:");
    console.log("   Tokens reclamados:", ethers.formatUnits(tokensReceived, 7), "GOAL");
    console.log("   Balance GOAL final:", ethers.formatUnits(goalBalanceAfter, 7));
    console.log("   Tokens restantes en vesting:", ethers.formatUnits(newVestedBalance, 7));
    
    // 7. Información de la transacción
    console.log("\n🔗 Información de la transacción:");
    console.log("   Hash:", claimTx.hash);
    console.log("   Ver en BSCScan:", `https://testnet.bscscan.com/tx/${claimTx.hash}`);
    
  } catch (error) {
    console.error("❌ Error durante el reclamo:", error.message);
    
    if (error.message.includes("InvalidTime")) {
      console.log("💡 Sugerencia: Aún no es tiempo de reclamar los tokens");
    } else if (error.message.includes("NothingToClaim")) {
      console.log("💡 Sugerencia: No tienes tokens para reclamar");
    } else if (error.message.includes("Claim disabled")) {
      console.log("💡 Sugerencia: El vesting no está activado");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });