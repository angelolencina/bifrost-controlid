import DeskoPersonDto from './desko.person.dto'
import DeskoPlaceDto from './desko.place.dto'
import DeskoFloorDto from './desko.floor.dto'
import DeskoBuildingDto from './desko.building.dto'
export default interface DeskoBookingDto {
  uuid: string
  start_date: Date
  end_date: Date
  state: string
  action: string
  person: DeskoPersonDto
  place: DeskoPlaceDto
  floor: DeskoFloorDto
  building: DeskoBuildingDto
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  tolerance?: number
}
