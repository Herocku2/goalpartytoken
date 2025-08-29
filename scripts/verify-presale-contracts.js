const { run } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Iniciando verificación de contratos de preventa en BSCScan...");
  
  // Leer información de deployment
  if (!fs.existsSync('deployment-info.json')) {
    console.error("❌ No se encontró deployment-info.json. Ejecuta primero el deployment.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  if (!deploymentInfo.presale) {
    console.error("❌ No se encontró información de preventa en deployment-info.json");
    return;
  }

  const { GoalToken, USDTMock, StandardizedPresale } = deploymentInfo.presale.contracts;
  
  console.log("📋 Contratos a verificar:");
  console.log("  GOAL Token:", GoalToken);
  console.log("  USDT Mock:", USDTMock);
  console.log("  Preventa:", StandardizedPresale);

  try {
    // 1. Verificar USDTMock
    console.log("\n1️⃣ Verificando USDTMock...");
    await run("verify:verify", {
      address: USDTMock,
      constructorArguments: [], // USDTMock no tiene argumentos en el constructor
    });
    console.log("✅ USDTMock verificado exitosamente");

    // 2. Verificar StandardizedPresale
    console.log("\n2️⃣ Verificando StandardizedPresale...");
    
    // Argumentos del constructor para StandardizedPresale
    const constructorArgs = [
      GoalToken,                                    // _saleToken
      USDTMock,                                    // _paymentToken
      deploymentInfo.presale.deployer,             // _fundsWallet
      true,                                        // _immediateDelivery
      0,                                          // _releaseTime
      [                                           // _minSpends
        "0",
        "100000000000000000000",
        "1000000000000000000000"
      ],
      [                                           // _pricesPerToken
        "100000000000000000",
        "80000000000000000", 
        "50000000000000000"
      ]
    ];

    await run("verify:verify", {
      address: StandardizedPresale,
      constructorArguments: constructorArgs,
    });
    console.log("✅ StandardizedPresale verificado exitosamente");

    console.log("\n🎉 ¡Todos los contratos han sido verificados!");
    console.log("🔗 Enlaces a BSCScan:");
    console.log(`   USDTMock: https://testnet.bscscan.com/address/${USDTMock}`);
    console.log(`   Preventa: https://testnet.bscscan.com/address/${StandardizedPresale}`);
    console.log(`   GOAL Token: https://testnet.bscscan.com/address/${GoalToken}`);

    console.log("\n💡 Funcionalidades verificadas:");
    console.log("📊 USDTMock:");
    console.log("   - mint(to, amount): Mintear tokens (solo owner)");
    console.log("   - burnFromAccount(account, amount): Quemar tokens (solo owner)");
    console.log("   - Funciones ERC20 estándar");
    
    console.log("🏪 StandardizedPresale:");
    console.log("   - buy(amountInPaymentToken, recipient): Comprar tokens");
    console.log("   - preview(amountInPaymentToken): Ver cotización");
    console.log("   - Sistema de tiers con precios escalonados");
    console.log("   - Entrega inmediata de tokens GOAL");

  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Algunos contratos ya estaban verificados");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });