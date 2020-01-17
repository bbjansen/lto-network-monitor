// Copyright (c) 2020, BB. Jansen
//
// Please see the included LICENSE file for more information.
'use strict'

const axios = require('axios')
const geoIP = require('geoip-lite')
const portscanner = require('portscanner')

class Network {
  constructor (opts) {
    opts = opts || {}
  }

  async getPeers (address) {
    try {

      let nodeIP = address.split(':')[0]
      let nodePort = +address.split(':')[1] + 1
      let res = await axios.get('http://' + nodeIP + ':' + nodePort + '/peers/all',
      {
        timeout: process.env.TIMEOUT
      })
      
      console.info('[peers] checked for ' + address)
      return res.data.peers
    } catch (err) {
      console.error('[peers] ' + err.message)
      return []
    }
  }

  async getStatus (address) {
    try {

      let nodeIP = address.split(':')[0]
      let nodePort = +address.split(':')[1] + 1
      let res = await axios.get('http://' + nodeIP + ':' + nodePort + '/node/status',
      {
        timeout: process.env.TIMEOUT
      })
      
      console.info('[status] checked for ' + address)
      return res.data

    } catch (err) {
      console.error('[status] ' + err.message)
      return []
    }
  }

  async checkPort (address) {
    let nodeIP = address.split(':')[0]
    let p2pPort = +address.split(':')[1]
    let apiPort = +address.split(':')[1] + 1
    
    let status = {
      address: address,
      p2p: false,
      api: false
    }
  
    // Scan p2p port
    await portscanner.checkPortStatus(p2pPort, nodeIP)
    .then(function(res) {

      if(res.toString() === 'open') {
        status.p2p = true
      } else {
        status.p2p = false
      }
    })
    .catch(function(err) {
        status.p2p = false
        console.error('[port]' + err.message)
    })

    // Scan api port
    await portscanner.checkPortStatus(apiPort, nodeIP)
    .then(function(res) {

      if(res.toString() === 'open') {
        status.api = true
      } else {
        status.api = false
      }
    })
    .catch(function(err) {
        status.api = false
        console.error('[port]' + err.message)
    })
    return status
  }

  async locateNode (address) {
    try {
      let nodeIP = address.split(':')[0]
      let res = await geoIP.lookup(nodeIP)

      console.info('[geo] checked for ' + address)
      return res
    } catch (err) {
      console.error('[geo] ' + err.message)
      return []
    }
  }
}

module.exports = Network
