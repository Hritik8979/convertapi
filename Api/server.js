const express = require('express')
const path = require('path')
const { createAllFolders } = require('./utils/folderUtils')
const convertRoute = require('./Routes/convertRoute')

const app = express()
const PORT = 4000

// Create required folders
createAllFolders()

app.use('/convert', convertRoute)

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`)
})
