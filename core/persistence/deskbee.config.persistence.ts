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
  public async save(token: string): Promise<void> {
    const credential: TCredential = {
      grant_type: 'client_credentials',
      client_id: Env.get('DESKBEE_API_CLIENT_ID'),
      client_secret: Env.get('DESKBEE_API_CLIENT_SECRET'),
      scope: Env.get('DESKBEE_API_SCOPE'),
    }
    const token_expires_in = DateTime.local().plus({ hours: 18 }).toFormat('yyyy-MM-dd HH:mm:ss')
    console.log('SAVING TOKEN ', {
      token,
      credential: JSON.stringify(credential),
      token_expires_in,
    })
    return Database.transaction(async (trx) => {
      await trx
        .insertQuery()
        .table('configurations')
        .insert({ account: this.ACCOUNT, token, credential, token_expires_in })
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

  public async setToken(newToken: string): Promise<void> {
    const exists = await Database.from('configurations')
      .where('account', this.ACCOUNT)
      .select('id')
      .first()
    console.log('EXISTS', exists)

    if (exists) {
      console.log('UPDATE TOKEN', {
        token: newToken,
        token_expires_in: DateTime.local().plus({ hours: 10 }).toFormat('yyyy-MM-dd HH:mm:ss'),
      })
      return Database.transaction(async (trx) => {
        await trx
          .from('configurations')
          .where('account', this.ACCOUNT)
          .update({
            token: newToken,
            token_expires_in: DateTime.local().plus({ hours: 10 }).toFormat('yyyy-MM-dd HH:mm:ss'),
            updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
          })
      })
    } else {
      this.save(newToken)
    }
  }

  public async getToken(): Promise<string | null> {
    const dataToken = await Database.from('configurations')
      .where('account', this.ACCOUNT)
      .select('token', 'token_expires_in')
      .where('token_expires_in', '>=', DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'))
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
