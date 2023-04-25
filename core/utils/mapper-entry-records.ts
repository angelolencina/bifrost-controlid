import { CheckInOutDto } from '../dto/desko.check-in-out.dto'

export const parseEntryRecords = (entryRecords: any) => {
  const records: CheckInOutDto[] = []
  console.log('Entry Records Input ==> ', entryRecords)
  if (entryRecords?.length) {
    for (const record of entryRecords) {
      records.push({
        device: record.deviceName,
        person: record.email,
        date: record.time,
        entrance: 1,
      })
    }
  } else {
    console.log('Entry Records Empty ==> ', records)
  }

  return records
}
