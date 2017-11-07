var hyperlog = require('hyperlog')
var levelup = require('levelup')
var leveldown = require('memdown')
var osmdb = require('osm-p2p-db')
var fdstore = require('fd-chunk-store')
var rimraf = require('rimraf')
var createPerfTimer = require('./lib/app_timer')

module.exports = benchmark

var level = function (name) {
  return levelup(name, { db: leveldown })
}

function benchmark (level, cb) {
  var timer = createPerfTimer()
  var res = []

  var osm = osmdb({
    log: hyperlog(level('log1'), { valueEncoding: 'json' }),
    db: level('index1'),
    store: fdstore(4096, 'kdb1')
  })

  var osm2 = osmdb({
    log: hyperlog(level('log2'), { valueEncoding: 'json' }),
    db: level('index2'),
    store: fdstore(4096, 'kdb2')
  })

  timer.start('insert')
  var batch = []
  var n = 100
  console.log('inserting', n, 'documents')
  for (var i=0; i < n; i++) {
    var node = {
      type: 'node',
      lat: Math.random() * 180 - 90,
      lon: Math.random() * 360 - 180
    }
    batch.push({ type: 'put', key: ''+i, value: node })
  }
  osm.batch(batch, function (err) {
    if (err) throw err
    res.push(timer.end())

    timer.start('index')
    osm.ready(function () {
      res.push(timer.end())

      timer.start('query')
      osm.query([[-90,90],[-180,180]], function (err) {
        if (err) throw err
        res.push(timer.end())

        timer.start('replicate')
        replicate(function () {
          res.push(timer.end())
          res.push(timer.total())
          cb(null, res)
        })
      })
    })
  })

  function replicate (cb) {
    var r1 = osm.log.replicate()
    var r2 = osm2.log.replicate()

    r1.pipe(r2).pipe(r1)

    r1.on('end', done)
    r2.on('end', done)

    var pending = 2
    function done () {
      if (!--pending) cb()
    }
  }
}
