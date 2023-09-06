import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import { eventTypeIdToText } from '../interfaces/type-event-controlid'

export default class DeskoEntryRecordPersistence {
  public async save(eventControlId) {
    const now = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
    await Database.table('entry_records').insert({
      name: eventTypeIdToText(eventControlId),
      created_at: now,
      updated_at: now,
    })
  }

  public async lastPassRecord(eventControlId): Promise<any> {
    return this.query()
      .where('name', eventTypeIdToText(eventControlId))
      .orderBy('created_at', 'desc')
      .first()
  }

  public async getDatetimeLastRecord(eventControlId): Promise<string> {
    const lastFiveMinutes = DateTime.local().minus({ minutes: 5 }).toFormat('yyyy-MM-dd HH:mm:ss')
    const lastRecord = await this.query()
      .where('name', eventTypeIdToText(eventControlId))
      .orderBy('created_at', 'desc')
      .first()
    return lastRecord ? lastRecord.created_at : lastFiveMinutes
  }

  public query() {
    return Database.from('entry_records')
  }
}
