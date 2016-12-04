'use strict'

const erisContracts = require('../..')
const I = require('iteray')
const Promise = require('bluebird')
const Solidity = require('solc')
const erisDbTest = require('eris-db/lib/test')
const test = require('../../lib/test')

const source = `
  contract Contract {
      event Event();

      function emit() {
          Event();
      }
  }
`

it('listens to an event from a contract', function (done) {
  this.timeout(60 * 1000)
  const name = 'blockchain'

  Promise.all([
    erisDbTest.newBlockchain(name, {protocol: 'http:'}),
    erisDbTest.privateValidator(name)
  ]).spread((url, validator) => {
    const manager = erisContracts.newContractManagerDev(url, {
      address: validator.address,
      pubKey: validator.pub_key,
      privKey: validator.priv_key
    }, {observer: process.env.DEBUG ? test.observer : I.sink})

    return test.compile(manager, source, 'Contract').then((contract) => {
      const readOnlyManager = erisContracts.newContractManagerDev(url, null, {
        observer: process.env.DEBUG ? test.observer : I.sink
      })

      const compiled = Solidity.compile(source, 1).contracts.Contract
      const abi = JSON.parse(compiled.interface)
      const contractFactory = readOnlyManager.newContractFactory(abi)

      return Promise.fromCallback((callback) =>
        contractFactory.at(contract.address, callback)
      ).then((readOnlyContract) => {
        readOnlyContract.Event.once((error, event) => {
          if (error) {
            done(error)
          } else {
            console.log('Received event', JSON.stringify(event, null, 2))
            done()
          }
        })

        contract.emit()
      })
    })
  }).catch(done)
})
