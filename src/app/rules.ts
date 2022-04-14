import ProductConfig from "../lib/productconfig"


export type RuleMatch = {
  repoPath: string
  repoName: string
  repoOwner: string
  branchName: string
  workflowName: string
}

export type RuleOverride = {
  workflowAlerts?: string
  builds?: string
  deployService?: string
}

export type Rule = {
  name: string
  match: Partial<RuleMatch>
  override: Partial<RuleOverride>
}

type RuleWithSpecificity = [ Rule, number ]

export default class Rules {

  public static getOverrideForRule(rule: RuleMatch): RuleOverride {
    const matches = Rules
      .getMatchingRules(rule)
      .sort((a, b) => a[1] - b[1])

    matches.push([ {
      name: 'default',
      match: {},
      override: ProductConfig.getParsed().default
    }, 0 ])

    const out: RuleOverride = { }
    for (const [rule] of matches) {
      for (const key of Object.keys(rule.override)) {
        if (!out[key])
          out[key] = rule.override[key]
      }
    }

    return out
  }

  private static getMatchingRules(item: RuleMatch): RuleWithSpecificity[] {
    const out: RuleWithSpecificity[] = []
    let spec
    for (const rule of ProductConfig.getParsed().rules) {
      spec = Rules.doesRuleMatch(rule, item)
      if (spec)
        out.push([ rule, spec ])
    }
    return out
  }

  /**
   * 
   * @param rule The rule to match
   * @param item The item to compare
   * @returns 0 if no match, n if match with n being the specificity
   */
  private static doesRuleMatch(rule: Rule, item: RuleMatch): number {
    if (!rule.match) return 1

    for (const key of Object.keys(rule.match)) {
      if (!Rules.doesValueMatch(rule.match[key], item[key]))
        return 0
    }

    return Object.keys(rule.match).length + 1
  }

  private static doesValueMatch(rule: string, item: string): boolean {
    if (!rule) return true

    // TODO add wildcard support to rules
    return rule === item
  }

}
