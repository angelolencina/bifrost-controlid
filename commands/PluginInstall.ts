import { BaseCommand } from '@adonisjs/core/build/standalone'
const GitUrlParse = require('git-url-parse')
const { execSync } = require('child_process')

export default class PluginInstall extends BaseCommand {
  public static commandName = 'plugin:install'
  public static description = 'install plugin from a github repository'
  public static settings = {
    loadApp: false,
    stayAlive: false,
  }

  public async run() {
    const url = await this.prompt.ask('Enter url github', {
      hint: 'git@github.com:deskbee/plugin-<nome plugin>.git',
      validate: (value) => {
        if (!value) {
          return 'Enter value'
        }

        let url = GitUrlParse(value)

        if (!url.git_suffix || url.source !== 'github.com') {
          return 'is not a valid repository'
        }

        return true
      },
    })

    const parseUrl = GitUrlParse(url)
    execSync(`git submodule add ${url} plugins/${parseUrl.name}`, {
      stdio: [0, 1, 2],
    })
  }
}
