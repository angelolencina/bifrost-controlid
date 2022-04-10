import { DateTime } from 'luxon'
export const isToday = (event) => {
  return DateTime.fromJSDate(event.start_date).ordinal == DateTime.now().ordinal
}
