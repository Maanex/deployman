import { InteractionMember } from "cordo"


export default class AuthGate {

  public static canEditConfig(member: InteractionMember): boolean {
    if (!member) return false

    return member.user.id === '137258778092503042' // TODO
  }

}
