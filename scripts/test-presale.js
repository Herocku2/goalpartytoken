const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🧪 Probando funcionalidad de la preventa GOAL...");
  
  // Leer información de deployment de la preventa
  if (!fs.existsSync('deployment-info.json')) {
    console.error("❌ No se encontró deployment-info.json. Ejecuta primero deploy-presale.js");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  if (!deploymentInfo.presale) {
    console.error("❌ No se encontró información de preventa en deployment-info.json");
    return;
  }

  const { GoalToken, USDTMock, StandardizedPresale } = deploymentInfo.presale.contracts;
  
  console.log("📋 Contratos a probar:");
  console.log("  GOAL Token:", GoalToken);
  console.log("  USDT Mock:", USDTMock);
  console.log("  Preventa:", StandardizedPresale);

  const [deployer] = await ethers.getSigners();
  
  // Conectar a los contratos
  const goalToken = await ethers.getContractAt("TokenFacet", GoalToken);
  const usdtMock = await ethers.getContractAt("USDTMock", USDTMock);
  const presale = await ethers.getContractAt("StandardizedPresale", StandardizedPresale);

  try {
    // 1. Verificar balances iniciales
    console.log("\n1️⃣ Verificando balances iniciales...");
    
    const goalBalance = await goalToken.balanceOf(deployer.address);
    const usdtBalance = await usdtMock.balanceOf(deployer.address);
    const presaleGoalBalance = await goalToken.balanceOf(StandardizedPresale);
    
    console.log("💰 Balances del deployer:");
    console.log("  GOAL:", ethers.formatUnits(goalBalance, 7));
    console.log("  USDT:", ethers.formatEther(usdtBalance));
    console.log("💼 Balance GOAL en preventa:", ethers.formatUnits(presaleGoalBalance, 7));

    // 2. Probar preview de compra
    console.log("\n2️⃣ Probando preview de compras...");
    
    const testAmounts = [
      ethers.parseEther("50"),    // 50 USDT - Tier 1
      ethers.parseEther("150"),   // 150 USDT - Tier 2  
      ethers.parseEther("1500")   // 1500 USDT - Tier 3
    ];

    for (let i = 0; i < testAmounts.length; i++) {
      const amount = testAmounts[i];
      const preview = await presale.preview(amount);
      
      console.log(`📊 Preview para ${ethers.formatEther(amount)} USDT:`);
      console.log(`   Precio aplicado: ${ethers.formatEther(preview.appliedPrice)} USDT por GOAL`);
      console.log(`   Tier: ${preview.tierIndex}`);
      console.log(`   GOAL a recibir: ${ethers.formatUnits(preview.tokensOut, 7)}`);
    }

    // 3. Realizar una compra de prueba
    console.log("\n3️⃣ Realizando compra de prueba...");
    
    const purchaseAmount = ethers.parseEther("100"); // 100 USDT
    
    // Aprobar USDT al contrato de preventa
    console.log("🔓 Aprobando USDT...");
    await usdtMock.approve(StandardizedPresale, purchaseAmount);
    
    // Obtener balances antes de la compra
    const goalBalanceBefore = await goalToken.balanceOf(deployer.address);
    const usdtBalanceBefore = await usdtMock.balanceOf(deployer.address);
    
    // Realizar la compra
    console.log("🛒 Ejecutando compra...");
    const tx = await presale.buy(purchaseAmount, deployer.address);
    await tx.wait();
    
    // Verificar balances después de la compra
    const goalBalanceAfter = await goalToken.balanceOf(deployer.address);
    const usdtBalanceAfter = await usdtMock.balanceOf(deployer.address);
    
    const goalReceived = goalBalanceAfter - goalBalanceBefore;
    const usdtSpent = usdtBalanceBefore - usdtBalanceAfter;
    
    console.log("✅ Compra exitosa!");
    console.log(`💸 USDT gastados: ${ethers.formatEther(usdtSpent)}`);
    console.log(`🎯 GOAL recibidos: ${ethers.formatUnits(goalReceived, 7)}`);
    
    // 4. Verificar estadísticas de la preventa
    console.log("\n4️⃣ Estadísticas de la preventa...");
    
    const totalRaised = await presale.totalRaised();
    console.log(`💰 Total recaudado: ${ethers.formatEther(totalRaised)} USDT`);
    
    console.log("\n🎉 ¡Todas las pruebas completadas exitosamente!");
    console.log("🔗 Ver preventa en BSCScan:", `https://testnet.bscscan.com/address/${StandardizedPresale}`);
    
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });