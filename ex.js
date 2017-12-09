var benchmark = require('.')
var level = require('level')
var chunk = require('fd-chunk-store')

// generate + benchmark a random dataset
benchmark.random(level, chunk, { n: 1000 }, function (err, res) {
  console.log(err || res)
})

// benchmark an existing dataset
// benchmark.db('/home/sww/.config/Electron/data', function (err, res) {
//   console.log(err || res)
// })
