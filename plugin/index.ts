import { DateTime } from 'luxon'
import DeskoCore from '../core/desko.core'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import DeskoEventDto from 'core/dto/desko.event.dto'

const axios = require('axios')
const https = require('https')

export default class Plugin extends DeskoCore implements DeskoPlugin {
  private idSecureDb: any

  public init() {

    if (!this.connIdSecureDb()) {
      return
    }

    if (Env.get('CONTROLID_FUNCTION_ACCESS_CONTROL')) {
      this.schedule(() => this.sync())
      this.webhook('booking', async (deskoEvent) => {
        this.eventAccessControl(deskoEvent)
      })
    }

    if (Env.get('CONTROLID_FUNCTION_QRCODE')) {
      this.schedule(() => this.eventUserQrCode())
    }
  }

  private connIdSecureDb() {
    const settings = this.configConnection()
    if (!settings) {
      Logger.warn(`connIdSecureDb: DB invalid data`)
      return false
    }

    this.idSecureDb = this.database('controlIdMySQLConnection', {
      client: 'mysql',
      connection: settings,
    })

    return true
  }

  private async eventUserQrCode() {
    /*
    idType: Representa se o tag está destinado a uma pessoa ou veículo, caso tenha o valor 1 = pessoa, caso tenha o valor 2 = veículo
    type: Tecnologia do cartão: "0" para ASK/125kHz, "1" para Mifare e "2" para QR-Code.
    */
    const query = `SELECT id, email FROM users where deleted = 0 AND id NOT IN (SELECT idUser FROM cards where idType = 1 AND type = 2)`
    const response = await this.idSecureDb.rawQuery(query)
    const users = response[0] || null
    if (!users || !users.length) {
      Logger.info(`eventUserQrCode : nenhum usuario`)
      return
    }

    const accessToken = await this.authApi()
    const payload = <any>[]
    for (const user of users) {
      const code = await this.createQrCode(accessToken, user.id)
      if (!code) {
        Logger.debug(`event: user:${user.id} code not found}`)
        continue
      }

      await this.userSaveQrCode(user.id, code)
      payload.push({
        identifier_type: 'email',
        identifier: user.email,
        code: code
      })

      this.syncUser(accessToken, user.id)
    }

    this.service().api('POST', 'integrations/personal-badge', payload)
  }

  private async eventAccessControl(deskoEvent: DeskoEventDto) {
    Logger.debug(`event: eventAccessControl ${JSON.stringify(deskoEvent)}`)
    const event = await this.provider().runEvent(deskoEvent)
    if (!event) {
      Logger.error('Event NotFound')
    }

    if (event.action === 'deleted') {
      this.declinedAccess(event)
      return
    }

    this.saveCache(event)
  }

  private saveCache (event) {
    this.persist()
      .booking()
      .save({
        uuid: event.uuid,
        start_date: event.start_date,
        end_date: event.end_date,
        state: event.state,
        action: event.action,
        person: JSON.stringify(event.person),
        place: JSON.stringify(event.place),
        floor: JSON.stringify(event.floor),
        building: JSON.stringify(event.building),
      })

    if (!this.isToday(event)) {
      return
    }

    this.persist().booking().setSync(event.uuid)
    this.userAccessLimit({
      email: event.person.email,
      start_date: event.start_date,
      end_date: event.end_date,
    })

    this.syncAll()
  }

  private declinedAccess(event) {
    this.persist().booking().delete(event.uuid)
    if (!this.isToday(event)) {
      return
    }

    this.userAccessLimit({
      email: event.person.email,
      start_date: new Date(2021, 0, 1, 0, 0, 0),
      end_date: new Date(2021, 0, 1, 0, 0, 0),
    })

    this.syncAll()
  }

  private async sync() {
    const now = DateTime.local().toFormat('yyyy-MM-dd HH:mm:s')
    const dateStart = DateTime.local().startOf('day')
    const dateEnd = DateTime.local().endOf('day')
    const bookings = await this.persist()
      .booking()
      .query()
      .where('start_date', '>=', dateStart.toFormat('yyyy-MM-dd HH:mm:s'))
      .where('end_date', '<=', dateEnd.toFormat('yyyy-MM-dd HH:mm:s'))
      .whereNull('sync_date')
      .select('*')

    Logger.debug(`sync ${now}: ${bookings.length} bookings`)

    // nengh7m evento novo para sincronizar
    if (!bookings.length) {
      return
    }

    bookings.map(async (booking) => {
      this.persist().booking().setSync(booking.uuid)
      this.userAccessLimit({
        email: booking.person.email,
        start_date: booking.start_date,
        end_date: booking.end_date,
      })
    })

    this.syncAll()
  }

  private async getUser(email: string) {
    const user = await this.idSecureDb
      .query()
      .from('users')
      .where('email', email)
      .where('deleted', 0)
      .first()

    if (!user) {
      Logger.info(`userAccessLimit : ${email} not found`)
      // XXX TODO :: Podemo inserir usuarios caso nao existam na base?
      //this.insertUser(booking.person)
      return false
    }

    return user
  }

  private async userSaveQrCode(userId: number, number: string) {
    Logger.debug(`userSaveQrCode : ${userId} : ${number}`)
    const query = `
      INSERT INTO cards (
        idUser, idType, type, number, numberStr
      ) VALUES (
        '${userId}', '1', '2', '${number}',
        (select CONCAT(CONVERT((${number} DIV 65536), CHAR), ",", CONVERT((${number} MOD 65536), CHAR)))
      )
    `
    await this.idSecureDb.rawQuery(query)
  }

  private async userAccessLimit({ email, start_date, end_date }) {
    Logger.debug(`userAccessLimit : ${email} : ${start_date}:${end_date}`)

    const user = await this.getUser(email)
    if (!user) {
      return
    }

    await this.idSecureDb
      .query()
      .from('users')
      .where('id', user.id)
      .update({
        dateStartLimit: DateTime.fromJSDate(start_date).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
        dateLimit: DateTime.fromJSDate(end_date).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
      })
  }

  private isToday(event) {
    return DateTime.fromJSDate(event.start_date).ordinal == DateTime.now().ordinal
  }

  private configConnection() {

    if (!Env.get('CONTROLID_MYSQL_USER') || !Env.get('CONTROLID_MYSQL_PASSWORD')) {
      return false
    }

    return {
      host: Env.get('CONTROLID_MYSQL_HOST'),
      port: Env.get('CONTROLID_MYSQL_PORT'),
      user: Env.get('CONTROLID_MYSQL_USER'),
      password: Env.get('CONTROLID_MYSQL_PASSWORD'),
      database: Env.get('CONTROLID_MYSQL_DB_NAME'),
    }
  }

  private async syncAll() {
    const url = `${Env.get('CONTROLID_API')}/util/SyncAll`
    Logger.debug(`syncAll: ${url}`)
    try {
      const result = await axios({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        method: 'GET',
        url: url,
      })
      Logger.debug(`syncAll Result : ${result.statusText} (${result.status})`)
    } catch (e) {
      Logger.error(`syncAll Error  : ${JSON.stringify(e)}`)
    }
  }

  private async createQrCode(accessToken, userId) {
    const url = `${Env.get('CONTROLID_API')}/qrcode/userqrcode`
    Logger.debug(`createUserQrCode: ${url}`)
    try {
      const result = await axios({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        method: 'POST',
        url: url,
        data: userId
      })
      
      return result.data || null
    } catch (e) {
      Logger.error(`createUserQrCode Error  : ${JSON.stringify(e)}`)
    }
  }

  private async syncUser(accessToken, userId) {
    const url = `${Env.get('CONTROLID_API')}/util/SyncUser/${userId}`
    Logger.debug(`syncUser: ${url}`)
    try {
      const result = await axios({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        method: 'GET',
        url: url
      })
      
      Logger.debug(`Result : ${result.statusText} (${result.status})`)
      Logger.debug(`Payload: ${JSON.stringify(result.data)}`)

    } catch (e) {
      Logger.error(`createUserQrCode Error  : ${JSON.stringify(e)}`)
    }
  }

  private async authApi() {
    const url = `${Env.get('CONTROLID_API')}/login`
    Logger.debug(`Login: ${url}`)
    try {
      const result = await axios({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username: Env.get('CONTROLID_API_USER'),
          password: Env.get('CONTROLID_API_PASSWORD')
        }
      })
     
      Logger.debug(`Result : ${result.statusText} (${result.status})`)
      Logger.debug(`Payload: ${JSON.stringify(result.data)}`)

      return result.data.accessToken || null
    } catch (e) {
      Logger.debug(`Error  : ${e.message} (${e.response}))`)
    }
  }
}
