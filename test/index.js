var imguri = require('../');

/** Test Code --------------------------------------------------------------- */
if (require.main === module) {
  (function () {
    var options = {
      force: false
    };
    var paths = ['test/test.png', 'test/nofile', 'http://www.vnykmshr.com/images/favicon.ico', 'http://www.vnykmshr.com/', 'http://www.vnykmshr.com/images/whois.png'];
    imguri.encode(paths, options, console.log);
  })();
}
