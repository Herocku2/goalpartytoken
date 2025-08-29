# 🎯 Documentación Completa del Token GOAL

## 📊 Información General del Token

### Datos del Token
- **Nombre**: Goal Play
- **Símbolo**: GOAL
- **Decimales**: 7
- **Supply Total**: 500,000,000 GOAL
- **Dirección**: `0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62`
- **Red**: BSC Testnet (Chain ID: 97)
- **Verificado**: ✅ [Ver en BSCScan](https://testnet.bscscan.com/address/0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62)
- **Arquitectura**: Diamond Pattern (EIP-2535)
- **Owner/Deployer**: `0x7DE35f84680022bfccd748AbB0656ff8551879Aa`

### Arquitectura Diamond
El token GOAL utiliza el patrón Diamond (EIP-2535) que permite:
- **Modularidad**: Funcionalidades separadas en facets
- **Upgradeabilidad**: Posibilidad de agregar/quitar funciones
- **Eficiencia de Gas**: Optimización en el uso de storage
- **Flexibilidad**: Fácil mantenimiento y extensión

---

## 🏗️ ESTRUCTURA DEL CONTRATO

### Contrato Principal: Diamond
**Dirección**: `0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62`
**Función**: Proxy que delega llamadas a los facets correspondientes

### Facets (Módulos Funcionales)

#### 1. TokenFacet
**Dirección**: `0xbb5E8CE20bd4D8d9Ca56507c775A64858889D7C4`
**Propósito**: Implementa funcionalidad ERC20 estándar

#### 2. DiamondCutFacet
**Dirección**: `0x5E1E1D9614EB38693707f8fDbA904faDA9128021`
**Propósito**: Gestiona la adición/eliminación de facets

#### 3. DiamondLoupeFacet
**Dirección**: `0x8118BDCe105FB0c65799DEc21d0AD607DF21B245`
**Propósito**: Proporciona introspección del Diamond

#### 4. AuthorizationManagementFacet
**Dirección**: `0x51ebB9697cA65de6A6F70c3Ef14748BeB751ae22`
**Propósito**: Sistema de autorización multi-firma

#### 5. TokenomicsManagementFacet
**Dirección**: `0x08E506a0aCab806d34377d213F5d02fECc11E75B`
**Propósito**: Funciones de rescate y gestión avanzada

### Inicializador: TokenInit
**Dirección**: `0x579Da75d4B42f89E59bF4373D8E6ed995c8BeBfd`
**Propósito**: Inicializa el token con parámetros específicos

---

## 🔍 FUNCIONES DE LECTURA (TokenFacet)

### Funciones ERC20 Estándar

#### 1. `name()`
**Propósito**: Obtiene el nombre del token
**Retorna**: "Goal Play"
**Ejemplo**:
```javascript
const name = await goalToken.name();
console.log(name); // "Goal Play"
```

#### 2. `symbol()`
**Propósito**: Obtiene el símbolo del token
**Retorna**: "GOAL"
**Ejemplo**:
```javascript
const symbol = await goalToken.symbol();
console.log(symbol); // "GOAL"
```

#### 3. `decimals()`
**Propósito**: Obtiene los decimales del token
**Retorna**: 7
**Ejemplo**:
```javascript
const decimals = await goalToken.decimals();
console.log(decimals); // 7
```

#### 4. `totalSupply()`
**Propósito**: Obtiene el supply total del token
**Retorna**: 500,000,000 * 10^7 (5000000000000000)
**Ejemplo**:
```javascript
const totalSupply = await goalToken.totalSupply();
console.log(ethers.formatUnits(totalSupply, 7)); // "500000000.0"
```

#### 5. `balanceOf(address account)`
**Propósito**: Obtiene el balance de una cuenta específica
**Parámetros**: `account` - Dirección a consultar
**Retorna**: Balance en unidades base (con 7 decimales)
**Ejemplo**:
```javascript
const balance = await goalToken.balanceOf("0x7DE35f84680022bfccd748AbB0656ff8551879Aa");
console.log(ethers.formatUnits(balance, 7)); // Balance formateado
```

#### 6. `allowance(address owner, address spender)`
**Propósito**: Obtiene la cantidad aprobada por owner para que spender pueda gastar
**Parámetros**:
- `owner`: Propietario de los tokens
- `spender`: Dirección autorizada a gastar
**Retorna**: Cantidad aprobada
**Ejemplo**:
```javascript
const allowance = await goalToken.allowance(ownerAddress, spenderAddress);
console.log(ethers.formatUnits(allowance, 7));
```

---

## ✍️ FUNCIONES DE ESCRITURA (TokenFacet)

### Funciones ERC20 Públicas

#### 1. `transfer(address to, uint256 value)`
**Propósito**: Transferir tokens a otra dirección
**Parámetros**:
- `to`: Dirección destino
- `value`: Cantidad a transferir (en unidades base)
**Retorna**: true si es exitoso
**Wallet requerida**: Cualquier usuario con balance suficiente

**Validaciones**:
- `to` no puede ser address(0)
- `msg.sender` debe tener balance suficiente

**Ejemplo**:
```javascript
// Transferir 1000 GOAL
const amount = ethers.parseUnits("1000", 7);
await goalToken.transfer("0xDestinoAddress", amount);
```

**Eventos emitidos**: `Transfer(from, to, value)`

#### 2. `approve(address spender, uint256 value)`
**Propósito**: Aprobar a otra dirección para gastar tokens
**Parámetros**:
- `spender`: Dirección a autorizar
- `value`: Cantidad máxima a aprobar
**Retorna**: true si es exitoso
**Wallet requerida**: Propietario de los tokens

**Validaciones**:
- `spender` no puede ser address(0)
- `msg.sender` no puede ser address(0)

**Ejemplo**:
```javascript
// Aprobar 5000 GOAL al contrato de preventa
const amount = ethers.parseUnits("5000", 7);
await goalToken.approve(presaleAddress, amount);
```

**Eventos emitidos**: `Approval(owner, spender, value)`

#### 3. `transferFrom(address from, address to, uint256 value)`
**Propósito**: Transferir tokens en nombre de otro (requiere aprobación previa)
**Parámetros**:
- `from`: Dirección origen
- `to`: Dirección destino  
- `value`: Cantidad a transferir
**Retorna**: true si es exitoso
**Wallet requerida**: Dirección con allowance suficiente

**Validaciones**:
- `from` y `to` no pueden ser address(0)
- `from` debe tener balance suficiente
- `msg.sender` debe tener allowance suficiente

**Ejemplo**:
```javascript
// Un contrato transfiere tokens del usuario
await goalToken.transferFrom(userAddress, contractAddress, amount);
```

**Eventos emitidos**: `Transfer(from, to, value)` y `Approval(owner, spender, newAllowance)`

---

## 🔍 FUNCIONES DE INTROSPECCIÓN (DiamondLoupeFacet)

### 1. `facets()`
**Propósito**: Obtiene todos los facets y sus selectores de función
**Retorna**: Array de structs `Facet{address facetAddress, bytes4[] functionSelectors}`
**Wallet requerida**: Cualquier usuario

**Ejemplo**:
```javascript
const facets = await goalToken.facets();
facets.forEach((facet, index) => {
    console.log(`Facet ${index}: ${facet.facetAddress}`);
    console.log(`Funciones: ${facet.functionSelectors.length}`);
});
```

### 2. `facetFunctionSelectors(address facet)`
**Propósito**: Obtiene los selectores de función de un facet específico
**Parámetros**: `facet` - Dirección del facet
**Retorna**: Array de selectores de función (bytes4[])

### 3. `facetAddresses()`
**Propósito**: Obtiene todas las direcciones de facets
**Retorna**: Array de direcciones

### 4. `facetAddress(bytes4 functionSelector)`
**Propósito**: Obtiene la dirección del facet que implementa una función específica
**Parámetros**: `functionSelector` - Selector de la función
**Retorna**: Dirección del facet

---

## 👑 FUNCIONES DE ADMINISTRACIÓN

### DiamondCutFacet (Solo Autorizados)

#### `manageFacets(FacetCut[] calldata facetCuts)`
**Propósito**: Agregar o quitar facets del Diamond
**Wallet requerida**: Cuenta autorizada (`0x7DE35f84680022bfccd748AbB0656ff8551879Aa`)
**Parámetros**: Array de `FacetCut{address facetAddress, FacetCutAction action}`

**Acciones disponibles**:
- `Add`: Agregar nuevo facet
- `Remove`: Quitar facet existente

**Ejemplo**:
```javascript
const facetCuts = [{
    facetAddress: "0xNuevoFacetAddress",
    action: 0 // Add
}];
await goalToken.manageFacets(facetCuts);
```

---

### AuthorizationManagementFacet (Solo Autorizados)

#### 1. `G01_add_Authorized_Account(address account)`
**Propósito**: Agregar una cuenta autorizada
**Wallet requerida**: Cuenta autorizada existente
**Parámetros**: `account` - Nueva cuenta a autorizar

**Validaciones**:
- La cuenta no debe estar ya autorizada
- Solo cuentas autorizadas pueden agregar otras

**Ejemplo**:
```javascript
await goalToken.G01_add_Authorized_Account("0xNuevaCuentaAutorizada");
```

#### 2. `G02_remove_Authorized_Account(address account)`
**Propósito**: Remover una cuenta autorizada
**Wallet requerida**: Cuenta autorizada existente
**Parámetros**: `account` - Cuenta a desautorizar

**Validaciones**:
- La cuenta debe estar autorizada
- Debe quedar al menos 2 cuentas autorizadas

#### 3. `G03_check_If_Account_Is_Authorized(address account)`
**Propósito**: Verificar si una cuenta está autorizada
**Wallet requerida**: Cuenta autorizada
**Parámetros**: `account` - Cuenta a verificar
**Retorna**: true si está autorizada

#### 4. `G04_show_all_Authorized_Accounts()`
**Propósito**: Mostrar todas las cuentas autorizadas
**Wallet requerida**: Cuenta autorizada
**Retorna**: Array de direcciones autorizadas

---

### TokenomicsManagementFacet (Solo Autorizados)

#### 1. `I01_RescueTokens(address token, address receiver, uint256 amount)`
**Propósito**: Rescatar tokens ERC20 enviados por error al contrato
**Wallet requerida**: Cuenta autorizada
**Parámetros**:
- `token`: Dirección del token a rescatar
- `receiver`: Dirección que recibirá los tokens
- `amount`: Cantidad a rescatar (0 = todo el balance)

**Validaciones**:
- `token` y `receiver` no pueden ser address(0)
- `receiver` no puede ser el contrato mismo
- Debe haber balance suficiente

**Ejemplo**:
```javascript
// Rescatar todos los USDT enviados por error
await goalToken.I01_RescueTokens(usdtAddress, rescueAddress, 0);
```

#### 2. `I02_RescueBlockhainNativeTokens(address receiver, uint256 amount)`
**Propósito**: Rescatar BNB/ETH nativo del contrato
**Wallet requerida**: Cuenta autorizada
**Parámetros**:
- `receiver`: Dirección que recibirá el BNB
- `amount`: Cantidad a rescatar (0 = todo el balance)

**Ejemplo**:
```javascript
// Rescatar todo el BNB
await goalToken.I02_RescueBlockhainNativeTokens(rescueAddress, 0);
```

---

## 🔐 SISTEMA DE AUTORIZACIÓN

### Cuentas Autorizadas
**Cuenta Principal**: `0x7DE35f84680022bfccd748AbB0656ff8551879Aa` (Deployer)

### Niveles de Acceso

1. **Público (Cualquier usuario)**:
   - Funciones ERC20: `transfer`, `approve`, `transferFrom`
   - Funciones de lectura: `balanceOf`, `allowance`, etc.
   - Introspección Diamond: `facets`, `facetAddress`, etc.

2. **Solo Cuentas Autorizadas**:
   - Gestión de facets: `manageFacets`
   - Gestión de autorización: agregar/quitar cuentas autorizadas
   - Funciones de rescate: `I01_RescueTokens`, `I02_RescueBlockhainNativeTokens`

### Modificadores de Seguridad
- `onlyIfAuthorized`: Solo cuentas en la lista de autorizados
- `nonReentrant`: Protección contra reentrancy (en funciones de rescate)

---

## 📊 EVENTOS EMITIDOS

### Eventos ERC20 Estándar

#### `Transfer(address indexed from, address indexed to, uint256 value)`
**Cuándo**: En transferencias, mint y burn
**Datos**: Dirección origen, destino y cantidad

#### `Approval(address indexed owner, address indexed spender, uint256 value)`
**Cuándo**: Al aprobar allowances
**Datos**: Propietario, gastador autorizado y cantidad

### Eventos de Autorización

#### `Added_Authorized_Account(address indexed account)`
**Cuándo**: Al agregar cuenta autorizada
**Datos**: Nueva cuenta autorizada

#### `Removed_Authorized_Account(address indexed account)`
**Cuándo**: Al remover cuenta autorizada
**Datos**: Cuenta removida

### Eventos Diamond

#### `FacetsManaged(FacetCut[] facetCuts)`
**Cuándo**: Al modificar facets
**Datos**: Array de cambios realizados

#### `External_Contract_Executed(address indexed contractAddress, bytes calldata)`
**Cuándo**: Al ejecutar contratos externos via delegatecall
**Datos**: Dirección del contrato y calldata

---

## 💾 STORAGE Y LIBRERÍAS

### LibTokenStorage
**Propósito**: Gestiona el storage del token ERC20
**Ubicación**: Slot específico usando Diamond Storage

**Estructura**:
```solidity
struct TokenStorage {
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;
    uint256 totalSupply;
    string name;
    string symbol;
    uint8 decimals;
}
```

### LibDiamondStorage
**Propósito**: Gestiona el storage del Diamond
**Estructura**:
```solidity
struct DiamondStorage {
    mapping(bytes4 => address) functionSelectorWhichFacetAddress;
    mapping(address => bytes4[]) facetWhichFunctionSelectors;
    mapping(address => uint256) facetWhichPosition;
    address[] facetAddresses;
    mapping(address => bool) Authorized;
    address[] authorizedAccountsList;
}
```

---

## 🛠️ EJEMPLOS DE USO COMPLETOS

### Ejemplo 1: Transferencia Simple
```javascript
// Conectar al token
const goalToken = await ethers.getContractAt("TokenFacet", goalTokenAddress);

// Verificar balance
const balance = await goalToken.balanceOf(senderAddress);
console.log("Balance:", ethers.formatUnits(balance, 7), "GOAL");

// Transferir 1000 GOAL
const amount = ethers.parseUnits("1000", 7);
await goalToken.transfer(recipientAddress, amount);
```

### Ejemplo 2: Aprobación y TransferFrom
```javascript
// 1. Aprobar (desde cuenta propietaria)
const amount = ethers.parseUnits("5000", 7);
await goalToken.approve(spenderAddress, amount);

// 2. Verificar allowance
const allowance = await goalToken.allowance(ownerAddress, spenderAddress);
console.log("Allowance:", ethers.formatUnits(allowance, 7));

// 3. TransferFrom (desde cuenta autorizada)
await goalToken.transferFrom(ownerAddress, recipientAddress, amount);
```

### Ejemplo 3: Consultar Información del Diamond
```javascript
// Ver todos los facets
const facets = await goalToken.facets();
console.log("Facets instalados:", facets.length);

// Ver funciones de un facet específico
const selectors = await goalToken.facetFunctionSelectors(tokenFacetAddress);
console.log("Funciones en TokenFacet:", selectors.length);

// Encontrar qué facet implementa una función
const transferSelector = "0xa9059cbb"; // transfer(address,uint256)
const facetAddress = await goalToken.facetAddress(transferSelector);
console.log("transfer() implementado en:", facetAddress);
```

### Ejemplo 4: Gestión de Autorización (Solo Autorizados)
```javascript
// Verificar si una cuenta está autorizada
const isAuthorized = await goalToken.G03_check_If_Account_Is_Authorized(accountAddress);
console.log("¿Está autorizada?", isAuthorized);

// Ver todas las cuentas autorizadas
const authorizedAccounts = await goalToken.G04_show_all_Authorized_Accounts();
console.log("Cuentas autorizadas:", authorizedAccounts);

// Agregar nueva cuenta autorizada (solo si ya estás autorizado)
await goalToken.G01_add_Authorized_Account(newAccountAddress);
```

### Ejemplo 5: Rescate de Tokens (Solo Autorizados)
```javascript
// Rescatar USDT enviados por error
await goalToken.I01_RescueTokens(
    usdtAddress,      // Token a rescatar
    rescueAddress,    // Dirección destino
    0                 // 0 = rescatar todo
);

// Rescatar BNB nativo
await goalToken.I02_RescueBlockhainNativeTokens(
    rescueAddress,    // Dirección destino
    ethers.parseEther("1") // 1 BNB
);
```

---

## 🔧 INTEGRACIÓN CON OTROS CONTRATOS

### Como Token de Pago
```javascript
// Aprobar al contrato de preventa
await goalToken.approve(presaleAddress, ethers.parseUnits("10000", 7));

// El contrato de preventa puede usar transferFrom
```

### Como Recompensa
```javascript
// Un contrato de staking puede transferir GOAL como recompensa
await goalToken.transfer(stakerAddress, rewardAmount);
```

### Verificación de Balance
```javascript
// Verificar balance antes de operaciones
const balance = await goalToken.balanceOf(userAddress);
if (balance >= requiredAmount) {
    // Proceder con la operación
}
```

---

## ⚠️ CONSIDERACIONES DE SEGURIDAD

### Validaciones Implementadas
- ✅ Protección contra address(0)
- ✅ Verificación de balances suficientes
- ✅ Verificación de allowances
- ✅ Sistema de autorización robusto
- ✅ Protección contra reentrancy en funciones críticas

### Buenas Prácticas
1. **Siempre verificar balances** antes de transferencias
2. **Usar allowances apropiadas** para contratos
3. **Solo cuentas autorizadas** pueden modificar el sistema
4. **Eventos completos** para tracking de transacciones

### Limitaciones
- **7 decimales**: Menor precisión que tokens de 18 decimales
- **Sistema de autorización**: Requiere múltiples firmas para cambios críticos
- **Diamond Pattern**: Complejidad adicional vs. contratos simples

---

## 📈 MÉTRICAS Y MONITOREO

### Métricas Clave
```javascript
// Supply total y distribución
const totalSupply = await goalToken.totalSupply();
const deployerBalance = await goalToken.balanceOf(deployerAddress);
const circulatingSupply = totalSupply - deployerBalance;

console.log("Total Supply:", ethers.formatUnits(totalSupply, 7));
console.log("Circulating:", ethers.formatUnits(circulatingSupply, 7));
```

### Monitoreo de Eventos
```javascript
// Escuchar transferencias
goalToken.on("Transfer", (from, to, value) => {
    console.log(`Transfer: ${ethers.formatUnits(value, 7)} GOAL from ${from} to ${to}`);
});

// Escuchar aprobaciones
goalToken.on("Approval", (owner, spender, value) => {
    console.log(`Approval: ${owner} approved ${ethers.formatUnits(value, 7)} GOAL to ${spender}`);
});
```

---

## 🔗 ENLACES DE REFERENCIA

- **Token en BSCScan**: https://testnet.bscscan.com/address/0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62
- **EIP-2535 (Diamond Standard)**: https://eips.ethereum.org/EIPS/eip-2535
- **ERC-20 Standard**: https://eips.ethereum.org/EIPS/eip-20
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Hardhat Documentation**: https://hardhat.org/docs

---

## 📞 SOPORTE TÉCNICO

### Para Desarrolladores
1. **Consultar eventos** en BSCScan para debugging
2. **Usar funciones de lectura** para verificar estado
3. **Verificar autorizaciones** antes de operaciones administrativas
4. **Revisar esta documentación** para casos de uso específicos

### Para Usuarios
1. **Verificar balance** antes de transferencias
2. **Confirmar direcciones** antes de enviar tokens
3. **Usar wallets compatibles** con BSC Testnet
4. **Guardar hash de transacciones** para referencia

### Información de Contacto
- **GitHub Repository**: https://github.com/Herocku2/goalpartytoken.git
- **BSCScan Testnet**: https://testnet.bscscan.com/
- **Documentación Técnica**: Este documento y archivos relacionados