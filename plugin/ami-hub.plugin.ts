import { DateTime } from 'luxon'
import DeskoCore from '../core/desko.core'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import DeskoEventDto from '../core/dto/desko.event.dto'
import { isToday } from '../core/utils/is-today'
import { hubAddReserve, hubCancelReserve, hubOpenGate } from '../apis/amihub.api'

export default class ControlidPlugin extends DeskoCore implements DeskoPlugin {
  public init() {
    const accessControl = Env.get('FUNCTION_ACCESS_CONTROL')
    const dinningHallActivated = Env.get('ACTIVE_DINNING_HALL')
    const lockerActivated = Env.get('ACTIVE_LOCKER')
    if (accessControl) {
      this.schedule(() => this.sync())
      this.webhook('booking', async (deskoEvent) => {
        this.eventAccessControl(deskoEvent)
      })
      this.webhook('checkin', async (payload) => {
        const placeType = payload?.included?.place_type
        const action = payload.resource.action
        Logger.info(`webhook:checkin: ${JSON.stringify(payload)}`)
        Logger.info(`webhook:PlaceType: ${payload?.included?.place_type}`)
        if (dinningHallActivated && placeType === 'dininghall' && action === 'created') {
          hubOpenGate(payload.included.place_uuid, payload.included.booking_uuid)
        }
        if (lockerActivated && placeType === 'locker') {
          hubOpenGate(payload.included.place_uuid, payload.included.booking_uuid)
        }
      })
    }
    if (lockerActivated) {
      this.webhook('checkin', async (payload) => {
        const placeType = payload?.included?.place_type
        Logger.info(`webhook:checkin: ${JSON.stringify(payload)}`)
        Logger.info(`webhook:PlaceType: ${payload?.included?.place_type}`)
        if (placeType === 'locker') {
          hubOpenGate(payload.included.place_uuid, payload.included.booking_uuid)
        }
      })
    }
  }

  private async eventAccessControl(deskoEvent: DeskoEventDto) {
    Logger.debug(`event: eventAccessControl ${JSON.stringify(deskoEvent)}`)
    const event = await this.provider().runEvent(deskoEvent)
    if (!event) {
      Logger.error('Event NotFound')
      return
    }
    if (event.action === 'deleted') {
      const booking = await this.persist()
        .booking()
        .query()
        .where('uuid', event.uuid)
        .andWhere('state', 'reserved')
        .first()
      if (booking) {
        await hubCancelReserve(event, booking.external_id)
        await this.persist().booking().delete(event.uuid)
      }
      return
    }
    if (event.action === 'created') {
      const personalBadge = {
        identifier: event.person.email,
        identifier_type: 'email',
        code: event.person.uuid,
      }
      await this.provider().generatePersonalBadge(personalBadge)
      this.saveCache(event)
      return
    }
  }

  private async saveCache(event) {
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
    const payload = this.getPayloadAmihub(event)
    const eventUuid = event.uuid
    const placeUuid = event.place.uuid
    this.persist().booking().setSync(eventUuid)
    const [reserve, response] = await hubAddReserve(placeUuid, payload)
    if (!reserve) {
      return
    }
    this.persist()
      .booking()
      .save({
        uuid: eventUuid,
        external_id: reserve.id,
        state: 'reserved',
        sync_date: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
        payload: JSON.stringify(response),
        created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
        updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
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
      const eventUuid = booking.uuid
      const payload = this.getPayloadAmihub(booking)
      await hubAddReserve(eventUuid, payload)
      await this.persist().booking().setSync(eventUuid)
    }
  }

  private getPayloadAmihub(event) {
    return {
      'region.reserve': {
        schedule: {
          start: event.start_date,
          end: event.end_date,
          tolerance: event.tolerance,
          start_checkin: event.start_checkin,
          end_checkin: event.end_checkin,
          host: {
            type: 'guest',
            name: event.person.name,
            code: event.person.uuid,
            booking: event.uuid,
          },
        },
      },
    }
  }
}
