var benchmark = require('.')
// var level = wrapLevel(require('level'))
var memdb = require('memdb')
var fdchunk = require('fd-chunk-store')
var rimraf = require('rimraf')

var dbs = []
function wrapLevel (level) {
  return function (name) {
    dbs.push(name)
    return level(name)
  }
}

function cleanup () {
  console.log('cleanup')
  dbs.forEach(function (db) {
    console.log('rimraffing', db)
    rimraf.sync(db)
    console.log('rimraffed', db)
  })
}

benchmark(memdb, fdchunk, { n: 200 }, function (err, res) {
  console.log(err ? err : res)
  cleanup()
})

