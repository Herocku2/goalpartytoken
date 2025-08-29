const { run } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Iniciando verificación de contratos en BSCScan...");
  
  // Leer información de deployment
  if (!fs.existsSync('deployment-info.json')) {
    console.error("❌ No se encontró deployment-info.json. Ejecuta primero el deployment.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const contracts = deploymentInfo.contracts;

  console.log("📋 Contratos a verificar:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  try {
    // 1. Verificar DiamondCutFacet
    console.log("\n1️⃣ Verificando DiamondCutFacet...");
    await run("verify:verify", {
      address: contracts.DiamondCutFacet,
      constructorArguments: [],
    });
    console.log("✅ DiamondCutFacet verificado");

    // 2. Verificar DiamondLoupeFacet
    console.log("\n2️⃣ Verificando DiamondLoupeFacet...");
    await run("verify:verify", {
      address: contracts.DiamondLoupeFacet,
      constructorArguments: [],
    });
    console.log("✅ DiamondLoupeFacet verificado");

    // 3. Verificar AuthorizationManagementFacet
    console.log("\n3️⃣ Verificando AuthorizationManagementFacet...");
    await run("verify:verify", {
      address: contracts.AuthorizationManagementFacet,
      constructorArguments: [],
    });
    console.log("✅ AuthorizationManagementFacet verificado");

    // 4. Verificar TokenFacet
    console.log("\n4️⃣ Verificando TokenFacet...");
    await run("verify:verify", {
      address: contracts.TokenFacet,
      constructorArguments: [],
    });
    console.log("✅ TokenFacet verificado");

    // 5. Verificar TokenomicsManagementFacet
    console.log("\n5️⃣ Verificando TokenomicsManagementFacet...");
    await run("verify:verify", {
      address: contracts.TokenomicsManagementFacet,
      constructorArguments: [],
    });
    console.log("✅ TokenomicsManagementFacet verificado");

    // 6. Verificar TokenInit
    console.log("\n6️⃣ Verificando TokenInit...");
    await run("verify:verify", {
      address: contracts.TokenInit,
      constructorArguments: [],
    });
    console.log("✅ TokenInit verificado");

    // 7. Verificar Diamond (contrato principal)
    console.log("\n7️⃣ Verificando Diamond (contrato principal)...");
    await run("verify:verify", {
      address: contracts.Diamond,
      constructorArguments: [
        contracts.DiamondCutFacet,
        contracts.DiamondLoupeFacet,
        contracts.AuthorizationManagementFacet,
        contracts.TokenFacet,
        contracts.TokenInit
      ],
    });
    console.log("✅ Diamond verificado");

    console.log("\n🎉 ¡Todos los contratos han sido verificados exitosamente!");
    console.log("🔗 Puedes ver los contratos verificados en:");
    console.log(`   https://testnet.bscscan.com/address/${contracts.Diamond}`);

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