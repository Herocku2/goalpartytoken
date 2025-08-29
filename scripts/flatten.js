const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("📁 Creando archivos flattened para verificación...");
  
  // Crear directorio flattened si no existe
  const flattenedDir = 'flattened';
  if (!fs.existsSync(flattenedDir)) {
    fs.mkdirSync(flattenedDir);
  }

  // Lista de contratos a flatten
  const contracts = [
    'Diamond.sol',
    'facets/DiamondCutFacet.sol',
    'facets/DiamondLoupeFacet.sol',
    'facets/AuthorizationManagementFacet.sol',
    'facets/TokenFacet.sol',
    'facets/TokenomicsManagementFacet.sol',
    'initializers/TokenInit.sol'
  ];

  for (const contract of contracts) {
    try {
      console.log(`🔄 Flattening ${contract}...`);
      
      const contractName = path.basename(contract, '.sol');
      const outputFile = path.join(flattenedDir, `${contractName}_flattened.sol`);
      
      // Ejecutar hardhat flatten
      const command = `npx hardhat flatten ${contract}`;
      const flattened = execSync(command, { encoding: 'utf8' });
      
      // Guardar archivo flattened
      fs.writeFileSync(outputFile, flattened);
      
      console.log(`✅ ${contractName}_flattened.sol creado`);
    } catch (error) {
      console.error(`❌ Error flattening ${contract}:`, error.message);
    }
  }

  console.log("\n🎉 ¡Todos los archivos flattened han sido creados!");
  console.log("📂 Los archivos están en la carpeta 'flattened/'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });