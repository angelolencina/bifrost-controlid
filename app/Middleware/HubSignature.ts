import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
const crypto = require('crypto')

export default class HubSignature {
  public async handle({ request }: HttpContextContract, next: () => Promise<void>) {
    Logger.info('HubSignature: checking signature')
    const hmac = crypto.createHmac('SHA256', Env.get('SIGNATURE'))

    if (request.header('x-hub-signature') !== hmac.update(request.raw()).digest('hex')) {
      Logger.error('HubSignature: invalid signature')
    }

    await next()
  }
}
