"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const desko_api_service_1 = __importDefault(require("./desko.api.service"));
const Logger_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Logger"));
class DeskoApiProvider {
    constructor() {
        this.STATE_BUSY = 'busy';
        this.STATE_RESERVED = 'reserved';
        this.STATE_WAITING_APPROVAL = 'waiting';
        this.STATE_REJECTED = 'rejected';
        this.STATE_FALL = 'fall';
        this.STATE_LAST = 'last';
        this.STATE_CANCELED = 'canceled';
        this.ACTION_CREATED = 'create';
        this.ACTION_DELETED = 'deleted';
        this.service = new desko_api_service_1.default();
    }
    async runEvent(payload) {
        this.resource = payload.resource;
        this.event = payload.event;
        Logger_1.default.info(`event: ${JSON.stringify(payload)}`);
        return await this.setEventContent();
    }
    async setEventContent() {
        switch (this.event) {
            case 'booking':
                const payload = await this.service.getBooking(this.resource.uuid);
                if (!payload) {
                    return;
                }
                this.payload = payload;
                return this.getEventBooking();
            case 'checkin':
                return {
                    action: this.getAction(),
                    uuid: this.resource.uuid,
                };
            default:
                break;
        }
    }
    getEventBooking() {
        return {
            uuid: this.payload.uuid,
            start_date: new Date(this.payload.start_date),
            end_date: new Date(this.payload.end_date),
            state: this.getState(),
            action: this.getAction(),
            person: this.getPerson(),
            place: this.getPlace(),
            floor: this.getFloor(),
            building: this.getBuilding(),
            created_at: new Date(this.payload.created_at),
            updated_at: new Date(this.payload.updated_at),
            deleted_at: this.payload.deleted_at ? new Date(this.payload.deleted_at) : null,
        };
    }
    getAction() {
        return this.resource.action;
    }
    getEventType() {
        return this.event;
    }
    getPerson() {
        return {
            uuid: this.payload.person.uuid,
            name: this.payload.person.name,
            name_display: this.payload.person.name_display,
            email: this.payload.person.email,
            enrollment: this.payload.person.enrollment,
            created_at: this.payload.person.created_at,
            updated_at: this.payload.person.updated_at,
        };
    }
    getState() {
        return {
            busy: this.STATE_BUSY,
            reserved: this.STATE_RESERVED,
            waiting: this.STATE_WAITING_APPROVAL,
            rejected: this.STATE_REJECTED,
            fall: this.STATE_FALL,
            last: this.STATE_LAST,
            canceled: this.STATE_CANCELED,
        }[this.payload.state];
    }
    getPlace() {
        return {
            uuid: this.payload.place.uuid,
            qrcode: this.payload.place.qrcode,
            type: this.payload.place.type,
            name: this.payload.place.name,
            name_display: this.payload.place.name_display,
            capacity: this.payload.place.capacity,
            sector: this.payload.place.sector,
            created_at: this.payload.place.created_at,
            updated_at: this.payload.place.updated_at,
        };
    }
    getBuilding() {
        return {
            uuid: this.payload.place.area.building.uuid,
            name: this.payload.place.area.building.name,
            address: this.payload.place.area.building.address,
            is_active: this.payload.place.area.building.is_active,
        };
    }
    getFloor() {
        return {
            uuid: this.payload.place.area.floor.uuid,
            name: this.payload.place.area.floor.name,
            is_active: this.payload.place.area.floor.is_active,
        };
    }
}
exports.default = DeskoApiProvider;
//# sourceMappingURL=desko.api.provider.js.map