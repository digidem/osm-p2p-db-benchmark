module.exports = createAsyncTimer

function createAsyncTimer () {
  var total = 0
  var pending = 0
  var start = undefined

  return {
    start: function () {
      if (!start) start = new Date().getTime()
      pending++
    },
    end: function () {
      if (!--pending) {
        var fin = new Date().getTime()
        total += fin - start
        start = undefined
      }
    },
    getTime: function () {
      return total
    }
  }
}
