import axios, { AxiosResponse } from "axios"
import YAML from "yaml"
import { config } from ".."
import ProductConfig from "./productconfig"


export type Webhook = {
  id: string
  name: string
  avatar: string
  token: string
}

export default class Webhooks {

  private static readonly API_BASE = 'https://discord.com/api/v10'

  public static async fetchWebhooks(channel: string, retry = true): Promise<Webhook[] | null> {
    const res = await Webhooks.makeRequest('GET', `/channels/${channel}/webhooks`)

    if (res.status === 403)
      throw new Error('Missing Permissions!')

    if (res.status >= 400 && res.status < 500)
      return null

    if (res.status >= 200 && res.status < 300)
      return res.data

    if (retry)
      return await this.fetchWebhooks(channel, false)

    return undefined
  }

  public static async createWebhook(channel: string, retry = true): Promise<Webhook | null> {
    const payload = {
      name: config.webhookDefaultName,
      avatar: config.webhookDefaultAvatar ?? undefined
    }

    const res = await Webhooks.makeRequest('POST', `/channels/${channel}/webhooks`, payload)

    if (res.status === 403)
      throw new Error('Missing Permissions!')

    if (res.status === 400 && res.data?.code === 30007)
      throw new Error('Max number of Webhooks reached!')

    if (res.status >= 400 && res.status < 500)
      return null

    if (res.status >= 200 && res.status < 300)
      return res.data

    if (retry)
      return await this.createWebhook(channel, false)

    return undefined
  }

  private static makeRequest(method: 'GET' | 'POST', url: string, payload?: any): Promise<AxiosResponse> {
    return axios({
      method,
      url,
      data: payload,
      validateStatus: null,
      baseURL: Webhooks.API_BASE,
      headers: {
        'Authorization': `Bot ${config.discordBotToken}`,
        'User-Agent': 'deployman (https://maanex.me/, 1.0)'
      }
    })
  }

  /*
   * 
   */

  public static async sendDataToChannel(channel: string, data: any) {
    try {
      const mapping = ProductConfig.getParsed().webhooks ?? {}
      if (mapping[channel]) {
        const success = await Webhooks.sendToWebhookId(mapping[channel], data)
        if (success) return
      }

      const hooks = await Webhooks.fetchWebhooks(channel)
      if (hooks?.length) {
        Webhooks.writeMapping(channel, hooks[0])

        const success = await Webhooks.sendToWebhookId(`${hooks[0].id}/${hooks[0].token}`, data)
        if (success) return
      }

      const hook = await Webhooks.createWebhook(channel)
      if (!hook) throw new Error('Could not create webhook.')

      Webhooks.writeMapping(channel, hook)

      const success = await Webhooks.sendToWebhookId(`${hook.id}/${hook.token}`, data)
      if (success) return
    } catch (ex) {
      console.error(ex)
    }
  }

  private static async sendToWebhookId(id: string, data: any): Promise<boolean> {
    const res = await Webhooks.makeRequest('POST', `/webhooks/${id}`, data)
    if (res.status >= 200 && res.status <= 299) return true
    if (res.status === 404) return false
    throw new Error(`Webhook failed. Http ${res.status}: ${res.statusText}`)
  }

  private static writeMapping(channel: string, hook: Webhook) {
    const config = ProductConfig.getParsed(true)
    if (!config.webhooks) config.webhooks = {}
    config.webhooks[channel] = `${hook.id}/${hook.token}`
    ProductConfig.put(YAML.stringify(config))
  }

}
