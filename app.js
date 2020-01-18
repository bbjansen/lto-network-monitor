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

// Seed Node Config

const seedNode = {
  address: process.env.SEED_NODE,
  ip: process.env.SEED_NODE.split(':')[0],
  port: process.env.SEED_NODE.split(':')[1],
  name: 'LTO Services',
  app: 'ltoL',
  version: '1.1.0'
}

// Start
init(seedNode)

// Init
async function init(seedNode) {
  await db.createTables()

  // Check for patient zero

  if(!seedNode.address) {

    console.error('no seed node address specified in .env [ip:port]')
    return

  } else {

    const checkSeed = await db.selectNode(seedNode.address)
    if(checkSeed.length <= 0) {

      await db.insertNode(seedNode.address, seedNode)

      console.info('[seed] set as ' + seedNode.address)
    } else {
      console.info('[seed] using ' + seedNode.address)
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
    let getPeers = await network.getPeers(node.ip, node.port)

    // Store peer nodes, let sql handle duplicates
    getPeers.map(async peer => {
      console.log(peer.declaredAddress.slice(1))
      await db.insertNode(peer.declaredAddress.slice(1), {
        ip: peer.address.slice(1).split(':')[0],
        port: peer.address.split(':')[1],
        name: peer.peerName,
        app: peer.applicationName,
        version: peer.applicationVersion
      })
    })
  })
}

async function pingNodes() {
  // Get all stored nodes
  let knownNodes = await db.selectNodes()

  // check status for each stored node
  knownNodes.map(async node => {

    let getStatus = await network.getStatus(node.ip, node.port)
    
    await db.updateStatus(node.address, getStatus)
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

    let geoData = await network.locateNode(node.ip)

    await db.updateGeo(node.address, geoData)
  })
}

