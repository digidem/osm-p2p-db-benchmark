var benchmark = require('.')
var level = require('level')
var chunk = require('fd-chunk-store')

benchmark(level, chunk, { n: 10000 }, function (err, res) {
  console.log(err ? err : res)
})

