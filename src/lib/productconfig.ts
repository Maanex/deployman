import * as fs from 'fs'
import YAML from 'yaml'
import { config } from '..'
import { Rule, RuleOverride } from '../app/rules'


export type ProductConfigType = {
  default: RuleOverride
  rules: Rule[]
  /** channelid -> webhook identifier */
  webhooks: Record<string, string>
}


export default class ProductConfig {

  private static parsed: ProductConfigType = null
  private static raw: string = null

  public static load(data?: string) {
    const raw = data ?? fs.readFileSync(config.productConfigPath)
    ProductConfig.raw = raw.toString()
    ProductConfig.parsed = YAML.parse(raw.toString())
  }

  public static getParsed(fresh = false): ProductConfigType {
    if (fresh) ProductConfig.load()
    return ProductConfig.parsed
  }

  public static getRaw(fresh = false): string {
    if (fresh) ProductConfig.load()
    return ProductConfig.raw
  }

  public static put(configYaml: string) {
    fs.writeFileSync(config.productConfigPath, configYaml)
    ProductConfig.load(configYaml)
  }

}
