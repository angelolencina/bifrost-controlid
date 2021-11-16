import DeskoModule from '../../core/desko.module'

export default class EventController {
  public async index({ request, response }) {
    await new DeskoModule().event(request.body())
    response.status(200)
  }
}
