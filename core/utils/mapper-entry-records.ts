import { CheckInOutDto } from "../dto/desko.check-in-out.dto"

export const  parseEntryRecords = (entryRecords: any[]) => {
  const records:CheckInOutDto[] = []
  for(const record of entryRecords) {
    records.push({
      device: record.deviceName,
      person: record.email,
      date: record.time,
      entrance: 1
    })
  }
  return records
}
