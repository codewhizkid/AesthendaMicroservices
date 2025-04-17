"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.ServiceError = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SYSTEM_ADMIN"] = "system_admin";
    Role["SALON_ADMIN"] = "salon_admin";
    Role["STYLIST"] = "stylist";
    Role["SALON_STAFF"] = "salon_staff";
    Role["CLIENT"] = "client";
})(Role || (exports.Role = Role = {}));
/**
 * Extended Error type for service-related errors
 */
class ServiceError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'ServiceError';
        this.code = options.code;
        this.path = options.path;
        this.errors = options.errors;
        this.service = options.service;
        this.statusCode = options.statusCode;
        // Ensures proper instanceof checks work in TypeScript
        Object.setPrototypeOf(this, ServiceError.prototype);
    }
}
exports.ServiceError = ServiceError;
/**
 * Timeout-specific service error
 */
class TimeoutError extends ServiceError {
    constructor(service, timeout) {
        super(`Service request timed out after ${timeout}ms`, {
            code: 'TIMEOUT_ERROR',
            service
        });
        this.name = 'TimeoutError';
        // Ensures proper instanceof checks work in TypeScript
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}
exports.TimeoutError = TimeoutError;
