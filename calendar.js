import dotenv from 'dotenv'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import fs from 'node:fs'

dotenv.config()

const clientSecret = await JSON.parse(fs.readFileSync(process.env.GOOGLE_OAUTH_KEYS))
const googleToken = await JSON.parse(fs.readFileSync(process.env.GOOGLE_TOKEN))
const calendarId = process.env.GOOGLE_CALENDAR_ID

const oauth2Client = new OAuth2Client(
  clientSecret.client_id,
  clientSecret.client_secret,
  clientSecret.redirect_uris[0]
)

oauth2Client.setCredentials({
  access_token: googleToken.access_token,
  refresh_token: googleToken.refresh_token
})

const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
})

async function createCalendarEvent (
  title, startDate, endDate
) {
  const calendarEvent = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: title,
      start: { date: `${startDate}` },
      end: { date: `${endDate}` }
    },
    sendUpdates: 'all'
  })
  console.log(`Event created: ${calendarEvent.data.htmlLink}`)
  return calendarEvent
}

async function getAllCalendars () {
  const calendarList = await calendar.calendarList.list()
  return calendarList.data.items
}

async function updateCalendarEvent (
  title, startDate, endDate, gCalevent
) {
  const requestBody = {}
  if (title) requestBody.summary = title
  if (startDate) requestBody.start = { date: `${startDate}` }
  if (endDate) requestBody.end = { date: `${endDate}` }
  const updatedCalendarEvent = await calendar.events.patch({
    calendarId: gCalevent.creator.email,
    eventId: gCalevent.id,
    requestBody,
    sendUpdates: 'all'
  })
  console.log(`Event updated: ${updatedCalendarEvent.data.htmlLink}`)
  return updatedCalendarEvent
}

async function deleteCalendarEvent (gCalevent) {
  const deletedCalendarEvent = await calendar.events.delete({
    calendarId: gCalevent.creator.email,
    eventId: gCalevent.id,
    sendUpdates: 'all'
  })
  console.log(`Event deleted: ${gCalevent.summary}`)
  return deletedCalendarEvent
}

export default {
  getAllCalendars, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent
}
