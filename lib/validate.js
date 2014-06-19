/**
 * Validate
 */

var fs = require('fs');
var request = require('request');

var SIZE_LIMIT = 4096;

var validate = {
    mimetype: function (item) {
        return (/http[s]*:\/\//gi).test(item) ? 'network' : 'local';
    },

    local: function (item, options, callback) {
        fs.exists(item, checkFile);

        function checkFile(exists) {
            if (!exists) {
                return callback(new Error('no such file: ' + item));
            }

            fs.stat(item, checkStat);
        }

        function checkStat(err, stats) {
            if (!err && stats) {
                if (stats.size > SIZE_LIMIT && !options.force) {
                    return callback(new Error(
                        'Size limit exceeded: ' + stats.size +
                        ' > ' + SIZE_LIMIT +
                        ' Set options.force to override'));
                }

                // go ahead
                callback();
            } else {
                callback(err || new Error('Unable to stat: ' + item));
            }
        }
    },

    network: function (item, options, callback) {
        request.head(item, checkNetwork);

        function checkNetwork(err, res) {
            if (!err && res && res.headers) {
                if (!(/image/gi).test(res.headers['content-type'])) {
                    return callback(new Error(
                        'Not an image, content-type: ' + res.headers[
                            'content-type'] + ', link: ' + item));
                }

                var length = Number(res.headers['content-length'] || 0);
                if (length && !isNaN(length) && (length < SIZE_LIMIT ||
                    options.force)) {
                    // go ahead
                    callback(null);
                } else {
                    callback(new Error('Size limit exceeded: ' + length +
                        ' > ' + SIZE_LIMIT +
                        ' Set options.force to override'));
                }
            }
        }
    }
};

module.exports = validate;
