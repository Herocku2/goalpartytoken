const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🛒 Script para comprar tokens GOAL...");
  
  // Leer configuración
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const { GoalToken, USDTMock, StandardizedPresale } = deploymentInfo.presale.contracts;
  
  const [buyer] = await ethers.getSigners();
  console.log("🔑 Comprando con la cuenta:", buyer.address);
  
  // Cantidad a comprar (puedes cambiar este valor)
  const usdtAmount = ethers.parseEther("500"); // 500 USDT
  
  console.log("💰 Cantidad a invertir:", ethers.formatEther(usdtAmount), "USDT");
  
  // Conectar a contratos
  const usdt = await ethers.getContractAt("USDTMock", USDTMock);
  const presale = await ethers.getContractAt("StandardizedPresale", StandardizedPresale);
  const goal = await ethers.getContractAt("TokenFacet", GoalToken);
  
  try {
    // 1. Verificar balance de USDT
    const usdtBalance = await usdt.balanceOf(buyer.address);
    console.log("💵 Balance USDT actual:", ethers.formatEther(usdtBalance));
    
    if (usdtBalance < usdtAmount) {
      console.log("⚠️  Balance insuficiente. Minteando USDT...");
      await usdt.mint(buyer.address, usdtAmount);
      console.log("✅ USDT minteados exitosamente");
    }
    
    // 2. Ver preview de la compra
    console.log("\n📊 Preview de la compra:");
    const preview = await presale.preview(usdtAmount);
    console.log("   Precio aplicado:", ethers.formatEther(preview.appliedPrice), "USDT por GOAL");
    console.log("   Tier:", preview.tierIndex.toString());
    console.log("   GOAL a recibir:", ethers.formatUnits(preview.tokensOut, 7));
    
    // 3. Aprobar USDT
    console.log("\n🔓 Aprobando USDT al contrato de preventa...");
    const approveTx = await usdt.approve(StandardizedPresale, usdtAmount);
    await approveTx.wait();
    console.log("✅ Aprobación exitosa");
    
    // 4. Verificar balances antes de la compra
    const goalBalanceBefore = await goal.balanceOf(buyer.address);
    const usdtBalanceBefore = await usdt.balanceOf(buyer.address);
    
    // 5. Realizar la compra
    console.log("\n🛒 Ejecutando compra...");
    const buyTx = await presale.buy(usdtAmount, buyer.address);
    await buyTx.wait();
    
    // 6. Verificar resultados
    const goalBalanceAfter = await goal.balanceOf(buyer.address);
    const usdtBalanceAfter = await usdt.balanceOf(buyer.address);
    
    const goalReceived = goalBalanceAfter - goalBalanceBefore;
    const usdtSpent = usdtBalanceBefore - usdtBalanceAfter;
    
    console.log("\n🎉 ¡Compra exitosa!");
    console.log("📈 Resultados:");
    console.log("   USDT gastados:", ethers.formatEther(usdtSpent));
    console.log("   GOAL recibidos:", ethers.formatUnits(goalReceived, 7));
    
    // 7. Mostrar balances finales
    console.log("\n💰 Balances finales:");
    console.log("   GOAL:", ethers.formatUnits(goalBalanceAfter, 7));
    console.log("   USDT:", ethers.formatEther(usdtBalanceAfter));
    
    // 8. Información de la transacción
    console.log("\n🔗 Información de la transacción:");
    console.log("   Hash:", buyTx.hash);
    console.log("   Ver en BSCScan:", `https://testnet.bscscan.com/tx/${buyTx.hash}`);
    
  } catch (error) {
    console.error("❌ Error durante la compra:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });