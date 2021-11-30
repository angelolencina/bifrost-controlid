"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const crypto = require('crypto');
class HubSignature {
    async handle({ request, response }, next) {
        const hmac = crypto.createHmac('SHA256', Env_1.default.get('SIGNATURE'));
        if (request.header('x-hub-signature') !== hmac.update(request.raw()).digest('hex')) {
            return response.status(404);
        }
        await next();
    }
}
exports.default = HubSignature;
//# sourceMappingURL=HubSignature.js.map