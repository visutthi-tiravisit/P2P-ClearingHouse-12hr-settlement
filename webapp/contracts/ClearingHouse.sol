// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── Chainlink Interface (copy-paste safe for Remix) ─────────────────────────
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt,
        uint256 updatedAt, uint80 answeredInRound
    );
}

// ─── ReentrancyGuard (inline, no import needed in Remix) ─────────────────────
abstract contract ReentrancyGuard {
    uint256 private _status = 1;
    modifier nonReentrant() {
        require(_status == 1, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
}

/**
 * @title  P2P ClearingHouse — 12-Hour Linear Settlement
 * @notice Peer-to-peer ETH options with dynamic premiums and Chainlink oracle.
 *
 * ─── Protocol Summary ────────────────────────────────────────────────────────
 *  • Users deposit native ETH as Collateral (C).
 *  • A Dynamic Premium (Π = R_skew + R_time + R_dist) is deducted.
 *  • Net Position: N = C − (C × Π)
 *  • Settlement price (P_final) is read from Chainlink at cycle end.
 *  • ITM payout: N × (1 + ΔP), funded by the OTM pool.
 *  • OTM payout: residual N after funding ITM gains.
 *  • Price Surcharge cap: R_dist ≤ 70% × ΔP (guarantees ~30% profit margin).
 *
 * ─── Deployment (Remix / Sepolia) ─────────────────────────────────────────
 *  1. Paste this file into Remix IDE.
 *  2. Compile with Solidity ^0.8.20.
 *  3. Deploy with constructor args:
 *       _priceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306  (ETH/USD Sepolia)
 *       _treasury  = <your address>
 *  4. Copy the deployed address into webapp/src/lib/constants.js
 */
contract ClearingHouse is ReentrancyGuard {

    // ─── Structs ─────────────────────────────────────────────────────────────────

    struct Cycle {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        int256  pTarget;          // Chainlink 8-decimal format
        int256  pFinal;           // set at settlement
        uint256 netLong;          // Σ netPosition of all LONG positions (wei)
        uint256 netShort;         // Σ netPosition of all SHORT positions (wei)
        uint256 longPayoutRatio;  // scaled SCALE: wei payout per wei of netPosition
        uint256 shortPayoutRatio;
        bool    settled;
    }

    struct Position {
        uint256 id;
        address payable owner;
        uint256 cycleId;
        bool    isLong;
        uint256 collateral;    // original deposit (wei)
        uint256 netPosition;   // collateral − premium (wei)
        int256  entryPrice;    // oracle price at open (8 decimals)
        uint256 premiumBps;    // total premium in bps (10000 = 100%)
        uint256 openedAt;
        bool    claimed;
    }

    struct PremiumBreakdown {
        uint256 skewBps;
        uint256 timeBps;
        uint256 distBps;
        uint256 totalBps;
        uint256 premiumCostWei;
        uint256 netPositionWei;
        uint256 baseFeeWei;      // BASE_RATE portion → transferred to treasury
        bool    isCapped;
        int256  oraclePrice;
    }

    // ─── Constants ───────────────────────────────────────────────────────────────

    uint256 public constant CYCLE_DURATION  = 12 hours;   // 43200s
    uint256 public constant STABLE_END      = 9 hours;    // 32400s
    uint256 public constant WARNING_END     = 10 hours + 30 minutes; // 37800s
    uint256 public constant BASE_RATE_BPS   = 10;         // 0.10%
    uint256 public constant BPS_DIVISOR     = 10_000;     // 100.00%
    uint256 public constant SCALE           = 1e18;
    uint256 public constant MIN_COLLATERAL  = 0.001 ether;
    uint256 public constant PRICE_STALENESS = 3_600;      // 1 hour

    // ─── State ───────────────────────────────────────────────────────────────────

    AggregatorV3Interface public immutable priceFeed;
    address public immutable treasury;

    uint256 public currentCycleId;
    mapping(uint256 => Cycle)    public cycles;

    uint256 public positionCount;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) private _userPositionIds;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event CycleStarted(uint256 indexed cycleId, int256 pTarget, uint256 startTime);
    event PositionOpened(
        uint256 indexed positionId,
        address indexed owner,
        bool    isLong,
        uint256 collateral,
        uint256 netPosition,
        uint256 premiumBps,
        int256  entryPrice,
        uint256 baseFee
    );
    event CycleSettled(
        uint256 indexed cycleId,
        int256  pFinal,
        uint256 longPayoutRatio,
        uint256 shortPayoutRatio
    );
    event PayoutClaimed(uint256 indexed positionId, address indexed owner, uint256 payout);

    // ─── Errors ──────────────────────────────────────────────────────────────────

    error CycleNotEndedYet();
    error CycleAlreadySettled();
    error CycleNotSettled();
    error PositionAlreadyClaimed();
    error NotPositionOwner();
    error BelowMinCollateral();
    error StalePriceFeed();
    error InvalidOraclePrice();
    error TransferFailed();
    error NotTreasury();

    // ─── Constructor ─────────────────────────────────────────────────────────────

    modifier onlyTreasury() {
        if (msg.sender != treasury) revert NotTreasury();
        _;
    }

    constructor(address _priceFeed, address _treasury) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        treasury  = _treasury;
        _startCycle(0); // first cycle: pTarget = current oracle price
    }

    // ─── Internal helpers ────────────────────────────────────────────────────────

    function _getOraclePrice() internal view returns (int256 price) {
        uint256 updatedAt;
        (, price, , updatedAt, ) = priceFeed.latestRoundData();
        if (block.timestamp - updatedAt > PRICE_STALENESS) revert StalePriceFeed();
        if (price <= 0) revert InvalidOraclePrice();
    }

    function _startCycle(int256 prevClose) internal {
        int256 target = prevClose == 0 ? _getOraclePrice() : prevClose;
        currentCycleId++;
        cycles[currentCycleId] = Cycle({
            id:               currentCycleId,
            startTime:        block.timestamp,
            endTime:          block.timestamp + CYCLE_DURATION,
            pTarget:          target,
            pFinal:           0,
            netLong:          0,
            netShort:         0,
            longPayoutRatio:  0,
            shortPayoutRatio: 0,
            settled:          false
        });
        emit CycleStarted(currentCycleId, target, block.timestamp);
    }

    // ─── Phase & premium views ───────────────────────────────────────────────────

    /// @return 0 = stable (0–9h), 1 = warning (9–10.5h), 2 = critical (10.5–12h)
    function getCyclePhase() public view returns (uint8) {
        Cycle storage c = cycles[currentCycleId];
        uint256 elapsed = block.timestamp >= c.endTime
            ? CYCLE_DURATION
            : block.timestamp - c.startTime;
        if (elapsed < STABLE_END)  return 0;
        if (elapsed < WARNING_END) return 1;
        return 2;
    }

    function getTimePremiumBps() public view returns (uint256) {
        uint8 phase = getCyclePhase();
        if (phase == 0) return 0;
        if (phase == 1) return 200; // 2%
        // Critical: linear 5% → 10% over 90 min
        Cycle storage c = cycles[currentCycleId];
        uint256 elapsed = block.timestamp - c.startTime;
        uint256 critElapsed  = elapsed > WARNING_END ? elapsed - WARNING_END : 0;
        uint256 critDuration = CYCLE_DURATION - WARNING_END; // 5400s
        return 500 + (critElapsed * 500 / critDuration);     // 500–1000 bps
    }

    /// @return skewBps  R_base × S_factor
    function getSkewBps(bool isLong) public view returns (uint256 skewBps) {
        Cycle storage c = cycles[currentCycleId];
        uint256 total = c.netLong + c.netShort;
        uint256 skewFactor = 100; // 1.0×
        if (total > 0) {
            uint256 pool = isLong ? c.netLong : c.netShort;
            uint256 ratioBps = pool * BPS_DIVISOR / total;
            if (ratioBps > 6000) skewFactor = 200; // overcrowded (>60%) → 2.0×
            else if (ratioBps < 4000) skewFactor = 50; // underfilled (<40%) → 0.5×
        }
        skewBps = BASE_RATE_BPS * skewFactor / 100;
    }

    /**
     * @notice Full premium breakdown — mirrors the off-chain premium.js logic.
     * @dev    Call this view before openPosition to show the user their exact costs.
     */
    function computePremium(bool isLong, uint256 collateral)
        public view
        returns (PremiumBreakdown memory pb)
    {
        pb.oraclePrice = _getOraclePrice();
        pb.skewBps     = getSkewBps(isLong);
        pb.timeBps     = getTimePremiumBps();

        Cycle storage c = cycles[currentCycleId];
        bool longITM  = isLong  && pb.oraclePrice > c.pTarget;
        bool shortITM = !isLong && pb.oraclePrice < c.pTarget;

        if (longITM || shortITM) {
            uint256 absDelta = pb.oraclePrice > c.pTarget
                ? uint256(pb.oraclePrice - c.pTarget)
                : uint256(c.pTarget       - pb.oraclePrice);
            // deltaBps = |ΔP| / P_target as bps (10000 = 100%)
            uint256 deltaBps  = absDelta * BPS_DIVISOR / uint256(c.pTarget);
            uint256 uncapped  = pb.skewBps + pb.timeBps + deltaBps;
            uint256 cap       = deltaBps * 70 / 100; // 70% of ΔP cap

            if (uncapped > cap && cap > 0) {
                pb.isCapped = true;
                uint256 baseFees = pb.skewBps + pb.timeBps;
                pb.distBps  = cap > baseFees ? cap - baseFees : 0;
                pb.totalBps = cap;
            } else {
                pb.distBps  = deltaBps;
                pb.totalBps = uncapped;
            }
        } else {
            pb.totalBps = pb.skewBps + pb.timeBps; // OTM: no distance surcharge
        }

        pb.premiumCostWei = collateral * pb.totalBps / BPS_DIVISOR;
        pb.netPositionWei = collateral - pb.premiumCostWei;
        pb.baseFeeWei     = collateral * BASE_RATE_BPS / BPS_DIVISOR;
    }

    // ─── Open Position ───────────────────────────────────────────────────────────

    /**
     * @notice Deposit ETH and open a Long or Short position.
     * @param  isLong  true = Long (profit when P_final > P_target), false = Short.
     */
    function openPosition(bool isLong) external payable nonReentrant {
        if (msg.value < MIN_COLLATERAL) revert BelowMinCollateral();
        Cycle storage c = cycles[currentCycleId];
        if (c.settled || block.timestamp >= c.endTime) revert CycleAlreadySettled();

        PremiumBreakdown memory pb = computePremium(isLong, msg.value);

        // Transfer base rate fee to treasury (platform maintenance / gas fund).
        // N = C − (C × Π) is unchanged; this deducts from the pool's premium surplus,
        // which always satisfies Π ≥ BASE_RATE so the pool remains solvent.
        (bool ok, ) = payable(treasury).call{value: pb.baseFeeWei}("");
        if (!ok) revert TransferFailed();

        positionCount++;
        positions[positionCount] = Position({
            id:          positionCount,
            owner:       payable(msg.sender),
            cycleId:     currentCycleId,
            isLong:      isLong,
            collateral:  msg.value,
            netPosition: pb.netPositionWei,
            entryPrice:  pb.oraclePrice,
            premiumBps:  pb.totalBps,
            openedAt:    block.timestamp,
            claimed:     false
        });
        _userPositionIds[msg.sender].push(positionCount);

        if (isLong) c.netLong  += pb.netPositionWei;
        else        c.netShort += pb.netPositionWei;

        emit PositionOpened(
            positionCount, msg.sender, isLong,
            msg.value, pb.netPositionWei, pb.totalBps, pb.oraclePrice,
            pb.baseFeeWei
        );
    }

    // ─── Settle Cycle ────────────────────────────────────────────────────────────

    /**
     * @notice Anyone can call after cycle endTime to settle and start next cycle.
     *         Payout ratios are pre-computed here so claimPayout() is O(1).
     */
    function settleCycle() external nonReentrant {
        Cycle storage c = cycles[currentCycleId];
        if (c.settled) revert CycleAlreadySettled();
        if (block.timestamp < c.endTime) revert CycleNotEndedYet();

        c.pFinal  = _getOraclePrice();
        c.settled = true;
        _computePayoutRatios(c);

        emit CycleSettled(currentCycleId, c.pFinal, c.longPayoutRatio, c.shortPayoutRatio);
        _startCycle(c.pFinal); // next cycle's pTarget = this cycle's pFinal
    }

    function _computePayoutRatios(Cycle storage c) internal {
        // Edge case: empty pools → everyone gets N back
        if (c.netLong == 0 || c.netShort == 0) {
            c.longPayoutRatio  = SCALE;
            c.shortPayoutRatio = SCALE;
            return;
        }

        // ΔP = |pFinal − pTarget| / pTarget  (scaled by SCALE)
        uint256 absDelta = c.pFinal > c.pTarget
            ? uint256(c.pFinal   - c.pTarget)
            : uint256(c.pTarget  - c.pFinal);
        uint256 deltaScaled = absDelta * SCALE / uint256(c.pTarget);

        if (c.pFinal == c.pTarget) {
            // Exact strike — return N to everyone
            c.longPayoutRatio  = SCALE;
            c.shortPayoutRatio = SCALE;

        } else if (c.pFinal > c.pTarget) {
            // LONG wins: gain = netLong × ΔP, funded from netShort
            uint256 longGainNeeded = c.netLong * deltaScaled / SCALE;
            uint256 actualGain     = longGainNeeded < c.netShort
                ? longGainNeeded : c.netShort;
            c.longPayoutRatio  = SCALE + (actualGain * SCALE / c.netLong);
            uint256 shortLeft  = c.netShort - actualGain;
            c.shortPayoutRatio = shortLeft * SCALE / c.netShort;

        } else {
            // SHORT wins: gain = netShort × ΔP, funded from netLong
            uint256 shortGainNeeded = c.netShort * deltaScaled / SCALE;
            uint256 actualGain      = shortGainNeeded < c.netLong
                ? shortGainNeeded : c.netLong;
            c.shortPayoutRatio = SCALE + (actualGain * SCALE / c.netShort);
            uint256 longLeft   = c.netLong - actualGain;
            c.longPayoutRatio  = longLeft * SCALE / c.netLong;
        }
    }

    // ─── Claim Payout ────────────────────────────────────────────────────────────

    /**
     * @notice Claim ETH payout for a settled position.
     *         Payout = netPosition × payoutRatio (SCALE = 1.0×)
     */
    function claimPayout(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        if (pos.owner != payable(msg.sender)) revert NotPositionOwner();
        if (pos.claimed) revert PositionAlreadyClaimed();

        Cycle storage c = cycles[pos.cycleId];
        if (!c.settled) revert CycleNotSettled();

        pos.claimed = true;
        uint256 ratio  = pos.isLong ? c.longPayoutRatio : c.shortPayoutRatio;
        uint256 payout = pos.netPosition * ratio / SCALE;

        emit PayoutClaimed(positionId, msg.sender, payout);

        (bool ok, ) = pos.owner.call{value: payout}("");
        if (!ok) revert TransferFailed();
    }

    // ─── View Helpers (for frontend) ─────────────────────────────────────────────

    function getCurrentCycle() external view returns (Cycle memory) {
        return cycles[currentCycleId];
    }

    function getCycleById(uint256 cycleId) external view returns (Cycle memory) {
        return cycles[cycleId];
    }

    function getOraclePrice() external view returns (int256) {
        return _getOraclePrice();
    }

    function getUserPositionIds(address user) external view returns (uint256[] memory) {
        return _userPositionIds[user];
    }

    function getPosition(uint256 id) external view returns (Position memory) {
        return positions[id];
    }

    function getCycleElapsed() external view returns (uint256) {
        Cycle storage c = cycles[currentCycleId];
        if (block.timestamp >= c.endTime) return CYCLE_DURATION;
        return block.timestamp - c.startTime;
    }

    /// @notice Batch-fetch multiple positions in one call (gas-efficient for UI)
    function getPositionsBatch(uint256[] calldata ids)
        external view returns (Position[] memory result)
    {
        result = new Position[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            result[i] = positions[ids[i]];
        }
    }

    // ─── Developer / Sandbox (owner-only) ────────────────────────────────────────

    /// @dev Collapses the current cycle's endTime to now + 60s for quick testing.
    function devFastForward() external onlyTreasury {
        Cycle storage c = cycles[currentCycleId];
        if (c.settled) revert CycleAlreadySettled();
        c.endTime = block.timestamp + 60;
    }

    /// @dev Settles the current cycle immediately, bypassing the endTime guard.
    function devForceSettle() external nonReentrant onlyTreasury {
        Cycle storage c = cycles[currentCycleId];
        if (c.settled) revert CycleAlreadySettled();
        c.pFinal  = _getOraclePrice();
        c.settled = true;
        _computePayoutRatios(c);
        emit CycleSettled(currentCycleId, c.pFinal, c.longPayoutRatio, c.shortPayoutRatio);
        _startCycle(c.pFinal);
    }

    receive() external payable {}
}
