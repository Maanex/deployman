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
    try {
      this.unsafeUpdateContainerByName(name)
    } catch (ex) {
      console.error('updateContainerByName failed fatal')
      console.error(ex)
    }
  }

  private static async unsafeUpdateContainerByName(name: string) {
    const list = await DockerInterface.client.listServices({
      Filters: {
        name: [ name ]
      }
    })
    if (!list.length) {
      console.error(`Task update container '${name}' failed. No such container found.`)
      return
    }

    const item = list.find(i => i.Spec.Name === name)
    if (!item) {
      console.error(`Task update container '${name}' failed. No such container found.`)
      return
    }

    const image = (item.Spec.TaskTemplate as any).ContainerSpec.Image.split('@')[0]
    console.log('image', image)

    // const auth = config.registryAuth ? {
    //   username: config.registryAuth.split(':')[0],
    //   password: config.registryAuth.split(':')[1]
    // } : {} as any
    const auth = config.registryAuth
    console.log('config', config)
    console.log('auth', auth)

    const debugProgress = (e: any) => console.log(e)

    const debug = await DockerInterface.client.pull(image, (err, stream) => {
      DockerInterface.client.modem.followProgress(stream, dat => DockerInterface.updatePullFinished(dat, item), debugProgress)
      // @ts-ignore
    }, { key: auth })
    console.log(debug)
    // const debug = await DockerInterface.client.pull(image, {
    //   // registryconfig: auth,
    //   // authconfig: auth
    //   authconfig: {
    //     key: auth
    //   }
    // })
    // console.log(debug)
  }

  private static async updatePullFinished(data: any, item: any) {
    console.log('data')
    console.log(data)
    console.log('data')

    await DockerInterface.client.getService(item.ID).remove()

    // wait for container to stop fully
    await new Promise((res) => setTimeout(res, 8000))

    await DockerInterface.client.createService({
      ...item.Spec,
      // authconfig: auth,
      // // @ts-ignore
      // registryconfig: auth
    })
    console.log('deploy done')
  }

}
