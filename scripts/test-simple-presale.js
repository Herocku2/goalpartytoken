const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🧪 Prueba simple de la preventa GOAL...");
  
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const { GoalToken, USDTMock, StandardizedPresale } = deploymentInfo.presale.contracts;
  
  const [deployer] = await ethers.getSigners();
  
  // Conectar a los contratos
  const goalToken = await ethers.getContractAt("TokenFacet", GoalToken);
  const usdtMock = await ethers.getContractAt("USDTMock", USDTMock);
  const presale = await ethers.getContractAt("StandardizedPresale", StandardizedPresale);

  try {
    console.log("\n📊 Información de contratos:");
    console.log("GOAL Token:", GoalToken);
    console.log("USDT Mock:", USDTMock);
    console.log("Preventa:", StandardizedPresale);

    // 1. Verificar balances
    const goalBalance = await goalToken.balanceOf(deployer.address);
    const usdtBalance = await usdtMock.balanceOf(deployer.address);
    const presaleGoalBalance = await goalToken.balanceOf(StandardizedPresale);
    
    console.log("\n💰 Balances actuales:");
    console.log(`Deployer GOAL: ${ethers.formatUnits(goalBalance, 7)}`);
    console.log(`Deployer USDT: ${ethers.formatEther(usdtBalance)}`);
    console.log(`Preventa GOAL: ${ethers.formatUnits(presaleGoalBalance, 7)}`);

    // 2. Verificar allowance actual
    const currentAllowance = await usdtMock.allowance(deployer.address, StandardizedPresale);
    console.log(`\n🔍 Allowance actual: ${ethers.formatEther(currentAllowance)} USDT`);

    // 3. Probar preview
    const testAmount = ethers.parseEther("100");
    const preview = await presale.preview(testAmount);
    console.log(`\n📊 Preview para ${ethers.formatEther(testAmount)} USDT:`);
    console.log(`Precio: ${ethers.formatEther(preview.appliedPrice)} USDT por GOAL`);
    console.log(`Tier: ${preview.tierIndex}`);
    console.log(`GOAL a recibir: ${ethers.formatUnits(preview.tokensOut, 7)}`);

    // 4. Aprobar una cantidad específica
    console.log("\n🔓 Aprobando 100 USDT...");
    const approveTx = await usdtMock.approve(StandardizedPresale, testAmount);
    await approveTx.wait();
    
    const newAllowance = await usdtMock.allowance(deployer.address, StandardizedPresale);
    console.log(`✅ Nueva allowance: ${ethers.formatEther(newAllowance)} USDT`);

    // 5. Intentar compra
    console.log("\n🛒 Intentando compra...");
    const buyTx = await presale.buy(testAmount, deployer.address);
    await buyTx.wait();
    
    console.log("✅ ¡Compra exitosa!");

    // 6. Verificar balances finales
    const finalGoalBalance = await goalToken.balanceOf(deployer.address);
    const finalUsdtBalance = await usdtMock.balanceOf(deployer.address);
    
    console.log("\n💰 Balances finales:");
    console.log(`Deployer GOAL: ${ethers.formatUnits(finalGoalBalance, 7)}`);
    console.log(`Deployer USDT: ${ethers.formatEther(finalUsdtBalance)}`);
    
    const goalReceived = finalGoalBalance - goalBalance;
    const usdtSpent = usdtBalance - finalUsdtBalance;
    
    console.log(`\n📈 Resultado de la compra:`);
    console.log(`USDT gastados: ${ethers.formatEther(usdtSpent)}`);
    console.log(`GOAL recibidos: ${ethers.formatUnits(goalReceived, 7)}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Información adicional para debugging
    console.log("\n🔍 Información de debugging:");
    console.log("Error completo:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });