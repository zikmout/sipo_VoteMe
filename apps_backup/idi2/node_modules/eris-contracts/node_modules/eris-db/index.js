/**
 * @file index.js
 * @fileOverview Index file for the eris-db javascript API. This file contains a factory method
 * for creating a new <tt>ErisDB</tt> instance.
 * @author Andreas Olofsson (andreas@erisindustries.com)
 * @module index
 */
'use strict';

var erisdb = require('./lib/erisdb');
const server = require('./lib/server')
var validation = require('./lib/validation');
var url = require('url');


/**
 * ErisDB allows you to do remote calls to a running erisdb-tendermint client.
 *
 * @param {string} URL The RPC endpoint URL.
 * @returns {module:erisdb-ErisDB}
 */
exports.createInstance = function(URL, options){
  if (url.parse(URL).protocol === 'ws:') {
    throw new Error('WebSocket is disabled until Eris DB complies with ' +
      'JSON-RPC.  See: https://github.com/eris-ltd/eris-db/issues/355')
  } else {
    var client;
    if(!URL || typeof(URL) !== "string" || URL === ""){
        URL = 'http://localhost:1337/rpc';
    }
    var validator = new validation.SinglePolicyValidator(true);
    return erisdb.createInstance(server(URL, options), validator);
  }
};
