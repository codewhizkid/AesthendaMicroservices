"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const resourceSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    description: String,
    tenantId: { type: String, required: true, index: true },
    availability: [
        {
            dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true }
        }
    ],
    metadata: mongoose_1.default.Schema.Types.Mixed
}, {
    timestamps: true
});
// Compound index for efficient querying of resources by tenant and type
resourceSchema.index({ tenantId: 1, type: 1 });
exports.Resource = mongoose_1.default.model('Resource', resourceSchema);
//# sourceMappingURL=Resource.js.map