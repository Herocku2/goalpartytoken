const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment del token GOAL en BSC Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying con la cuenta:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(balance), "BNB");

  // 1. Deploy DiamondCutFacet
  console.log("\n1️⃣ Deploying DiamondCutFacet...");
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.waitForDeployment();
  const diamondCutAddress = await diamondCutFacet.getAddress();
  console.log("✅ DiamondCutFacet deployed to:", diamondCutAddress);

  // 2. Deploy DiamondLoupeFacet
  console.log("\n2️⃣ Deploying DiamondLoupeFacet...");
  const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
  const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
  await diamondLoupeFacet.waitForDeployment();
  const diamondLoupeAddress = await diamondLoupeFacet.getAddress();
  console.log("✅ DiamondLoupeFacet deployed to:", diamondLoupeAddress);

  // 3. Deploy AuthorizationManagementFacet
  console.log("\n3️⃣ Deploying AuthorizationManagementFacet...");
  const AuthorizationManagementFacet = await ethers.getContractFactory("AuthorizationManagementFacet");
  const authorizationManagementFacet = await AuthorizationManagementFacet.deploy();
  await authorizationManagementFacet.waitForDeployment();
  const authorizationManagementAddress = await authorizationManagementFacet.getAddress();
  console.log("✅ AuthorizationManagementFacet deployed to:", authorizationManagementAddress);

  // 4. Deploy TokenFacet
  console.log("\n4️⃣ Deploying TokenFacet...");
  const TokenFacet = await ethers.getContractFactory("TokenFacet");
  const tokenFacet = await TokenFacet.deploy();
  await tokenFacet.waitForDeployment();
  const tokenFacetAddress = await tokenFacet.getAddress();
  console.log("✅ TokenFacet deployed to:", tokenFacetAddress);

  // 5. Deploy TokenomicsManagementFacet
  console.log("\n5️⃣ Deploying TokenomicsManagementFacet...");
  const TokenomicsManagementFacet = await ethers.getContractFactory("TokenomicsManagementFacet");
  const tokenomicsManagementFacet = await TokenomicsManagementFacet.deploy();
  await tokenomicsManagementFacet.waitForDeployment();
  const tokenomicsManagementAddress = await tokenomicsManagementFacet.getAddress();
  console.log("✅ TokenomicsManagementFacet deployed to:", tokenomicsManagementAddress);

  // 6. Deploy TokenInit
  console.log("\n6️⃣ Deploying TokenInit...");
  const TokenInit = await ethers.getContractFactory("TokenInit");
  const tokenInit = await TokenInit.deploy();
  await tokenInit.waitForDeployment();
  const tokenInitAddress = await tokenInit.getAddress();
  console.log("✅ TokenInit deployed to:", tokenInitAddress);

  // 7. Deploy Diamond (Main Contract)
  console.log("\n7️⃣ Deploying Diamond (Main Contract)...");
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(
    diamondCutAddress,
    diamondLoupeAddress,
    authorizationManagementAddress,
    tokenFacetAddress,
    tokenInitAddress
  );
  await diamond.waitForDeployment();
  const diamondAddress = await diamond.getAddress();
  console.log("✅ Diamond (GOAL Token) deployed to:", diamondAddress);

  // Guardar las direcciones para verificación
  const deploymentInfo = {
    network: "BSC Testnet",
    deployer: deployer.address,
    contracts: {
      Diamond: diamondAddress,
      DiamondCutFacet: diamondCutAddress,
      DiamondLoupeFacet: diamondLoupeAddress,
      AuthorizationManagementFacet: authorizationManagementAddress,
      TokenFacet: tokenFacetAddress,
      TokenomicsManagementFacet: tokenomicsManagementAddress,
      TokenInit: tokenInitAddress
    },
    timestamp: new Date().toISOString()
  };

  // Guardar información de deployment
  const fs = require('fs');
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 ¡Deployment completado exitosamente!");
  console.log("📄 Información guardada en deployment-info.json");
  console.log("\n📋 Resumen de contratos:");
  console.log("🔷 GOAL Token (Diamond):", diamondAddress);
  console.log("🔸 DiamondCutFacet:", diamondCutAddress);
  console.log("🔸 DiamondLoupeFacet:", diamondLoupeAddress);
  console.log("🔸 AuthorizationManagementFacet:", authorizationManagementAddress);
  console.log("🔸 TokenFacet:", tokenFacetAddress);
  console.log("🔸 TokenomicsManagementFacet:", tokenomicsManagementAddress);
  console.log("🔸 TokenInit:", tokenInitAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el deployment:", error);
    process.exit(1);
  });