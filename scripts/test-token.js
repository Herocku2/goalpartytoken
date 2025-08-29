const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🧪 Probando funcionalidad del token GOAL...");
  
  // Leer información de deployment
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const diamondAddress = deploymentInfo.contracts.Diamond;
  
  console.log("🔷 Conectando al contrato Diamond:", diamondAddress);
  
  // Conectar al contrato usando la interfaz del TokenFacet
  const tokenFacet = await ethers.getContractAt("TokenFacet", diamondAddress);
  
  try {
    // Obtener información básica del token
    const name = await tokenFacet.name();
    const symbol = await tokenFacet.symbol();
    const decimals = await tokenFacet.decimals();
    const totalSupply = await tokenFacet.totalSupply();
    
    console.log("\n📊 Información del Token:");
    console.log("  Nombre:", name);
    console.log("  Símbolo:", symbol);
    console.log("  Decimales:", decimals.toString());
    console.log("  Supply Total:", ethers.formatUnits(totalSupply, decimals), symbol);
    
    // Obtener balance del deployer
    const [deployer] = await ethers.getSigners();
    const balance = await tokenFacet.balanceOf(deployer.address);
    
    console.log("\n💰 Balance del Deployer:");
    console.log("  Dirección:", deployer.address);
    console.log("  Balance:", ethers.formatUnits(balance, decimals), symbol);
    
    console.log("\n✅ ¡Token funcionando correctamente!");
    console.log("🔗 Ver en BSCScan:", `https://testnet.bscscan.com/address/${diamondAddress}`);
    
  } catch (error) {
    console.error("❌ Error al probar el token:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });