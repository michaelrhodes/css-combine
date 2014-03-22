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

var CSSCombine = function(file) {
  if (!(this instanceof CSSCombine)) {
    return new CSSCombine(file)
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

util.inherits(CSSCombine, stream.Readable)

CSSCombine.prototype._read = function() {
  var thy = this

  if (thy.busy) {
    return
  }
  
  thy.busy = true
  var dir = path.dirname(path.resolve(thy.file))
  var file = path.basename(thy.file)
  var filepath = path.join(dir, file)

  var die = function(error) {
    thy.emit('error', error.message)
  }

  var parse = function(content, callback) {
    var rules = css
      .parse(content.toString())
      .stylesheet
      .rules

    var i = 0
    var l = rules.length

    if (!l) {
      callback()
      return
    }

    ;(function loop() {
      var next = function() {
        if (++i < l) {
          loop()
          return
        }
        callback()
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
          .on('error', die)
          .pipe(concat(function(content) {
            parse(content, next)
          }))
      }
      else if (!rule.declarations.length) {
        thy.push(rule.selectors.join(',\n') + ' {}\n')
        next()    
      }
      else {
        thy.push(css.stringify({
          stylesheet: {
            rules: [rule]
          }
        }))
        next()
      }
    })()
  }

  read(filepath)
    .on('error', die)
    .pipe(concat(function(content) {
      parse(content, function() {
        thy.push('\n')
        thy.push(null) 
      })
    }))
}

module.exports = CSSCombine
