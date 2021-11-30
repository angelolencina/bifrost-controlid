import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
const axios = require('axios')

export default class DeskoApiService {
  private endpoint: string
  private accessToken: string | null

  constructor() {
    this.endpoint = Env.get('DESKO_API_URL')
    this.accessToken = null
  }

  private async auth(): Promise<DeskoApiService> {
    // tratar expires_in, para quando token expirar
    if (this.accessToken) {
      return this
    }

    const result = await axios.post(
      `${this.endpoint}/v1.1/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: Env.get('DESKO_API_CLIENT_ID'),
        client_secret: Env.get('DESKO_API_CLIENT_SECRET'),
        scope: Env.get('DESKO_API_SCOPE'),
      },
      {
        headers: { 'Content-Type': `application/json; charset=UTF-8` },
      }
    )

    // XXX FIXME :: Tratar erros de acess token
    // result.status
    this.accessToken = result.data.access_token

    return this
  }

  public async getBooking(uuid): Promise<object | boolean>  {
    try {
      await this.auth()
      const booking = await axios.get(`${this.endpoint}/v1.1/bookings/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `application/json; charset=UTF-8`,
        },
      })

      return booking.data.data

    } catch (e) {
      Logger.error(`Error API ${e.response.statusText}: (${e.response.status})`)
      Logger.error(`Error API ${e.response.config.ur}`)
      Logger.error(`Error API ${JSON.stringify(e.response.data)}`)
    }
    return false
  }
}
