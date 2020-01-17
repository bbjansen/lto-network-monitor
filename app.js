// Copyright (c) 2020, BB. Jansen
//
// Please see the included LICENSE file for more information.

'use strict'

// Load .env
require('dotenv').config()

// Setup logger
require('console-stamp')(console, {
  pattern: 'dd/mm/yyyy HH:MM:ss.l',
  colors: {
      stamp: 'green',
      label: 'white',
  }
})

// Load Libraries
const cron = require('node-cron')
const DB = require('./lib/db')
const Network = require('./lib/network')
const db = new DB()
const network = new Network()

// Start
init()

// Init
async function init() {
  await db.createTables()

  // Check for patient zero
  let seedNode = process.env.SEED_NODE

  if(!seedNode) {

    console.error('no seed node address specified in .env [ip:port]')
    return

  } else {

    const checkSeed = await db.selectNode(seedNode)

    if(checkSeed.length <= 0) {
      await db.insertNode(seedNode, Date.now())
      console.info('[seed] set as ' + seedNode)
    } else {
      console.info('[seed] using ' + seedNode)
    }
  }

  // Set cron jobs
  cron.schedule(process.env.CRON_DISCOVER || '*/15 * * * *', () => {
    discoverNodes()
  })

  cron.schedule(process.env.CRON_PING || '0 0 * * *', () => {
    pingNodes()
  })

  cron.schedule(process.env.CRON_SCAN || '0 0 * * *', () => {
    scanNodes()
  })

  cron.schedule(process.env.CRON_LOCATE || '0 0 * * 0', () => {
    locateNodes()
  })
}

// Discover nodes in the network
async function discoverNodes() {
  // Get all stored nodes that have been last seen 24 hours +
  let knownNodes = await db.selectNodes()

  // collect peer node for each stored node
  knownNodes.map(async node => {
    let getPeers = await network.getPeers(node.address)

    // Store peer nodes, let sql handle duplicates
    getPeers.map(async node => {
      await db.insertNode(node.address.slice(1), { lastSeen: node.lastSeen })
    })
  })
}

async function pingNodes() {
  // Get all stored nodes
  let knownNodes = await db.selectNodes()

  // check status for each stored node
  knownNodes.map(async node => {

    let nodestatus = await network.getStatus(node.address)
    await db.updatePing(node.address, nodestatus)
  })
}

async function scanNodes() {
  // Get all stored nodes that have been last seen 24 hours +
  let knownNodes = await db.selectNodes()

  // check ports for each stored node
  knownNodes.map(async node => {

    let portStatus = await network.checkPort(node.address)
    await db.updatePort(node.address, portStatus)
  })
}

async function locateNodes() {
  // Get all stored nodes
  let knownNodes = await db.selectNodes()

  // check status for each stored node
  knownNodes.map(async node => {

    let geoData = await network.locateNode(node.address)

    await db.updateGeo(node.address, geoData)
  })
}

