import DeskoCore from '../core/desko.core'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import { hubAddTouchDisplay, hubCancelTouchDisplay, hubOpenGate } from '../apis/amihub.api'

export default class AmiHubPlugin extends DeskoCore implements DeskoPlugin {

  public async init() {

    this.webhook('checkin', (payload) => {
      Logger.info(`webhook:checkin: ${JSON.stringify(payload)}`)
      if (payload.included && payload.included.place_type === 'locker') {
        hubOpenGate(payload.included.place_uuid)
      }
    })

    this.webhook('booking', async (payload) => {
      Logger.info(`webhook:booking: ${JSON.stringify(payload)}`)

      const event = await this.provider().runEvent(payload)
      if (event.place.type !== 'meetingroom') {
        return
      }

      if (event.action === 'created') {
        const personalBadge = {
          identifier: event.person.email,
          identifier_type: 'email',
          code: event.person.uuid
        }
        await this.provider().generatePersonalBadge(personalBadge)
        const response = await hubAddTouchDisplay(event, {
          'region.reserve': {
            schedule: {
              start: event.start_date,
              end: event.end_date,
              tolerance: event.tolerance,
              host: {
                type: 'guest',
                name: event.person.name,
                code: personalBadge.code,
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
          await hubCancelTouchDisplay(event.place.uuid, booking.external_id)
          await this.persist().booking().delete(event.uuid)
        }
      }
    })
  }
}
