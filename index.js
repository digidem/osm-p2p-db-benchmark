var hyperlog = require('hyperlog')
var osmdb = require('osm-p2p-db')
var createPerfTimer = require('./lib/app_timer')
var path = require('path')
var nineSquare = require('./lib/9-square')
var meanNode = require('./lib/mean-node')
var tmpdir = require('os').tmpdir

module.exports = {
  random: benchmarkRandom,
  db: benchmarkDb
}

function benchmarkDb (dbPath, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  var level = require('level')
  var chunk = require('fd-chunk-store')

  var osm = osmdb({
    log: hyperlog(level(path.join(dbPath, 'log')), { valueEncoding: 'json' }),
    db: level(path.join(tmpdir(), 'index' + Math.random().toString())),
    store: chunk(4096, path.join(tmpdir(), 'kdb' + Math.random().toString())),
  })

  var timer = createPerfTimer(level, chunk)
  var res = []

  process.stdout.write('Indexing..')
  timer.start('index')
  osm.ready(function () {
    console.log('..done')
    res.push(timer.end())

    process.stdout.write('Computing rough center of dataset..')
    meanNode(osm, function (err, lat, lon) {
      console.log('..done (' + lat + ', ' + lon + ')')

      process.stdout.write('Zoom-16 query..')
      timer.start('zoom-16-query')
      nineSquare(osm, 0, 0, 0.005, function (err, results) {
        console.log('..done')
        res.push(timer.end())

        process.stdout.write('Zoom-13 query..')
        timer.start('zoom-13-query')
        nineSquare(osm, 0, 0, 0.044, function (err, results) {
          console.log('..done')
          res.push(timer.end())

          process.stdout.write('Zoom-9 query..')
          timer.start('zoom-9-query')
          nineSquare(osm, 0, 0, 0.703, function (err, results) {
            console.log('..done')
            res.push(timer.end())

            process.stdout.write('Full map query..')
            timer.start('full-map-query')
            fullMapQuery(osm, function (err) {
              console.log('..done')
              res.push(timer.end())

              res.push(timer.total())
              res.db = dbPath
              cb(null, res)
            })
          })
        })
      })
    })
  })
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

function fullMapQuery (osm, cb) {
  var bbox = [
    [-85, 85],
    [-180, 180]
  ]
  var qs = osm.queryStream(bbox)
  qs.on('data', function () {})
  qs.once('error', cb)
  qs.once('end', cb)
}
