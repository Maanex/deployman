import Cordo, { GuildData } from "cordo"
import { config } from "."
import express from 'express'
import Logger from "./lib/logger"
import ProductConfig from "./lib/productconfig"
import { postGithubWebhook } from "./web/routes/github"


export default class Modules {

  public static loadProductConfig() {
    ProductConfig.load()
  }

  public static initCordo() {
    Cordo.init({
      botId: config.discordClientId,
      contextPath: [ __dirname, 'interactions' ],
      botAdmins: (id: string) => false,
      texts: {
        interaction_not_owned_title: '=interaction_not_owned_1',
        interaction_not_owned_description: '=interaction_not_owned_2',
        interaction_not_permitted_title: '=interaction_not_permitted_1',
        interaction_not_permitted_description_generic: '=interaction_not_permitted_2_generic',
        interaction_not_permitted_description_bot_admin: '=interaction_not_permitted_2_bot_admin',
        interaction_not_permitted_description_guild_admin: '=interaction_not_permitted_2_admin',
        interaction_not_permitted_description_manage_server: '=interaction_not_permitted_2_manage_server',
        interaction_not_permitted_description_manage_messages: '=interaction_not_permitted_2_manage_messages',
        interaction_failed: 'We are very sorry but an error occured while processing your command. Please try again.',
        interaction_invalid_description: 'Huh',
        interaction_invalid_title: 'That is odd. You should not be able to run this command...'
      }
    })
  }

  public static startServer() {
    const app = express()
    app.set('trust proxy', 1)

    app.use('/discord/interactions', Cordo.useWithExpress(config.discordPublicKey))

    app.post('/github/webhook', express.json(), postGithubWebhook)

    app.listen(config.port, undefined, () => {
      Logger.process(`Server launched at port ${config.port}`)
    })
  }

}
