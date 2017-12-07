var hyperlog = require('hyperlog')
var osmdb = require('osm-p2p-db')
var createPerfTimer = require('./lib/app_timer')

module.exports = {
  random: benchmarkRandom
}

function benchmarkRandom (level, chunk, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  var timer = createPerfTimer(level, chunk)
  var res = []

  var osm = osmdb({
    log: hyperlog(level('log1'), { valueEncoding: 'json' }),
    db: level('index1'),
    store: chunk(4096, 'kdb1')
  })

  var osm2 = osmdb({
    log: hyperlog(level('log2'), { valueEncoding: 'json' }),
    db: level('index2'),
    store: chunk(4096, 'kdb2')
  })

  timer.start('insert')
  var batch = []
  var n = opts.n || 100
  console.error('inserting', n, 'documents')
  for (var i = 0; i < n; i++) {
    var node = {
      type: 'node',
      lat: Math.random() * 180 - 90,
      lon: Math.random() * 360 - 180
    }
    batch.push({ type: 'put', key: '' + i, value: node })
  }
  osm.batch(batch, function (err) {
    if (err) throw err
    res.push(timer.end())

    timer.start('index')
    osm.ready(function () {
      res.push(timer.end())

      timer.start('small-query')
      osm.query([[-10, 10], [-20, 20]], function (err) {
        if (err) throw err
        res.push(timer.end())

        timer.start('medium-query')
        osm.query([[-45, 45], [-90, 90]], function (err) {
          if (err) throw err
          res.push(timer.end())

          timer.start('full-query')
          osm.query([[-90, 90], [-180, 180]], function (err) {
            if (err) throw err
            res.push(timer.end())

            timer.start('replicate')
            replicate(function () {
              res.push(timer.end())
              res.push(timer.total())
              res.numNodes = n
              cb(null, res)
            })
          })
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
