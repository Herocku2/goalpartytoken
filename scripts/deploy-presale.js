const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment del sistema de preventa GOAL...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying con la cuenta:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(balance), "BNB");

  // 1. Deploy USDTMock (usando el contrato que me proporcionaste)
  console.log("\n1️⃣ Deploying USDTMock...");
  const USDTMock = await ethers.getContractFactory("USDTMock");
  const usdtMock = await USDTMock.deploy();
  await usdtMock.waitForDeployment();
  const usdtAddress = await usdtMock.getAddress();
  console.log("✅ USDTMock deployed to:", usdtAddress);

  // Verificar información del USDTMock
  const usdtName = await usdtMock.name();
  const usdtSymbol = await usdtMock.symbol();
  const usdtDecimals = await usdtMock.decimals();
  const usdtTotalSupply = await usdtMock.totalSupply();
  
  console.log("📊 Información del USDTMock:");
  console.log("  Nombre:", usdtName);
  console.log("  Símbolo:", usdtSymbol);
  console.log("  Decimales:", usdtDecimals.toString());
  console.log("  Supply Total:", ethers.formatEther(usdtTotalSupply), usdtSymbol);

  // 2. Deploy StandardizedPresale (usando el contrato de preventa general)
  console.log("\n2️⃣ Deploying StandardizedPresale...");
  
  // Leer información del token GOAL ya deployado
  const fs = require('fs');
  let goalTokenAddress;
  
  if (fs.existsSync('deployment-info.json')) {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    goalTokenAddress = deploymentInfo.contracts.Diamond;
    console.log("📋 Usando token GOAL existente:", goalTokenAddress);
  } else {
    console.error("❌ No se encontró deployment-info.json. Ejecuta primero el deployment del token GOAL.");
    return;
  }

  // Configuración de la preventa según el contrato StandardizedPresale
  const fundsWallet = deployer.address; // Wallet que recibirá los pagos
  const immediateDelivery = true; // Entrega inmediata
  const releaseTime = 0; // No aplica para entrega inmediata
  
  // Configuración de tiers de precios
  // USDT tiene 18 decimales, GOAL tiene 7 decimales
  // Tier 1: 0+ USDT = 0.10 USDT por GOAL 
  // Tier 2: 100+ USDT = 0.08 USDT por GOAL  
  // Tier 3: 1000+ USDT = 0.05 USDT por GOAL
  const minSpends = [
    ethers.parseEther("0"),      // Tier 1: desde 0 USDT
    ethers.parseEther("100"),    // Tier 2: desde 100 USDT
    ethers.parseEther("1000")    // Tier 3: desde 1000 USDT
  ];
  
  const pricesPerToken = [
    ethers.parseEther("0.10"),   // 0.10 USDT por GOAL
    ethers.parseEther("0.08"),   // 0.08 USDT por GOAL
    ethers.parseEther("0.05")    // 0.05 USDT por GOAL
  ];

  const StandardizedPresale = await ethers.getContractFactory("StandardizedPresale");
  const presale = await StandardizedPresale.deploy(
    goalTokenAddress,    // Token que se vende (GOAL)
    usdtAddress,        // Token de pago (USDT Mock)
    fundsWallet,        // Wallet para recibir pagos
    immediateDelivery,  // Entrega inmediata
    releaseTime,        // Tiempo de liberación (0 para inmediato)
    minSpends,          // Montos mínimos por tier
    pricesPerToken      // Precios por tier
  );
  
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();
  console.log("✅ StandardizedPresale deployed to:", presaleAddress);

  // 3. Configurar límites de la preventa
  console.log("\n3️⃣ Configurando límites de preventa...");
  const minPurchase = ethers.parseEther("10");     // Mínimo 10 USDT
  const maxPurchase = ethers.parseEther("10000");  // Máximo 10,000 USDT por transacción
  const hardCap = ethers.parseEther("1000000");    // Tope total: 1,000,000 USDT
  
  await presale.setLimits(minPurchase, maxPurchase, hardCap);
  console.log("✅ Límites configurados:");
  console.log("   - Compra mínima: 10 USDT");
  console.log("   - Compra máxima: 10,000 USDT");
  console.log("   - Hard cap: 1,000,000 USDT");

  // 4. Transferir tokens GOAL al contrato de preventa
  console.log("\n4️⃣ Transfiriendo tokens GOAL al contrato de preventa...");
  
  // Conectar al token GOAL usando la interfaz TokenFacet
  const goalToken = await ethers.getContractAt("TokenFacet", goalTokenAddress);
  const presaleAllocation = ethers.parseUnits("50000000", 7); // 50M GOAL para preventa
  
  await goalToken.transfer(presaleAddress, presaleAllocation);
  console.log("✅ Transferidos 50,000,000 GOAL al contrato de preventa");

  // Guardar información del deployment
  const presaleInfo = {
    network: "BSC Testnet",
    deployer: deployer.address,
    contracts: {
      GoalToken: goalTokenAddress,
      USDTMock: usdtAddress,
      StandardizedPresale: presaleAddress
    },
    presaleConfig: {
      fundsWallet: fundsWallet,
      immediateDelivery: immediateDelivery,
      minPurchase: "10 USDT",
      maxPurchase: "10,000 USDT", 
      hardCap: "1,000,000 USDT",
      tiers: [
        { minSpend: "0 USDT", price: "0.10 USDT per GOAL" },
        { minSpend: "100 USDT", price: "0.08 USDT per GOAL" },
        { minSpend: "1000 USDT", price: "0.05 USDT per GOAL" }
      ]
    },
    timestamp: new Date().toISOString()
  };

  // Actualizar deployment-info.json existente
  let existingInfo = {};
  if (fs.existsSync('deployment-info.json')) {
    existingInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  }
  
  existingInfo.presale = presaleInfo;
  fs.writeFileSync('deployment-info.json', JSON.stringify(existingInfo, null, 2));

  console.log("\n🎉 ¡Sistema de preventa deployado exitosamente!");
  console.log("📄 Información actualizada en deployment-info.json");
  console.log("\n📋 Resumen de contratos:");
  console.log("🎯 GOAL Token:", goalTokenAddress);
  console.log("💵 USDT Mock:", usdtAddress);
  console.log("🏪 Preventa:", presaleAddress);
  
  console.log("\n💡 Funciones disponibles:");
  console.log("- buy(amountInPaymentToken, recipient): Comprar tokens");
  console.log("- preview(amountInPaymentToken): Ver preview de compra");
  console.log("- mint(to, amount): Mintear USDT (solo owner)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el deployment:", error);
    process.exit(1);
  });