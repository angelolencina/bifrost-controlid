import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import { PersonalBadgeDto } from '../core/dto/desko.personal-badge.dto'
import { CheckInOutDto } from '../core/dto/desko.check-in-out.dto'
import * as https from 'https'
import DeskbeeConfigPersistence from '../core/persistence/deskbee.config.persistence'

const baseURL = Env.get('DESKO_API_URL')
export const apiDeskbee = axios.create({
  baseURL,
  headers: { 'Content-Type': `application/json; charset=UTF-8` },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
})

const configuration = new DeskbeeConfigPersistence()

apiDeskbee.interceptors.request.use(
  async (config) => {
    let token = await configuration.getToken()
    if (!token) {
      console.log('getBearerToken dont have token in time')
      token = await getBearerToken()
      configuration.setToken(token)
    }
    config.headers['Authorization'] = `Bearer ${token}`
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

const getBearerToken = () => {
  return axios
    .post(
      `${baseURL}/v1.1/oauth/token`,
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
    .then((res) => res.data.access_token)
}

export const findOneBooking = (uuid) => {
  return apiDeskbee
    .get(`/v1.1/bookings/${uuid}?include=checkin;min_tolerance;image;documents`)
    .then((res) => res.data.data)
    .catch((e) => {
      console.log('ERROR', e)
      throw new Error(`Error GetBooking: ${e.message}`)
    })
}

export const registerPersonalBadge = (personalBadgeDto: PersonalBadgeDto[]): Promise<any> => {
  return apiDeskbee
    .post(`/v1.1/integrations/personal-badge`, personalBadgeDto)
    .then((res) => res.data.data)
    .catch((e) => {
      console.log('ERROR', e)
      throw new Error(`Error Send PersonalBadge: ${e.message}`)
    })
}

export const checkinByUser = (events: CheckInOutDto[]) => {
  return apiDeskbee
    .post(`/v1.1/integrations/checkin`, events)
    .then((res) => {
      if (events?.length > 0) {
        console.log(res.data)
        console.log(
          `Deskbee eventos de checkin enviados com sucesso: ${events?.length || 0} eventos ${
            events[0]?.person || ''
          } `
        )
      }
    })
    .catch((e) => {
      console.error('Erro ao enviar checkin para deskbee', e)
      throw new Error(`Erro ao enviar eventos de checkin: ${e.message}`)
    })
}
