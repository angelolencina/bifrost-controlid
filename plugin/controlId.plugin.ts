import { DateTime } from 'luxon'
import DeskoCore from '../core/desko.core'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { MysqlConfig, SqliteConfig } from '@ioc:Adonis/Lucid/Database'
import { TypeEventControlid } from '../core/interfaces/type-event-controlid'
import { parseEntryRecords } from '../core/utils/mapper-entry-records'
import axios from 'axios'
import * as https from 'https'
import { apiControlid } from '../apis/controlid.api'
import DeskoEventDto from '../core/dto/desko.event.dto'
import { isToday } from '../core/utils/is-today'
import { beginDay, endDay } from './common/utils'
export default class ControlidPlugin extends DeskoCore implements DeskoPlugin {
  private idSecureDb: any

  public init() {
    if (!this.connIdSecureDb()) {
      return
    }
    if (Env.get('FUNCTION_ACCESS_CONTROL')) {
      this.schedule(() => this.sync())
      this.webhook('booking', async (deskoEvent) => {
        this.eventAccessControl(deskoEvent)
      })
    }

    if (Env.get('CONTROLID_FUNCTION_AUTOMATED_CHECKIN')) {
      this.schedule(() => this.checkEntryRecords())
    }

    if (Env.get('CONTROLID_FUNCTION_QRCODE')) {
      this.schedule(() => this.eventUserQrCode())
    }
  }
  private connIdSecureDb() {
    const settings = this.configConnection()
    if (!settings) {
      Logger.info(`connIdSecureDb: DB invalid data`)
      return false
    }
    this.idSecureDb = this.database('controlIdDatabaseConnection', settings)
    return true
  }

  private async eventAccessControl(deskoEvent: DeskoEventDto) {
    Logger.info(`event: eventAccessControl ${JSON.stringify(deskoEvent)}`)
    const event = await this.provider().runEvent(deskoEvent)
    if (!event) {
      Logger.error('Event NotFound')
      return
    }
    if (event.action === 'deleted' || event.state === 'fall') {
      this.declinedAccess(event)
      return
    }
    this.saveCache(event)
  }

  private declinedAccess(event) {
    this.persist().booking().delete(event.uuid)
    if (!isToday(event)) {
      return
    }

    this.userAccessLimit({
      email: event.person.email,
      start_date: new Date(2021, 0, 1, 0, 0, 0),
      end_date: new Date(2021, 0, 1, 0, 0, 0),
    })
  }

  private saveCache(event) {
    const eventDatabase = {
      uuid: event.uuid,
      start_date: DateTime.fromJSDate(event.start_date)
        .setZone('UTC+0', { keepLocalTime: true }).toFormat('yyyy-MM-dd HH:mm:ss'),
      end_date: DateTime.fromJSDate(event.end_date)
        .setZone('UTC+0', { keepLocalTime: true })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      state: event.state,
      action: event.action,
      person: JSON.stringify(event.person),
      place: JSON.stringify(event.place),
      floor: JSON.stringify(event.floor),
      building: JSON.stringify(event.building),
      created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
      updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
    }
    this.persist().booking().save(eventDatabase)

    if (!isToday(event)) {
      return
    }

    this.persist().booking().setSync(event.uuid)
    this.userAccessLimit({
      email: event.person.email,
      start_date: beginDay(event.start_date),
      end_date: endDay(event.end_date),
    })
  }

  public async userSaveQrCode(userId: number, number: string) {
    Logger.info(`userSaveQrCode : ${userId} : ${number}`)
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

  private configConnection(): SqliteConfig | boolean | MysqlConfig | any {
    if (Env.get('CONTROLID_DB_CONNECTION') === 'sqlite') {
      return {
        client: 'sqlite3',
        connection: { filename: Env.get('CONTROLID_DB_SQLITE_PATH') },
        useNullAsDefault: true,
      }
    }

    if (!Env.get('CONTROLID_MYSQL_USER') || !Env.get('CONTROLID_MYSQL_PASSWORD')) {
      return false
    }

    return {
      client: 'mysql',
      connection: {
        host: Env.get('CONTROLID_MYSQL_HOST'),
        port: Env.get('CONTROLID_MYSQL_PORT'),
        user: Env.get('CONTROLID_MYSQL_USER'),
        password: Env.get('CONTROLID_MYSQL_PASSWORD'),
        database: Env.get('CONTROLID_MYSQL_DB_NAME'),
      },
    }
  }

  private async sync() {
    const now = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
    const dateStart = DateTime.local().startOf('day')
    const dateEnd = DateTime.local().endOf('day')
    const bookings = await this.persist()
      .booking()
      .query()
      .where('start_date', '>=', dateStart.toFormat('yyyy-MM-dd HH:mm:ss'))
      .where('end_date', '<=', dateEnd.toFormat('yyyy-MM-dd HH:mm:ss'))
      .whereNull('sync_date')
      .select('*')
    Logger.info(`sync ${now}: ${bookings.length} bookings`)
    // nengh7m evento novo para sincronizar
    if (!bookings.length) {
      return
    }
    for (const booking of bookings) {
      this.persist().booking().setSync(booking.uuid)
      this.userAccessLimit({
        email: booking.person.email,
        start_date: beginDay(booking.start_date),
        end_date: endDay(booking.end_date),
      })
    }
  }

  public async eventUserQrCode() {
    /*
    idType: Representa se o tag está destinado a uma pessoa ou veículo, caso tenha o valor 1 = pessoa, caso tenha o valor 2 = veículo
    type: Tecnologia do cartão: "0" para ASK/125kHz, "1" para Mifare e "2" para QR-Code.
    */
    const lastSixMinutes = DateTime.local().minus({ minutes: 6 }).toFormat('yyyy-MM-dd HH:mm:ss')
    const query = `SELECT id, email FROM users where deleted = 0 AND email != '' AND id NOT IN (SELECT idUser FROM cards where idType = 1 AND type = 2) OR timeOfRegistration > '${lastSixMinutes}'`
    const response = await this.idSecureDb.rawQuery(query)
    const users = response[0] || null
    if (!users || !users.length) {
      Logger.info(`eventUserQrCode : nenhum usuario`)
      return
    }

    const payload = <any>[]
    for (const user of users) {
      const code = await this.createQrCode(user.id)
      if (!code) {
        Logger.info(`event: user:${user.id} code not found}`)
        continue
      }

      await this.userSaveQrCode(user.id, code)
      payload.push({
        identifier_type: 'email',
        identifier: user.email,
        code: code,
      })

      this.syncUser(user.id)
    }

    this.service().sendPersonalBadge(payload)
  }

  public async getUser(email: string) {
    if(email && email !== ''){
    const user = await this.idSecureDb
      .query()
      .from('users')
      .where('deleted', 0)
      .andWhere('email', 'LIKE', email)
      .orWhere('email', 'LIKE', email.toUpperCase())
      .orderBy('id', 'desc')
      .first()
      if (!user) {
        Logger.info(`userAccessLimit : ${email} not found`)
        // XXX TODO :: Podemo inserir usuarios caso nao existam na base?
        //this.insertUser(booking.person)
        return false
      }
      return user
    }
    return null
  }

  public async checkEntryRecords() {
    const lastRecords = (await this.getUserPassLogs()) || []
    Logger.info(`AutomateCheckin : ${lastRecords.length} checkinEvents`)
    this.provider()
      .automateCheckin(lastRecords)
      ?.then(() => {
        this.persist().entryRecord().save(TypeEventControlid.Pass)
      })
      .catch((error) => {
        Logger.info(`Erro ao enviar checkin: ${error}`)
      })
  }

  public async getUserPassLogs() {
    await this.syncAll()
    const lastDateRecord = await this.persist()
      .entryRecord()
      .getDatetimeLastRecord(TypeEventControlid.Pass)
    const query = `SELECT u.id, u.email, u.name, l.idDevice, l.deviceName, l.reader, l.idArea, l.area, l.event, l.time
    FROM Logs l
    INNER JOIN Users u ON l.idUser = u.id
    WHERE l.event = 7 AND l.time > '${lastDateRecord}'`
    const [records] = await this.idSecureDb.rawQuery(query)
    return parseEntryRecords(records)
  }

  public async userAccessLimit({ email, start_date, end_date }) {
    Logger.info(`userAccessLimit : ${email} : ${start_date}:${end_date}`)

    const user = await this.getUser(email)
    if (!user) {
      return
    }

    await this.idSecureDb
      .query()
      .from('users')
      .where('id', user.id)
      .update({
        dateStartLimit: DateTime.fromJSDate(start_date)
          .startOf('day')
          .toFormat('yyyy-MM-dd HH:mm:ss'),
        dateLimit: DateTime.fromJSDate(end_date).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
      })
    this.syncAll()
  }

  public async syncAll() {
    const url = `${Env.get('CONTROLID_API')}/util/SyncAll`
    Logger.info(`syncAll: ${url}`)
    try {
      const result = await axios({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        method: 'GET',
        url: url,
      })
      Logger.info(`syncAll Result : ${result.statusText} (${result.status})`)
    } catch (e) {
      Logger.error(`syncAll Error  : ${JSON.stringify(e)}`)
    }
  }

  public async createQrCode(userId) {
    Logger.info(`createUserQrCode userId: ${userId}`)
    return apiControlid
      .post(`/qrcode/userqrcode`, userId.toString())
      .then((res) => res.data || null)
      .catch((e) => {
        Logger.error(`createUserQrCode Error  : ${JSON.stringify(e)}`)
      })
  }

  public async syncUser(userId): Promise<void> {
    Logger.info(`syncUser: controlid userId:${userId}`)
    apiControlid
      .get(`/util/SyncUser/${userId}`)
      .then((res) => {
        Logger.info(`Result : ${res.statusText} (${res.status})`)
        Logger.info(`Payload: ${JSON.stringify(res.data)}`)
        return res.data
      })
      .catch((e) => {
        Logger.error(`createUserQrCode Error  : ${JSON.stringify(e)}`)
      })
  }
}
