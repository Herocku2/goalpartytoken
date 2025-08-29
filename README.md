# Goal Play Token (GOAL) 🎯

Un token ERC20 implementado usando el patrón Diamond (EIP-2535) desplegado en BSC Testnet.

## 📋 Información del Token

- **Nombre**: Goal Play
- **Símbolo**: GOAL
- **Decimales**: 7
- **Supply Total**: 500,000,000 GOAL
- **Red**: BSC Testnet (Chain ID: 97)

## 🚀 Contratos Desplegados

### Contrato Principal (Diamond)
- **Dirección**: `0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62`
- **Explorer**: [Ver en BSCScan](https://testnet.bscscan.com/address/0x8F6db1C57fF450e891F7D67146a4c1DD0B866C62)

### Sistema de Preventa
- **USDTMock**: `0xc906139A6a3f1728C0385b71300d92CeCE306D58`
- **StandardizedPresale**: `0x344C842C5C44ED83E9dc2f09C6C60E537AD14012`
- **Explorer Preventa**: [Ver en BSCScan](https://testnet.bscscan.com/address/0x344C842C5C44ED83E9dc2f09C6C60E537AD14012)

### Facets (Módulos)
- **DiamondCutFacet**: `0x5E1E1D9614EB38693707f8fDbA904faDA9128021`
- **DiamondLoupeFacet**: `0x8118BDCe105FB0c65799DEc21d0AD607DF21B245`
- **AuthorizationManagementFacet**: `0x51ebB9697cA65de6A6F70c3Ef14748BeB751ae22`
- **TokenFacet**: `0xbb5E8CE20bd4D8d9Ca56507c775A64858889D7C4`
- **TokenomicsManagementFacet**: `0x08E506a0aCab806d34377d213F5d02fECc11E75B`

### Inicializador
- **TokenInit**: `0x579Da75d4B42f89E59bF4373D8E6ed995c8BeBfd`

## 🛠️ Tecnologías Utilizadas

- **Solidity**: ^0.8.20
- **Hardhat**: Framework de desarrollo
- **Diamond Pattern**: EIP-2535 para modularidad
- **BSC Testnet**: Red de pruebas de Binance Smart Chain

## 📁 Estructura del Proyecto

```
├── contracts/
│   ├── Diamond.sol                 # Contrato principal
│   ├── facets/                     # Módulos funcionales
│   ├── interfaces/                 # Interfaces
│   ├── libraries/                  # Librerías compartidas
│   ├── initializers/              # Inicializadores
│   └── utils/                     # Utilidades
├── scripts/
│   ├── deploy.js                  # Script de deployment
│   ├── verify.js                  # Script de verificación
│   └── flatten.js                 # Script para flatten
├── flattened/                     # Contratos flattened
└── deployment-info.json           # Info de deployment

```

## 🚀 Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Compilar contratos
npm run compile

# Desplegar token GOAL en BSC Testnet
npm run deploy

# Desplegar sistema de preventa
npm run deploy-presale

# Verificar contratos principales
npm run verify

# Verificar contratos de preventa
npm run verify-presale

# Crear archivos flattened
npm run flatten

# Probar funcionalidad del token
npm run test-token

# Probar funcionalidad de preventa
npm run test-simple
```

## 🔧 Configuración

El proyecto está configurado para trabajar con:

- **BSC Testnet RPC**: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- **Chain ID**: 97
- **Gas Price**: 10 gwei
- **Optimizer**: Habilitado (200 runs)

## 📊 Características del Token

### Patrón Diamond (EIP-2535)
- **Modularidad**: Funcionalidades separadas en facets
- **Upgradeabilidad**: Posibilidad de agregar/quitar funciones
- **Eficiencia de Gas**: Optimización en el uso de storage
- **Flexibilidad**: Fácil mantenimiento y extensión

### Funcionalidades Implementadas
- ✅ ERC20 estándar completo
- ✅ Sistema de autorización
- ✅ Gestión de tokenomics
- ✅ Funciones de administración
- ✅ Seguridad anti-reentrancy
- ✅ Sistema de preventa con tiers de precios
- ✅ Token mock USDT para testing
- ✅ Entrega inmediata de tokens

## 🏪 Sistema de Preventa

### Características de la Preventa
- **Token de Pago**: USDT Mock (18 decimales)
- **Token Vendido**: GOAL (7 decimales)
- **Entrega**: Inmediata
- **Sistema de Tiers**: Precios escalonados según monto

### Tiers de Precios
1. **Tier 1**: 0+ USDT = 0.10 USDT por GOAL
2. **Tier 2**: 100+ USDT = 0.08 USDT por GOAL  
3. **Tier 3**: 1000+ USDT = 0.05 USDT por GOAL

### Límites
- **Compra mínima**: 10 USDT
- **Compra máxima**: 10,000 USDT por transacción
- **Hard cap**: 1,000,000 USDT total

### Funciones Principales
- `buy(amountInPaymentToken, recipient)`: Comprar tokens GOAL
- `preview(amountInPaymentToken)`: Ver cotización antes de comprar
- `mint(to, amount)`: Mintear USDT para testing (solo owner)

## 🔐 Seguridad

- Contratos verificados en BSCScan
- Implementación del patrón Diamond estándar
- Uso de librerías probadas (OpenZeppelin style)
- Protección contra reentrancy attacks

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contacta al equipo de desarrollo.

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ para la comunidad Goal Play**