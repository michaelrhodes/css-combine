#!/usr/bin/env node

var fs = require('fs')
var url = require('url')
var path = require('path')
var css = require('css')
var concat = require('concat-stream')
var hyperquest = require('hyperquest')

var isURL = function(path) {
  return !!url.parse(path).protocol
}

var extract = function(rule) {
  return rule 
    .replace(/^url\(/, '')
    .replace(/'|"/g, '')
    .replace(/\)\s*$/, '')
}

var read = function(path) {
  return !isURL(path) ?
    fs.createReadStream(path) :
    hyperquest(path)
}

var file = process.argv[2]
var files = process.argv.slice(2)

if (!file) {
  return read('./usage.txt')
    .pipe(process.stdout)
}

var dir = path.dirname(path.resolve(file))
var file = path.basename(file)
var full = path.join(dir, file)

read(full).on('error', function(error) {
  process.stderr.write(
    error.message + '\n'
  )
})
.pipe(concat(function(content) {
  var rules = css
    .parse(content.toString())
    .stylesheet
    .rules

  var total = rules.length 
  
  ;(function loop(i) { 
    var end = function() {
      if (++i < total) {
        loop(i)
      } 
    }

    var rule = rules[i]
    if (rule.type == 'import') {
      var file = extract(rule.import)

      // Allow relative paths
      if (!isURL(file) && /^[^\/]/.test(file)) {
        file = path.resolve(dir, file)
      }

      // Assume absolute paths use the 
      // working directory as root.
      else if (/^\//.test(file)) {
        file = path.join(process.cwd(), file)
      }

      read(file)
        .on('end', end)
        .pipe(process.stdout) 
    }
  })(0)
}))
