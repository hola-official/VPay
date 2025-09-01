// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title MultiTokenVestingManager
 * @dev A single contract that manages vesting schedules for multiple tokens and recipients
 */
contract MultiTokenVestingManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    // Enums for contract permissions
    enum CancelPermission {
        NONE,
        SENDER_ONLY,
        RECIPIENT_ONLY,
        BOTH
    }

    enum ChangeRecipientPermission {
        NONE,
        SENDER_ONLY,
        RECIPIENT_ONLY,
        BOTH
    }

    // Unlock schedule frequencies
    enum UnlockSchedule {
        SECOND,
        MINUTE,
        HOUR,
        DAILY,
        WEEKLY,
        BIWEEKLY,
        MONTHLY,
        QUARTERLY,
        YEARLY
    }

    struct VestingSchedule {
        uint256 id;
        address token;
        address sender;
        address recipient;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 endTime;
        UnlockSchedule unlockSchedule;
        bool autoClaim;
        bool cancelled;
        string contractTitle;
        string recipientEmail;
        CancelPermission cancelPermission;
        ChangeRecipientPermission changeRecipientPermission;
        uint256 createdAt;
    }

    struct TokenVestingInfo {
        address token;
        uint256 totalVestedAmount;
        uint256 totalReleasedAmount;
        uint256 activeSchedulesCount;
    }

    // State variables
    uint256 private constant ID_PADDING = 1_000_000;
    VestingSchedule[] private _vestingSchedules;

    // Mappings for efficient lookups
    mapping(address => EnumerableSet.UintSet) private _recipientSchedules;
    mapping(address => EnumerableSet.UintSet) private _senderSchedules;
    mapping(address => EnumerableSet.UintSet) private _tokenSchedules;

    // Token tracking
    EnumerableSet.AddressSet private _vestedTokens;
    mapping(address => TokenVestingInfo) public tokenVestingInfo;

    // Fee system (optional, like TokenLocker)
    address private feeRecipient;
    uint256 public vestingFeePercentage = 0; // 0% by default, can be set by owner

    // Events
    event VestingScheduleCreated(
        uint256 indexed scheduleId,
        address indexed token,
        address indexed sender,
        address recipient,
        uint256 amount,
        uint256 startTime,
        uint256 endTime
    );

    event TokensReleased(uint256 indexed scheduleId, address indexed token, address indexed recipient, uint256 amount);

    event VestingScheduleCancelled(uint256 indexed scheduleId);

    event RecipientChanged(uint256 indexed scheduleId, address indexed oldRecipient, address indexed newRecipient);

    event VestingFeeUpdated(uint256 newFeePercentage);

    modifier validSchedule(uint256 scheduleId) {
        _getActualIndex(scheduleId);
        _;
    }

    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }

    /**
     * @dev Creates a single vesting schedule
     */
    function createVestingSchedule(
        address _token,
        address _recipient,
        uint256 _amount,
        uint256 _startTime,
        uint256 _endTime,
        UnlockSchedule _unlockSchedule,
        bool _autoClaim,
        string memory _contractTitle,
        string memory _recipientEmail,
        CancelPermission _cancelPermission,
        ChangeRecipientPermission _changeRecipientPermission
    ) external returns (uint256 scheduleId) {
        require(_token != address(0), "Token address cannot be zero");
        require(_recipient != address(0), "Recipient cannot be zero address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_startTime < _endTime, "Start time must be before end time");
        require(_endTime > block.timestamp, "End time must be in the future");

        // Validate that vesting duration is divisible by unlock schedule
        uint256 vestingDuration = _endTime - _startTime;
        uint256 unlockInterval = getUnlockInterval(_unlockSchedule);
        require(vestingDuration % unlockInterval == 0, "Vesting duration must be divisible by unlock schedule");

        scheduleId = _createSchedule(
            _token,
            msg.sender,
            _recipient,
            _amount,
            _startTime,
            _endTime,
            _unlockSchedule,
            _autoClaim,
            _contractTitle,
            _recipientEmail,
            _cancelPermission,
            _changeRecipientPermission
        );

        // Transfer tokens from sender to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit VestingScheduleCreated(scheduleId, _token, msg.sender, _recipient, _amount, _startTime, _endTime);

        return scheduleId;
    }

    /**
     * @dev Creates multiple vesting schedules for the same token and parameters
     */
    function createMultipleVestingSchedules(
        address _token,
        address[] memory _recipients,
        uint256[] memory _amounts,
        uint256 _startTime,
        uint256 _endTime,
        UnlockSchedule _unlockSchedule,
        bool _autoClaim,
        string[] memory _contractTitles,
        string[] memory _recipientEmails,
        CancelPermission _cancelPermission,
        ChangeRecipientPermission _changeRecipientPermission
    ) external returns (uint256[] memory scheduleIds) {
        require(_token != address(0), "Token address cannot be zero");
        require(_recipients.length == _amounts.length, "Recipients and amounts length mismatch");
        require(_recipients.length == _contractTitles.length, "Recipients and titles length mismatch");
        require(_recipients.length == _recipientEmails.length, "Recipients and emails length mismatch");
        require(_startTime < _endTime, "Start time must be before end time");
        require(_endTime > block.timestamp, "End time must be in the future");

        // Validate that vesting duration is divisible by unlock schedule
        uint256 vestingDuration = _endTime - _startTime;
        uint256 unlockInterval = getUnlockInterval(_unlockSchedule);
        require(vestingDuration % unlockInterval == 0, "Vesting duration must be divisible by unlock schedule");

        uint256 totalAmount = 0;
        scheduleIds = new uint256[](_recipients.length);

        // Create all schedules first
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Recipient cannot be zero address");
            require(_amounts[i] > 0, "Amount must be greater than 0");

            totalAmount += _amounts[i];

            scheduleIds[i] = _createSchedule(
                _token,
                msg.sender,
                _recipients[i],
                _amounts[i],
                _startTime,
                _endTime,
                _unlockSchedule,
                _autoClaim,
                _contractTitles[i],
                _recipientEmails[i],
                _cancelPermission,
                _changeRecipientPermission
            );

            emit VestingScheduleCreated(
                scheduleIds[i], _token, msg.sender, _recipients[i], _amounts[i], _startTime, _endTime
            );
        }

        // Transfer total amount once
        IERC20(_token).safeTransferFrom(msg.sender, address(this), totalAmount);

        return scheduleIds;
    }

    /**
     * @dev Internal function to create a vesting schedule
     */
    function _createSchedule(
        address _token,
        address _sender,
        address _recipient,
        uint256 _amount,
        uint256 _startTime,
        uint256 _endTime,
        UnlockSchedule _unlockSchedule,
        bool _autoClaim,
        string memory _contractTitle,
        string memory _recipientEmail,
        CancelPermission _cancelPermission,
        ChangeRecipientPermission _changeRecipientPermission
    ) internal returns (uint256 scheduleId) {
        scheduleId = _vestingSchedules.length + ID_PADDING;

        VestingSchedule memory newSchedule = VestingSchedule({
            id: scheduleId,
            token: _token,
            sender: _sender,
            recipient: _recipient,
            totalAmount: _amount,
            releasedAmount: 0,
            startTime: _startTime,
            endTime: _endTime,
            unlockSchedule: _unlockSchedule,
            autoClaim: _autoClaim,
            cancelled: false,
            contractTitle: _contractTitle,
            recipientEmail: _recipientEmail,
            cancelPermission: _cancelPermission,
            changeRecipientPermission: _changeRecipientPermission,
            createdAt: block.timestamp
        });

        _vestingSchedules.push(newSchedule);

        // Update mappings
        _recipientSchedules[_recipient].add(scheduleId);
        _senderSchedules[_sender].add(scheduleId);
        _tokenSchedules[_token].add(scheduleId);
        _vestedTokens.add(_token);

        // Update token info
        TokenVestingInfo storage tokenInfo = tokenVestingInfo[_token];
        if (tokenInfo.token == address(0)) {
            tokenInfo.token = _token;
        }
        tokenInfo.totalVestedAmount += _amount;
        tokenInfo.activeSchedulesCount++;

        return scheduleId;
    }

    /**
     * @dev Releases vested tokens for a specific schedule
     */
    function release(uint256 _scheduleId) external nonReentrant validSchedule(_scheduleId) {
        VestingSchedule storage schedule = _vestingSchedules[_getActualIndex(_scheduleId)];
        require(!schedule.cancelled, "Vesting schedule is cancelled");

        uint256 releasableAmount = getReleasableAmount(_scheduleId);
        require(releasableAmount > 0, "No tokens available for release");

        uint256 fee = 0;
        uint256 amountAfterFee = releasableAmount;

        if (vestingFeePercentage > 0) {
            fee = (releasableAmount * vestingFeePercentage) / 10000; // Using basis points
            amountAfterFee = releasableAmount - fee;
        }

        schedule.releasedAmount += releasableAmount;

        // Update token info
        tokenVestingInfo[schedule.token].totalReleasedAmount += releasableAmount;

        IERC20(schedule.token).safeTransfer(schedule.recipient, amountAfterFee);

        if (fee > 0) {
            IERC20(schedule.token).safeTransfer(feeRecipient, fee);
        }

        emit TokensReleased(_scheduleId, schedule.token, schedule.recipient, amountAfterFee);
    }

    /**
     * @dev Releases tokens for all schedules of a recipient
     */
    function releaseAll(address _recipient) external nonReentrant {
        uint256[] memory scheduleIds = getRecipientSchedules(_recipient);
        require(scheduleIds.length > 0, "No schedules found for recipient");

        for (uint256 i = 0; i < scheduleIds.length; i++) {
            VestingSchedule storage schedule = _vestingSchedules[_getActualIndex(scheduleIds[i])];
            if (!schedule.cancelled) {
                uint256 releasableAmount = getReleasableAmount(scheduleIds[i]);
                if (releasableAmount > 0) {
                    uint256 fee = 0;
                    uint256 amountAfterFee = releasableAmount;

                    if (vestingFeePercentage > 0) {
                        fee = (releasableAmount * vestingFeePercentage) / 10000;
                        amountAfterFee = releasableAmount - fee;
                    }

                    schedule.releasedAmount += releasableAmount;
                    tokenVestingInfo[schedule.token].totalReleasedAmount += releasableAmount;

                    IERC20(schedule.token).safeTransfer(_recipient, amountAfterFee);

                    if (fee > 0) {
                        IERC20(schedule.token).safeTransfer(feeRecipient, fee);
                    }

                    emit TokensReleased(scheduleIds[i], schedule.token, _recipient, amountAfterFee);
                }
            }
        }
    }

    /**
     * @dev Cancels a vesting schedule
     */
    function cancelVestingSchedule(uint256 _scheduleId) external validSchedule(_scheduleId) {
        VestingSchedule storage schedule = _vestingSchedules[_getActualIndex(_scheduleId)];
        require(!schedule.cancelled, "Schedule already cancelled");

        bool canCancel = false;
        if (schedule.cancelPermission == CancelPermission.SENDER_ONLY && msg.sender == schedule.sender) {
            canCancel = true;
        } else if (schedule.cancelPermission == CancelPermission.RECIPIENT_ONLY && msg.sender == schedule.recipient) {
            canCancel = true;
        } else if (
            schedule.cancelPermission == CancelPermission.BOTH
                && (msg.sender == schedule.sender || msg.sender == schedule.recipient)
        ) {
            canCancel = true;
        }

        require(canCancel, "Not authorized to cancel this schedule");

        schedule.cancelled = true;

        // Release any currently vested tokens to recipient
        uint256 releasableAmount = getReleasableAmount(_scheduleId);
        uint256 unreleasedAmount = schedule.totalAmount - schedule.releasedAmount - releasableAmount;

        if (releasableAmount > 0) {
            uint256 fee = 0;
            uint256 amountAfterFee = releasableAmount;

            if (vestingFeePercentage > 0) {
                fee = (releasableAmount * vestingFeePercentage) / 10000;
                amountAfterFee = releasableAmount - fee;
            }

            schedule.releasedAmount += releasableAmount;
            tokenVestingInfo[schedule.token].totalReleasedAmount += releasableAmount;

            IERC20(schedule.token).safeTransfer(schedule.recipient, amountAfterFee);

            if (fee > 0) {
                IERC20(schedule.token).safeTransfer(feeRecipient, fee);
            }

            emit TokensReleased(_scheduleId, schedule.token, schedule.recipient, amountAfterFee);
        }

        // Return unvested tokens to sender
        if (unreleasedAmount > 0) {
            IERC20(schedule.token).safeTransfer(schedule.sender, unreleasedAmount);
        }

        // Update token info
        tokenVestingInfo[schedule.token].activeSchedulesCount--;

        emit VestingScheduleCancelled(_scheduleId);
    }

    /**
     * @dev Changes the recipient of a vesting schedule
     */
    function changeRecipient(uint256 _scheduleId, address _newRecipient) external validSchedule(_scheduleId) {
        require(_newRecipient != address(0), "New recipient cannot be zero address");

        VestingSchedule storage schedule = _vestingSchedules[_getActualIndex(_scheduleId)];
        require(!schedule.cancelled, "Schedule is cancelled");

        bool canChange = false;
        if (
            schedule.changeRecipientPermission == ChangeRecipientPermission.SENDER_ONLY && msg.sender == schedule.sender
        ) {
            canChange = true;
        } else if (
            schedule.changeRecipientPermission == ChangeRecipientPermission.RECIPIENT_ONLY
                && msg.sender == schedule.recipient
        ) {
            canChange = true;
        } else if (
            schedule.changeRecipientPermission == ChangeRecipientPermission.BOTH
                && (msg.sender == schedule.sender || msg.sender == schedule.recipient)
        ) {
            canChange = true;
        }

        require(canChange, "Not authorized to change recipient");

        address oldRecipient = schedule.recipient;
        schedule.recipient = _newRecipient;

        // Update recipient schedules mapping
        _recipientSchedules[oldRecipient].remove(_scheduleId);
        _recipientSchedules[_newRecipient].add(_scheduleId);

        emit RecipientChanged(_scheduleId, oldRecipient, _newRecipient);
    }

    /**
     * @dev Auto-claim function for schedules with auto-claim enabled
     */
    function processAutoClaims() external {
        for (uint256 i = 0; i < _vestingSchedules.length; i++) {
            VestingSchedule storage schedule = _vestingSchedules[i];
            if (schedule.autoClaim && !schedule.cancelled) {
                uint256 releasableAmount = getReleasableAmount(schedule.id);
                if (releasableAmount > 0) {
                    uint256 fee = 0;
                    uint256 amountAfterFee = releasableAmount;

                    if (vestingFeePercentage > 0) {
                        fee = (releasableAmount * vestingFeePercentage) / 10000;
                        amountAfterFee = releasableAmount - fee;
                    }

                    schedule.releasedAmount += releasableAmount;
                    tokenVestingInfo[schedule.token].totalReleasedAmount += releasableAmount;

                    IERC20(schedule.token).safeTransfer(schedule.recipient, amountAfterFee);

                    if (fee > 0) {
                        IERC20(schedule.token).safeTransfer(feeRecipient, fee);
                    }

                    emit TokensReleased(schedule.id, schedule.token, schedule.recipient, amountAfterFee);
                }
            }
        }
    }

    // View functions
    function getReleasableAmount(uint256 _scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = getScheduleById(_scheduleId);
        if (schedule.cancelled || block.timestamp < schedule.startTime) {
            return 0;
        }

        uint256 vestedAmount = getVestedAmount(_scheduleId);
        return vestedAmount - schedule.releasedAmount;
    }

    function getVestedAmount(uint256 _scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = getScheduleById(_scheduleId);

        if (block.timestamp < schedule.startTime) {
            return 0;
        } else if (block.timestamp >= schedule.endTime) {
            return schedule.totalAmount;
        }

        uint256 unlockInterval = getUnlockInterval(schedule.unlockSchedule);
        uint256 elapsedIntervals = (block.timestamp - schedule.startTime) / unlockInterval;
        uint256 totalIntervals = (schedule.endTime - schedule.startTime) / unlockInterval;

        return (schedule.totalAmount * elapsedIntervals) / totalIntervals;
    }

    function getUnlockInterval(UnlockSchedule _schedule) public pure returns (uint256) {
        if (_schedule == UnlockSchedule.SECOND) return 1;
        if (_schedule == UnlockSchedule.MINUTE) return 60;
        if (_schedule == UnlockSchedule.HOUR) return 3600;
        if (_schedule == UnlockSchedule.DAILY) return 86400;
        if (_schedule == UnlockSchedule.WEEKLY) return 604800;
        if (_schedule == UnlockSchedule.BIWEEKLY) return 1209600;
        if (_schedule == UnlockSchedule.MONTHLY) return 2629746; // Average month
        if (_schedule == UnlockSchedule.QUARTERLY) return 7889238; // Average quarter
        if (_schedule == UnlockSchedule.YEARLY) return 31556952; // Average year
        return 86400; // Default to daily
    }

    function getScheduleById(uint256 _scheduleId) public view returns (VestingSchedule memory) {
        return _vestingSchedules[_getActualIndex(_scheduleId)];
    }

    function getRecipientSchedules(address _recipient) public view returns (uint256[] memory) {
        uint256 length = _recipientSchedules[_recipient].length();
        uint256[] memory scheduleIds = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            scheduleIds[i] = _recipientSchedules[_recipient].at(i);
        }
        return scheduleIds;
    }

    function getSenderSchedules(address _sender) public view returns (uint256[] memory) {
        uint256 length = _senderSchedules[_sender].length();
        uint256[] memory scheduleIds = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            scheduleIds[i] = _senderSchedules[_sender].at(i);
        }
        return scheduleIds;
    }

    function getTokenSchedules(address _token) public view returns (uint256[] memory) {
        uint256 length = _tokenSchedules[_token].length();
        uint256[] memory scheduleIds = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            scheduleIds[i] = _tokenSchedules[_token].at(i);
        }
        return scheduleIds;
    }

    function getTotalScheduleCount() external view returns (uint256) {
        return _vestingSchedules.length;
    }

    function getAllVestedTokens() external view returns (address[] memory) {
        uint256 length = _vestedTokens.length();
        address[] memory tokens = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = _vestedTokens.at(i);
        }
        return tokens;
    }

    function _getActualIndex(uint256 scheduleId) internal view returns (uint256) {
        if (scheduleId < ID_PADDING) {
            revert("Invalid schedule id");
        }
        uint256 actualIndex = scheduleId - ID_PADDING;
        require(actualIndex < _vestingSchedules.length, "Invalid schedule id");
        return actualIndex;
    }

    // Owner functions
    function setVestingFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10%
        vestingFeePercentage = _feePercentage;
        emit VestingFeeUpdated(_feePercentage);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Zero address");
        feeRecipient = _feeRecipient;
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
