const { run } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Iniciando verificación del Mock USDT en BSCScan...");
  
  // Leer información de deployment
  if (!fs.existsSync('deployment-info.json')) {
    console.error("❌ No se encontró deployment-info.json. Ejecuta primero el deployment.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  if (!deploymentInfo.mockUSDT) {
    console.error("❌ No se encontró información de MockUSDT en deployment-info.json");
    return;
  }

  const mockUSDTAddress = deploymentInfo.mockUSDT.contract.address;
  console.log("📋 Mock USDT a verificar:", mockUSDTAddress);

  try {
    console.log("\n🔍 Verificando MockUSDT...");
    await run("verify:verify", {
      address: mockUSDTAddress,
      constructorArguments: [], // MockUSDT no tiene argumentos en el constructor
    });
    console.log("✅ MockUSDT verificado exitosamente");

    console.log("\n🎉 ¡Verificación completada!");
    console.log("🔗 Puedes ver el contrato verificado en:");
    console.log(`   https://testnet.bscscan.com/address/${mockUSDTAddress}`);
    console.log("\n💡 Funciones útiles del Mock USDT:");
    console.log("   - faucet(amount): Para obtener tokens de prueba");
    console.log("   - getFreeTokens(): Para obtener 1,000 USDT gratis");
    console.log("   - Funciones ERC20 estándar: transfer, approve, etc.");

  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  El contrato ya estaba verificado");
      console.log("🔗 Ver en BSCScan:");
      console.log(`   https://testnet.bscscan.com/address/${mockUSDTAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });