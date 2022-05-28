import axios from 'axios'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'

export const apiAmiHub = axios.create({
  baseURL: 'https://alpha.ami-hub.com/api',
  headers: {
    'Content-Type': `application/json; charset=UTF-8`,
    'Authorization': `Bearer ${Env.get('TOKEN_AMI_HUB')}`,
  },
})

export const hubAddReserve = (placeUuid, payload) => {
  Logger.info(`hubAddReserve: ${JSON.stringify(payload)}`)
  return apiAmiHub
    .post(`/region/${placeUuid}/reserve`, payload)
    .then((res) => {
      if (res?.data?.payload?.objects) {
        const reserve = res.data.payload.objects[0]['region.reserve']
        const response = res.data.payload
        return [reserve, response]
      }
      return []
    })
    .catch((e) => {
      Logger.info(`Error hubAddReserve  : ${e.message} (${e.response.status}))`)
      Logger.info(`Payload: ${JSON.stringify(e.response.data)}`)
      throw new Error(`Error hubAddReserve`)
    })
}

export const hubCancelReserve = async (event, bookingExternalId) => {
  Logger.info(`hubCancelReserve: ${event.place.uuid}, ${bookingExternalId}`)
  apiAmiHub.delete(`/region/${event.place.uuid}/reserve/${bookingExternalId}`).catch((e) => {
    Logger.info(`Error hubCancelTouchDisplay  : ${e.message} (${e.response.status}))`)
    Logger.info(`Payload: ${JSON.stringify(e.response.data)}`)
    throw new Error(`Error hubCancelTouchDisplay`)
  })
}

export const hubOpenGate = (placeUuid: string, bookingUuid?: string) => {
  Logger.info(`hubOpenGate : ${placeUuid}`)

  if (bookingUuid) {
    apiAmiHub.defaults.headers['booking-uuid'] = bookingUuid
  }
  return apiAmiHub.post(`gate/${placeUuid}/open`).catch((e) => {
    Logger.info(`Error hubOpenGate  : ${e.message} (${e.response.status}))`)
    Logger.info(`Payload: ${JSON.stringify(e.response.data)}`)
    throw new Error(`Error hubOpenGate`)
  })
}
