import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { CheckInOutDto } from '../dto/desko.check-in-out.dto';
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
    ).catch((e)=>{
      throw new Error(`Error get token: ${e.response.statusText} (${e.response.status})`)
    })

    // XXX FIXME :: Tratar erros de acess token
    // result.status
    this.accessToken = result.data.access_token

    return this
  }

  public async api(method, path, payload = null) {
    try {
      await this.auth()
      const result = await axios({
        method: method,
        url: `${this.endpoint}/v1.1/${path}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `application/json; charset=UTF-8`,
        },
        data: payload
      })

      Logger.debug(`Result : ${result.statusText} (${result.status})`)
      Logger.debug(`Payload: ${JSON.stringify(result.data)}`)

      return result.data || null
    } catch (e) {
      Logger.error(`Error API ${e.response.statusText}: (${e.response.status})`)
      Logger.error(`Error API ${e.response.config.ur}`)
      Logger.error(`Error API ${JSON.stringify(e.response.data)}`)
    }
    return false
  }

  public async getBooking(uuid): Promise<object | boolean> {
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
      Logger.error(`Error API ${JSON.stringify(e)}`)
    }
    return false
  }

  public async sendDeviceEvent(events: CheckInOutDto[]) {
      await this.auth()
      return axios.post(`${this.endpoint}/v1.1/integrations/checkin`, events,{
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `application/json; charset=UTF-8`,
        }
      }).then(res=> res.data)
      .catch(e=>{
        Logger.error(`Error API ${JSON.stringify(e)}`)
        throw new Error(`Erro ao enviar eventos de checkin: ${e.message}`)
      })

  }
}
