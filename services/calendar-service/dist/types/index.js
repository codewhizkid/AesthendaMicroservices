"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.RecurrenceType = exports.ResourceType = exports.EventType = exports.EventStatus = void 0;
var EventStatus;
(function (EventStatus) {
    EventStatus["PENDING"] = "PENDING";
    EventStatus["CONFIRMED"] = "CONFIRMED";
    EventStatus["CANCELLED"] = "CANCELLED";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var EventType;
(function (EventType) {
    EventType["APPOINTMENT"] = "APPOINTMENT";
    EventType["MEETING"] = "MEETING";
    EventType["BLOCKOUT"] = "BLOCKOUT";
    EventType["OTHER"] = "OTHER";
})(EventType || (exports.EventType = EventType = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["STYLIST"] = "STYLIST";
    ResourceType["ROOM"] = "ROOM";
    ResourceType["EQUIPMENT"] = "EQUIPMENT";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var RecurrenceType;
(function (RecurrenceType) {
    RecurrenceType["DAILY"] = "DAILY";
    RecurrenceType["WEEKLY"] = "WEEKLY";
    RecurrenceType["MONTHLY"] = "MONTHLY";
    RecurrenceType["YEARLY"] = "YEARLY";
})(RecurrenceType || (exports.RecurrenceType = RecurrenceType = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["STAFF"] = "STAFF";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=index.js.map