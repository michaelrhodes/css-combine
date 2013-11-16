# css-combine
css-combine is a module and command-line utility that combines CSS files by resolving their @import directives. At this time, only @imports found in the first file will be resolved (ie. no recursion).

[![Build status](https://travis-ci.org/michaelrhodes/css-combine.png?branch=master)](https://travis-ci.org/michaelrhodes/css-combine)

## Install
``` sh
$ npm install [-g] css-combine
```

### Usage
#### cli
``` sh
$ css-combine /path/to/file > /path/to/build
```

#### module
``` js
var fs = require('fs')
var combine = require('css-combine')

var css = [
  "@import 'one.css';",
  "@import url(two.css);",
  "@import url('/test/css/three.css');",
  '@import "../css/four.css";',
  '@import url("five.css");',
  "@import url('http://resolves-external-files.too')"
].combine('\n')

combine(raw).pipe(
  fs.createWriteStream('/path/to/build')
)
```

### License
[MIT](http://opensource.org/licenses/MIT)
