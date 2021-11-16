import DeskoBookingPersistence from './persistence/desko.booking.persistence'

export default class DeskoPersistence {
  public booking() {
    return new DeskoBookingPersistence()
  }
}
