import { DateTime } from 'luxon'
import DeskoCore from '../../core/desko.core'

export default class Plugin extends DeskoCore implements DeskoPlugin {
  private dbControId: any

  public init() {
    const env = this.getEnv(`${__dirname}/.env`)
    this.dbControId = this.database('controlIdMySQLConnection', {
      client: 'mysql',
      connection: {
        host: env.CONTROLID_MYSQL_HOST,
        port: env.CONTROLID_MYSQL_PORT,
        user: env.CONTROLID_MYSQL_USER,
        password: env.CONTROLID_MYSQL_PASSWORD,
        database: env.CONTROLID_MYSQL_DB_NAME,
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
      }
    })
  }

  private async sync() {
    
    const dateStart = DateTime.local().startOf('day')
    const dateEnd = DateTime.local().endOf('day')
    const bookings = await this.persist()
      .booking()
      .query()
      .where('start_date', '>=', dateStart.toFormat('yyyy-MM-dd HH:mm:s'))
      .where('end_date', '<=', dateEnd.toFormat('yyyy-MM-dd HH:mm:s'))
      .whereNull('sync_date')
      .select('*')

      this.logger(`sync ${DateTime.local().toFormat('yyyy-MM-dd HH:mm:s')}: ${bookings.length} bookings`)

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
  }

  private async userAccessLimit ({ uuid, email, start_date, end_date}) {
    const user = await this.dbControId
        .query()
        .from('users')
        .where('email', email)
        .first()

      if (!user) {
        // XXX TODO :: Podemo inserir usuarios caso nao existam na base?
        //this.insertUser(booking.person)
        return
      }

      await this.dbControId.query().from('users').where('id', user.id).update({
        dateLimit: DateTime.fromJSDate(start_date).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
        dateStartLimit: DateTime.fromJSDate(end_date).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss'),
      })

      await this.persist().booking().setSync(uuid)
  }
}
