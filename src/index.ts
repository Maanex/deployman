import { configjs } from './types/config'
export const config = require('../config.js') as configjs

//

import Logger from './lib/logger'
import Modules from './modules'


async function run() {
  Logger.log('Starting...')

  Modules.loadProductConfig()
  Modules.connectDockerInterface()
  Modules.initCordo()
  Modules.startServer()
}

run().catch((err) => {
  Logger.error('Error in main:')
  console.trace(err)
})
