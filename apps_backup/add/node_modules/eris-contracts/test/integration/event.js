'use strict'

const R = require('ramda')
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

  test.newContractManager('blockchain', {protocol: 'http:'}).then((manager) =>
    test.compile(manager, source, 'Contract').then((contract) => {
      let count = 0

      contract.Event(R.identity, (error, event) => {
        if (error) {
          throw error
        } else {
          console.log('Received event', JSON.stringify(event, null, 2))
          count++

          if (count === 2) {
            done()
          }
        }
      })

      contract.emit()
      contract.emit()
    })
    .catch(done)
  )
})
