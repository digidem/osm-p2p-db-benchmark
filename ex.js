var benchmark = require('.')
var level = require('level')
var chunk = require('fd-chunk-store')

benchmark.random(level, chunk, { n: 10000 }, function (err, res) {
  console.log(err || res)
})
