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

  async getPeers (ip, port) {
    try {
      // Assume api port is one above p2p
      // better implementation is needed
      // in future.
      let apiPort = +port + 1

      let res = await axios.get('http://' + ip + ':' + apiPort + '/peers/connected',
        {
          timeout: process.env.TIMEOUT
        })

      console.info('[peers] checked for ' + ip + ':' + apiPort)
      return res.data.peers
    } catch (err) {
      console.error('[peers] ' + err.message)
      return []
    }
  }

  async getStatus (ip, port) {
    try {
      // Assume api port is one above p2p
      // better implementation is needed
      // in future.
      let apiPort = +port + 1

      let res = await axios.get('http://' + ip + ':' + apiPort + '/node/status',
        {
          timeout: process.env.TIMEOUT
        })

      console.info('[status] checked ' + ip + ':' + apiPort)
      return res.data
    } catch (err) {
      console.error('[status] ' + err.message)
      return []
    }
  }

  // Assume api port is one above p2p
  // better implementation is needed
  // in future.
  async checkPort (ip, port) {
    let apiPort = +port + 1

    let status = {
      ip: ip,
      port: port,
      p2p: false,
      api: false
    }

    // Scan p2p port
    await portscanner.checkPortStatus(port, ip)
      .then(function (res) {
        if (res.toString() === 'open') {
          status.p2p = true
        } else {
          status.p2p = false
        }
      })
      .catch(function (err) {
        status.p2p = false
        console.error('[port]' + err.message)
      })

    // Scan api port
    await portscanner.checkPortStatus(apiPort, ip)
      .then(function (res) {
        if (res.toString() === 'open') {
          status.api = true
        } else {
          status.api = false
        }
      })
      .catch(function (err) {
        status.api = false
        console.error('[port]' + err.message)
      })
    return status
  }

  async locateNode (ip) {
    try {
      let res = await geoIP.lookup(ip)

      console.info('[geo] checked for ' + ip)
      return res
    } catch (err) {
      let data = {
        country: null,
        region: null,
        city: null,
        coordinates: null
      }

      console.error('[geo] ' + err.message)
      return data
    }
  }
}
module.exports = Network
