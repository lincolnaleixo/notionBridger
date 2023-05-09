
import fs from 'node:fs'

const LINK_DATABASE = process.env.LINK_DATABASE

function generateUniqueId () {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  const id = `${timestamp}-${random}`
  return id
}

async function linkItems (
  notionItem, GCalItem
) {
  const linkDatabase = JSON.parse(fs.readFileSync(LINK_DATABASE)
    .toString())
  linkDatabase.push({
    id: generateUniqueId(), notionItem, GCalItem
  })
  fs.writeFileSync(
    LINK_DATABASE,
    JSON.stringify(
      linkDatabase,
      null,
      2
    )
  )
}

async function getLinks () {
  const linkDatabase = JSON.parse(fs.readFileSync(LINK_DATABASE)
    .toString())

  return linkDatabase
}

async function updateLink (
  linkId, notionItem, GCalItem
) {
  const linkDatabase = JSON.parse(fs.readFileSync(LINK_DATABASE)
    .toString())

  const linkIndex = linkDatabase.findIndex((link) => link.id === linkId)
  if (linkIndex === -1) {
    throw new Error(`Link with ID ${linkId} not found in database`)
  }

  linkDatabase[linkIndex].notionItem = notionItem
  linkDatabase[linkIndex].GCalItem = GCalItem

  fs.writeFileSync(
    LINK_DATABASE,
    JSON.stringify(
      linkDatabase,
      null,
      2
    )
  )
}

async function deleteLink (linkId) {
  const linkDatabase = JSON.parse(fs.readFileSync(LINK_DATABASE)
    .toString())

  const linkIndex = linkDatabase.findIndex((link) => link.id === linkId)
  if (linkIndex === -1) {
    throw new Error(`Link with ID ${linkId} not found in database`)
  }

  linkDatabase.splice(
    linkIndex,
    1
  )

  fs.writeFileSync(
    LINK_DATABASE,
    JSON.stringify(
      linkDatabase,
      null,
      2
    )
  )
}

export default {
  linkItems, getLinks, updateLink, deleteLink
}
