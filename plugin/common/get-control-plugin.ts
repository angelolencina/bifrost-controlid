import Env from '@ioc:Adonis/Core/Env'
import AmiHubPlugin from '../ami-hub.plugin'
import BioStarPlugin from '../biostar.plugin'
import ControlidPlugin from '../controlId.plugin'
import Logger from '@ioc:Adonis/Core/Logger'

export const getPluginControl = () => {
  switch (Env.get('PLUGIN')) {
    case 'biostar':
      Logger.info('Plugin: biostar')
      return new BioStarPlugin()
    case 'controlid':
      Logger.info('Plugin: controlid')
      return new ControlidPlugin()
    case 'amiHub':
      Logger.info('Plugin: amiHub')
      return new AmiHubPlugin()
    default:
      throw new Error('Plugin not found:')
  }
}
