module.exports = mean

// Find the mean latitude and longitude node coordinates of a dataset
function mean (osm, cb) {
  var lat = 0
  var lon = 0
  var n = 0

  var rs = osm.kv.createReadStream()
  rs.on('data', function (row) {
    var doc = row.values[Object.keys(row.values)[0]].value
    if (doc && doc.type === 'node') {
      lat += Number(doc.lat)
      lon += Number(doc.lon)
      n++
    }
  })
  rs.once('end', function () {
    cb(null, lat / n, lon / n)
  })
  rs.once('error', cb)
}
