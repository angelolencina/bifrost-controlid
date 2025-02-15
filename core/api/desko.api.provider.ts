/* eslint-disable @typescript-eslint/naming-convention */
import DeskoEventDto from '../dto/desko.event.dto'
import DeskoPersonDto from '../dto/desko.person.dto'
import DeskoBookingDto from '../dto/desko.booking.dto'
import DeskoPlaceDto from '../dto/desko.place.dto'
import DeskoApiService from './desko.api.service'
import DeskoBuildingDto from '../dto/desko.building.dto'
import DeskoFloorDto from '../dto/desko.floor.dto'
import Logger from '@ioc:Adonis/Core/Logger'
import { CheckInOutDto } from '../dto/desko.check-in-out.dto'
import { PersonalBadgeDto } from '../dto/desko.personal-badge.dto'

export default class DeskoApiProvider {
  // Ocupação Andamento
  public readonly STATE_BUSY = 'busy'
  // Reserva Válida
  public readonly STATE_RESERVED = 'reserved'
  // Aguardando Aprovação
  public readonly STATE_WAITING_APPROVAL = 'waiting'
  // Reserva Rejeitada
  public readonly STATE_REJECTED = 'rejected'
  // Reserva Expirada (caiu reserva)
  public readonly STATE_FALL = 'fall'
  // Ocupação Encerrada (checkout realizado)
  public readonly STATE_LAST = 'last'
  // ocupacao cancelada
  public readonly STATE_CANCELED = 'canceled'

  public readonly ACTION_CREATED = 'create'
  public readonly ACTION_DELETED = 'deleted'

  private resource: any
  private payload: any
  private event: string
  private service: DeskoApiService

  constructor() {
    this.service = new DeskoApiService()
  }

  public async runEvent(payload: DeskoEventDto): Promise<any> {
    this.resource = payload.resource
    this.event = payload.event

    Logger.info(`event: ${JSON.stringify(payload)}`)
    return this.setEventContent()
  }

  public async setEventContent() {
    if (this.event === 'booking') {
      try {
        this.payload = await this.service.getBooking(this.resource.uuid)
        return this.getEventBooking()
      } catch (error) {
        return 'error'
      }
    }
    if (this.event === 'checkin') {
      return {
        action: this.getAction(),
        uuid: this.resource.uuid,
      }
    }
  }

  public setDateBytolerance(date: string, tolerance: number) {
    let newDate = new Date(date)
    newDate.setMinutes(newDate.getMinutes() - tolerance)
    return newDate
  }

  public getEventBooking(): DeskoBookingDto {
    const tolerance = this.payload?.min_tolerance || 15
    return {
      uuid: this.payload.uuid,
      start_date: new Date(this.payload.start_date),
      end_date: new Date(this.payload.end_date),
      end_checkin: this.setDateBytolerance(this.payload.end_date, tolerance),
      start_checkin: this.setDateBytolerance(this.payload.start_date, tolerance),
      state: this.getState(),
      action: this.getAction(),
      person: this.getPerson(),
      place: this.getPlace(),
      floor: this.getFloor(),
      building: this.getBuilding(),
      tolerance: tolerance,
      created_at: new Date(this.payload.created_at),
      updated_at: new Date(this.payload.updated_at),
      deleted_at: this.payload.deleted_at ? new Date(this.payload.deleted_at) : null,
    }
  }

  public getAction(): string {
    return this.resource.action
  }

  public getEventType(): string {
    return this.event
  }

  public automateCheckin(events: CheckInOutDto[]) {
    return this.service.sendDeviceEvent(events)
  }

  public getPerson(): DeskoPersonDto {
    return {
      uuid: this.payload.person.uuid,
      name: this.payload.person.name,
      name_display: this.payload.person.name_display,
      email: this.payload.person.email,
      enrollment: this.payload.person.enrollment,
      created_at: this.payload.person.created_at,
      updated_at: this.payload.person.updated_at,
    }
  }

  public getState(): string {
    return {
      busy: this.STATE_BUSY,
      reserved: this.STATE_RESERVED,
      waiting: this.STATE_WAITING_APPROVAL,
      rejected: this.STATE_REJECTED,
      fall: this.STATE_FALL,
      last: this.STATE_LAST,
      canceled: this.STATE_CANCELED,
    }[this.payload.state]
  }

  public getPlace(): DeskoPlaceDto {
    return {
      uuid: this.payload.place.uuid,
      qrcode: this.payload.place.qrcode,
      type: this.payload.place.type,
      name: this.payload.place.name,
      name_display: this.payload.place.name_display,
      capacity: this.payload.place.capacity,
      sector: this.payload.place.sector,
      created_at: this.payload.place.created_at,
      updated_at: this.payload.place.updated_at,
    }
  }

  public getBuilding(): DeskoBuildingDto {
    return {
      uuid: this.payload.place.area.building.uuid,
      name: this.payload.place.area.building.name,
      address: this.payload.place.area.building.address,
      is_active: this.payload.place.area.building.is_active,
    }
  }

  public getFloor(): DeskoFloorDto {
    return {
      uuid: this.payload.place.area.floor.uuid,
      name: this.payload.place.area.floor.name,
      is_active: this.payload.place.area.floor.is_active,
    }
  }

  public async generatePersonalBadge(
    personalBadgeDto: PersonalBadgeDto
  ): Promise<PersonalBadgeDto> {
    Logger.info(`generatePersonalBadge: ${JSON.stringify(personalBadgeDto)}`)
    return this.service
      .sendPersonalBadge([personalBadgeDto])
      .then((res) => res[0])
      .catch((err) => {
        Logger.error(`generatePersonalBadge: ${JSON.stringify(err)}`)
        throw new Error(`Error Send PersonalBadge`)
      })
  }
}
