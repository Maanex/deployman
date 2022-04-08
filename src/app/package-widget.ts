import Webhooks from "../lib/webhooks"
import { GithubEvent } from "./github-events"


export default class PackageWidget {

  public static async createWidget(channel: string, event: GithubEvent) {
    const name = event.registry_package?.name
    if (!name) return

    const payload = PackageWidget.buildWidget(event)
    Webhooks.sendDataToChannel(channel, payload)
  }

  //

  private static buildWidget(event: GithubEvent) {
    console.log(event)
    return {
      content: 'Gamers be gaming'
    }
  }

}
