module.exports = query

var async = require('async')

// Make 9 square queries around lat/lon of uniform size
function query (osm, lat, lon, squareSize, cb) {
  var bboxes = buildQueryBoxes(lat, lon, squareSize)
  var n = 0

  async.map(bboxes, map, function allDone (err) {
    cb(err, n)
  })

  function map (bbox, done) {
    var qs = osm.queryStream(bbox)
    qs.on('data', function () { n++ })
    qs.once('error', done)
    qs.once('end', done)
  }
}

function buildQueryBoxes (lat, lon, squareSize) {
  var centers = [
    [lat - squareSize, lon - squareSize],
    [lat, lon - squareSize],
    [lat + squareSize, lon - squareSize],
    [lat - squareSize, lon],
    [lat, lon],
    [lat + squareSize, lon],
    [lat - squareSize, lon + squareSize],
    [lat, lon + squareSize],
    [lat + squareSize, lon + squareSize]
  ]

  return centers.map(bboxify.bind(null, squareSize))
}

function bboxify (size, pt) {
  // [[minLat,maxLat],[minLon,maxLon]]
  return [
    [pt[0] - size, pt[0] + size],
    [pt[1] - size, pt[1] + size]
  ]
}
