import axios from 'axios'
import { GetVisitorIdDto } from './dtos/get-visitor-id.dto'

export const apiEcktor = axios.create({
  baseURL: 'https://www.ecktor.com.br/api',
  headers: {
    'Content-Type': `application/json; charset=UTF-8`,
  },
})

export const getEmployeeId = (facilityId: number, documentNumber: string) => {
  return apiEcktor.get(`Usuarios/${facilityId}/${documentNumber}`)
}

export const getVisitorId = (visitorDto: GetVisitorIdDto) => {
  const {
    facilityId,
    hostDocumentNumber,
    host,
    visitor,
    visitorDocumentNumber,
    initialDate,
    finalDate,
    initialHour,
    finalHour,
    stay,
  } = visitorDto
  return apiEcktor.get(
    `Visitantes/${facilityId}/${hostDocumentNumber}/${host}/${visitor}/${visitorDocumentNumber}/${initialDate}/${finalDate}/${initialHour}/${finalHour}/${stay}`
  )
}

export const deleteVisitorBooking = (
  facilityId: number,
  visitorDocumentNumber: string,
  initialDate: string,
  initialHour: string
) => {
  return apiEcktor.get(
    `Usuarios/${facilityId}/${visitorDocumentNumber}/${initialDate}/${initialHour}`
  )
}
