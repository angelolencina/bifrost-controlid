/* eslint-disable @typescript-eslint/naming-convention */
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
  public ACCESS_CONTROL: boolean = Env.get('FUNCTION_ACCESS_CONTROL') === 'true'
  public CUSTOM_ACCESS_CONTROL: boolean = Env.get('FUNCTION_CUSTOM_ACCESS_CONTROL') === 'true'
  public ACCESS_PLACE_TYPE: string[] = Env.get('ACCESS_PLACE_TYPE')?.split(',')

  public placeNames: any = {
    dininghall: 'Refeitorio',
    meetingroom: 'Sala de reunião',
    parking: 'Estacionamento',
    coworking: 'Coworking',
    bus: 'onibus',
    locker: 'locker',
    service: 'serviço',
    bathroom: 'banheiro',
    kitchen: 'cozinha',
    reception: 'recepção',
    homeoffice: 'home office',
  }

  public init() {
    if (!this.connIdSecureDb()) {
      return
    }
    if (this.ACCESS_CONTROL) {
      console.log('this.ACCESS_CONTROL', this.ACCESS_CONTROL)
      this.schedule(() => this.sync())
      this.webhook('booking', async (deskoEvent) => {
        this.eventAccessControl(deskoEvent)
      })
    }

    if (this.CUSTOM_ACCESS_CONTROL) {
      this.scheduleEndDay(() => this.deleteAllUserFromGroup())
      console.log('this.CUSTOM_ACCESS_CONTROL', this.CUSTOM_ACCESS_CONTROL)
      this.schedule(() => this.sync())
      this.webhook('booking', async (deskoEvent) => {
        this.eventAccessControl(deskoEvent)
      })
    }

    if (Env.get('FUNCTION_AUTOMATED_CHECKIN')) {
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
    if (event === 'error') {
      if (deskoEvent.included?.person?.email) {
        const included = deskoEvent.included
        this.allowAccess(included?.person?.email, included?.start_date, included?.end_date)
      }
    }
    if (!event) {
      Logger.error('Event NotFound')
      return
    }
    if (event.action === 'deleted' || event.action === 'checkout') {
      this.declinedAccess(event)
      return
    }
    this.saveCache(event)
  }

  private declinedAccess(event) {
    if (!(Env.get('DISABLE_UPDATE_USER_ON_DECLINE') === 'true')) {
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
    if (this.ACCESS_CONTROL) {
      this.userAccessLimit({
        email: event.person.email,
        start_date: new Date(2021, 0, 1, 0, 0, 0),
        end_date: new Date(2021, 0, 1, 0, 0, 0),
      })
    }
    console.log('declinedAccess Group', this.CUSTOM_ACCESS_CONTROL)
    if (this.CUSTOM_ACCESS_CONTROL) {
      this.removeUserFromGroup(event.person.email)
    }
  }

  private allowAccess(email: string, start_date: string, end_date: string) {
    if (this.ACCESS_CONTROL) {
      this.userAccessLimit({
        email: email,
        start_date: beginDay(start_date),
        end_date: endDay(end_date),
      })
    }
  }

  private saveCache(event) {
    const eventDatabase = {
      uuid: event.uuid,
      start_date: DateTime.fromJSDate(event.start_date)
        .setZone('UTC+0', { keepLocalTime: true })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
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

    this.allowAccessOnControlId(event)
  }

  public async allowAccessOnControlId(event) {
    const {
      person: { email },
      start_date,
      end_date,
    } = event
    if (this.ACCESS_CONTROL) {
      this.userAccessLimit({
        email: email,
        start_date: beginDay(start_date),
        end_date: endDay(end_date),
      })
    }
    console.log('allowAccessOnControlId', this.CUSTOM_ACCESS_CONTROL)
    if (this.CUSTOM_ACCESS_CONTROL) {
      this.addUserToGroup(email, event.place.type)
    }
  }

  public async getGroupId(placeType: string) {
    console.log('getGroupId', this.ACCESS_PLACE_TYPE, placeType)
    if (this.ACCESS_PLACE_TYPE?.length && this.ACCESS_PLACE_TYPE.includes(placeType)) {
      console.log(this.placeNames[placeType])
      const response = await this.idSecureDb
        .query()
        .select('id')
        .from('groups')
        .where('name', this.placeNames[placeType])
        .first()
      if (!response) {
        console.warn(`getGroupId: group not found ${placeType}`)
        return
      }
      return response.id
    } else {
      console.warn(`getGroupId: placeType not active to custom access control ${placeType}`)
    }
    return null
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
      if (booking?.person) {
        booking.person = JSON.parse(booking.person)
      }
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
    if (email && email !== '') {
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
    Logger.info(`userAccessLimit : ${email} not found on controlid`)
    // XXX TODO :: Podemo inserir usuarios caso nao existam na base?
    //this.insertUser(booking.person)
    return false
  }

  public async checkEntryRecords() {
    const lastRecords = (await this.getUserPassLogs()) || []
    const checkIns = lastRecords.map((record) => {
      return {
        device: record.deviceName,
        person: record.email,
        date: record.time,
        entrance: 1,
      }
    })
    this.provider()
      .automateCheckin(checkIns)
      ?.then(() => {
        this.persist().entryRecord().save(TypeEventControlid.Pass)
      })
      .catch((error) => {
        Logger.info(`Erro ao enviar checkin: ${error}`)
      })
  }

  public async getUserPassLogs() {
    await this.syncAll()
    const mysqlQuery = `SELECT u.id, u.email, u.name, l.idDevice, l.deviceName, l.reader, l.idArea, l.area, l.event, l.time
    FROM Logs l
    INNER JOIN Users u ON l.idUser = u.id
    WHERE l.event = 7 AND l.time > date_sub(NOW(), INTERVAL 5 minute)
    ORDER BY time DESC
    `
    const sqlite = `SELECT u.id, u.email, u.name, l.idDevice, l.deviceName, l.reader, l.idArea, l.area, l.event, l.time
    FROM Logs l
    INNER JOIN Users u ON l.idUser = u.id
    WHERE l.event = 7 AND l.time > DATETIME(DATETIME('now'), '-5 minutes', 'localtime' )
    ORDER BY time DESC
    `
    const query = Env.get('CONTROLID_DB_CONNECTION') === 'mysql' ? mysqlQuery : sqlite
    return this.idSecureDb.rawQuery(query).then((response) => {
      if (response) {
        if (Env.get('CONTROLID_DB_CONNECTION') === 'mysql') {
          return parseEntryRecords(response[0])
        }
        return response
      }
      return []
    })
  }

  public async addUserToGroup(email: string, placeType: string) {
    console.log('addUserToGroup', email, placeType)
    const idGroup: number = await this.getGroupId(placeType)
    console.log('idGroup', idGroup)
    const user = await this.getUser(email)
    if (!user || !idGroup) {
      return
    }
    const idUser = user.id
    const idType = user.idType

    const query = `INSERT INTO usergroups (idUser, idGroup, isVisitor) VALUES (${idUser}, ${idGroup}, ${idType})`
    return this.idSecureDb.rawQuery(query)
  }

  public async removeUserFromGroup(email: string) {
    const idGroup: number = await this.getGroupId(Env.get('ACCESS_PLACE_TYPE'))
    console.log('removeUserFromGroup', email, idGroup)
    const user = await this.getUser(email)
    if (!user || !idGroup) {
      return
    }
    const idUser = user.id
    return this.idSecureDb
      .query()
      .from('usergroups')
      .where('idUser', idUser)
      .andWhere('idGroup', idGroup)
      .delete()
  }

  public async deleteAllUserFromGroup() {
    const idGroup: number = await this.getGroupId(Env.get('ACCESS_PLACE_TYPE'))
    return this.idSecureDb.query().from('usergroups').where('idGroup', idGroup).delete()
  }

  public async userAccessLimit({ email, start_date, end_date }) {
    if (this.ACCESS_CONTROL) {
      console.log('userAccessLimit', email, start_date, end_date)
      if (!(Env.get('DISABLE_UPDATE_CONTROLID_USER') === 'true')) {
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
    }
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
      console.error(`syncAll Error  :`, e)
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
