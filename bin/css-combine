#!/usr/bin/env node

var combine = require('./')

var file = process.argv[2]

if (!file) {
  return fs.createReadStream('./usage.txt')
    .pipe(process.stdout)
}

combine(file).on('error', function(error) {
  process.stderr.write(
    error.message + '\n'
  )
})
.pipe(process.stdout)
