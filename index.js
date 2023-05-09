import dotenv from 'dotenv'
import fs from 'node:fs'
import calendar from './calendar.js'
import link from './link.js'
import log from './log.js'
import notion from './notion.js'

dotenv.config()

const databaseId = process.env.NOTION_DATABASE_ID
const adminDatabaseLocation = process.env.ADMIN_DATABASE

async function main () {
  const adminDatabase = JSON.parse(fs.readFileSync(adminDatabaseLocation)
    .toString())
  if (adminDatabase.lastSynced === '') {
    console.log('First time sync')
    await syncProjectsToCalendar()
    adminDatabase.lastSynced = new Date()
      .toISOString()
    fs.writeFileSync(
      adminDatabaseLocation,
      JSON.stringify(
        adminDatabase,
        null,
        2
      )
    )
  } else {
    console.log('Not first time')
    await checkForModifications()
  }
}

async function syncProjectsToCalendar () {
  const notionDbItems = await notion.getDbItems(databaseId)

  const notionItems = notionDbItems.results.map((item) => {
    return {
      id: item.id,
      title: item.properties.Name.title[0].plain_text,
      start_date: item.properties['Start Date'].date.start,
      end_date: item.properties['End Date'].date.start,
      to_end_date: `${Math.round(item.properties['To End Date'].formula.number * 100)}%`
    }
  })

  for (let index = 0; index < notionItems.length; index++) {
    const notionItem = notionItems[index]
    const calendarEvent = await calendar.createCalendarEvent(
      `${notionItem.title} (${notionItem.to_end_date})`,
      notionItem.start_date,
      notionItem.end_date
    )
    await link.linkItems(
      notionItem,
      calendarEvent.data
    )
    await log.addNewLog(`Linked ${notionItem.id}|${notionItem.title} to ${calendarEvent.data.id}`)
  }
}

async function checkForModifications () {
  const links = await link.getLinks()
  for (let i = 0; i < links.length; i++) {
    const linkItem = links[i]
    const notionItem = linkItem.notionItem
    const notionItemData = await notion.getDbItem(notionItem.id)
    const gCalItem = linkItem.GCalItem

    // check if item got deleted on notion
    if (notionItemData.archived) {
      console.log('Item got deleted on notion, deleting calendar event')
      await calendar.deleteCalendarEvent(gCalItem)
      await link.deleteLink(linkItem.id)
      await log.addNewLog(`Deleted ${notionItem.id}|${notionItem.title} - ${gCalItem.id}`)
      continue
    }

    let newTitle = ''
    if ((`${notionItem.title} (${notionItem.to_end_date})`) !== (`${notionItemData.properties.Name.title[0].plain_text} (${Math.round(notionItemData.properties['To End Date'].formula.number * 100)}%)`)) {
      console.log('Title changed')
      newTitle = (`${notionItemData.properties.Name.title[0].plain_text} (${Math.round(notionItemData.properties['To End Date'].formula.number * 100)}%)`)
      notionItem.title = notionItemData.properties.Name.title[0].plain_text
    }
    let newStartDate = ''
    if (notionItem.start_date !== notionItemData.properties['Start Date'].date.start) {
      console.log('Start date changed')
      newStartDate = notionItemData.properties['Start Date'].date.start
      notionItem.start_date = newStartDate
    }
    let newEndDate = ''
    if (notionItem.end_date !== notionItemData.properties['End Date'].date.start) {
      console.log('End date changed')
      newEndDate = notionItemData.properties['End Date'].date.start
      notionItem.end_date = newEndDate
    }
    let newToEndDate = ''
    if (notionItem.to_end_date !== `${Math.round(notionItemData.properties['To End Date'].formula.number * 100)}%`) {
      console.log('To end date changed')
      newToEndDate = `${Math.round(notionItemData.properties['To End Date'].formula.number * 100)}%`
      notionItem.to_end_date = newToEndDate
    }

    if (newTitle !== '' || newStartDate !== '' || newEndDate !== '') {
      console.log('Updating calendar event')
      await calendar.updateCalendarEvent(
        newTitle,
        newStartDate,
        newEndDate,
        gCalItem
      )
      await link.updateLink(
        linkItem.id,
        notionItem,
        gCalItem
      )
      await log.addNewLog(`Updated ${notionItem.id}|${notionItem.title} - ${gCalItem.id}`)
    } else {
      console.log(`No changes on id: ${linkItem.id}`)
    }
  }
}

await main()
