import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
const crypto = require('crypto')

export default class HubSignature {
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    // console.log(request.header('x-hub-signature'))
    // console.log(request.raw())

    const hmac = crypto.createHmac('SHA256', Env.get('SIGNATURE'))

    if (request.header('x-hub-signature') !== hmac.update(request.raw()).digest('hex')) {
      return response.status(404)
    }

    await next()
  }
}
