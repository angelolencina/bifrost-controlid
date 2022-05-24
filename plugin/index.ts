import DeskoCore from '../core/desko.core'
import { getPluginControl } from './common/get-control-plugin'
export default class Plugin extends DeskoCore implements DeskoPlugin {
  constructor(private controlPlugin: any) {
    super()
    this.controlPlugin = getPluginControl()
  }

  public init() {
    if (this.controlPlugin) {
      this.controlPlugin.init()
    }
  }
}
