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
      this.webhook('personal_badge', async (deskoEvent) => {
        this.eventUserQrCode(deskoEvent)
      })

      this.webhook('user', async (deskoEvent) => {
        this.eventUserQrCode(deskoEvent)
      })
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

  private async eventUserQrCode(event: DeskoEventDto) {
    Logger.debug(`event: eventUserQrCode ${JSON.stringify(event)}`)
    const data = event.included ?? false
    if (data.email && data.personal_badge) {
      this.userSaveQrCode(data.email, data.personal_badge)
    }
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

  private async userSaveQrCode(email: string, number: string) {
    Logger.debug(`userSaveQrCode : ${email} : ${number}`)
    const user = await this.getUser(email)
    if (!user) {
      return
    }

    const cards = await this.idSecureDb
      .query()
      .from('cards')
      .where('idUser', user.id)
      .where('number', number)
      .first()

    if (cards) {
      Logger.debug(`cards :card ${number} exists`)
      return
    }

    const query = `
      INSERT INTO cards (
        idUser, idType, type, number, numberStr
      ) VALUES (
        '${user.id}', '1', '2', '${number}',
        (select CONCAT(CONVERT((${number} DIV 65536), CHAR), ",", CONVERT((${number} MOD 65536), CHAR)))
      )
    `
    await this.idSecureDb.rawQuery(query)
    this.syncAll()
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
    const url = `${Env.get('CONTROLID_MYSQL_DB_NAME')}/util/SyncAll`
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
}
