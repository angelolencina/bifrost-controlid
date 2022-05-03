import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddExternaIdToBookings extends BaseSchema {
  protected tableName = 'bookings'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('external_id', 100).index()
      table.json('payload')
      table.timestamp('deleted_at', { useTz: true })
    })
  }

  public async down () {}
}
