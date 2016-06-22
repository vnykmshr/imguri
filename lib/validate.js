/**
 * Validate
 */

var fs = require('fs');
var util = require('util');
var request = require('request');

var SIZE_LIMIT = 4096;

var validate = {
  mimetype: function (item) {
    return (/http[s]*:\/\//gi).test(item) ? 'network' : 'local';
  },

  local: function (item, options, cb) {
    fs.exists(item, checkFile);

    function checkFile(exists) {
      if (!exists) {
        return cb(new Error('no such file: ' + item));
      }

      fs.stat(item, checkStat);
    }

    function checkStat(err, stats) {
      if (!err && stats) {
        if (stats.size > SIZE_LIMIT && !options.force) {
          return cb(new Error(util.format(
            'Size limit exceeded: %s > %s Set options.force to override', stats.size,
            SIZE_LIMIT)));
        }

        // go ahead
        cb();
      } else {
        cb(err || new Error('Unable to stat: ' + item));
      }
    }
  },

  network: function (item, options, cb) {
    request.head(item, checkNetwork);

    function checkNetwork(err, res) {
      if (!err && res && res.headers) {
        if (!(/image/gi).test(res.headers['content-type'])) {
          return cb(new Error(util.format('Not an image, content-type: %s, link: %s', res.headers[
            'content-type'], item)));
        }

        var length = Number(res.headers['content-length'] || 0);
        if (length && !isNaN(length) && (length < SIZE_LIMIT || options.force)) {
          // go ahead
          cb();
        } else {
          cb(new Error(util.format(
            'Size limit exceeded: %s > %s, Set options.force to override', length,
            SIZE_LIMIT)));
        }
      }
    }
  }
};

module.exports = validate;
