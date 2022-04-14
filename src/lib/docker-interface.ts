import Docker from 'dockerode'
import { config } from '..'


export type FsContainer = {
  id: string
  role: string
  imageName: string
  imageId: string
  labels: Record<string, string>
  state: string
  networkName: string
  networkIp: string
}

// https://docs.docker.com/engine/api/v1.27/
export default class DockerInterface {

  private static client: Docker

  public static connect() {
    DockerInterface.client = new Docker()
  }

  public static async updateContainerByName(name: string) {
    const list = await DockerInterface.client.listServices({
      Filters: {
        name: [ name ]
      }
    })
    if (!list.length) {
      console.error(`Task update container '${name}' failed. No such container found.`)
      return
    }

    const item = list[0]
    const itemId = item.ID
    const image = (item.Spec.TaskTemplate as any).ContainerSpec.Image

    const auth = config.registryAuth ? {
      username: config.registryAuth.split(':')[0],
      password: config.registryAuth.split(':')[1]
    } : {} as any

    // await DockerInterface.client.pull(image, {
    //   registryconfig: auth,
    //   authconfig: auth
    // })

    await DockerInterface.client.getService(itemId).remove()

    await DockerInterface.client.createService({
      ...item,
      authconfig: auth,
      // @ts-ignore
      registryconfig: auth
    })
  }

}
