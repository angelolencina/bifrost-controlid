/* eslint-disable @typescript-eslint/naming-convention */
import DeskoCore from '../core/desko.core'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import { hubAddReserve, hubCancelReserve, hubOpenGate } from '../apis/amihub.api'

export default class AmiHubPlugin extends DeskoCore implements DeskoPlugin {
  public async init() {
    this.webhook('checkin', async (payload) => {
      Logger.info(`webhook:checkin: ${JSON.stringify(payload)}`)
      const booking = await this.persist().booking().findOne(payload.included.booking_uuid)

      if (booking) {
        Logger.info(`webhook: HasCheckin: ${booking.uuid} `)
        return
      }
      if (Env.get('ACTIVE_DINNING_HALL') && payload?.included.place_type === 'dininghall') {
        if (payload.resource.action === 'created') {
          hubOpenGate(payload.included.place_uuid, payload.included.booking_uuid)
        }
      }
      if (Env.get('ACTIVE_LOCKER') && payload?.included.place_type === 'locker') {
        hubOpenGate(payload.included.place_uuid, payload.included.booking_uuid)
      }
    })

    this.webhook('booking', async (payload) => {
      Logger.info(`webhook:booking: ${JSON.stringify(payload)}`)
      const event = await this.provider().runEvent(payload)
      if (event.action === 'created') {
        const personalBadge = {
          identifier: event.person.email,
          identifier_type: 'email',
          code: event.person.uuid,
        }
        await this.provider().generatePersonalBadge(personalBadge)
        const response = await hubAddReserve(event, {
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
                code: personalBadge.code,
                booking: event.uuid,
              },
            },
          },
        })
        if (response.count > 0) {
          const [object] = response.objects
          const external_id = object['region.reserve'].id
          this.persist()
            .booking()
            .save({
              uuid: event.uuid,
              external_id,
              payload: JSON.stringify(response),
              created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
              updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
            })
        }
        return
      }

      if (event.action === 'deleted') {
        const booking = await this.persist().booking().query().where('uuid', event.uuid).first()
        if (booking) {
          await hubCancelReserve(event.place.uuid, booking.external_id)
          await this.persist().booking().delete(event.uuid)
        }
      }
    })
  }
}
