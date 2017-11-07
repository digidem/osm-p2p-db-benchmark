var createAsyncTimer = require('./async_timer')
var levelup = require('levelup')

module.exports = createAppTimer

function createAppTimer () {
  var appStart, appEnd
  var levelTimer = createAsyncTimer()
  var totalResults = {name:'total',total:0,app:0,level:0}

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
        app: (appEnd - appStart) - levelTimer.getTime(),
        level: levelTimer.getTime()
      }

      totalResults.total += res.total
      totalResults.app += res.app
      totalResults.level += res.level

      // reset
      levelTimer = createAsyncTimer()
      appStart = appEnd = 0

      return res
    },
    total: function () {
      return totalResults
    }
  }
}


