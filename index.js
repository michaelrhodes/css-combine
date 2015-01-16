var fs = require('fs')
var url = require('url')
var path = require('path')
var stream = require('stream')
var util = require('util')
var css = require('css')
var concat = require('concat-stream')
var hyperquest = require('hyperquest')
var isURL = require('is-url')

var extract = function(rule) {
  return rule 
    .replace(/^url\(/, '')
    .replace(/'|"/g, '')
    .replace(/\)\s*$/, '')
}

var read = function(file) {
  return !isURL(file) ?
    fs.createReadStream(file) :
    hyperquest(file)
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

  this.file = path.normalize(file)
  this.busy = false
}

util.inherits(CSSCombine, stream.Readable)

CSSCombine.prototype._read = function() {
  var thy = this

  if (thy.busy) {
    return
  }
  
  thy.busy = true

  var entrypoint = path.resolve(thy.file)

  read(entrypoint)
    .on('error', die)
    .pipe(concat(function(content) {
      parse(entrypoint, content, function() {
        thy.push('\n')
        thy.push(null) 
      })
    }))

  function parse (filename, content, callback) {
    if (!content) {
      callback()
      return
    }

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
        if (!isURL(file) && /^[^\/\\]/.test(file)) {
          dir = path.dirname(filename)
          file = path.normalize(path.resolve(dir, file))
        }

        // Assume absolute paths use the 
        // working directory as root.
        else if (/^\/|\\/.test(file)) {
          file = path.normalize(path.join(process.cwd(), file))
        }

        read(file)
          .on('error', die)
          .pipe(concat(function(content) {
            parse(file, content, next)
          }))
      }
      else if (rule.declarations && !rule.declarations.length) {
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

  function die (error) {
    thy.emit('error', error.message)
  }
}

module.exports = CSSCombine
