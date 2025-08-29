# 🏪 Guía Completa de Preventa GOAL Token

Esta guía te explica paso a paso cómo realizar ventas de tokens GOAL y configurar el sistema de vesting.

## 📋 Información General

### Contratos Desplegados
- **GOAL Token**: `0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62`
- **USDT Mock**: `0xc906139A6a3f1728C0385b71300d92CeCE306D58`
- **Preventa**: `0x344C842C5C44ED83E9dc2f09C6C60E537AD14012`
- **Red**: BSC Testnet (Chain ID: 97)

### Sistema de Precios por Tiers
1. **Tier 1**: 0+ USDT = 0.10 USDT por GOAL
2. **Tier 2**: 100+ USDT = 0.08 USDT por GOAL
3. **Tier 3**: 1000+ USDT = 0.05 USDT por GOAL

---

## 🛒 Cómo Comprar Tokens GOAL

### Paso 1: Obtener USDT de Prueba

#### Opción A: Usar la función mint (solo owner)
```javascript
// Conectar al contrato USDTMock
const usdtContract = await ethers.getContractAt("USDTMock", "0xc906139A6a3f1728C0385b71300d92CeCE306D58");

// Mintear 1000 USDT a una dirección
await usdtContract.mint("0xDireccionDestino", ethers.parseEther("1000"));
```

#### Opción B: Script automatizado
```bash
# Ejecutar script para obtener USDT
npm run get-usdt
```

### Paso 2: Aprobar USDT al Contrato de Preventa

```javascript
// Cantidad a aprobar (ejemplo: 500 USDT)
const amount = ethers.parseEther("500");

// Aprobar al contrato de preventa
await usdtContract.approve("0x344C842C5C44ED83E9dc2f09C6C60E537AD14012", amount);
```

### Paso 3: Ver Preview de la Compra

```javascript
// Conectar al contrato de preventa
const presaleContract = await ethers.getContractAt("StandardizedPresale", "0x344C842C5C44ED83E9dc2f09C6C60E537AD14012");

// Ver preview para 500 USDT
const preview = await presaleContract.preview(ethers.parseEther("500"));

console.log("Precio aplicado:", ethers.formatEther(preview.appliedPrice), "USDT por GOAL");
console.log("Tier:", preview.tierIndex.toString());
console.log("GOAL a recibir:", ethers.formatUnits(preview.tokensOut, 7));
```

### Paso 4: Realizar la Compra

```javascript
// Realizar la compra
const buyTx = await presaleContract.buy(
    ethers.parseEther("500"),  // Cantidad en USDT
    "0xDireccionReceptor"      // Dirección que recibirá los GOAL
);

await buyTx.wait();
console.log("¡Compra exitosa!");
```

---

## ⏰ Configurar Vesting (Entrega Diferida)

### Cambiar de Entrega Inmediata a Vesting de 50 Días

#### Paso 1: Calcular Timestamp de Liberación

```javascript
// Calcular 50 días desde ahora
const currentTime = Math.floor(Date.now() / 1000);
const fiftyDaysInSeconds = 50 * 24 * 60 * 60; // 50 días * 24 horas * 60 minutos * 60 segundos
const releaseTime = currentTime + fiftyDaysInSeconds;

console.log("Tiempo de liberación:", new Date(releaseTime * 1000));
```

#### Paso 2: Configurar el Vesting

```javascript
// Conectar al contrato de preventa
const presaleContract = await ethers.getContractAt("StandardizedPresale", "0x344C842C5C44ED83E9dc2f09C6C60E537AD14012");

// Cambiar a modo vesting
await presaleContract.setImmediateDelivery(false);

// Establecer tiempo de liberación (50 días)
await presaleContract.setReleaseTime(releaseTime);

console.log("Vesting configurado para 50 días");
```

### Verificar Configuración de Vesting

```javascript
// Verificar configuración actual
const immediateDelivery = await presaleContract.immediateDelivery();
const releaseTime = await presaleContract.releaseTime();

console.log("Entrega inmediata:", immediateDelivery);
console.log("Tiempo de liberación:", new Date(releaseTime * 1000));
```

---

## 🔄 Flujo Completo con Vesting

### 1. Compra con Vesting Activo

```javascript
// Los tokens se acumulan en vestedBalance[comprador]
const buyTx = await presaleContract.buy(
    ethers.parseEther("1000"),
    "0xCompradorAddress"
);

// Verificar balance en vesting
const vestedBalance = await presaleContract.vestedBalance("0xCompradorAddress");
console.log("Tokens en vesting:", ethers.formatUnits(vestedBalance, 7));
```

### 2. Reclamar Tokens Después del Vesting

```javascript
// Solo funciona después del releaseTime
const claimTx = await presaleContract.claim();
await claimTx.wait();

console.log("¡Tokens reclamados exitosamente!");
```

---

## 🛠️ Scripts de Automatización

### Script para Compra Automática

```javascript
// scripts/buy-goal-tokens.js
const { ethers } = require("hardhat");

async function main() {
    const [buyer] = await ethers.getSigners();
    const usdtAmount = ethers.parseEther("500"); // 500 USDT
    
    // Contratos
    const usdt = await ethers.getContractAt("USDTMock", "0xc906139A6a3f1728C0385b71300d92CeCE306D58");
    const presale = await ethers.getContractAt("StandardizedPresale", "0x344C842C5C44ED83E9dc2f09C6C60E537AD14012");
    
    // 1. Aprobar USDT
    console.log("Aprobando USDT...");
    await usdt.approve(presale.address, usdtAmount);
    
    // 2. Ver preview
    const preview = await presale.preview(usdtAmount);
    console.log(`Recibirás: ${ethers.formatUnits(preview.tokensOut, 7)} GOAL`);
    
    // 3. Comprar
    console.log("Comprando tokens...");
    await presale.buy(usdtAmount, buyer.address);
    
    console.log("¡Compra completada!");
}

main().catch(console.error);
```

### Script para Configurar Vesting

```javascript
// scripts/setup-vesting.js
const { ethers } = require("hardhat");

async function main() {
    const days = 50; // Días de vesting
    const releaseTime = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60);
    
    const presale = await ethers.getContractAt("StandardizedPresale", "0x344C842C5C44ED83E9dc2f09C6C60E537AD14012");
    
    // Configurar vesting
    await presale.setImmediateDelivery(false);
    await presale.setReleaseTime(releaseTime);
    
    console.log(`Vesting configurado para ${days} días`);
    console.log(`Liberación: ${new Date(releaseTime * 1000)}`);
}

main().catch(console.error);
```

---

## 📊 Funciones de Consulta Útiles

### Verificar Estado de la Preventa

```javascript
const presale = await ethers.getContractAt("StandardizedPresale", "0x344C842C5C44ED83E9dc2f09C6C60E537AD14012");

// Información general
const totalRaised = await presale.totalRaised();
const immediateDelivery = await presale.immediateDelivery();
const releaseTime = await presale.releaseTime();

console.log("Total recaudado:", ethers.formatEther(totalRaised), "USDT");
console.log("Entrega inmediata:", immediateDelivery);
console.log("Tiempo de liberación:", new Date(releaseTime * 1000));

// Límites
const minPurchase = await presale.minPurchase();
const maxPurchase = await presale.maxPurchase();
const hardCap = await presale.hardCapPayment();

console.log("Compra mínima:", ethers.formatEther(minPurchase), "USDT");
console.log("Compra máxima:", ethers.formatEther(maxPurchase), "USDT");
console.log("Hard cap:", ethers.formatEther(hardCap), "USDT");
```

### Verificar Tiers de Precios

```javascript
const tiersCount = await presale.tiersCount();

for (let i = 0; i < tiersCount; i++) {
    const tier = await presale.tiers(i);
    console.log(`Tier ${i}:`);
    console.log(`  Mínimo: ${ethers.formatEther(tier.minSpend)} USDT`);
    console.log(`  Precio: ${ethers.formatEther(tier.pricePerToken)} USDT por GOAL`);
}
```

---

## 🔐 Funciones Administrativas

### Solo Owner (Deployer)

#### Pausar/Despausar Preventa
```javascript
// Pausar
await presale.pause();

// Despausar
await presale.unpause();
```

#### Cambiar Wallet de Fondos
```javascript
await presale.setFundsWallet("0xNuevaWalletAddress");
```

#### Retirar Tokens No Vendidos
```javascript
// Retirar GOAL no vendidos
await presale.withdrawUnsold(ethers.parseUnits("1000000", 7), "0xDestinationAddress");

// Retirar USDT del contrato
await presale.withdrawPayment(ethers.parseEther("1000"), "0xDestinationAddress");
```

#### Rescatar Tokens Enviados por Error
```javascript
// Rescatar cualquier ERC20
await presale.rescueERC20("0xTokenAddress", "0xDestinationAddress", amount);

// Rescatar ETH/BNB
await presale.rescueETH("0xDestinationAddress", ethers.parseEther("1"));
```

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ Contratos verificados en BSCScan
- ✅ Protección contra reentrancy
- ✅ Sistema de autorización robusto
- ✅ Pausable en caso de emergencia

### Límites y Validaciones
- Compra mínima: 10 USDT
- Compra máxima: 10,000 USDT por transacción
- Hard cap total: 1,000,000 USDT
- Validación de direcciones zero
- Verificación de balances suficientes

### Vesting
- Solo se puede reclamar después del `releaseTime`
- Los tokens se acumulan por comprador
- Una vez reclamados, el balance se resetea
- El claim no está pausable (solo las compras)

---

## 🔗 Enlaces Útiles

- **BSCScan Testnet**: https://testnet.bscscan.com/
- **GOAL Token**: https://testnet.bscscan.com/address/0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62
- **Preventa**: https://testnet.bscscan.com/address/0x344C842C5C44ED83E9dc2f09C6C60E537AD14012
- **GitHub Repo**: https://github.com/Herocku2/goalpartytoken.git

---

## 📞 Comandos NPM Disponibles

```bash
# Deployar sistema completo
npm run deploy-presale

# Probar funcionalidad
npm run test-simple

# Verificar contratos
npm run verify-presale

# Crear archivos flattened
npm run flatten
```

¡Con esta guía puedes gestionar completamente el sistema de preventa de tokens GOAL! 🎯