var imguri = require('../');

/** Test Code --------------------------------------------------------------- */
if (require.main === module) {
    (function () {
        var options = {
            force: false
        };
        var paths = ['test/test.png', 'test/nofile'];
        paths.push('http://www.vnykmshr.com/images/favicon.ico');
        paths.push('http://www.vnykmshr.com/');
        paths.push('http://www.vnykmshr.com/images/whois.png');
        imguri.encode(paths, options, console.log);
    })();
}
