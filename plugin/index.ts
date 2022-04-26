import { DateTime } from 'luxon'
import DeskoCore from '../core/desko.core'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import DeskoEventDto from '../core/dto/desko.event.dto'
import ControlidPlugin from './controlId'
import BioStarPlugin from './biostar.plugin';
import { isToday } from '../core/utils/is-today'
export default class Plugin extends DeskoCore implements DeskoPlugin {
  constructor(private controlPlugin: any) {
    super()
    this.controlPlugin = Env.get('PLUGIN') == 'biostar' ? new BioStarPlugin() : new ControlidPlugin()
  }

  public init() {
    this.controlPlugin.init()
    if (Env.get('FUNCTION_ACCESS_CONTROL')) {
      this.schedule(() => this.sync())
      this.webhook('booking', async (deskoEvent) => {
        this.eventAccessControl(deskoEvent)
      })
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

  private saveCache(event) {
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

    if (!isToday(event)) {
      return
    }

    this.persist().booking().setSync(event.uuid)
    this.controlPlugin.userAccessLimit({
      email: event.person.email,
      start_date: event.start_date,
      end_date: event.end_date,
    })
  }

  private declinedAccess(event) {
    this.persist().booking().delete(event.uuid)
    if (!isToday(event)) {
      return
    }

    this.controlPlugin.userAccessLimit({
      email: event.person.email,
      start_date: new Date(2021, 0, 1, 0, 0, 0),
      end_date: new Date(2021, 0, 1, 0, 0, 0),
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
    Logger.info(`sync ${now}: ${bookings.length} bookings`)
    // nengh7m evento novo para sincronizar
    if (!bookings.length) {
      return
    }
    for (const booking of bookings) {
      this.persist().booking().setSync(booking.uuid)
      this.controlPlugin.userAccessLimit({
        email: booking.person.email,
        start_date: booking.start_date,
        end_date: booking.end_date,
      })
    }
  }
}
