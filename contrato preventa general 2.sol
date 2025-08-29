// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StandardizedPresale
 * @notice Contrato de preventa genérico para EVM:
 * - Compra con ERC20 de pago (p.ej. USDT).
 * - Precio por token configurable + pricing por tramos (tiers) según monto gastado.
 * - Entrega inmediata o vesting con fecha global (cliff).
 * - Funciones administrativas seguras (Ownable2Step, Pausable).
 * - Anti-reentradas (ReentrancyGuard).
 * - Rescue/withdraw de cualquier ERC20 (incluido WETH) y de ETH nativo.
 * - Compatible con tokens detrás de proxies (incluye detección/override de decimals).
 *
 * Convenciones:
 * - `pricePerToken` se expresa en unidades del token de pago requeridas para obtener 1 * (10^decimalsDelTokenVendido).
 *   Ej.: si el token vendido tiene 18 decimales y el precio es 0.10 USDT (6 dec), entonces pricePerToken = 100_000.
 *
 * Flujo:
 * - El comprador aprueba (approve) al contrato para gastar `paymentToken`.
 * - Llama `buy(amountInPaymentToken, recipient)`.
 * - Se calcula el tier aplicable en base a `amountInPaymentToken`.
 * - Si `immediateDelivery == true`: se transfieren los tokens vendidos al instante.
 *   Si `immediateDelivery == false`: se acumulan en `vestedBalance[recipient]` y se podrán reclamar a partir de `releaseTime`.
 *
 * Auditoría / Buenas prácticas:
 * - Pausable en compras (no bloquea claim).
 * - Sin fondos retenidos innecesariamente: opción de enviar el pago directamente al `fundsWallet`.
 * - Eventos exhaustivos.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address o, address s) external view returns (uint256);
    function transfer(address to, uint256 v) external returns (bool);
    function approve(address spender, uint256 v) external returns (bool);
    function transferFrom(address from, address to, uint256 v) external returns (bool);
}

interface IERC20Metadata is IERC20 {
    function decimals() external view returns (uint8);
}

library SafeERC20 {
    function safeTransfer(IERC20 t, address to, uint256 v) internal {
        (bool ok, bytes memory d) = address(t).call(abi.encodeWithSelector(t.transfer.selector, to, v));
        require(ok && (d.length == 0 || abi.decode(d, (bool))), "SafeERC20: transfer failed");
    }

    function safeTransferFrom(IERC20 t, address from, address to, uint256 v) internal {
        (bool ok, bytes memory d) = address(t).call(abi.encodeWithSelector(t.transferFrom.selector, from, to, v));
        require(ok && (d.length == 0 || abi.decode(d, (bool))), "SafeERC20: transferFrom failed");
    }

    function safeApprove(IERC20 t, address spender, uint256 v) internal {
        (bool ok, bytes memory d) = address(t).call(abi.encodeWithSelector(t.approve.selector, spender, v));
        require(ok && (d.length == 0 || abi.decode(d, (bool))), "SafeERC20: approve failed");
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _ENTERED = 1;
    uint256 private constant _NOT_ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

abstract contract Ownable2Step {
    address public owner;
    address public pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: not owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: zero addr");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() public {
        require(msg.sender == pendingOwner, "Ownable: not pending");
        address old = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(old, owner);
    }
}

abstract contract Pausable is Ownable2Step {
    bool public paused;

    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
}

contract StandardizedPresale is Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // === Tokens y precisión ===
    IERC20 public saleToken;          // Token que se vende
    IERC20 public paymentToken;       // Token con el que se paga (p.ej. USDT)
    uint8   public saleTokenDecimals; // Decimales token vendido
    uint8   public paymentDecimals;   // Decimales token pago

    // === Fondos / Tesorería ===
    address public fundsWallet;       // Donde se envían los pagos

    // === Pricing por tramos ===
    struct Tier {
        uint256 minSpend;        // monto mínimo en token de pago (en sus decimales)
        uint256 pricePerToken;   // precio (token de pago) por 1 * 10^saleTokenDecimals
    }
    Tier[] public tiers; // Debe estar ordenado por minSpend ascendente. Se aplica el último tier cuyo minSpend <= spend.

    // === Vesting ===
    bool    public immediateDelivery;   // true = entrega inmediata; false = vesting
    uint64  public releaseTime;         // timestamp Unix (segundos) cuando se puede reclamar si vesting

    mapping(address => uint256) public vestedBalance; // tokens pendientes por reclamar si vesting

    // === Límites opcionales (puedes dejarlos en 0 si no aplican) ===
    uint256 public minPurchase;      // compra mínima en token de pago (decimales paymentToken). 0 = sin mínimo
    uint256 public maxPurchase;      // compra máxima por tx en token de pago. 0 = sin máximo
    uint256 public hardCapPayment;   // tope total de recaudación en token de pago. 0 = sin tope
    uint256 public totalRaised;      // recaudado total (paymentToken)

    // === Fechas de venta opcionales (0 = sin restricciones) ===
    uint64 public saleStart;
    uint64 public saleEnd;

    // === Eventos ===
    event ConfigTokens(address indexed saleToken, uint8 saleTokenDecimals, address indexed paymentToken, uint8 paymentDecimals);
    event FundsWalletUpdated(address indexed newWallet);
    event TiersUpdated(uint256 count);
    event Purchase(address indexed buyer, address indexed recipient, uint256 spent, uint256 tokensOut, uint256 appliedPrice);
    event Claim(address indexed account, uint256 amount);
    event ImmediateDeliverySet(bool enabled);
    event ReleaseTimeSet(uint64 releaseTime);
    event Rescue(address indexed token, address indexed to, uint256 amount);
    event WithdrawPayment(address indexed to, uint256 amount);
    event WithdrawUnsold(address indexed to, uint256 amount);
    event LimitsUpdated(uint256 minPurchase, uint256 maxPurchase, uint256 hardCapPayment);
    event SaleWindowUpdated(uint64 start, uint64 end);

    // === Errores personalizados ===
    error InvalidArray();
    error UnsortedTiers();
    error NoTiers();
    error ZeroAddress();
    error InvalidTime();
    error OutOfWindow();
    error AmountTooLow();
    error AmountTooHigh();
    error HardCapExceeded();
    error PriceZero();
    error NothingToClaim();

    constructor(
        address _saleToken,
        address _paymentToken,
        address _fundsWallet,
        bool    _immediateDelivery,
        uint64  _releaseTime,
        uint256[] memory _minSpends,       // Ej.: [0, 100e6, 1000e6, ...] si USDT 6 dec
        uint256[] memory _pricesPerToken   // Ej.: [100000, 10000, ...] (precio en paymentToken por 1*10^saleTokenDecimals)
    ) {
        if (_saleToken == address(0) || _paymentToken == address(0) || _fundsWallet == address(0)) revert ZeroAddress();

        saleToken    = IERC20(_saleToken);
        paymentToken = IERC20(_paymentToken);
        fundsWallet  = _fundsWallet;

        // Detecta decimales (fallback a 18 si no existe el método)
        saleTokenDecimals = _tryGetDecimals(_saleToken, 18);
        paymentDecimals   = _tryGetDecimals(_paymentToken, 18);

        emit ConfigTokens(_saleToken, saleTokenDecimals, _paymentToken, paymentDecimals);

        _setTiers(_minSpends, _pricesPerToken);
        immediateDelivery = _immediateDelivery;
        emit ImmediateDeliverySet(_immediateDelivery);

        if (!_immediateDelivery) {
            if (_releaseTime == 0 || _releaseTime <= block.timestamp) revert InvalidTime();
            releaseTime = _releaseTime;
            emit ReleaseTimeSet(_releaseTime);
        }
    }

    // === Compra principal ===
    function buy(uint256 amountInPaymentToken, address recipient)
        external
        nonReentrant
        whenNotPaused
    {
        if (recipient == address(0)) recipient = msg.sender;
        if (saleStart != 0 && block.timestamp < saleStart) revert OutOfWindow();
        if (saleEnd   != 0 && block.timestamp > saleEnd)   revert OutOfWindow();
        if (amountInPaymentToken == 0) revert AmountTooLow();
        if (minPurchase != 0 && amountInPaymentToken < minPurchase) revert AmountTooLow();
        if (maxPurchase != 0 && amountInPaymentToken > maxPurchase) revert AmountTooHigh();
        if (hardCapPayment != 0 && totalRaised + amountInPaymentToken > hardCapPayment) revert HardCapExceeded();

        (uint256 appliedPrice,,) = quotePrice(amountInPaymentToken); // obtiene price por tier
        if (appliedPrice == 0) revert PriceZero();

        uint256 tokensOut = _calcTokensOut(amountInPaymentToken, appliedPrice);

        // recolección: envía el pago directo a la tesorería
        paymentToken.safeTransferFrom(msg.sender, fundsWallet, amountInPaymentToken);
        totalRaised += amountInPaymentToken;

        if (immediateDelivery) {
            // entrega inmediata
            _safeDeliver(recipient, tokensOut);
        } else {
            // vesting: acumula balance a reclamar después de releaseTime
            vestedBalance[recipient] += tokensOut;
        }

        emit Purchase(msg.sender, recipient, amountInPaymentToken, tokensOut, appliedPrice);
    }

    // === Reclamo de vesting (cuando immediateDelivery = false) ===
    function claim() external nonReentrant {
        require(!immediateDelivery, "Claim disabled on immediate mode");
        if (block.timestamp < releaseTime) revert InvalidTime();
        uint256 amt = vestedBalance[msg.sender];
        if (amt == 0) revert NothingToClaim();
        vestedBalance[msg.sender] = 0;
        _safeDeliver(msg.sender, amt);
        emit Claim(msg.sender, amt);
    }

    // === Vistas de ayuda ===

    /// @notice Devuelve (priceAplicado, tierIndex, tokensOut) para un monto de pago dado
    function preview(uint256 amountInPaymentToken) external view returns (uint256 appliedPrice, uint256 tierIndex, uint256 tokensOut) {
        (appliedPrice, tierIndex, ) = quotePrice(amountInPaymentToken);
        if (appliedPrice == 0) return (0, tierIndex, 0);
        tokensOut = _calcTokensOut(amountInPaymentToken, appliedPrice);
    }

    /// @notice Dado un monto de pago, encuentra el tier aplicable y el precio por token (en paymentToken)
    function quotePrice(uint256 amountInPaymentToken) public view returns (uint256 appliedPrice, uint256 tierIndex, bool found) {
        uint256 n = tiers.length;
        if (n == 0) return (0, 0, false);
        // Elegir el mayor minSpend <= amount
        appliedPrice = 0;
        tierIndex = 0;
        for (uint256 i = 0; i < n; i++) {
            if (amountInPaymentToken >= tiers[i].minSpend) {
                appliedPrice = tiers[i].pricePerToken;
                tierIndex = i;
                found = true;
            } else {
                break;
            }
        }
    }

    function tiersCount() external view returns (uint256) {
        return tiers.length;
    }

    // === Admin: configuración ===

    function setTokens(address _saleToken, address _paymentToken) external onlyOwner {
        if (_saleToken == address(0) || _paymentToken == address(0)) revert ZeroAddress();
        saleToken = IERC20(_saleToken);
        paymentToken = IERC20(_paymentToken);
        saleTokenDecimals = _tryGetDecimals(_saleToken, 18);
        paymentDecimals   = _tryGetDecimals(_paymentToken, 18);
        emit ConfigTokens(_saleToken, saleTokenDecimals, _paymentToken, paymentDecimals);
    }

    /// @notice Permite override manual de decimales si el token no cumple IERC20Metadata o reporta algo inesperado.
    function overrideDecimals(uint8 _saleTokenDecimals, uint8 _paymentDecimals) external onlyOwner {
        require(_saleTokenDecimals > 0 && _saleTokenDecimals <= 36, "bad sale dec");
        require(_paymentDecimals > 0 && _paymentDecimals <= 36, "bad pay dec");
        saleTokenDecimals = _saleTokenDecimals;
        paymentDecimals   = _paymentDecimals;
        emit ConfigTokens(address(saleToken), saleTokenDecimals, address(paymentToken), paymentDecimals);
    }

    function setFundsWallet(address _fundsWallet) external onlyOwner {
        if (_fundsWallet == address(0)) revert ZeroAddress();
        fundsWallet = _fundsWallet;
        emit FundsWalletUpdated(_fundsWallet);
    }

    /// @dev Reemplaza todos los tiers. Debe contener al menos un tier con minSpend == 0 y orden ascendente.
    function setTiers(uint256[] calldata _minSpends, uint256[] calldata _pricesPerToken) external onlyOwner {
        _setTiers(_minSpends, _pricesPerToken);
    }

    function _setTiers(uint256[] memory _minSpends, uint256[] memory _pricesPerToken) internal {
        if (_minSpends.length == 0 || _minSpends.length != _pricesPerToken.length) revert InvalidArray();

        // Validaciones: el primero debe ser 0, orden ascendente y precios > 0
        if (_minSpends[0] != 0) revert NoTiers();
        for (uint256 i=0; i<_minSpends.length; i++) {
            if (_pricesPerToken[i] == 0) revert PriceZero();
            if (i > 0 && _minSpends[i] <= _minSpends[i-1]) revert UnsortedTiers();
        }

        delete tiers;
        for (uint256 j=0; j<_minSpends.length; j++) {
            tiers.push(Tier({minSpend: _minSpends[j], pricePerToken: _pricesPerToken[j]}));
        }
        emit TiersUpdated(tiers.length);
    }

    function setImmediateDelivery(bool _enabled) external onlyOwner {
        immediateDelivery = _enabled;
        emit ImmediateDeliverySet(_enabled);
    }

    /// @notice Configura/actualiza la fecha de liberación (vesting cliff). Debe ser futura.
    function setReleaseTime(uint64 _releaseTime) external onlyOwner {
        if (_releaseTime == 0 || _releaseTime <= block.timestamp) revert InvalidTime();
        releaseTime = _releaseTime;
        emit ReleaseTimeSet(_releaseTime);
    }

    /// @notice Límites opcionales
    function setLimits(uint256 _minPurchase, uint256 _maxPurchase, uint256 _hardCapPayment) external onlyOwner {
        if (_maxPurchase != 0) require(_maxPurchase >= _minPurchase, "max<min");
        if (_hardCapPayment != 0) require(_hardCapPayment >= totalRaised, "hardCap<raised");
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
        hardCapPayment = _hardCapPayment;
        emit LimitsUpdated(_minPurchase, _maxPurchase, _hardCapPayment);
    }

    /// @notice Ventana de venta (0 = sin restricción)
    function setSaleWindow(uint64 _start, uint64 _end) external onlyOwner {
        if (_end != 0 && _start != 0) require(_end > _start, "end<=start");
        saleStart = _start;
        saleEnd   = _end;
        emit SaleWindowUpdated(_start, _end);
    }

    // === Admin: retiros y rescates ===

    /// @notice Retira saldo en el token de pago que estuviera en el contrato (por si no se envió directo a fundsWallet)
    function withdrawPayment(uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        paymentToken.safeTransfer(to, amount);
        emit WithdrawPayment(to, amount);
    }

    /// @notice Retira tokens no vendidos (saleToken) del contrato
    function withdrawUnsold(uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(saleToken).safeTransfer(to, amount);
        emit WithdrawUnsold(to, amount);
    }

    /// @notice Rescata cualquier ERC20 (ej.: WETH enviado por error) y lo reenvía a `to`
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0) || token == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit Rescue(token, to, amount);
    }

    /// @notice Retira ETH nativo (por si fue enviado por accidente o vía selfdestruct)
    function rescueETH(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit Rescue(address(0), to, amount);
    }

    // === Internas ===

    function _calcTokensOut(uint256 amountInPaymentToken, uint256 pricePerToken) internal view returns (uint256) {
        // tokensOut = amount * 10^saleTokenDecimals / pricePerToken
        // Aquí `pricePerToken` y `amountInPaymentToken` están en decimales del token de pago.
        // No requiere normalización explícita porque pricePerToken ya está definido en unidades del token de pago
        // por 1 * 10^saleTokenDecimals del token vendido.
        uint256 unit = 10 ** uint256(saleTokenDecimals);
        return (amountInPaymentToken * unit) / pricePerToken;
    }

    function _safeDeliver(address to, uint256 amount) internal {
        // El contrato DEBE tener suficientes saleToken pre-cargados.
        IERC20(saleToken).safeTransfer(to, amount);
    }

    function _tryGetDecimals(address token, uint8 fallbackDecimals) private view returns (uint8) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSelector(IERC20Metadata.decimals.selector));
        if (ok && data.length >= 32) {
            uint256 dec = abi.decode(data, (uint256));
            if (dec > 0 && dec <= 36) return uint8(dec);
        }
        return fallbackDecimals; // por defecto 18 si no expone `decimals()`
    }

    // Rechaza ETH por defecto (se puede rescatar si entra por selfdestruct)
    receive() external payable {
        revert("No direct ETH");
    }
}
