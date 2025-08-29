const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("⏰ Configurando sistema de vesting...");
  
  // Leer configuración
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const { StandardizedPresale } = deploymentInfo.presale.contracts;
  
  const [owner] = await ethers.getSigners();
  console.log("🔑 Configurando con la cuenta:", owner.address);
  
  // Configuración de vesting (puedes cambiar estos valores)
  const vestingDays = 50; // Días de vesting
  const currentTime = Math.floor(Date.now() / 1000);
  const vestingSeconds = vestingDays * 24 * 60 * 60;
  const releaseTime = currentTime + vestingSeconds;
  
  console.log("📅 Configuración de vesting:");
  console.log("   Días de vesting:", vestingDays);
  console.log("   Fecha actual:", new Date(currentTime * 1000).toLocaleString());
  console.log("   Fecha de liberación:", new Date(releaseTime * 1000).toLocaleString());
  
  // Conectar al contrato
  const presale = await ethers.getContractAt("StandardizedPresale", StandardizedPresale);
  
  try {
    // 1. Verificar configuración actual
    console.log("\n📊 Configuración actual:");
    const currentImmediateDelivery = await presale.immediateDelivery();
    const currentReleaseTime = await presale.releaseTime();
    
    console.log("   Entrega inmediata:", currentImmediateDelivery);
    if (currentReleaseTime > 0) {
      console.log("   Tiempo de liberación actual:", new Date(Number(currentReleaseTime) * 1000).toLocaleString());
    } else {
      console.log("   Sin vesting configurado");
    }
    
    // 2. Cambiar a modo vesting
    console.log("\n🔄 Cambiando a modo vesting...");
    const setDeliveryTx = await presale.setImmediateDelivery(false);
    await setDeliveryTx.wait();
    console.log("✅ Entrega inmediata desactivada");
    
    // 3. Establecer tiempo de liberación
    console.log("⏰ Estableciendo tiempo de liberación...");
    const setTimeTx = await presale.setReleaseTime(releaseTime);
    await setTimeTx.wait();
    console.log("✅ Tiempo de liberación configurado");
    
    // 4. Verificar nueva configuración
    console.log("\n📊 Nueva configuración:");
    const newImmediateDelivery = await presale.immediateDelivery();
    const newReleaseTime = await presale.releaseTime();
    
    console.log("   Entrega inmediata:", newImmediateDelivery);
    console.log("   Tiempo de liberación:", new Date(Number(newReleaseTime) * 1000).toLocaleString());
    
    // 5. Información adicional
    console.log("\n💡 Información importante:");
    console.log("   - Las nuevas compras se acumularán en vesting");
    console.log("   - Los tokens se podrán reclamar después del", new Date(releaseTime * 1000).toLocaleString());
    console.log("   - Usar la función claim() para reclamar tokens después del vesting");
    
    // 6. Guardar configuración
    const vestingConfig = {
      vestingDays: vestingDays,
      releaseTime: releaseTime,
      releaseDate: new Date(releaseTime * 1000).toISOString(),
      configuredAt: new Date().toISOString(),
      configuredBy: owner.address
    };
    
    // Actualizar deployment info
    deploymentInfo.presale.vestingConfig = vestingConfig;
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Configuración guardada en deployment-info.json");
    console.log("🔗 Ver contrato en BSCScan:", `https://testnet.bscscan.com/address/${StandardizedPresale}`);
    
  } catch (error) {
    console.error("❌ Error durante la configuración:", error.message);
    
    if (error.message.includes("InvalidTime")) {
      console.log("💡 Sugerencia: El tiempo de liberación debe ser futuro");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });