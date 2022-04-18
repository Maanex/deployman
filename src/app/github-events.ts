import Logger from "../lib/logger"
import Webhooks from "../lib/webhooks"
import PackageWidget from "./package-widget"
import Rules, { RuleMatch, RuleOverride } from "./rules"
import WorkflowWidget from "./workflow-widget"


export type GithubEvent = {
  action: 'requested' | 'created' | 'in_progress' | 'published' | 'completed'
  check_run?: {
    /** unique id */
    id: number
    /** workflow name */
    name: string
    html_url: string
    status: 'completed' | 'in_progress'
    conclusion: 'success' | 'failure'
    started_at: string
    completed_at: string | null
    output: {
      summary: string | null
    }
    check_suite: {
      head_branch: string
    }
  }
  registry_package?: {
    name: string
    namespace: string
    created_at: string
    package_version: {
      version: string
      target_commitish: string
      package_url
    }
  }
  repository: {
    name: string
    full_name: string
    owner: {
      login: string
      avatar_url: string
      html_url: string
    }
    html_url: string
  }
}

export default class GithubEvents {

  private static readonly allowedEvents: GithubEvent['action'][] = [ 'created', 'completed', 'published' ]

  public static emitEvent(event: GithubEvent) {
    if (!event.action) return
    if (!GithubEvents.allowedEvents.includes(event.action)) return

    Logger.debug(event.action)

    // check_run is a single workflow job     <- we are here
    // workflow_run is an entire workflow
    if (!event.check_run && !event.registry_package) return

    const candidate: RuleMatch = {
      repoPath: event.repository?.full_name ?? '',
      repoName: event.repository?.name ?? '',
      repoOwner: event.repository?.owner?.login ?? '',
      branchName: event.check_run?.check_suite?.head_branch
        ?? event.registry_package?.package_version?.target_commitish
        ?? '',
      workflowName: event.check_run?.name ?? ''
    }

    const overrides = Rules.getOverrideForRule(candidate)
    try {
      GithubEvents.actOnEvent(event, overrides)
    } catch (ex) {
      console.error(ex)
    }
  }

  private static actOnEvent(event: GithubEvent, overrides: RuleOverride) {
    switch (event.action) {
      case 'created':
      case 'completed':
        WorkflowWidget.createOrUpdateWidget(overrides.workflowAlerts, event)
        break;
      case 'published':
        PackageWidget.createWidget(overrides.builds, event, overrides.deployService)
        break;
    }
  }

}
