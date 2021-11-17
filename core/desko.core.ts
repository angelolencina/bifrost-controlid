import Event from '@ioc:Adonis/Core/Event'
import Logger from '@ioc:Adonis/Core/Logger'
import DeskoPersistence from './desko.persistence'
import Database, {
  MssqlConfig,
  MysqlConfig,
  OracleConfig,
  PostgreConfig,
  SqliteConfig,
} from '@ioc:Adonis/Lucid/Database'
import DeskoApiProvider from './api/desko.api.provider'

export default class DeskoCore {
  protected webhook(name: string, callback): void {
    Event.on(`webhook:${name}`, (event) => callback(event))
  }

  protected provider(): DeskoApiProvider {
    return new DeskoApiProvider()
  }

  protected persist(): DeskoPersistence {
    return new DeskoPersistence()
  }

  protected schedule(callback) {
    callback()
    return require('node-schedule').scheduleJob('*/1 * * * *', async () => callback())
  }

  protected getEnv(file: string) {
    const env = require('dotenv').config({ path: file })
    return env.parsed
  }

  public logger(text) {
    return Logger.info(text)
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
