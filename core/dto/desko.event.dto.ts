export default interface DeskoEventDto {
  subscription_id: string
  transaction_id: string
  send_at: string
  event: string
  resource: {
    action: string
    route: string
    uuid: string
  }
}
