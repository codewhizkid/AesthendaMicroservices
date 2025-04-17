"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
// Read and export schema from .graphql file
exports.typeDefs = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, './schema.graphql'), 'utf-8');
//# sourceMappingURL=index.js.map