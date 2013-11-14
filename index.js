#!/usr/bin/env node

var fs = require('fs')
var url = require('url')
var css = require('css')
var hyperquest = require('hyperquest')

var isURL = function(path) {
  return !!url.parse(path).protocol
}

var extract = function(path) {
  return path
    .replace(/^url\('?/, '')
    .replace(/'?\)$/, '')
}

var path = process.argv[2]
var paths = process.argv.slice(2)

var parse = function(path) {
  if (fs.existsSync(path)) {
    var content = fs.readFileSync(path, 'utf8')
    var rules = css.parse(content).stylesheet.rules
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
          
        var read = (!isURL(path) ?
          fs.createReadStream :
          hyperquest
        )

        read(path)
          .on('end', end)
          .pipe(process.stdout) 
      }
    })(0)
  }
}

if (!isURL(path)) {
  parse(path)
}
