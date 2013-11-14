#!/usr/bin/env node

var join = require('./')

var file = process.argv[2]
//var files = process.argv.slice(2)

if (!file) {
  return fs.createReadStream('./usage.txt')
    .pipe(process.stdout)
}

join(file).on('error', function(error) {
  process.stderr.write(
    error.message + '\n'
  )
})
.pipe(process.stdout)
