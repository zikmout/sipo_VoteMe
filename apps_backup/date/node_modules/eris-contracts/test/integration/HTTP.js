'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const source = `
  contract SimpleStorage {
      uint storedData;

      function set(uint x) {
          storedData = x;
      }

      function get() constant returns (uint retVal) {
          return storedData;
      }
  }
`

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain', {protocol: 'http:'})
    .then((manager) =>
      test.compile(manager, source, 'SimpleStorage').then((contract) =>
        Promise.fromCallback((callback) =>
          contract.set(42, callback)
        ).then(() =>
          Promise.fromCallback((callback) =>
            contract.get(callback)
          )
        )
      ).then((value) => {
        assert.equal(value, 42)
      })
    )
})
