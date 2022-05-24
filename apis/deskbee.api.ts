import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { PersonalBadgeDto } from '../core/dto/desko.personal-badge.dto'
import { CheckInOutDto } from '../core/dto/desko.check-in-out.dto'

export const apiDeskbee = axios.create({
  baseURL: Env.get('DESKBEE_API_URL'),
  headers: { 'Content-Type': `application/json; charset=UTF-8` },
})

apiDeskbee.interceptors.request.use(
  async (config) => {
    config.headers['Authorization'] = await getBearerToken()
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

const getBearerToken = () => {
  return axios
    .post(
      `${Env.get('DESKBEE_API_URL')}/v1.1/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: Env.get('DESKBEE_API_CLIENT_ID'),
        client_secret: Env.get('DESKBEE_API_CLIENT_SECRET'),
        scope: Env.get('DESKBEE_API_SCOPE'),
      },
      {
        headers: { 'Content-Type': `application/json; charset=UTF-8` },
      }
    )
    .then((res) => (res.data?.access_token ? `Bearer ${res.data.access_token}` : null))
    .catch((e) => {
      Logger.error(`Error getBearerToken ${e.response.statusText}: (${e.response.status})`)
      Logger.error(`Error getBearerToken ${e.response.config.ur}`)
      Logger.error(`Error getBearerToken ${JSON.stringify(e.response.data)}`)
      throw new Error(`Error get token: ${e.response.statusText} (${e.response.status})`)
    })
}

export const findOneBooking = (uuid) => {
  return apiDeskbee
    .get(`/v1.1/bookings/${uuid}?include=checkin;min_tolerance;image;documents`)
    .then((res) => res.data.data)
    .catch((e) => {
      Logger.error(`Error findOneBooking ${e.response.statusText}: (${e.response.status})`)
      Logger.error(`Error findOneBooking ${e.response.config.ur}`)
      Logger.error(`Error findOneBooking ${JSON.stringify(e.response.data)}`)
      throw new Error(`Error GetBooking: ${e.message}`)
    })
}

export const registerPersonalBadge = (personalBadgeDto: PersonalBadgeDto[]): Promise<any> => {
  return apiDeskbee
    .post(`/v1.1/integrations/personal-badge`, personalBadgeDto)
    .then((res) => res.data.data)
    .catch((e) => {
      Logger.error(`Error registerPersonalBadge ${e.response.statusText}: (${e.response.status})`)
      Logger.error(`Error registerPersonalBadge ${e.response.config.ur}`)
      Logger.error(`Error registerPersonalBadge ${JSON.stringify(e.response.data)}`)
      throw new Error(`Error Send PersonalBadge: ${e.message}`)
    })
}

export const checkinByUser = (events: CheckInOutDto[]) => {
  return apiDeskbee
    .post(`/v1.1/integrations/checkin`, events)
    .then((res) => res.data)
    .catch((e) => {
      Logger.error(`Error checkinByUser ${e.response.statusText}: (${e.response.status})`)
      Logger.error(`Error checkinByUser ${e.response.config.ur}`)
      Logger.error(`Error checkinByUser ${JSON.stringify(e.response.data)}`)
      throw new Error(`Erro ao enviar eventos de checkin: ${e.message}`)
    })
}
