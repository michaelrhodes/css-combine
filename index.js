var fs = require('fs')
var url = require('url')
var path = require('path')
var stream = require('stream')
var util = require('util')
var css = require('css')
var concat = require('concat-stream')
var hyperquest = require('hyperquest')
var isURL = require('is-url')

// Aliases
var normalize = path.normalize
var extname = path.extname
var dirname = path.dirname
var resolve = path.resolve
var join = path.join

function CSSCombine (file) {
  if (!(this instanceof CSSCombine)) {
    return new CSSCombine(file)
  }

  stream.Readable.call(this)

  if (!file) {
    throw new Error(
      'Please provide a CSS file.'
    )
  }

  this.file = normalize(file)
  this.busy = false
}

util.inherits(CSSCombine, stream.Readable)

CSSCombine.prototype._read = function () {
  var thy = this

  if (thy.busy) {
    return
  }
  
  thy.busy = true

  var entrypoint = resolve(thy.file)

  read(entrypoint)
    .on('error', die)
    .pipe(concat(function (content) {
      parse(entrypoint, content, function () {
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
      var rule = rules[i]
      if (rule.type == 'import') {
        var file = extract(rule.import)

        // Allow relative paths
        if (!isURL(file) && /^[^\/\\]/.test(file)) {
          dir = dirname(filename)
          file = normalize(resolve(dir, file))
        }

        // Assume absolute paths use the 
        // working directory as root.
        else if (/^\/|\\/.test(file)) {
          file = normalize(join(process.cwd(), file))
        }

        // Handle malformed, node-style imports
        if (!extname(file)) {
          file = file + '.css'
        }

        read(file)
          .on('error', die)
          .pipe(concat(function (content) {
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

      function next () {
        ++i < l ?
          loop() :
          callback()
      }
    })()
  }

  function die (error) {
    thy.emit('error', error.message)
  }
}

function extract (rule) {
  return rule
    .replace(/^url\(/, '')
    .replace(/'|"/g, '')
    .replace(/\)\s*$/, '')
}

function read (file) {
  return !isURL(file) ?
    fs.createReadStream(file) :
    hyperquest(file)
}

module.exports = CSSCombine
