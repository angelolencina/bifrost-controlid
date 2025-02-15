/**
 * Config source: https://git.io/JesV9
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'
import { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'

const databaseConfig: DatabaseConfig = {
  /*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | The primary connection for making database queries across the application
  | You can use any key from the `connections` object defined in this same
  | file.
  |
  */
  connection: Env.get('DATABASE_DRIVE') ? Env.get('DATABASE_DRIVE') : 'sqlite',

  connections: {
    /*
    |--------------------------------------------------------------------------
    | MySQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for MySQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i mysql
    |
    */

    sqlite: {
      client: 'sqlite3',
      connection: {
        filename: Env.get('NODE_ENV') === 'development' ? './bifrost.sqlite' : '../bifrost.sqlite',
      },
      useNullAsDefault: true,
    },
    sqlite2: {
      client: 'sqlite3',
      connection: {
        filename: Env.get('CONTROLID_DB_SQLITE_PATH'),
      },
      useNullAsDefault: true,
    },
    mysql: {
      client: 'mysql2',
      connection: {
        host: Env.get('DB_MYSQL_HOST'),
        port: Env.get('DB_MYSQL_PORT', 3306),
        user: Env.get('DB_MYSQL_USER'),
        password: Env.get('DB_MYSQL_PASSWORD', ''),
        database: Env.get('DB_MYSQL_NAME'),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: false,
      debug: false,
    },
  },
}

export default databaseConfig
