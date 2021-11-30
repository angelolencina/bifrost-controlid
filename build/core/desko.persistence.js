"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const desko_booking_persistence_1 = __importDefault(require("./persistence/desko.booking.persistence"));
class DeskoPersistence {
    booking() {
        return new desko_booking_persistence_1.default();
    }
}
exports.default = DeskoPersistence;
//# sourceMappingURL=desko.persistence.js.map