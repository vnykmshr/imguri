/**
 * imguri
 */

var fs = require('fs');
var util = require('util');
var mime = require('mime');
var async = require('async');
var request = require('request');

var validate = require('./validate');

var EACH_LIMIT = 10;

var imguri = {
  encode: function (paths, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!util.isArray(paths)) paths = [paths];

    var results = {};

    var encodeSingle = function (item, cb) {
      if (results[item]) {
        // duplicate entry?
        return cb();
      }

      var type = validate.mimetype(item);
      imguri[type](item, options, function (err, data) {
        // silent error
        results[item] = {
          err: err,
          data: data
        };

        cb();
      });
    };

    async.eachLimit(paths, EACH_LIMIT, encodeSingle, function (err) {
      callback(err, results);
    });
  },

  local: function (item, options, callback) {
    validate.local(item, options, function (err) {
      if (!err) {
        fs.readFile(item, function (err, data) {
          if (!err && data) {
            callback(null, imguri.base64(data, mime.lookup(item)));
          } else {
            callback(err || new Error('unable to stat: ' + item));
          }
        });
      } else {
        callback(err);
      }
    });
  },

  network: function (item, options, callback) {
    validate.network(item, options, function (err) {
      if (!err) {
        var reqOptions = {
          encoding: 'binary',
          timeout: 20 * 1000
        };

        request(item, reqOptions, function (err, res) {
          if (!err && res && res.body) {
            callback(null, imguri.base64(res.body, reqOptions.encoding));
          } else {
            callback(err || new Error('unable to fetch: ' + item));
          }
        });
      } else {
        callback(err);
      }
    });
  },

  base64: function (content, type) {
    var buffer = (/binary/i).test(type) ? new Buffer(content, "binary") : new Buffer(content);
    return "data:" + type + ";base64," + buffer.toString('base64');
  }
};

module.exports = imguri;

/** Test Code --------------------------------------------------------------- */
if (require.main === module) {
  (function () {
    var options = {
      force: false
    };
    var paths = ['test/test.png', 'test/nofile', 'http://www.vnykmshr.com/images/favicon.ico', 'http://www.vnykmshrx.com/', 'http://www.vnykmshr.com/images/whois.png'];
    imguri.encode(paths, options, console.log);
  })();
}
