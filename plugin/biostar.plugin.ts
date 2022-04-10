import DeskoCore from '../core/desko.core'
import Logger from '@ioc:Adonis/Core/Logger'
import { updateUserDateLimits } from '../apis/biostar.api';


export default class BioStarPlugin extends DeskoCore implements DeskoPlugin {
  public init() {}
  public async userAccessLimit({ email, start_date, end_date }) {
    Logger.info(`userAccessLimit: ${email} : ${start_date} : ${end_date}`)
    await updateUserDateLimits({ email, start_date, end_date })
  }

}
