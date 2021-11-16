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

    // nengh7m evento novo para sincronizar
    if (!bookings.length) {
      return
    }

    bookings.map(async (booking) => {
      const user = await this.dbControId
        .query()
        .from('users')
        .where('email', booking.person.email)
        .first()

      console.log('user', user)

      if (!user) {
        // XXX TODO :: Podemo inserir usuarios caso nao existam na base?
        //this.insertUser(booking.person)
        return
      }

      await this.dbControId.query().from('users').where('id', user.id).update({
        dateLimit: booking.start_date,
        dateStartLimit: booking.end_date,
      })

      await this.persist().booking().setSync(booking.uuid)
    })
  }
}
