"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Event"));
const Logger_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Logger"));
const desko_persistence_1 = __importDefault(require("./desko.persistence"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const desko_api_provider_1 = __importDefault(require("./api/desko.api.provider"));
class DeskoCore {
    webhook(name, callback) {
        Event_1.default.on(`webhook:${name}`, (event) => callback(event));
    }
    provider() {
        return new desko_api_provider_1.default();
    }
    persist() {
        return new desko_persistence_1.default();
    }
    schedule(callback) {
        callback();
        return require('node-schedule').scheduleJob('*/10 * * * *', async () => callback());
    }
    getEnv(file) {
        const env = require('dotenv').config({ path: file });
        return env.parsed;
    }
    logger(text) {
        return Logger_1.default.info(text);
    }
    database(storeConnection, connection) {
        if (!Database_1.default.manager.has(storeConnection)) {
            Database_1.default.manager.add(storeConnection, connection);
            Database_1.default.manager.connect(storeConnection);
        }
        return Database_1.default.connection(storeConnection);
    }
}
exports.default = DeskoCore;
//# sourceMappingURL=desko.core.js.map