import { ButtonStyle, ComponentType, InteractionComponentFlag } from "cordo"
import CordoAPI from "cordo/dist/api"
import Webhooks from "../lib/webhooks"
import { GithubEvent } from "./github-events"


export default class PackageWidget {

  public static async createWidget(channel: string, event: GithubEvent, deployService: string) {
    const name = event.registry_package?.name
    if (!name) return

    const payload = PackageWidget.buildWidget(event, deployService)
    Webhooks.sendDataToChannel(channel, payload)
  }

  //

  private static buildWidget(event: GithubEvent, deployService: string) {
    return {
      content: JSON.stringify(event).substring(0, 1980),
      components: deployService ? [
        {
          type: ComponentType.ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.SUCCESS,
              label: `Deploy ${deployService}`.substring(0, 49),
              custom_id: CordoAPI.compileCustomId(`deploy_${deployService.replace(/\_/g, '+')}`, [ InteractionComponentFlag.ACCESS_EVERYONE ])
            }
          ]
        }
      ] : []
    }
  }

}
