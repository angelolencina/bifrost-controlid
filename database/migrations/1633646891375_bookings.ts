import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Bookings extends BaseSchema {
  protected tableName = 'bookings'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('action', 15).index()
      table.uuid('uuid').index()
      table.timestamp('sync_date', { useTz: true }).index()
      table.dateTime('start_date', { useTz: true }).index()
      table.dateTime('end_date', { useTz: true }).index()
      table.string('state', 20).index()
      table.json('person')
      table.json('place')
      table.json('floor')
      table.json('building')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
