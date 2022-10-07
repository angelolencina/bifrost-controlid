export const beginDay = (date: string) => {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
}
export const endDay = (date: string) => {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
}
