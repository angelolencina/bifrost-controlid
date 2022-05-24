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

  public async delete(uuid: string): Promise<void> {
    await Database.from('bookings').where('uuid', uuid).delete()
  }

  public async setSync(uuid: string): Promise<void> {
    await Database.from('bookings')
      .where('uuid', uuid)
      .update({
        sync_date: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
      })
  }

  public async findOne(uuid: string) {
    return Database.from('bookings').where('uuid', uuid).first()
  }

  public query() {
    return Database.from('bookings')
  }
}
