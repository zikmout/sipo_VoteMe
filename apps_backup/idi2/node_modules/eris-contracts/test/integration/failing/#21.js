'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../../lib/test')

describe('issue #21', function () {
  let contract

  before(function () {
    this.timeout(60 * 1000)

    const source = `
      contract c {
        function getBytes() constant returns (byte[10]){
            byte[10] memory b;
            string memory s = "hello";
            bytes memory sb = bytes(s);

            uint k = 0;
            for (uint i = 0; i < sb.length; i++) b[k++] = sb[i];
            b[9] = 0xff;
            return b;
        }

        function deeper() constant returns (byte[12][100] s, uint count) {
          count = 42;
          return (s, count);
        }
      }
    `

    return test.newContractManager('blockchain').then((manager) =>
      test.compile(manager, source, 'c').then((compiledContract) => {
        contract = compiledContract
      })
    )
  })

  it('gets the static byte array decoded properly', function () {
    return Promise.fromCallback((callback) => contract.getBytes(callback))
      .then((bytes) => {
        assert.deepEqual(bytes, [
          '0x68', '0x65', '0x6C', '0x6C', '0x6F', '0x00', '0x00', '0x00',
          '0x00', '0xFF'
        ])
      })
  })

  it('returns multiple values correctly from a function', function () {
    return Promise.fromCallback((callback) => contract.deeper(callback))
      .then((values) => {
        assert.equal(Number(values[1]), 42)
      })
  })
})
