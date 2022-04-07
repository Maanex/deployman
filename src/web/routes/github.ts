import { Request, Response } from 'express'
import GithubEvents from '../../app/github-events'


export async function postGithubWebhook(req: Request, res: Response) {
  // const filename = new Date().toLocaleTimeString().replace(/\W/g, '-') + '.' + req.body.action + '.json'
  // require('fs').writeFileSync('./logs/' + filename, JSON.stringify(req.body, null, 2))
  GithubEvents.emitEvent(req.body)

  res.status(200).end()
}