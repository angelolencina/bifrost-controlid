import DeskoBookingPersistence from './persistence/desko.booking.persistence'
import DeskoEntryRecordPersistence from './persistence/desko.entry-record.pesistence'

export default class DeskoPersistence {
  public booking() {
    return new DeskoBookingPersistence()
  }

  public entryRecord() {
    return new DeskoEntryRecordPersistence()
  }
}
