/* eslint-disable @typescript-eslint/naming-convention */
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'

type TCredential = {
  grant_type: string
  client_id: string
  client_secret: string
  scope: string
}

export default class DeskbeeConfigPersistence {
  public ACCOUNT = Env.get('ACCOUNT')
  public async save(credentials: TCredential) {
    const exists = await Database.from('configurations')
      .where('account', this.ACCOUNT)
      .select('id')
      .first()

    if (exists) {
      return Database.transaction(async (trx) => {
        await trx.from('configurations').where('account', this.ACCOUNT).update(credentials)
      })
    }

    return Database.transaction(async (trx) => {
      await trx.insertQuery().table('configurations').insert(credentials)
    })
  }

  public async delete(uuid: string): Promise<any> {
    return Database.transaction(async (trx) => {
      await trx
        .from('configurations')
        .where('uuid', uuid)
        .update({
          deleted_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'),
        })
    })
  }

  public async setToken(token: string | null): Promise<void> {
    if (!token) return
    return Database.transaction(async (trx) => {
      await trx
        .from('configurations')
        .where('account', this.ACCOUNT)
        .update({
          token,
          expires_in: DateTime.local().plus({ hours: 18 }).toFormat('yyyy-MM-dd HH:mm:s'),
        })
    })
  }

  public async getToken(): Promise<string | null> {
    const dataToken = await Database.from('configurations')
      .where('account', this.ACCOUNT)
      .select('token', 'expires_in')
      .where('expires_in', '>', DateTime.local().toFormat('yyyy-MM-dd HH:mm:s'))
      .first()
    return dataToken?.token || null
  }

  public async update(uuid: string, data: any) {
    await Database.from('configurations').where('uuid', uuid).update(data)
  }

  public query() {
    return Database.from('configurations')
  }
}
