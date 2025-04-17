"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const types_1 = require("../types");
const eventSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    recurringRule: String,
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    attendees: [String],
    location: String,
    status: {
        type: String,
        enum: Object.values(types_1.EventStatus),
        default: types_1.EventStatus.CONFIRMED
    },
    metadata: mongoose_1.default.Schema.Types.Mixed
}, {
    timestamps: true
});
// Compound index for efficient querying of events by tenant and date range
eventSchema.index({ tenantId: 1, startTime: 1, endTime: 1 });
exports.Event = mongoose_1.default.model('Event', eventSchema);
//# sourceMappingURL=Event.js.map