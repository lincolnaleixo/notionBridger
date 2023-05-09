import dotenv from 'dotenv'
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import fs from 'node:fs'
import open from 'open'

dotenv.config()

async function main () {
  const clientSecret = JSON.parse(await fs.promises.readFile(process.env.GOOGLE_OAUTH_KEYS))

  const oauth2Client = new OAuth2Client(
    clientSecret.client_id,
    clientSecret.client_secret,
    clientSecret.redirect_uris[0]
  )

  // Generate authorization URL
  const scopes = ['https://www.googleapis.com/auth/calendar']
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' ')
  })

  await open(authUrl)

  // Set up express server to handle redirect
  const app = express()
  const port = process.env.PORT || 3000

  const server = app.listen(
    port,
    () => {}
  )

  app.get(
    '/',
    async (
      req, res
    ) => {
      try {
        const code = req.query.code

        if (!code) {
          res.status(400)
            .send('Missing authorization code')
          return
        }

        const { tokens } = await oauth2Client.getToken(code)
        fs.writeFile(
          './google_token.json',
          JSON.stringify(tokens),
          (err) => {
            if (err) {
              res.status(200)
                .send(`Error: ${err}`)
              throw err
            }
            res.status(200)
              .send('Tokens updated, you can close this tab now')
            server.close()
          }
        )
      } catch (error) {
        console.error(
          'Error getting tokens:',
          error
        )
        res.status(500)
          .send('Error getting tokens')
      }
    }
  )
}

main()
