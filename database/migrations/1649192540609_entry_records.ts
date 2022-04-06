import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EntryRecords extends BaseSchema {
  protected tableName = 'entry_records'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 50).index()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).defaultTo(new Date().toISOString())
      table.timestamp('updated_at', { useTz: true }).defaultTo(new Date().toISOString())
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
