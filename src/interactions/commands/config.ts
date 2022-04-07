import { ComponentType, InteractionComponentFlag, ReplyableCommandInteraction, TextInputStyle } from 'cordo'
import CordoAPI from 'cordo/dist/api'
import AuthGate from '../../lib/authgate'
import ProductConfig from '../../lib/productconfig'


export default function (i: ReplyableCommandInteraction) {
  if (!AuthGate.canEditConfig(i.member))
    return i.replyPrivately({ content: 'No permission' })

  i.openModal({
    custom_id: CordoAPI.compileCustomId('config_submit', [ InteractionComponentFlag.ACCESS_EVERYONE ]),
    title: 'Edit config',
    components: [
      {
        type: ComponentType.TEXT,
        custom_id: 'config',
        style: TextInputStyle.PARAGRAPH,
        label: 'Config JSON',
        value: ProductConfig.getRaw(true),
        required: true
      }
    ]
  })
}
