"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketContext = exports.checkRole = exports.createContext = exports.verifyToken = void 0;
const graphql_1 = require("graphql");
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../config");
const verifyToken = (token) => {
    try {
        return (0, jsonwebtoken_1.verify)(token, config_1.config.jwtSecret);
    }
    catch (error) {
        throw new graphql_1.GraphQLError(config_1.errorMessages.UNAUTHORIZED, {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};
exports.verifyToken = verifyToken;
const createContext = ({ req }) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new graphql_1.GraphQLError(config_1.errorMessages.UNAUTHORIZED, {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    const decoded = (0, exports.verifyToken)(token);
    return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        userRole: decoded.role,
    };
};
exports.createContext = createContext;
const checkRole = (context, allowedRoles) => {
    if (!allowedRoles.includes(context.userRole)) {
        throw new graphql_1.GraphQLError(config_1.errorMessages.FORBIDDEN, {
            extensions: { code: 'FORBIDDEN' },
        });
    }
};
exports.checkRole = checkRole;
const createWebSocketContext = (ctx) => {
    const token = ctx.connectionParams?.authorization?.split(' ')[1];
    if (!token) {
        throw new graphql_1.GraphQLError(config_1.errorMessages.UNAUTHORIZED, {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    const decoded = (0, exports.verifyToken)(token);
    return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        userRole: decoded.role,
    };
};
exports.createWebSocketContext = createWebSocketContext;
//# sourceMappingURL=auth.js.map