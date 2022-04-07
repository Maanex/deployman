import { ComponentType, MessageComponent, ModalSubmitInteraction, ReplyableComponentInteraction } from 'cordo'
import ProductConfig from '../../lib/productconfig'


function polyfillGetSubmission(name: string, components: MessageComponent[]): string {
  for (const comp of components) {
    if ((comp as any).type === ComponentType.ROW) {
      const res = polyfillGetSubmission(name, (comp as any).components)
      if (res) return res
    }
    if ((comp as any).custom_id === name)
      return (comp as any).value
  }
  return undefined
}

export default function (i: ReplyableComponentInteraction) {
  const data = polyfillGetSubmission('config', (<unknown>i as ModalSubmitInteraction).data.components)
  ProductConfig.put(data)
  i.replyPrivately({ content: 'Changes saved!' })
}
