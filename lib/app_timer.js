var createAsyncTimer = require('./async_timer')
var levelup = require('levelup')

module.exports = createAppTimer

function createAppTimer (_, chunk) {
  var appStart, appEnd
  var levelTimer = createAsyncTimer()
  var chunkTimer = createAsyncTimer()
  var totalResults = {name:'total',total:0,app:0,level:0,chunk:0}

  // Record time spent in 'put'
  var chunk_put = chunk.prototype.put
  chunk.prototype.put = function (n, buf, opts, cb) {
    if (typeof opts === 'function' && !cb) {
      cb = opts
      opts = {}
    }
    chunkTimer.start()
    chunk_put.call(this, n, buf, opts, function (err, value) {
      chunkTimer.end()
      cb(err, value)
    })
  }

  // Record time spent in 'get'
  var chunk_get = chunk.prototype.get
  chunk.prototype.get = function (n, opts, cb) {
    if (typeof opts === 'function' && !cb) {
      cb = opts
      opts = {}
    }
    chunkTimer.start()
    chunk_get.call(this, n, opts, function (err, value) {
      chunkTimer.end()
      cb(err, value)
    })
  }

  // Record time spent in 'get'
  var levelup_get = levelup.prototype.get
  levelup.prototype.get = function (key_, options, callback) {
    if (typeof options === 'function' && !callback) {
      callback = options
      options = {}
    }
    levelTimer.start()
    levelup_get.call(this, key_, options, function (err, value) {
      levelTimer.end()
      callback(err, value)
    })
  }

  // Record time spent in 'put'
  var levelup_put = levelup.prototype.put
  levelup.prototype.put = function (key_, value_, options, callback) {
    if (typeof options === 'function' && !callback) {
      callback = options
      options = {}
    }
    levelTimer.start()
    levelup_put.call(this, key_, value_, options, function (err, value) {
      levelTimer.end()
      callback(err, value)
    })
  }

  // Record time spent in 'batch'
  var levelup_batch = levelup.prototype.batch
  levelup.prototype.batch = function (arr_, options, callback) {
    if (typeof options === 'function' && !callback) {
      callback = options
      options = {}
    }
    levelTimer.start()
    levelup_batch.call(this, arr_, options, function (err, value) {
      levelTimer.end()
      callback(err, value)
    })
  }

  var label

  return {
    start: function (str) {
      appStart = new Date().getTime()
      label = str
    },
    end: function () {
      appEnd = new Date().getTime()
      var res = {
        name: label,
        total: appEnd - appStart,
        app: (appEnd - appStart) - levelTimer.getTime() - chunkTimer.getTime(),
        level: levelTimer.getTime(),
        chunk: chunkTimer.getTime()
      }

      totalResults.total += res.total
      totalResults.app += res.app
      totalResults.level += res.level
      totalResults.chunk += res.chunk

      // reset
      levelTimer = createAsyncTimer()
      chunkTimer = createAsyncTimer()
      appStart = appEnd = 0

      return res
    },
    total: function () {
      return totalResults
    }
  }
}


