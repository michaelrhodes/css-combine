var run = require('tape').test
var fs = require('fs')
var concat = require('concat-stream')
var join = require('../')

run('it works', function(test) {
  var expected = fs.readFileSync(
    __dirname + '/css/expected.css'
  )

  var check = concat(function(result) {
    test.equal(
      result.toString(),
      expected.toString()
    )
    test.end()
  })

  join(__dirname + '/css/all.css')
    .pipe(check)
})
