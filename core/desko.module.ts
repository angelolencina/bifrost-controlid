import Application from '@ioc:Adonis/Core/Application'
import Logger from '@ioc:Adonis/Core/Logger'
import Event from '@ioc:Adonis/Core/Event'
import DeskoEventDto from './dto/desko.event.dto'
import Env from '@ioc:Adonis/Core/Env'

export default class DeskoModule {
  public loadingPlugins() {
    const plugins = (Env.get('PLUGINS') || '').split(',')

    if (!plugins.length || !plugins[0].length) {
      Logger.info(`no plugin loaded`)
      return
    }

    Logger.info(`loading ${plugins.join(',')} plugins ....`)

    plugins.map(async (plugin) => {
      const file = `${Application.appRoot}/plugins/${plugin}/index.ts`
      Logger.info(`loading ${file}`)
      const MODULE = await import(file)
      new MODULE.default().init()
    })
  }

  public async event(payload: DeskoEventDto) {
    Event.emit(`webhook:${payload.event}`, payload)
  }
}
