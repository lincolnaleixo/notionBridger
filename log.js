import fs from 'node:fs'

const logFile = process.env.LOG_FILE
const today = new Date()
  .toISOString()
  .split('T')[0]

async function addNewLog (message) {
  fs.appendFileSync(
    logFile,
    `${today}: ${message}\n`
  )
}

export default { addNewLog }
