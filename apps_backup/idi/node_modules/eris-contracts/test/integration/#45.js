'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const source = `
  contract Test {

      string _name;

      function add(int a, int b) constant returns (int sum) {
          sum = a + b;
      }

      function setName(string newname) {
         _name = newname;
      }

      function getName() returns (string) {
          return _name;
      }
  }
`

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain', {protocol: 'http:'})
    .then((manager) =>
      test.compile(manager, source, 'Test').then((contract) =>
        Promise.fromCallback((callback) =>
          contract.setName('Batman', callback)
        ).then(() =>
          Promise.fromCallback((callback) =>
            contract.getName(callback)
          )
        )
      ).then((value) => {
        assert.equal(value,
          '000000000000000000000000000000000000000000000000000000000000002000' +
          '000000000000000000000000000000000000000000000000000000000000083078' +
          '4261746D616E000000000000000000000000000000000000000000000000'
        )
      })
    )
})
