"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.dbConfig = void 0;
require("dotenv/config");
const promise_1 = __importDefault(require("mysql2/promise"));
const db_1 = require("../config/db");
const dbProfile = (0, db_1.resolveDbProfile)();
exports.dbConfig = (0, db_1.buildDbConfig)();
console.log('🔧 Database pool:', (0, db_1.dbConfigLogLabel)(exports.dbConfig, dbProfile));
exports.pool = promise_1.default.createPool(exports.dbConfig);
exports.default = exports.pool;
//# sourceMappingURL=pool.js.map