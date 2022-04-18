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

export type HookRef = {
  mapping: string
  message: string
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
      throw new Error(res.status + ' ' + res.statusText + ' ' + JSON.stringify(res.data))

    if (res.status >= 200 && res.status < 300)
      return res.data

    if (retry)
      return await this.createWebhook(channel, false)

    return undefined
  }

  private static makeRequest(method: 'GET' | 'POST' | 'PATCH', url: string, payload?: any): Promise<AxiosResponse> {
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

  public static async sendDataToChannel(channel: string, data: any): Promise<HookRef> {
    try {
      const mappings = ProductConfig.getParsed().webhooks ?? {}
      if (mappings[channel]) {
        const message = await Webhooks.sendToWebhookId(mappings[channel], data)
        if (message) return { mapping: mappings[channel], message }
      }

      const hooks = await Webhooks.fetchWebhooks(channel)
      if (hooks?.length) {
        Webhooks.writeMapping(channel, hooks[0])

        const mapping = `${hooks[0].id}/${hooks[0].token}`
        const message = await Webhooks.sendToWebhookId(mapping, data)
        if (message) return { mapping, message }
      }

      const hook = await Webhooks.createWebhook(channel)
      if (!hook) throw new Error('Could not create webhook.')

      Webhooks.writeMapping(channel, hook)

      const mapping = `${hook.id}/${hook.token}`
      const message = await Webhooks.sendToWebhookId(mapping, data)
      if (message) return { mapping, message }
    } catch (ex) {
      console.error(ex)
      return null
    }
  }

  public static async editSentWebhook(hook: HookRef, data: any): Promise<string> {
    const res = await Webhooks.makeRequest('PATCH', `/webhooks/${hook.mapping}/messages/${hook.message}`, data)
    if (res.status >= 200 && res.status <= 299) return res.data?.id ?? ''
    if (res.status === 404) return ''
    throw new Error(`Webhook failed. Http ${res.status}: ${res.statusText}`)
  }

  private static async sendToWebhookId(id: string, data: any): Promise<string> {
    const res = await Webhooks.makeRequest('POST', `/webhooks/${id}?wait=true`, data)
    if (res.status >= 200 && res.status <= 299) return res.data?.id ?? ''
    if (res.status === 404) return ''
    throw new Error(`Webhook failed. Http ${res.status}: ${res.statusText}`)
  }

  private static writeMapping(channel: string, hook: Webhook) {
    const config = ProductConfig.getParsed(true)
    if (!config.webhooks) config.webhooks = {}
    config.webhooks[channel] = `${hook.id}/${hook.token}`
    ProductConfig.put(YAML.stringify(config))
  }

}
