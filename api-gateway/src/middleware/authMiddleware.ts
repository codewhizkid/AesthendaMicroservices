import jwt from "jsonwebtoken";
import { Request } from "express";
import config from "../config";
import { User, Role } from "../types";

/**
 * Authentication middleware to extract user from JWT token
 * @param {Request} req - The Express request object
 * @returns {User|null} - The authenticated user or null
 */
export const authenticateToken = (req: Request): User | null => {
  // Get the Authorization header
  const authHeader = req.headers.authorization || "";

  if (!authHeader) {
    return null;
  }

  try {
    // Check if the header is in the format 'Bearer [token]'
    const token = authHeader.split(" ")[1];
    if (!token) {
      return null;
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      name?: string;
      role: string;
      tenantId: string;
      stylist_id?: string;
    };

    // Return the user information from the token
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || "",
      role: decoded.role,
      tenantId: decoded.tenantId,
      stylist_id: decoded.stylist_id,
    };
  } catch (error) {
    // Token verification failed
    console.error("Token verification failed:", (error as Error).message);
    return null;
  }
};

/**
 * Middleware to check for required roles
 * @param {User|null} user - The authenticated user
 * @param {string[]} requiredRoles - List of roles that have access
 * @returns {boolean} Whether the user has access
 */
export const checkRole = (
  user: User | null,
  requiredRoles: string[],
): boolean => {
  if (!user) {
    return false;
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No specific role required
  }

  return requiredRoles.includes(user.role);
};

/**
 * Middleware to check if user is a stylist and belongs to specified tenant
 * @param {User|null} user - The authenticated user
 * @param {string} tenantId - The tenant ID to check access for
 * @param {string} stylist_id - Optional stylist ID to check access for
 * @returns {boolean} Whether the user has access
 */
export const checkStylistAccess = (
  user: User | null,
  tenantId: string,
  stylist_id?: string,
): boolean => {
  if (!user) {
    return false;
  }

  // System admins have full access
  if (user.role === Role.SYSTEM_ADMIN) {
    return true;
  }

  // Salon admins have access to their tenant
  if (user.role === Role.SALON_ADMIN && user.tenantId === tenantId) {
    return true;
  }

  // For stylists and staff, check both tenant and stylist_id
  if ([Role.STYLIST, Role.SALON_STAFF].includes(user.role as Role)) {
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
