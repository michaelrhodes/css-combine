var fs = require('fs')
var url = require('url')
var path = require('path')
var css = require('css')
var concat = require('concat-stream')
var hyperquest = require('hyperquest')
var stream = require('stream')
var util = require('util')

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

var Join = function(file) {
  if (!(this instanceof Join)) {
    return new Join(file)
  }

  stream.Readable.call(this)

  if (!file) {
    throw new Error(
      'Please provide a CSS file.'
    )
  }

  this.file = file
  this.busy = false
}

util.inherits(Join, stream.Readable)

Join.prototype._read = function() {
  var thy = this

  if (thy.busy) {
    return
  }
  
  thy.busy = true
  var dir = path.dirname(path.resolve(thy.file))
  var file = path.basename(thy.file)
  var full = path.join(dir, file)

  read(full).on('error', function(error) {
    thy.emit('error', error.message)
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
          return loop(i)
        }
        thy.push(null)
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
          .on('data', function(data) {
            thy.push(data)
          }) 
      }
    })(0)
  }))
}

module.exports = Join
