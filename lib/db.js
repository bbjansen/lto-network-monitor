// Copyright (c) 2020, BB. Jansen
//
// Please see the included LICENSE file for more information.
'use strict'

const db = require('../utils/knex')

class DB {
  constructor (opts) {
    opts = opts || {}
  }

  // Create tables
  async createTables () {
    try {

        // Nodes Table
        if (!(await db.schema.hasTable('nodes'))) {
        
        await db.schema.createTable('nodes', function (table) {
          table.unique('address')
          table.string('address')
          table.string('ip')
          table.int('port')
          table.string('name')
          table.string('app')
          table.string('version')
          table.bigint('updated')
          table.bigint('created')
        })

        console.info('[db] created table `nodes`')
      }

      // Status Table
      if (!(await db.schema.hasTable('status'))) {

        await db.schema.createTable('status', function (table) {
          table.unique('address')
          table.string('address')
          table.bigint('height')
          table.int('p2p')
          table.int('api')
          table.string('uptime')
          table.bigint('updated')
        })

        console.info('[db] created table `status`')
      }

      // Geo Table
      if (!(await db.schema.hasTable('geo'))) {
        await db.schema.createTable('geo', function (table) {
          table.unique('address')
          table.string('address')
          table.string('country')
          table.string('region')
          table.string('city')
          table.jsonb('coordinates')
          table.bigint('updated')
        })

        console.info('[db] created table `geo`')
      }

      console.info('[db] ready')
      return

    } catch (err) {
      console.error('[db] ' + err.message)
      return
    }
  }

  // select a single node
  async selectNode (address) {
    try {

      let getNode = await db('nodes')
      .select()
      .where('address', address)
      .limit(1)

      if(getNode.length >= 1) {
        console.info('[db] selected ' + address)
        return getNode
      } else
      {
        console.info('[db] no nodes found')
        return getNode
      }
    } catch (err) {
      console.error('[db] ' + err.message)
      return []
    }
  }

  // select multaddressle nodes with range (optional)
  async selectNodes (range) {
    try {
      let getNodes

      // select all if no range is specified
      if (!range) {

        getNodes = await db('nodes').select()

      } else {

        getNodes = await db('nodes')
          .select()
          .where('seen', '<', range)
      }

      console.info('[db] selected ' + getNodes.length + ' nodes')
      return getNodes

    } catch (err) {
      console.error('[db] ' + err.message)
      return []
    }
  }

  // Insert Node and related status and geo table
  async insertNode (address, data) {
    try {

      // Insert Node
      const insertNode = await db('nodes')
      .insert({
        address: address,
        ip: data.ip,
        port: data.port,
        name: data.name,
        app: data.app,
        version: data.version,
        updated: Date.now(),
        created: Date.now()
      })

      // Insert Status
      await db('status')
      .insert({
        address: address,
        height: null,
        p2p: null,
        api: null,
        uptime: '111111111111111111111111',
        updated: Date.now()
      })

      // Insert Geo
      await db('geo')
      .insert({
        address: address,
        country: null,
        region: null,
        city: null,
        coordinates: null,
        updated: Date.now()
      })

      console.info('[db] inserted ' + address)
      return insertNode

    } catch (err) {
      //console.error('[db] ' + err.message)
      return []
    }
  }

  // Update Node Status
  async updateStatus (address, data) {
    try {
      await db('status').update({
        height: data.stateHeight,
        updated: Date.now()
      })
      .where('address', address)
      .limit(1)

      console.info('[db] status updated for ' + address)
      
    } catch (err) {
      console.error('[db] ' + err.message)
    }
  }

  // Update Node Port
  async updatePort (address, data) {
    try {

      let uptime

      // determine avaibility by api port
      if(data.api === true) {
        uptime = db.raw('substr(uptime, 2, length(uptime)) || ?', ['1'])

      } else {
        uptime = db.raw('substr(uptime, 2, length(uptime)) || ?', ['0'])
      }
      
      await db('status').update({
        p2p: data.p2p,
        api: data.api,
        uptime: uptime,
        updated: Date.now()
      })
      .where('address', address)
      .limit(1)

      console.info('[db] ports updated for ' + address)
      
    } catch (err) {
      console.error('[db] ' + err.message)
    }
  }

  // Update Node Geo
  async updateGeo (address, data) {
    try {

      await db('geo').update({
        country: data.country,
        region: data.region,
        city: data.city,
        coordinates:JSON.stringify([data.ll[0], data.ll[1]]),
        updated: Date.now()
      })
      .where('address', address)
      .limit(1)

      console.info('[db] geo updated for ' +  address)
  
    } catch (err) {
      console.error('[db] ' + err.message)
    }
  }
}

module.exports = DB
