'use strict'

const childProcess = require('mz/child_process')
const ErisDb = require('../')
const fs = require('mz/fs')
const httpRequest = require('request-promise')
const I = require('iteray')
const Promise = require('bluebird')
const R = require('ramda')
const untildify = require('untildify')
const url = require('url')
const WebSocket = require('ws')

const exec = R.composeP(R.trim, R.head, childProcess.exec)

const intervalAsyncIterable = (delay) => {
  let lastOutput = Date.now()

  return I.AsyncQueue((push) =>
    setTimeout(() => {
      lastOutput = Date.now()

      push(Promise.resolve({
        done: false,
        value: lastOutput
      }))
    }, delay - (Date.now() - lastOutput))
  )
}

const poll = R.curry((action, interval) => {
  const asyncIterator = I.to('Iterator', R.pipe(
    I.map(() => Promise.try(action)),
    I.pull
  )(interval))

  const next = () =>
    asyncIterator.next().catch(next)

  return next().then(R.prop('value'))
})

const privateValidator = (name) =>
  fs.readFile(untildify(`~/.eris/chains/${name}/priv_validator.json`))
    .then(JSON.parse)

const dockerMachineIp = () =>
  exec('docker-machine ip $(docker-machine active)').catch(() => 'localhost')

const blockchainUrl = (protocol, name) => {
  const portPromise = exec(`
    id=$(eris chains inspect ${name} Id)
    docker inspect --format='{{(index (index .NetworkSettings.Ports "1337` +
      `/tcp") 0).HostPort}}' $id
  `)

  return Promise.all([dockerMachineIp(), portPromise])
    .spread((hostname, port) => url.format({
      protocol,
      slashes: true,
      hostname,
      port,
      pathname: protocol === 'ws:' ? '/socketrpc' : '/rpc'
    })
  )
}

const webSocketIsAvailable = (url) =>
  poll(() =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url)

      socket.once('open', () => {
        socket.close()
        resolve()
      })

      socket.once('error', reject)
    }),
    intervalAsyncIterable(100)
  ).then(() => url)

const httpIsAvailable = (url) =>
  poll(() => httpRequest(url).catch((reason) => {
    if (reason.name === 'RequestError') {
      throw reason
    }
  }), intervalAsyncIterable(100)
  ).then(R.always(url))

const newBlockchain = (name, {protocol = 'ws:'} = {}) =>
  exec(`
    eris chains rm --data --force ${name}
    eris chains start --init-dir ~/.eris/chains/${name} --publish ${name}
  `, {env: R.assoc('ERIS_PULL_APPROVE', true, process.env)})
    .then(() => blockchainUrl(protocol, name))
    .then((url) => {
      console.log(`Created new blockchain at ${url}.`)
      return url
    })
    .then(protocol === 'ws:' ? webSocketIsAvailable : httpIsAvailable)

const observer = (asyncIterable) => R.pipe(
  I.map((event) => JSON.stringify(event, null, 2) + '\n\n'),
  I.toNodeStream
)(asyncIterable).pipe(process.stderr)

const newInstance = (name, options) =>
  newBlockchain(name, options).then((url) =>
    ErisDb.createInstance(url, {observer: process.env.DEBUG
      ? observer
      : I.sink
    })
  )

module.exports = {
  newBlockchain,
  newInstance,
  privateValidator
}
