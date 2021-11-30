"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const desko_core_1 = __importDefault(require("../core/desko.core"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Logger_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Logger"));
const axios = require('axios');
const https = require('https');
class Plugin extends desko_core_1.default {
    init() {
        this.connIdSecureDb();
        this.schedule(() => this.sync());
        this.webhook('booking', async (deskoEvent) => {
            if (Env_1.default.get('CONTROLID_FUNCTION_ACCESS_CONTROL')) {
                this.eventAccessControl(deskoEvent);
            }
        });
        this.webhook('organization', async (deskoEvent) => {
            if (Env_1.default.get('CONTROLID_FUNCTION_QRCODE')) {
                this.eventUserQrCode(deskoEvent);
            }
        });
    }
    connIdSecureDb() {
        this.idSecureDb = this.database('controlIdMySQLConnection', {
            client: 'mysql',
            connection: {
                host: Env_1.default.get('CONTROLID_MYSQL_HOST'),
                port: Env_1.default.get('CONTROLID_MYSQL_PORT'),
                user: Env_1.default.get('CONTROLID_MYSQL_USER'),
                password: Env_1.default.get('CONTROLID_MYSQL_PASSWORD'),
                database: Env_1.default.get('CONTROLID_MYSQL_DB_NAME'),
            },
        });
    }
    async eventUserQrCode(event) {
        Logger_1.default.debug(`event: eventUserQrCode ${JSON.stringify(event)}`);
        if (event.event !== 'deleted') {
            return;
        }
        const data = event.included ?? false;
        if (data.object && data.object == 'user') {
            this.userSaveQrCode(data.email, data.number);
        }
    }
    async eventAccessControl(deskoEvent) {
        Logger_1.default.debug(`event: eventAccessControl ${JSON.stringify(deskoEvent)}`);
        const event = await this.provider().runEvent(deskoEvent);
        if (!event) {
            Logger_1.default.error('Event NotFound');
        }
        if (event.action === 'deleted') {
            this.declinedAccess(event);
            return;
        }
        this.saveCache(event);
    }
    saveCache(event) {
        this.persist()
            .booking()
            .save({
            uuid: event.uuid,
            start_date: event.start_date,
            end_date: event.end_date,
            state: event.state,
            action: event.action,
            person: JSON.stringify(event.person),
            place: JSON.stringify(event.place),
            floor: JSON.stringify(event.floor),
            building: JSON.stringify(event.building),
        });
        if (!this.isToday(event)) {
            return;
        }
        this.persist().booking().setSync(event.uuid);
        this.userAccessLimit({
            email: event.person.email,
            start_date: event.start_date,
            end_date: event.end_date,
        });
        this.syncAll();
    }
    declinedAccess(event) {
        this.persist().booking().delete(event.uuid);
        if (!this.isToday(event)) {
            return;
        }
        this.userAccessLimit({
            email: event.person.email,
            start_date: new Date(2021, 0, 1, 0, 0, 0),
            end_date: new Date(2021, 0, 1, 0, 0, 0),
        });
        this.syncAll();
    }
    async sync() {
        const now = luxon_1.DateTime.local().toFormat('yyyy-MM-dd HH:mm:s');
        const dateStart = luxon_1.DateTime.local().startOf('day');
        const dateEnd = luxon_1.DateTime.local().endOf('day');
        const bookings = await this.persist()
            .booking()
            .query()
            .where('start_date', '>=', dateStart.toFormat('yyyy-MM-dd HH:mm:s'))
            .where('end_date', '<=', dateEnd.toFormat('yyyy-MM-dd HH:mm:s'))
            .whereNull('sync_date')
            .select('*');
        Logger_1.default.debug(`sync ${now}: ${bookings.length} bookings`);
        if (!bookings.length) {
            return;
        }
        bookings.map(async (booking) => {
            this.persist().booking().setSync(booking.uuid);
            this.userAccessLimit({
                email: booking.person.email,
                start_date: booking.start_date,
                end_date: booking.end_date,
            });
        });
        this.syncAll();
    }
    async getUser(email) {
        const user = await this.idSecureDb
            .query()
            .from('users')
            .where('email', email)
            .where('deleted', 0)
            .first();
        if (!user) {
            Logger_1.default.info(`userAccessLimit : ${email} not found`);
            return false;
        }
        return user;
    }
    async userSaveQrCode(email, number) {
        Logger_1.default.debug(`userSaveQrCode : ${email} : ${number}`);
        const user = await this.getUser(email);
        if (!user) {
            return;
        }
        const cards = await this.idSecureDb
            .query()
            .from('cards')
            .where('idUser', user.id)
            .where('number', number)
            .first();
        if (cards) {
            Logger_1.default.debug(`cards :card ${number} exists`);
            return;
        }
        const query = `
      INSERT INTO cards (
        idUser, idType, type, number, numberStr
      ) VALUES (
        '${user.id}', '1', '2', '${number}',
        (select CONCAT(CONVERT((${number} DIV 65536), CHAR), ",", CONVERT((${number} MOD 65536), CHAR)))
      )
    `;
        await this.idSecureDb.rawQuery(query);
        this.syncAll();
    }
    async userAccessLimit({ email, start_date, end_date }) {
        Logger_1.default.debug(`userAccessLimit : ${email} : ${start_date}:${end_date}`);
        const user = await this.getUser(email);
        if (!user) {
            return;
        }
        await this.idSecureDb
            .query()
            .from('users')
            .where('id', user.id)
            .update({
            dateStartLimit: luxon_1.DateTime.fromJSDate(start_date).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
            dateLimit: luxon_1.DateTime.fromJSDate(end_date).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
        });
    }
    isToday(event) {
        return luxon_1.DateTime.fromJSDate(event.start_date).ordinal == luxon_1.DateTime.now().ordinal;
    }
    async syncAll() {
        const url = `https://localhost:30443/api/util/SyncAll`;
        Logger_1.default.debug(`syncAll: ${url}`);
        try {
            const result = await axios({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
                method: 'GET',
                url: url,
            });
            Logger_1.default.debug(`syncAll Result : ${result.statusText} (${result.status})`);
        }
        catch (e) {
            Logger_1.default.error(`syncAll Error  : ${JSON.stringify(e)}`);
        }
    }
}
exports.default = Plugin;
//# sourceMappingURL=index.js.map