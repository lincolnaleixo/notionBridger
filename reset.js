import fs from 'node:fs'

const LINK_DATABASE = './db/link.json'
const ADMIN_DATABASE = './db/admin.json'

await fs.writeFileSync(
  LINK_DATABASE,
  JSON.stringify(
    [],
    null,
    2
  )
)

const defaultAdminJSON = { lastSynced: '' }

await fs.writeFileSync(
  ADMIN_DATABASE,
  JSON.stringify(
    defaultAdminJSON,
    null,
    2
  )
)
