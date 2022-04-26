import Event from '@ioc:Adonis/Core/Event'
import Env from '@ioc:Adonis/Core/Env'
import DeskoPersistence from './desko.persistence'
import Database, {
  MssqlConfig,
  MysqlConfig,
  OracleConfig,
  PostgreConfig,
  SqliteConfig,
} from '@ioc:Adonis/Lucid/Database'
import DeskoApiProvider from './api/desko.api.provider'
import DeskoApiService from './api/desko.api.service'

export default class DeskoCore {
  protected webhook(name: string, callback): void {
    Event.on(`webhook:${name}`, (event) => callback(event))
  }

  protected service(): DeskoApiService {
    return new DeskoApiService()
  }

  protected provider(): DeskoApiProvider {
    return new DeskoApiProvider()
  }

  protected persist(): DeskoPersistence {
    return new DeskoPersistence()
  }


  protected schedule(callback) {
    callback()

    let minutes = Number.parseInt(Env.get('SCHEDULE_POOLING_MINUTES'));
    if (!minutes || minutes < 1) {
      minutes = 5
    }

    return require('node-schedule').scheduleJob(`*/${minutes} * * * *`, async () => callback())
  }

  protected database(
    storeConnection: string,
    connection: SqliteConfig | MysqlConfig | PostgreConfig | OracleConfig | MssqlConfig
  ) {
    // conecta no banco, caso nao esteja conectado
    if (!Database.manager.has(storeConnection)) {
      Database.manager.add(storeConnection, connection)
      Database.manager.connect(storeConnection)
    }

    return Database.connection(storeConnection)
  }
}
