import { CheckInOutDto } from '../dto/desko.check-in-out.dto'
import { PersonalBadgeDto } from '../dto/desko.personal-badge.dto'
import { findOneBooking, checkinByUser, registerPersonalBadge } from '../../apis/deskbee.api'

export default class DeskoApiService {
  public async getBooking(uuid): Promise<object | boolean> {
    return findOneBooking(uuid)
  }

  public async sendPersonalBadge(personalBadgeDto: PersonalBadgeDto[]): Promise<any> {
    return registerPersonalBadge(personalBadgeDto)
  }

  public async sendDeviceEvent(events: CheckInOutDto[]) {
    return checkinByUser(events)
  }
}
