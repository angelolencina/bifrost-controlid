"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const desko_module_1 = __importDefault(require("../../core/desko.module"));
class EventController {
    async index({ request, response }) {
        await new desko_module_1.default().event(request.body());
        response.status(200);
    }
}
exports.default = EventController;
//# sourceMappingURL=EventController.js.map