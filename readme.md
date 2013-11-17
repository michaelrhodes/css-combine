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
var combine = require('./')

var raw = '/path/to/file'
/*
  @import 'one.css';
  @import url(two.css);
  @import url('/path/to/three.css');
  @import "../to/four.css";
  @import url("five.css");
  @import url(https://resolves-external-files.too);

  body:before {
    content: 'Just regular CSS'
  }
*/

combine(raw).pipe(
  fs.createWriteStream('/path/to/build')
)
```

#### Note
If your @import directives use absolute file-system paths (like `three.css` in the above example), make sure you run css-combine from the root directory so that everything resolves correctly.

### License
[MIT](http://opensource.org/licenses/MIT)
