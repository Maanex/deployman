import { ModalSubmitInteraction, ReplyableComponentInteraction } from 'cordo'
import DockerInterface from '../../lib/docker-interface'
import ProductConfig from '../../lib/productconfig'


export default function (i: ReplyableComponentInteraction) {
  const service = i.params.service.replace(/\+/g, '_')
  i.replyPrivately({ content: service })
  DockerInterface.updateContainerByName(service)
}
