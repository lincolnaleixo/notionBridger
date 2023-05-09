import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
import fs from 'node:fs'

dotenv.config()

const notionToken = await JSON.parse(fs.readFileSync(process.env.NOTION_TOKEN))
const notion = new Client({ auth: notionToken.token })

async function getDbItems (databaseId) {
  const dbItems = await notion.databases.query({ database_id: databaseId })
  return dbItems
}

async function getDbItem (itemId) {
  const dbItem = await notion.pages.retrieve({ page_id: itemId })
  return dbItem
}

export default {
  getDbItems, getDbItem
}
