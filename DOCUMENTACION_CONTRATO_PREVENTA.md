# 📋 Documentación Completa del Contrato de Preventa StandardizedPresale

## 📊 Información General del Contrato

### Datos del Contrato
- **Nombre**: StandardizedPresale
- **Dirección**: `0x344C842C5C44ED83E9dc2f09C6C60E537AD14012`
- **Red**: BSC Testnet (Chain ID: 97)
- **Verificado**: ✅ [Ver en BSCScan](https://testnet.bscscan.com/address/0x344C842C5C44ED83E9dc2f09C6C60E537AD14012)
- **Owner/Deployer**: `0x7DE35f84680022bfccd748AbB0656ff8551879Aa`

### Tokens Involucrados
- **Token de Venta**: GOAL Token (`0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62`)
- **Token de Pago**: USDT Mock (`0xc906139A6a3f1728C0385b71300d92CeCE306D58`)

---

## 🔍 FUNCIONES DE LECTURA (View Functions)

### 1. `preview(uint256 amountInPaymentToken)`
**Propósito**: Simula una compra sin ejecutarla para ver cuántos tokens se recibirían.

**Parámetros**:
- `amountInPaymentToken`: Cantidad de USDT a invertir (en wei, 18 decimales)

**Retorna**:
- `appliedPrice`: Precio por token aplicado según el tier
- `tierIndex`: Índice del tier aplicado (0, 1, 2...)
- `tokensOut`: Cantidad de GOAL tokens que se recibirían

**Ejemplo de uso**:
```javascript
// Preview para 500 USDT
const preview = await presaleContract.preview(ethers.parseEther("500"));
console.log("Precio:", ethers.formatEther(preview.appliedPrice), "USDT por GOAL");
console.log("Tier:", preview.tierIndex.toString());
console.log("GOAL a recibir:", ethers.formatUnits(preview.tokensOut, 7));
```

**Quién puede usar**: Cualquier usuario (función pública)

---

### 2. `quotePrice(uint256 amountInPaymentToken)`
**Propósito**: Obtiene el precio y tier aplicable para una cantidad específica.

**Parámetros**:
- `amountInPaymentToken`: Cantidad de USDT (en wei)

**Retorna**:
- `appliedPrice`: Precio por token
- `tierIndex`: Índice del tier
- `found`: Si se encontró un tier válido

**Ejemplo de uso**:
```javascript
const quote = await presaleContract.quotePrice(ethers.parseEther("1000"));
```

**Quién puede usar**: Cualquier usuario

---

### 3. `tiersCount()`
**Propósito**: Obtiene el número total de tiers configurados.

**Retorna**: Número de tiers (uint256)

**Ejemplo de uso**:
```javascript
const count = await presaleContract.tiersCount();
console.log("Número de tiers:", count.toString());
```

---

### 4. `tiers(uint256 index)`
**Propósito**: Obtiene información de un tier específico.

**Parámetros**:
- `index`: Índice del tier (0, 1, 2...)

**Retorna**:
- `minSpend`: Monto mínimo para este tier
- `pricePerToken`: Precio por token en este tier

**Ejemplo de uso**:
```javascript
const tier = await presaleContract.tiers(0);
console.log("Mínimo:", ethers.formatEther(tier.minSpend), "USDT");
console.log("Precio:", ethers.formatEther(tier.pricePerToken), "USDT por GOAL");
```

---

### 5. Variables de Estado (Lectura)

#### `saleToken()`
**Propósito**: Dirección del token que se vende (GOAL)
**Retorna**: Address del token GOAL

#### `paymentToken()`
**Propósito**: Dirección del token de pago (USDT)
**Retorna**: Address del token USDT

#### `saleTokenDecimals()`
**Propósito**: Decimales del token de venta
**Retorna**: 7 (decimales del GOAL)

#### `paymentDecimals()`
**Propósito**: Decimales del token de pago
**Retorna**: 18 (decimales del USDT Mock)

#### `fundsWallet()`
**Propósito**: Wallet que recibe los pagos
**Retorna**: Address de la wallet de fondos

#### `immediateDelivery()`
**Propósito**: Si la entrega es inmediata o con vesting
**Retorna**: true = inmediata, false = vesting

#### `releaseTime()`
**Propósito**: Timestamp de liberación para vesting
**Retorna**: Timestamp Unix (segundos)

#### `totalRaised()`
**Propósito**: Total recaudado en USDT
**Retorna**: Cantidad total en wei

#### `minPurchase()`
**Propósito**: Compra mínima permitida
**Retorna**: Cantidad mínima en wei de USDT

#### `maxPurchase()`
**Propósito**: Compra máxima por transacción
**Retorna**: Cantidad máxima en wei de USDT

#### `hardCapPayment()`
**Propósito**: Tope máximo de recaudación
**Retorna**: Hard cap en wei de USDT

#### `saleStart()`
**Propósito**: Timestamp de inicio de venta
**Retorna**: Timestamp Unix (0 = sin restricción)

#### `saleEnd()`
**Propósito**: Timestamp de fin de venta
**Retorna**: Timestamp Unix (0 = sin restricción)

#### `vestedBalance(address account)`
**Propósito**: Balance en vesting de una cuenta
**Parámetros**: `account` - Dirección a consultar
**Retorna**: Cantidad de tokens en vesting

#### `paused()`
**Propósito**: Estado de pausa del contrato
**Retorna**: true = pausado, false = activo

#### `owner()`
**Propósito**: Propietario actual del contrato
**Retorna**: Address del owner

#### `pendingOwner()`
**Propósito**: Propietario pendiente (transferencia en proceso)
**Retorna**: Address del pending owner

---

## ✍️ FUNCIONES DE ESCRITURA (State-Changing Functions)

### 🛒 FUNCIONES PÚBLICAS (Cualquier Usuario)

#### 1. `buy(uint256 amountInPaymentToken, address recipient)`
**Propósito**: Comprar tokens GOAL con USDT.

**Parámetros**:
- `amountInPaymentToken`: Cantidad de USDT a gastar (en wei)
- `recipient`: Dirección que recibirá los tokens (puede ser address(0) para usar msg.sender)

**Requisitos previos**:
1. Aprobar USDT al contrato: `usdtContract.approve(presaleAddress, amount)`
2. Tener suficiente balance de USDT
3. Que la cantidad esté dentro de los límites (min/max)
4. Que no se exceda el hard cap
5. Que el contrato no esté pausado

**Proceso interno**:
1. Valida parámetros y límites
2. Calcula el tier aplicable y precio
3. Calcula tokens GOAL a entregar
4. Transfiere USDT del comprador al fundsWallet
5. Si `immediateDelivery = true`: transfiere GOAL inmediatamente
6. Si `immediateDelivery = false`: acumula en `vestedBalance[recipient]`

**Ejemplo de uso**:
```javascript
// 1. Aprobar USDT
await usdtContract.approve(presaleAddress, ethers.parseEther("500"));

// 2. Comprar
await presaleContract.buy(ethers.parseEther("500"), buyerAddress);
```

**Eventos emitidos**: `Purchase(buyer, recipient, spent, tokensOut, appliedPrice)`

---

#### 2. `claim()`
**Propósito**: Reclamar tokens en vesting después del período de liberación.

**Requisitos**:
1. `immediateDelivery` debe ser `false`
2. `block.timestamp >= releaseTime`
3. Tener balance > 0 en `vestedBalance[msg.sender]`

**Proceso**:
1. Verifica que sea tiempo de reclamar
2. Obtiene el balance en vesting del usuario
3. Resetea el balance a 0
4. Transfiere los tokens GOAL al usuario

**Ejemplo de uso**:
```javascript
// Solo funciona después del releaseTime
await presaleContract.claim();
```

**Eventos emitidos**: `Claim(account, amount)`

---

### 👑 FUNCIONES DE ADMINISTRACIÓN (Solo Owner)

#### 3. `setTokens(address _saleToken, address _paymentToken)`
**Propósito**: Cambiar los tokens de venta y pago.

**Wallet requerida**: Owner (`0x7DE35f84680022bfccd748AbB0656ff8551879Aa`)

**Parámetros**:
- `_saleToken`: Nueva dirección del token de venta
- `_paymentToken`: Nueva dirección del token de pago

**Uso típico**: Cambiar a tokens en mainnet o corregir direcciones

---

#### 4. `overrideDecimals(uint8 _saleTokenDecimals, uint8 _paymentDecimals)`
**Propósito**: Sobrescribir manualmente los decimales de los tokens.

**Wallet requerida**: Owner

**Parámetros**:
- `_saleTokenDecimals`: Decimales del token de venta (1-36)
- `_paymentDecimals`: Decimales del token de pago (1-36)

**Uso típico**: Cuando los tokens no implementan correctamente `decimals()`

---

#### 5. `setFundsWallet(address _fundsWallet)`
**Propósito**: Cambiar la wallet que recibe los pagos.

**Wallet requerida**: Owner

**Parámetros**:
- `_fundsWallet`: Nueva dirección de la wallet de fondos

**Ejemplo**:
```javascript
await presaleContract.setFundsWallet("0xNuevaWalletAddress");
```

---

#### 6. `setTiers(uint256[] calldata _minSpends, uint256[] calldata _pricesPerToken)`
**Propósito**: Configurar completamente los tiers de precios.

**Wallet requerida**: Owner

**Parámetros**:
- `_minSpends`: Array de montos mínimos (debe empezar con 0)
- `_pricesPerToken`: Array de precios correspondientes

**Requisitos**:
- Arrays de igual longitud
- Primer elemento de `_minSpends` debe ser 0
- Orden ascendente en `_minSpends`
- Todos los precios > 0

**Ejemplo**:
```javascript
const minSpends = [
    ethers.parseEther("0"),      // Tier 1: desde 0 USDT
    ethers.parseEther("100"),    // Tier 2: desde 100 USDT
    ethers.parseEther("1000")    // Tier 3: desde 1000 USDT
];

const prices = [
    ethers.parseEther("0.10"),   // 0.10 USDT por GOAL
    ethers.parseEther("0.08"),   // 0.08 USDT por GOAL
    ethers.parseEther("0.05")    // 0.05 USDT por GOAL
];

await presaleContract.setTiers(minSpends, prices);
```

---

#### 7. `setImmediateDelivery(bool _enabled)`
**Propósito**: Activar/desactivar entrega inmediata.

**Wallet requerida**: Owner

**Parámetros**:
- `_enabled`: true = entrega inmediata, false = vesting

**Ejemplo**:
```javascript
// Activar vesting
await presaleContract.setImmediateDelivery(false);
```

---

#### 8. `setReleaseTime(uint64 _releaseTime)`
**Propósito**: Establecer el tiempo de liberación para vesting.

**Wallet requerida**: Owner

**Parámetros**:
- `_releaseTime`: Timestamp Unix futuro

**Requisitos**:
- `_releaseTime` debe ser mayor que `block.timestamp`
- `_releaseTime` no puede ser 0

**Ejemplo**:
```javascript
// 50 días desde ahora
const releaseTime = Math.floor(Date.now() / 1000) + (50 * 24 * 60 * 60);
await presaleContract.setReleaseTime(releaseTime);
```

---

#### 9. `setLimits(uint256 _minPurchase, uint256 _maxPurchase, uint256 _hardCapPayment)`
**Propósito**: Configurar límites de compra y hard cap.

**Wallet requerida**: Owner

**Parámetros**:
- `_minPurchase`: Compra mínima en wei de USDT
- `_maxPurchase`: Compra máxima en wei de USDT (0 = sin límite)
- `_hardCapPayment`: Hard cap total en wei de USDT (0 = sin límite)

**Validaciones**:
- `_maxPurchase >= _minPurchase` (si _maxPurchase != 0)
- `_hardCapPayment >= totalRaised` (si _hardCapPayment != 0)

**Ejemplo**:
```javascript
await presaleContract.setLimits(
    ethers.parseEther("10"),      // Mín: 10 USDT
    ethers.parseEther("10000"),   // Máx: 10,000 USDT
    ethers.parseEther("1000000")  // Hard cap: 1M USDT
);
```

---

#### 10. `setSaleWindow(uint64 _start, uint64 _end)`
**Propósito**: Establecer ventana temporal de venta.

**Wallet requerida**: Owner

**Parámetros**:
- `_start`: Timestamp de inicio (0 = sin restricción)
- `_end`: Timestamp de fin (0 = sin restricción)

**Validación**: `_end > _start` (si ambos != 0)

---

#### 11. `pause()` / `unpause()`
**Propósito**: Pausar/despausar las compras (no afecta claim).

**Wallet requerida**: Owner

**Ejemplo**:
```javascript
// Pausar en emergencia
await presaleContract.pause();

// Reanudar
await presaleContract.unpause();
```

---

### 💰 FUNCIONES DE RETIRO (Solo Owner)

#### 12. `withdrawPayment(uint256 amount, address to)`
**Propósito**: Retirar USDT del contrato.

**Wallet requerida**: Owner

**Uso típico**: Si los pagos no se enviaron directamente al fundsWallet

---

#### 13. `withdrawUnsold(uint256 amount, address to)`
**Propósito**: Retirar tokens GOAL no vendidos.

**Wallet requerida**: Owner

**Uso típico**: Al finalizar la preventa, retirar tokens sobrantes

---

#### 14. `rescueERC20(address token, address to, uint256 amount)`
**Propósito**: Rescatar cualquier token ERC20 enviado por error.

**Wallet requerida**: Owner

**Parámetros**:
- `token`: Dirección del token a rescatar
- `to`: Dirección destino
- `amount`: Cantidad a rescatar

---

#### 15. `rescueETH(address to, uint256 amount)`
**Propósito**: Rescatar BNB/ETH nativo del contrato.

**Wallet requerida**: Owner

---

### 🔄 FUNCIONES DE OWNERSHIP

#### 16. `transferOwnership(address newOwner)`
**Propósito**: Iniciar transferencia de ownership (paso 1 de 2).

**Wallet requerida**: Owner actual

**Proceso**: Establece `pendingOwner`, requiere `acceptOwnership()`

---

#### 17. `acceptOwnership()`
**Propósito**: Aceptar ownership (paso 2 de 2).

**Wallet requerida**: Pending owner

**Proceso**: Completa la transferencia de ownership

---

## 🔐 CONTROL DE ACCESO

### Niveles de Acceso

1. **Público (Cualquier usuario)**:
   - `buy()`: Comprar tokens
   - `claim()`: Reclamar tokens en vesting
   - Todas las funciones de lectura

2. **Solo Owner** (`0x7DE35f84680022bfccd748AbB0656ff8551879Aa`):
   - Configuración de tiers y precios
   - Configuración de límites y ventanas
   - Configuración de vesting
   - Pausa/despausa
   - Retiros y rescates
   - Transferencia de ownership

3. **Solo Pending Owner**:
   - `acceptOwnership()`

### Modificadores de Seguridad

- `onlyOwner`: Solo el propietario
- `nonReentrant`: Protección contra reentrancy
- `whenNotPaused`: Solo cuando no está pausado (para compras)

---

## 📊 EVENTOS EMITIDOS

### `Purchase(address indexed buyer, address indexed recipient, uint256 spent, uint256 tokensOut, uint256 appliedPrice)`
**Cuándo**: Al realizar una compra exitosa
**Datos**: Comprador, receptor, USDT gastados, GOAL recibidos, precio aplicado

### `Claim(address indexed account, uint256 amount)`
**Cuándo**: Al reclamar tokens en vesting
**Datos**: Cuenta que reclama, cantidad reclamada

### `ConfigTokens(address indexed saleToken, uint8 saleTokenDecimals, address indexed paymentToken, uint8 paymentDecimals)`
**Cuándo**: Al configurar tokens
**Datos**: Direcciones y decimales de tokens

### `FundsWalletUpdated(address indexed newWallet)`
**Cuándo**: Al cambiar la wallet de fondos

### `TiersUpdated(uint256 count)`
**Cuándo**: Al actualizar los tiers de precios

### `ImmediateDeliverySet(bool enabled)`
**Cuándo**: Al cambiar el modo de entrega

### `ReleaseTimeSet(uint64 releaseTime)`
**Cuándo**: Al establecer tiempo de liberación

### `LimitsUpdated(uint256 minPurchase, uint256 maxPurchase, uint256 hardCapPayment)`
**Cuándo**: Al actualizar límites

### `SaleWindowUpdated(uint64 start, uint64 end)`
**Cuándo**: Al configurar ventana de venta

### `Paused(address indexed by)` / `Unpaused(address indexed by)`
**Cuándo**: Al pausar/despausar

### `Rescue(address indexed token, address indexed to, uint256 amount)`
**Cuándo**: Al rescatar tokens o ETH

### `WithdrawPayment(address indexed to, uint256 amount)`
**Cuándo**: Al retirar pagos

### `WithdrawUnsold(address indexed to, uint256 amount)`
**Cuándo**: Al retirar tokens no vendidos

---

## ⚠️ ERRORES PERSONALIZADOS

### `InvalidArray()`
Arrays de diferente longitud o vacíos

### `UnsortedTiers()`
Tiers no ordenados correctamente

### `NoTiers()`
Primer tier no empieza en 0

### `ZeroAddress()`
Dirección cero no permitida

### `InvalidTime()`
Tiempo inválido o en el pasado

### `OutOfWindow()`
Fuera de la ventana de venta

### `AmountTooLow()`
Cantidad menor al mínimo

### `AmountTooHigh()`
Cantidad mayor al máximo

### `HardCapExceeded()`
Se excedería el hard cap

### `PriceZero()`
Precio no puede ser cero

### `NothingToClaim()`
No hay tokens para reclamar

---

## 🛠️ EJEMPLOS DE USO COMPLETOS

### Ejemplo 1: Compra Simple
```javascript
// 1. Conectar a contratos
const usdt = await ethers.getContractAt("USDTMock", usdtAddress);
const presale = await ethers.getContractAt("StandardizedPresale", presaleAddress);

// 2. Verificar preview
const amount = ethers.parseEther("500");
const preview = await presale.preview(amount);
console.log("Recibirás:", ethers.formatUnits(preview.tokensOut, 7), "GOAL");

// 3. Aprobar y comprar
await usdt.approve(presaleAddress, amount);
await presale.buy(amount, buyerAddress);
```

### Ejemplo 2: Configurar Vesting (Solo Owner)
```javascript
// 1. Desactivar entrega inmediata
await presale.setImmediateDelivery(false);

// 2. Establecer tiempo de liberación (30 días)
const releaseTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await presale.setReleaseTime(releaseTime);

// 3. Las nuevas compras irán a vesting
```

### Ejemplo 3: Reclamar Tokens en Vesting
```javascript
// 1. Verificar si es tiempo de reclamar
const releaseTime = await presale.releaseTime();
const currentTime = Math.floor(Date.now() / 1000);
const canClaim = currentTime >= releaseTime;

if (canClaim) {
    // 2. Verificar balance en vesting
    const vestedBalance = await presale.vestedBalance(userAddress);
    
    if (vestedBalance > 0) {
        // 3. Reclamar
        await presale.claim();
    }
}
```

---

## 🔗 ENLACES DE REFERENCIA

- **Contrato en BSCScan**: https://testnet.bscscan.com/address/0x344C842C5C44ED83E9dc2f09C6C60E537AD14012
- **Código Fuente**: Verificado en BSCScan
- **Documentación EIP-2535**: https://eips.ethereum.org/EIPS/eip-2535
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/

---

## 📞 SOPORTE TÉCNICO

Para consultas técnicas sobre el contrato:
1. Revisar eventos emitidos en BSCScan
2. Usar funciones de lectura para debugging
3. Verificar permisos de la wallet utilizada
4. Consultar esta documentación para casos de uso específicos