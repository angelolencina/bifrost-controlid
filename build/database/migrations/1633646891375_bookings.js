"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Bookings extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'bookings';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('action', 15).index();
            table.uuid('uuid').index();
            table.dateTime('sync_date', { useTz: true }).index();
            table.dateTime('start_date', { useTz: true }).index();
            table.dateTime('end_date', { useTz: true }).index();
            table.string('state', 20).index();
            table.json('person');
            table.json('place');
            table.json('floor');
            table.json('building');
            table.dateTime('created_at', { useTz: true });
            table.dateTime('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Bookings;
//# sourceMappingURL=1633646891375_bookings.js.map