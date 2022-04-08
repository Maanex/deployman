import { Request, Response } from 'express'
import GithubEvents from '../../app/github-events'


// let i = 0
export async function postGithubWebhook(req: Request, res: Response) {
  // const filename = new Date().toLocaleTimeString().replace(/\W/g, '-') + '.' + req.body.action + '.' + (++i % 10) + '.json'
  // require('fs').writeFileSync('./logs/' + filename, JSON.stringify(req.body, null, 2))
  GithubEvents.emitEvent(req.body)

  res.status(200).end()
}