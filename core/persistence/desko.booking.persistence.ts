import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class DeskoBookingPersistence {
  public async save(event) {
    const exists = await Database.from('bookings')
      .where('uuid', event.uuid)
      .select('id')
      .limit(1)
      .first()

    if (exists) {
      return await Database.from('bookings').where('uuid', event.uuid).update(event)
    }

    return await Database.table('bookings').insert(event)
  }

  public async delete(event) {
    return await Database.from('bookings').where('uuid', event.uuid).delete()
  }

  public async setSync(uuid: string): Promise<void> {
    await Database.from('bookings')
      .where('uuid', uuid)
      .update({
        sync_date: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
      })
  }

  public query() {
    return Database.from('bookings')
  }
}
