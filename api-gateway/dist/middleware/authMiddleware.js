"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStylistAccess = exports.checkRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const types_1 = require("../types");
/**
 * Authentication middleware to extract user from JWT token
 * @param {Request} req - The Express request object
 * @returns {User|null} - The authenticated user or null
 */
const authenticateToken = (req) => {
    // Get the Authorization header
    const authHeader = req.headers.authorization || '';
    if (!authHeader) {
        return null;
    }
    try {
        // Check if the header is in the format 'Bearer [token]'
        const token = authHeader.split(' ')[1];
        if (!token) {
            return null;
        }
        // Verify and decode the token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        // Return the user information from the token
        return {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name || '',
            role: decoded.role,
            tenantId: decoded.tenantId,
            stylist_id: decoded.stylist_id
        };
    }
    catch (error) {
        // Token verification failed
        console.error('Token verification failed:', error.message);
        return null;
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to check for required roles
 * @param {User|null} user - The authenticated user
 * @param {string[]} requiredRoles - List of roles that have access
 * @returns {boolean} Whether the user has access
 */
const checkRole = (user, requiredRoles) => {
    if (!user) {
        return false;
    }
    if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No specific role required
    }
    return requiredRoles.includes(user.role);
};
exports.checkRole = checkRole;
/**
 * Middleware to check if user is a stylist and belongs to specified tenant
 * @param {User|null} user - The authenticated user
 * @param {string} tenantId - The tenant ID to check access for
 * @param {string} stylist_id - Optional stylist ID to check access for
 * @returns {boolean} Whether the user has access
 */
const checkStylistAccess = (user, tenantId, stylist_id) => {
    if (!user) {
        return false;
    }
    // System admins have full access
    if (user.role === types_1.Role.SYSTEM_ADMIN) {
        return true;
    }
    // Salon admins have access to their tenant
    if (user.role === types_1.Role.SALON_ADMIN && user.tenantId === tenantId) {
        return true;
    }
    // For stylists and staff, check both tenant and stylist_id
    if ([types_1.Role.STYLIST, types_1.Role.SALON_STAFF].includes(user.role)) {
        // Always check tenant
        if (user.tenantId !== tenantId) {
            return false;
        }
        // If stylist_id is specified, check that too
        if (stylist_id && user.stylist_id !== stylist_id) {
            return false;
        }
        return true;
    }
    return false;
};
exports.checkStylistAccess = checkStylistAccess;
