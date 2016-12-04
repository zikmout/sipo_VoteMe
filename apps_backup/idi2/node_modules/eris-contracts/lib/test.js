'use strict'

const erisContracts = require('..')
const I = require('iteray')
const Promise = require('bluebird')
const R = require('ramda')
const Solidity = require('solc')
const stream = require('stream')
const test = require('eris-db/lib/test')

const observer = (asyncIterable) => R.pipe(
  I.map((event) => JSON.stringify(event, null, 2) + '\n\n'),
  I.to(stream.Readable)
)(asyncIterable).pipe(process.stderr)

const newContractManager = (name, options) =>
  Promise.all([
    test.newBlockchain(name, options),
    test.privateValidator(name)
  ]).spread((url, validator) =>
    erisContracts.newContractManagerDev(url, {
      address: validator.address,
      pubKey: validator.pub_key,
      privKey: validator.priv_key
    }, {observer: process.env.DEBUG ? observer : I.sink})
  )

const compile = (contractManager, source, name) => {
  const compiled = Solidity.compile(source, 1).contracts[name]
  const abi = JSON.parse(compiled.interface)
  const contractFactory = contractManager.newContractFactory(abi)

  return Promise.fromCallback((callback) =>
    contractFactory.new({data: compiled.bytecode}, callback)
  )
}

module.exports = {
  newContractManager,
  compile,
  observer
}
