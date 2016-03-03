var tape = require('tape')
var fs = require('fs')
var concat = require('concat-stream')
var combine = require('../')

var newlines = /\n|\r/g
var run = function(input, output) {
  var test = this
  var expected = fs.readFileSync(output)
  var check = concat(function(result) {
    test.equal(
      result.toString().replace(newlines, ''),
      expected.toString().replace(newlines, '')
    )
    test.end()
  })

  combine(input).pipe(check)
}

tape('single level of @imports', function(test) {
  run.call(test,
    __dirname + '/css/all-single.css',
    __dirname + '/css/expected-single.css'
  )
})

tape('nested @imports', function(test) {
  run.call(test,
    __dirname + '/css/all-nested.css',
    __dirname + '/css/expected-nested.css'
  )
})

tape('nested extra @imports', function(test) {
  run.call(test,
    __dirname + '/css/all-extra.css',
    __dirname + '/css/expected-extra.css'
  )
})

tape('no @imports', function(test) {
  run.call(test,
    __dirname + '/css/all-no.css',
    __dirname + '/css/expected-no.css'
  )
})

tape('node-style @imports', function(test) {
  run.call(test,
    __dirname + '/css/all-node.css',
    __dirname + '/css/expected-node.css'
  )
})
