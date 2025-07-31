// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MultiRecipientTokenVesting
 * @dev A token vesting contract that supports multiple recipients with individual schedules
 */
contract MultiRecipientTokenVesting is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Enums for contract permissions
    enum CancelPermission { NONE, SENDER_ONLY, RECIPIENT_ONLY, BOTH }
    enum ChangeRecipientPermission { NONE, SENDER_ONLY, RECIPIENT_ONLY, BOTH }
    
    // Unlock schedule frequencies
    enum UnlockSchedule { SECOND, MINUTE, HOUR, DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY }

    struct VestingSchedule {
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
    }

    // State variables
    IERC20 public immutable token;
    address public sender;
    uint256 public totalVestedAmount;
    uint256 public vestingScheduleCount;
    
    // Mappings
    mapping(uint256 => VestingSchedule) public vestingSchedules;
    mapping(address => uint256[]) public recipientSchedules;
    
    // Events
    event VestingScheduleCreated(
        uint256 indexed scheduleId,
        address indexed recipient,
        uint256 amount,
        uint256 startTime,
        uint256 endTime
    );
    
    event TokensReleased(
        uint256 indexed scheduleId,
        address indexed recipient,
        uint256 amount
    );
    
    event VestingScheduleCancelled(uint256 indexed scheduleId);
    
    event RecipientChanged(
        uint256 indexed scheduleId,
        address indexed oldRecipient,
        address indexed newRecipient
    );

    constructor(address _token, address _sender) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        require(_sender != address(0), "Sender address cannot be zero");
        
        token = IERC20(_token);
        sender = _sender;
    }

    /**
     * @dev Creates multiple vesting schedules
     */
    function createVestingSchedules(
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
    ) external {
        require(msg.sender == sender, "Only sender can create vesting schedules");
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
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        // Transfer tokens from sender to contract
        token.safeTransferFrom(sender, address(this), totalAmount);
        totalVestedAmount += totalAmount;

        // Create vesting schedules
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Recipient cannot be zero address");
            require(_amounts[i] > 0, "Amount must be greater than 0");

            uint256 scheduleId = vestingScheduleCount;
            
            vestingSchedules[scheduleId] = VestingSchedule({
                recipient: _recipients[i],
                totalAmount: _amounts[i],
                releasedAmount: 0,
                startTime: _startTime,
                endTime: _endTime,
                unlockSchedule: _unlockSchedule,
                autoClaim: _autoClaim,
                cancelled: false,
                contractTitle: _contractTitles[i],
                recipientEmail: _recipientEmails[i],
                cancelPermission: _cancelPermission,
                changeRecipientPermission: _changeRecipientPermission
            });

            recipientSchedules[_recipients[i]].push(scheduleId);
            
            emit VestingScheduleCreated(
                scheduleId,
                _recipients[i],
                _amounts[i],
                _startTime,
                _endTime
            );

            vestingScheduleCount++;
        }
    }

    /**
     * @dev Releases vested tokens for a specific schedule
     */
    function release(uint256 _scheduleId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        require(!schedule.cancelled, "Vesting schedule is cancelled");
        require(schedule.totalAmount > 0, "Schedule does not exist");
        
        uint256 releasableAmount = getReleasableAmount(_scheduleId);
        require(releasableAmount > 0, "No tokens available for release");

        schedule.releasedAmount += releasableAmount;
        token.safeTransfer(schedule.recipient, releasableAmount);

        emit TokensReleased(_scheduleId, schedule.recipient, releasableAmount);
    }

    /**
     * @dev Releases tokens for all schedules of a recipient
     */
    function releaseAll(address _recipient) external nonReentrant {
        uint256[] memory scheduleIds = recipientSchedules[_recipient];
        require(scheduleIds.length > 0, "No schedules found for recipient");

        uint256 totalReleasable = 0;
        for (uint256 i = 0; i < scheduleIds.length; i++) {
            VestingSchedule storage schedule = vestingSchedules[scheduleIds[i]];
            if (!schedule.cancelled) {
                uint256 releasableAmount = getReleasableAmount(scheduleIds[i]);
                if (releasableAmount > 0) {
                    schedule.releasedAmount += releasableAmount;
                    totalReleasable += releasableAmount;
                    emit TokensReleased(scheduleIds[i], _recipient, releasableAmount);
                }
            }
        }

        if (totalReleasable > 0) {
            token.safeTransfer(_recipient, totalReleasable);
        }
    }

    /**
     * @dev Cancels a vesting schedule
     */
    function cancelVestingSchedule(uint256 _scheduleId) external {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        require(schedule.totalAmount > 0, "Schedule does not exist");
        require(!schedule.cancelled, "Schedule already cancelled");
        
        bool canCancel = false;
        if (schedule.cancelPermission == CancelPermission.SENDER_ONLY && msg.sender == sender) {
            canCancel = true;
        } else if (schedule.cancelPermission == CancelPermission.RECIPIENT_ONLY && msg.sender == schedule.recipient) {
            canCancel = true;
        } else if (schedule.cancelPermission == CancelPermission.BOTH && 
                  (msg.sender == sender || msg.sender == schedule.recipient)) {
            canCancel = true;
        }
        
        require(canCancel, "Not authorized to cancel this schedule");

        schedule.cancelled = true;
        
        // Return unvested tokens to sender
        uint256 releasableAmount = getReleasableAmount(_scheduleId);
        uint256 unreleasedAmount = schedule.totalAmount - schedule.releasedAmount - releasableAmount;
        
        if (releasableAmount > 0) {
            schedule.releasedAmount += releasableAmount;
            token.safeTransfer(schedule.recipient, releasableAmount);
            emit TokensReleased(_scheduleId, schedule.recipient, releasableAmount);
        }
        
        if (unreleasedAmount > 0) {
            token.safeTransfer(sender, unreleasedAmount);
        }

        emit VestingScheduleCancelled(_scheduleId);
    }

    /**
     * @dev Changes the recipient of a vesting schedule
     */
    function changeRecipient(uint256 _scheduleId, address _newRecipient) external {
        require(_newRecipient != address(0), "New recipient cannot be zero address");
        
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        require(schedule.totalAmount > 0, "Schedule does not exist");
        require(!schedule.cancelled, "Schedule is cancelled");
        
        bool canChange = false;
        if (schedule.changeRecipientPermission == ChangeRecipientPermission.SENDER_ONLY && msg.sender == sender) {
            canChange = true;
        } else if (schedule.changeRecipientPermission == ChangeRecipientPermission.RECIPIENT_ONLY && 
                  msg.sender == schedule.recipient) {
            canChange = true;
        } else if (schedule.changeRecipientPermission == ChangeRecipientPermission.BOTH && 
                  (msg.sender == sender || msg.sender == schedule.recipient)) {
            canChange = true;
        }
        
        require(canChange, "Not authorized to change recipient");

        address oldRecipient = schedule.recipient;
        schedule.recipient = _newRecipient;
        
        // Update recipient schedules mapping
        _removeScheduleFromRecipient(oldRecipient, _scheduleId);
        recipientSchedules[_newRecipient].push(_scheduleId);

        emit RecipientChanged(_scheduleId, oldRecipient, _newRecipient);
    }

    /**
     * @dev Auto-claim function for schedules with auto-claim enabled
     */
    function processAutoClaims() external {
        for (uint256 i = 0; i < vestingScheduleCount; i++) {
            VestingSchedule storage schedule = vestingSchedules[i];
            if (schedule.autoClaim && !schedule.cancelled) {
                uint256 releasableAmount = getReleasableAmount(i);
                if (releasableAmount > 0) {
                    schedule.releasedAmount += releasableAmount;
                    token.safeTransfer(schedule.recipient, releasableAmount);
                    emit TokensReleased(i, schedule.recipient, releasableAmount);
                }
            }
        }
    }

    /**
     * @dev Gets the releasable amount for a specific schedule
     */
    function getReleasableAmount(uint256 _scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_scheduleId];
        if (schedule.cancelled || block.timestamp < schedule.startTime) {
            return 0;
        }

        uint256 vestedAmount = getVestedAmount(_scheduleId);
        return vestedAmount - schedule.releasedAmount;
    }

    /**
     * @dev Gets the vested amount for a specific schedule
     */
    function getVestedAmount(uint256 _scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_scheduleId];
        
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

    /**
     * @dev Gets the unlock interval in seconds for a given schedule type
     */
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

    /**
     * @dev Gets all schedule IDs for a recipient
     */
    function getRecipientSchedules(address _recipient) external view returns (uint256[] memory) {
        return recipientSchedules[_recipient];
    }

    /**
     * @dev Gets schedule details
     */
    function getScheduleDetails(uint256 _scheduleId) external view returns (
        address recipient,
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 startTime,
        uint256 endTime,
        UnlockSchedule unlockSchedule,
        bool autoClaim,
        bool cancelled,
        string memory contractTitle,
        string memory recipientEmail
    ) {
        VestingSchedule memory schedule = vestingSchedules[_scheduleId];
        return (
            schedule.recipient,
            schedule.totalAmount,
            schedule.releasedAmount,
            schedule.startTime,
            schedule.endTime,
            schedule.unlockSchedule,
            schedule.autoClaim,
            schedule.cancelled,
            schedule.contractTitle,
            schedule.recipientEmail
        );
    }

    /**
     * @dev Internal function to remove a schedule from recipient's list
     */
    function _removeScheduleFromRecipient(address _recipient, uint256 _scheduleId) internal {
        uint256[] storage schedules = recipientSchedules[_recipient];
        for (uint256 i = 0; i < schedules.length; i++) {
            if (schedules[i] == _scheduleId) {
                schedules[i] = schedules[schedules.length - 1];
                schedules.pop();
                break;
            }
        }
    }

    /**
     * @dev Emergency function to recover tokens (only owner)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}