import Application from '@ioc:Adonis/Core/Application'
import Logger from '@ioc:Adonis/Core/Logger'
import Event from '@ioc:Adonis/Core/Event'
import DeskoEventDto from './dto/desko.event.dto'

export default class DeskoModule {
  public async loadingPlugins() {
    const file = `${Application.appRoot}/plugin/index`
    Logger.info(`loading ${file}`)
    const MODULE = await import(file)
    new MODULE.default().init()
  }

  public async event(payload: DeskoEventDto) {
    Logger.debug(`event: ${JSON.stringify(payload)}`)
    Event.emit(`webhook:${payload.event}`, payload)
  }
}