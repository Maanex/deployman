/* eslint-disable no-console */
const axios = require('axios')
const config = require('../config.js')

if (!config) throw new Error('Config not found. Please cd into /scripts')

const token = config.discordBotToken || ''
const clientid = config.discordClientId || ''

const commands = [
  {
    name: 'config',
    description: 'Edit the deployman config'
  }
]

async function run(remove = true, add = true, whitelist) {
  const opts = {
    headers: { Authorization: `Bot ${token}` }
  }

  const { data } = await axios.get(`https://discord.com/api/v8/applications/${clientid}/commands`, opts)

  if (remove) {
    await Promise.all(data
      .filter(d => !whitelist || whitelist.includes(d.name))
      .map(d => axios.delete(`https://discord.com/api/v8/applications/${clientid}/commands/${d.id}`, opts))
    )
  }

  let delay = 0
  if (add) {
    for (const command of commands) {
      if (whitelist && !whitelist.includes(command.name)) continue
      setTimeout(() => {
        axios
          .post(`https://discord.com/api/v8/applications/${clientid}/commands`, command, opts)
          .catch(err => console.error(err.response.status, command.name, JSON.stringify(err.response.data, null, 2)))
        console.log('Registered command %s', command.name)
      }, delay += 1000)
    }
    setTimeout(() => console.log('Done.'), delay + 100)
  }
}
run(false, true)
