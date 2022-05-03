import axios from 'axios'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'

export const apiAmiHub = axios.create({
  baseURL: 'https://alpha.ami-hub.com/api', headers: {
    'Content-Type': `application/json; charset=UTF-8`,
    'Authorization': `Bearer ${Env.get('TOKEN_AMI_HUB')}`,
   }
});

export const hubAddTouchDisplay = (event, payload)=>{
  Logger.info(`hubAddTouchDisplay: ${JSON.stringify(payload)}`)
  return apiAmiHub.post(`/region/${event.place.uuid}/reserve`, payload)
  .then(res => res.data.payload)
  .catch(e => {
    Logger.info(`Error hubAddTouchDisplay  : ${e.message} (${e.response.status}))`)
    Logger.info(`Payload: ${JSON.stringify(e.response.data)}`)
    throw new Error(`Error hubAddTouchDisplay`)
  })
}

export const hubCancelTouchDisplay = (eventPlaceId, bookingExternalId) => {
  Logger.info(`hubCancelTouchDisplay: ${eventPlaceId}, ${bookingExternalId}`)
  apiAmiHub.delete(`/region/${eventPlaceId}/reserve/${bookingExternalId}`)
  .catch(e => {
    Logger.info(`Error hubCancelTouchDisplay  : ${e.message} (${e.response.status}))`)
    Logger.info(`Payload: ${JSON.stringify(e.response.data)}`)
    throw new Error(`Error hubCancelTouchDisplay`)
  })
}

export const hubOpenGate = (placeUuid:string) => {
  Logger.info(`hubOpenGate : ${placeUuid}`)
  return apiAmiHub.post(`gate/${placeUuid}/open`)
  .catch(e => {
    Logger.info(`Error hubOpenGate  : ${e.message} (${e.response.status}))`)
    Logger.info(`Payload: ${JSON.stringify(e.response.data)}`)
    throw new Error(`Error hubOpenGate`)
  })
}






