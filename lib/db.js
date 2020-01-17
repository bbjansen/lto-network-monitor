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
          table.increments()
          table.unique('address')
          table.string('address')
          table.bigint('seen')
          table.bigint('updated')
          table.bigint('created')
        })

        console.info('[db] created table `nodes`')
      }

      // Status Table
      if (!(await db.schema.hasTable('status'))) {

        await db.schema.createTable('status', function (table) {
          table.increments()
          table.unique('address')
          table.string('address')
          table.bigint('height')
          table.int('p2p')
          table.int('api')
          table.bigint('uptime')
          table.bigint('updated')
        })

        console.info('[db] created table `status`')
      }

      // Geo Table
      if (!(await db.schema.hasTable('geo'))) {
        await db.schema.createTable('geo', function (table) {
          table.increments()
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
      .count('id as count')
      .where('address', address)
      .limit(1)

        console.log('[db] selected ' + address)
        return getNode[0]
    
    } catch (err) {
      console.error('[db] selected' + err.message)
      return []
    }
  }

  // select multiple nodes with range (optional)
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
  async insertNode (data) {
    try {

      // Insert Node
      const insertNode = await db.raw(db('nodes')
      .insert({
        address: data.address.slice(1),
        seen: data.lastSeen,
        updated: Date.now(),
        created: Date.now()
      }).toString().replace(/^insert/i, 'insert or ignore'))

      // Insert Status
      await db('status')
      .insert({
        address: data.address.slice(1),
        p2p: 0,
        api: 0,
        uptime: 0,
        updated: Date.now()
      })

      // Insert Geo
      await db('geo')
      .insert({
        address: data.address.slice(1),
        country: null,
        region: null,
        city: null,
        coordinates: null,
        updated: Date.now()
      })

      console.info('[db] inserted - ' + address)
      return insertNode

    } catch (err) {
      //console.error('[db] ' + err.message)
      return []
    }
  }

  // Update Node Status Table
  async updatePing (address, data) {
    try {
      await db('status').update({
        height: data.blockchainHeight,
        uptime: true,
        updated: Date.now()
      })
      .where('address', address)
      .limit(1)

      console.info('[db] ping updated for ' + address)
      
    } catch (err) {
      console.log('[status] ' + err.message)
    }
  }

  // Update Node Port
  async updatePort (address, data) {
    try {
      await db('status').update({
        p2p: data.p2p,
        api: data.p2p,
        updated: Date.now()
      })
      .where('address', address)
      .limit(1)

      console.info('[db] ports updated for ' + address)
      
    } catch (err) {
      console.log('[db] ' + err.message)
    }
  }

  // Update Node Geo
  async updateGeo (address, data) {
    try {

      await db('geo').update({
        country: data.country,
        region: data.region,
        city: data.city,
        coordinates: data.ll,
        updated: Date.now()
      })
      .where('address', address)
      .limit(1)

      console.info('[db] geo updated for ' + address)
  
    } catch (err) {
      console.log('[db] ' + err.message)
    }
  }
}

module.exports = DB
