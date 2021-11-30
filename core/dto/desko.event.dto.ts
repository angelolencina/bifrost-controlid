export default interface DeskoEventDto {
  subscription_id: string
  transaction_id: string
  send_at: string
  event: string
  included: any
  resource: {
    action: string
    route: string
    uuid: string
  }
}
