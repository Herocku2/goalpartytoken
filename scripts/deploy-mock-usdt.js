const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment del Mock USDT en BSC Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying con la cuenta:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(balance), "BNB");

  // Deploy MockUSDT
  console.log("\n💵 Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

  // Verificar información del token
  const name = await mockUSDT.name();
  const symbol = await mockUSDT.symbol();
  const decimals = await mockUSDT.decimals();
  const totalSupply = await mockUSDT.totalSupply();
  const deployerBalance = await mockUSDT.balanceOf(deployer.address);

  console.log("\n📊 Información del Mock USDT:");
  console.log("  Nombre:", name);
  console.log("  Símbolo:", symbol);
  console.log("  Decimales:", decimals.toString());
  console.log("  Supply Total:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("  Balance del Deployer:", ethers.formatUnits(deployerBalance, decimals), symbol);

  // Guardar información de deployment
  const deploymentInfo = {
    network: "BSC Testnet",
    deployer: deployer.address,
    contract: {
      name: "MockUSDT",
      address: mockUSDTAddress,
      symbol: symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString()
    },
    timestamp: new Date().toISOString()
  };

  // Leer deployment info existente y agregar MockUSDT
  const fs = require('fs');
  let existingInfo = {};
  if (fs.existsSync('deployment-info.json')) {
    existingInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  }
  
  existingInfo.mockUSDT = deploymentInfo;
  fs.writeFileSync('deployment-info.json', JSON.stringify(existingInfo, null, 2));

  console.log("\n🎉 ¡Mock USDT deployment completado exitosamente!");
  console.log("📄 Información actualizada en deployment-info.json");
  console.log("\n📋 Resumen:");
  console.log("🔸 Mock USDT:", mockUSDTAddress);
  console.log("🔸 Supply inicial:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("🔸 Funciones disponibles:");
  console.log("   - faucet(amount): Obtener hasta 10,000 USDT");
  console.log("   - getFreeTokens(): Obtener 1,000 USDT gratis");
  console.log("   - mint(to, amount): Mintear tokens (solo owner)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el deployment:", error);
    process.exit(1);
  });