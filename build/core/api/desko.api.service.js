"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Logger_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Logger"));
const axios = require('axios');
class DeskoApiService {
    constructor() {
        this.endpoint = Env_1.default.get('DESKO_API_URL');
        this.accessToken = null;
    }
    async auth() {
        if (this.accessToken) {
            return this;
        }
        const result = await axios.post(`${this.endpoint}/v1.1/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: Env_1.default.get('DESKO_API_CLIENT_ID'),
            client_secret: Env_1.default.get('DESKO_API_CLIENT_SECRET'),
            scope: Env_1.default.get('DESKO_API_SCOPE'),
        }, {
            headers: { 'Content-Type': `application/json; charset=UTF-8` },
        });
        this.accessToken = result.data.access_token;
        return this;
    }
    async getBooking(uuid) {
        try {
            await this.auth();
            const booking = await axios.get(`${this.endpoint}/v1.1/bookings/${uuid}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': `application/json; charset=UTF-8`,
                },
            });
            return booking.data.data;
        }
        catch (e) {
            Logger_1.default.error(`Error API ${e.response.statusText}: (${e.response.status})`);
            Logger_1.default.error(`Error API ${e.response.config.ur}`);
            Logger_1.default.error(`Error API ${JSON.stringify(e.response.data)}`);
        }
        return false;
    }
}
exports.default = DeskoApiService;
//# sourceMappingURL=desko.api.service.js.map