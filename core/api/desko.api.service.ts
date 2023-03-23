import { CheckInOutDto } from '../dto/desko.check-in-out.dto'
import { PersonalBadgeDto } from '../dto/desko.personal-badge.dto'
import { findOneBooking, checkinByUser, registerPersonalBadge } from '../../apis/deskbee.api'
import Env from '@ioc:Adonis/Core/Env'

export default class DeskoApiService {
  public async getBooking(uuid): Promise<object | boolean> {
    const emailsOnHomologation = this.getEmailsHomologation()
     const booking = await findOneBooking(uuid)
     if(emailsOnHomologation && Array.isArray(emailsOnHomologation)){
          console.warn("Homologação de controle de acesso está ativa")
          if(emailsOnHomologation?.includes(booking?.person?.email?.toLowerCase())){
            console.warn(`Email ${booking?.person?.email?.toLowerCase()} ESTÁ dentro da homologação - Controle de acesso ATIVADO`)
            return booking
          }
          console.warn(`Email ${booking?.person?.email?.toLowerCase()} NÃO ESTÁ dentro da homologação - Controle de acesso DESATIVADO`)
          return false

     }
    return booking
  }

  public async sendPersonalBadge(personalBadgeDto: PersonalBadgeDto[]): Promise<any> {
    return registerPersonalBadge(personalBadgeDto)
  }

  public async sendDeviceEvent(events: CheckInOutDto[]) {
    return checkinByUser(events)
  }
  private getEmailsHomologation(): string[] | boolean{
    if(Env.get('NODE_ENV').toLowerCase() === 'homologation'){
      const emails = Env.get('EMAIL_USERS_HOMOLOGATION')
      return emails ? emails.toLowerCase().split(',') : []
    }

    return false

  }
}
