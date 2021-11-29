import { DateTime } from 'luxon'
import DeskoCore from '../core/desko.core'
import Env from '@ioc:Adonis/Core/Env'
const axios = require('axios')
const https = require('https')

export default class Plugin extends DeskoCore implements DeskoPlugin {
  private dbControId: any

  public init() {
    this.dbControId = this.database('controlIdMySQLConnection', {
      client: 'mysql',
      connection: {
        host: Env.get('CONTROLID_MYSQL_HOST'),
        port: Env.get('CONTROLID_MYSQL_PORT'),
        user: Env.get('CONTROLID_MYSQL_USER'),
        password: Env.get('CONTROLID_MYSQL_PASSWORD'),
        database: Env.get('CONTROLID_MYSQL_DB_NAME'),
      },
    })

    this.schedule(() => this.sync())

    // quando receber evento de booking, persiste na base
    this.webhook('booking', async (payload) => {
      this.logger(`webhook:booking: ${JSON.stringify(payload)}`)

      const event = await this.provider().runEvent(payload)
      if (event.action === 'deleted') {
        return this.persist().booking().delete(event.uuid)
      }

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

      if (DateTime.fromJSDate(event.start_date).ordinal == DateTime.now().ordinal) {
        this.userAccessLimit({
          uuid: event.uuid,
          email: event.person.email,
          start_date: event.start_date,
          end_date: event.end_date,
        })
        this.syncAll()
      }
    })
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

    this.logger(`sync ${now}: ${bookings.length} bookings`)

    // nengh7m evento novo para sincronizar
    if (!bookings.length) {
      return
    }

    bookings.map(async (booking) => {
      this.userAccessLimit({
        uuid: booking.uuid,
        email: booking.person.email,
        start_date: booking.start_date,
        end_date: booking.end_date,
      })
    })

    this.syncAll()
  }

  private async userAccessLimit({ uuid, email, start_date, end_date }) {
    const user = await this.dbControId
      .query()
      .from('users')
      .where('email', email)
      .where('deleted', 0)
      .first()

    if (!user) {
      // XXX TODO :: Podemo inserir usuarios caso nao existam na base?
      //this.insertUser(booking.person)
      return
    }

    await this.dbControId
      .query()
      .from('users')
      .where('id', user.id)
      .update({
        dateStartLimit: DateTime.fromJSDate(start_date).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
        dateLimit: DateTime.fromJSDate(end_date).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
      })

    await this.persist().booking().setSync(uuid)
  }

  private async syncAll() {
    const url = `https://localhost:30443/api/util/SyncAll`
    this.logger(`syncAll: ${url}`)
    try {
      const result = await axios({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        method: 'GET',
        url: url,
      })
      this.logger(`syncAll Result : ${result.statusText} (${result.status})`)
    } catch (e) {
      this.logger(`syncAll Error  : ${JSON.stringify(e)}`)
    }
  }
}
