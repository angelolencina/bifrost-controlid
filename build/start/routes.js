"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const EventController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/EventController"));
Route_1.default.post('/events', async (ctx) => {
    return new EventController_1.default().index(ctx);
}).middleware('signature');
Route_1.default.get('/ping', () => {
    return 'pong';
});
//# sourceMappingURL=routes.js.map