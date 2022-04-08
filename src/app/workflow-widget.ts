import Const from "../lib/const"
import Webhooks, { HookRef } from "../lib/webhooks"
import { GithubEvent } from "./github-events"


type Run = {
  id: number
  status: GithubEvent['action']
  hook?: HookRef
  events: GithubEvent[]
}

export default class WorkflowWidget {

  private static runs: Map<number, Run> = new Map()

  public static async createOrUpdateWidget(channel: string, event: GithubEvent) {
    const id = event.check_run?.id
    if (!id) return

    if (!WorkflowWidget.runs.has(id)) {
      WorkflowWidget.runs.set(id, { id, status: 'in_progress', events: [] })
    }

    const run = WorkflowWidget.runs.get(id)
    run.events.push(event)
    run.status = event.action
    const payload = WorkflowWidget.buildWidget(run)

    if (run.hook)
      Webhooks.editSentWebhook(run.hook, payload)
    else
      run.hook = await Webhooks.sendDataToChannel(channel, payload)

    if (event.action === 'completed')
      this.runs.delete(id)
  }

  //

  private static buildWidget(run: Run) {
    const generalInfo = `${run.events[0].repository.full_name}\n\n`

    if (run.status === 'created') {
      return {
        embeds: [
          {
            title: run.events[0].check_run.name,
            color: 0x2f3136,
            description: `${generalInfo}${Const.Emojis.loading} Workflow running...\n${Const.Emojis.nothing} [View on Github](${run.events[0].check_run.html_url})`
          }
        ]
      }
    } if (run.status === 'completed') {
      const lastEvent = run.events[run.events.length - 1]
      const start = new Date(lastEvent.check_run.started_at).getTime()
      const end = new Date(lastEvent.check_run.completed_at).getTime()
      const delta = end - start
      const deltaString = delta > 60000
        ? `${~~(delta / 60000)}m ${((~~((delta % 60000) / 100)) / 10)}s`
        : `${((~~(delta / 100)) / 10)}s`
      return {
        embeds: [
          {
            title: run.events[0].check_run.name,
            color: 0x2f3136,
            description: lastEvent.check_run.conclusion === 'success'
              ? `${generalInfo}${Const.Emojis.success} Workflow completed **successfully** in ${deltaString}\n`
                + `${Const.Emojis.nothing} [View on Github](${lastEvent.check_run.html_url})`
              : `${generalInfo}${Const.Emojis.failed} Workflow **failed** in ${deltaString}\n`
                + `${Const.Emojis.nothing} ${lastEvent.check_run.output.summary}\n`
                + `${Const.Emojis.nothing} [View on Github](${lastEvent.check_run.html_url})`
          }
        ]
      }
    } else {
      return {
        content: `An error occured, invalid status "${run.status}"`
      }
    }
  }

}
