"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
class DeskoBookingPersistence {
    async save(event) {
        const exists = await Database_1.default.from('bookings')
            .where('uuid', event.uuid)
            .select('id')
            .limit(1)
            .first();
        if (exists) {
            return await Database_1.default.from('bookings').where('uuid', event.uuid).update(event);
        }
        return await Database_1.default.table('bookings').insert(event);
    }
    async delete(uuid) {
        await Database_1.default.from('bookings').where('uuid', uuid).delete();
    }
    async setSync(uuid) {
        await Database_1.default.from('bookings')
            .where('uuid', uuid)
            .update({
            sync_date: luxon_1.DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
        });
    }
    query() {
        return Database_1.default.from('bookings');
    }
}
exports.default = DeskoBookingPersistence;
//# sourceMappingURL=desko.booking.persistence.js.map