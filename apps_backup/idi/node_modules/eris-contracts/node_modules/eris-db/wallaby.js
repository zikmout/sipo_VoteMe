module.exports = function () {
  return {
    files: [
      'lib/**/*.js'
    ],

    tests: [
      'test/unit/*.js'
    ],

    env: {
      type: 'node'
    }
  }
}
