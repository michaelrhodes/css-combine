#!/usr/bin/env node

var fs = require('fs')
var url = require('url')
var css = require('css')
var concat = require('concat-stream')
var hyperquest = require('hyperquest')

var isURL = function(path) {
  return !!url.parse(path).protocol
}

var extract = function(path) {
  return path
    .replace(/^url\('?/, '')
    .replace(/'?\)$/, '')
}

var read = function(path) {
  return !isURL(path) ?
    fs.createReadStream(path) :
    hyperquest(path)
}

var path = process.argv[2]
var paths = process.argv.slice(2)

read(path).on('error', function(error) {
  process.stderr.write(
    error.message + '\n'
  )
})
.pipe(concat(function(content) {
  var rules = css.parse(content.toString()).stylesheet.rules
  var total = rules.length 
  
  ;(function loop(i) { 
    var end = function() {
      if (++i < total) {
        loop(i)
      } 
    }

    var rule = rules[i]
    if (rule.type == 'import') {
      var path = extract(rule.import)
        
      read(path)
        .on('end', end)
        .pipe(process.stdout) 
    }
  })(0)
}))
