"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestBusinessHours = exports.createTestResource = exports.createTestEvent = exports.createMockContext = exports.clearTestDB = exports.teardownTestDB = exports.setupTestDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const types_1 = require("../types");
let mongoServer;
// Connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
const getConnectionStateString = (state) => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[state] || 'unknown';
};
const MONGOOSE_OPTIONS = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};
const setupTestDB = async () => {
    try {
        // Log initial state
        console.log(`[Test DB] Initial connection state: ${getConnectionStateString(mongoose_1.default.connection.readyState)}`);
        // Ensure clean state
        if (mongoose_1.default.connection.readyState !== 0) {
            console.log('[Test DB] Disconnecting from existing connection...');
            await mongoose_1.default.disconnect();
            console.log('[Test DB] Disconnected successfully');
        }
        // Create new server instance if needed
        if (!mongoServer) {
            console.log('[Test DB] Creating new MongoDB memory server...');
            mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            console.log('[Test DB] Memory server created successfully');
        }
        const mongoUri = mongoServer.getUri();
        console.log('[Test DB] Connecting to memory server...');
        await mongoose_1.default.connect(mongoUri, MONGOOSE_OPTIONS);
        console.log(`[Test DB] Connected successfully. State: ${getConnectionStateString(mongoose_1.default.connection.readyState)}`);
    }
    catch (error) {
        console.error('[Test DB] Failed to setup test database:', error);
        throw error;
    }
};
exports.setupTestDB = setupTestDB;
const teardownTestDB = async () => {
    try {
        console.log('[Test DB] Starting teardown...');
        console.log(`[Test DB] Current state: ${getConnectionStateString(mongoose_1.default.connection.readyState)}`);
        await mongoose_1.default.disconnect();
        console.log('[Test DB] Disconnected from database');
        if (mongoServer) {
            await mongoServer.stop();
            mongoServer = undefined;
            console.log('[Test DB] Memory server stopped and cleared');
        }
    }
    catch (error) {
        console.error('[Test DB] Failed to teardown test database:', error);
        throw error;
    }
};
exports.teardownTestDB = teardownTestDB;
const clearTestDB = async () => {
    console.log('[Test DB] Clearing all collections...');
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    console.log('[Test DB] All collections cleared');
};
exports.clearTestDB = clearTestDB;
// Mock context factory
const createMockContext = (tenantId = 'tenant-1', role = types_1.UserRole.USER) => ({
    tenantId,
    userRole: role,
    userId: 'user-1',
});
exports.createMockContext = createMockContext;
// Test data generators
const createTestEvent = (overrides = {}) => ({
    title: 'Test Event',
    startTime: new Date('2024-03-20T10:00:00Z'),
    endTime: new Date('2024-03-20T11:00:00Z'),
    type: types_1.EventType.APPOINTMENT,
    tenantId: 'tenant-1',
    ...overrides,
});
exports.createTestEvent = createTestEvent;
const createTestResource = (overrides = {}) => ({
    title: 'Test Resource',
    type: 'room',
    availability: [
        {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
        },
    ],
    tenantId: 'tenant-1',
    ...overrides,
});
exports.createTestResource = createTestResource;
const createTestBusinessHours = (overrides = {}) => ({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isOpen: true,
    tenantId: 'tenant-1',
    ...overrides,
});
exports.createTestBusinessHours = createTestBusinessHours;
//# sourceMappingURL=testUtils.js.map