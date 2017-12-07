# osm-p2p-db-benchmark

> Benchmarking suite for [osm-p2p-db](https://github.com/digidem/osm-p2p-db).

Breaks down various `osm-p2p-db` operations by time spent in LevelDB, [chunk
store](https://github.com/mafintosh/abstract-chunk-store), and application
logic.

This makes it easy to swap in various Level and chunk-store backends into
`osm-p2p-db` and see what performance differences they make.

## Example

```js
var benchmark = require('osm-p2p-db-benchmark')
var level = require('level')
var fdchunk = require('fd-chunk-store')

benchmark(level, fdchunk, function (err, res) {
  console.log(err ? err : res)
})
```

outputs

```
[ { name: 'insert',    total: 3556,  app: 2417, level: 1139, chunk: 0 },
  { name: 'index',     total: 3069,  app: 2646, level: 0,    chunk: 423 },
  { name: 'query',     total: 1911,  app: 1325, level: 586,  chunk: 0 },
  { name: 'replicate', total: 8013,  app: 1679, level: 6049, chunk: 285 },
  { name: 'total',     total: 16549, app: 8067, level: 7774, chunk: 708 } ]
```

## API

```js
var benchmark = require('osm-p2p-db-benchmark')
```

### benchmark.random(level, chunk[, opts], cb)

Generate a random dataset (uniform distribution of N nodes) and run the
benchmarking suite with the Level backend `level` and abstract chunk store
`chunk`. `cb` is called with `(err, res)`, where `res` are the timing results
shown in the above example output.

Valid `opts` include:

- `n` (Number): the number of nodes to insert to benchmark against

## License

ISC
