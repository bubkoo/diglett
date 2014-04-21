;
(function (global) {
    'use strict';

    // create a local object, exported or attached to global later
    var datetime = {};
    // current version
    datetime.version = '0.0.6';

    datetime.options = {
        format: 'yyyy-MM-dd HH:mm:ss',
        // il8n settings
        daySeparators: ['am', 'pm'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'],
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };

    datetime.parse = function (date, format) {
        // if date is null or `undefined`
        if (typeof date === 'undefined' || date === null) {
            date = new Date();
        }

        if (typeof date === 'string') {
            // positive or negative number string
            if (/^\-?\d+$/.test(date)) {
                date = int(date, 10);
            } else {
                date = string2Date(date);
            }
        }
        // convert timestamp to date object
        if (typeof date === 'number') {
            date = new Date(date);
        }

        // check convert result
        if (!isDate(date)) {
            return date;
        }

        var opts = merge(
            (isObject(format) ? format : {
                format: format
            }),
            datetime.options);

        // ref: http://www.regexper.com/#%2F%22%5B%5E%22%5D*%22%7C'%5B%5E'%5D*'%7C%5Cb(%3F%3Ad%7B1%2C4%7D%7Cm%7B1%2C4%7D%7Cyy(%3F%3Ayy)%3F%7C(%5BhHMstT%5D)%5C1%3F%7C%5BlLZ%5D)%5Cb%2F
        return opts.format.replace(/"[^"]*"|'[^']*'|\b(?:d{1,4}|m{1,4}|yy(?:yy)?|([hHMstT])\1?|[lLZ])\b/g, function ($0) {
            switch ($0) {
                case 'd':
                    return date.getDate();
                case 'dd':
                    return zeroize(date.getDate());
                case 'ddd':
                    // day of week, short name
                    return opts.dayNamesShort[date.getDay()];
                case 'dddd':
                    // day of week, full name
                    return opts.dayNames[date.getDay()];
                case 'M':
                    return date.getMonth() + 1;
                case 'MM':
                    return zeroize(date.getMonth() + 1);
                case 'MMM':
                    return opts.monthNamesShort[date.getMonth()];
                case 'MMMM':
                    return opts.monthNames[date.getMonth()];
                case 'yy':
                    return String(date.getFullYear()).substr(2);
                case 'yyyy':
                    return date.getFullYear();
                case 'h':
                    return date.getHours() % 12 || 12;
                case 'hh':
                    return zeroize(date.getHours() % 12 || 12);
                case 'H':
                    return date.getHours();
                case 'HH':
                    return zeroize(date.getHours());
                case 'm':
                    return date.getMinutes();
                case 'mm':
                    return zeroize(date.getMinutes());
                case 's':
                    return date.getSeconds();
                case 'ss':
                    return zeroize(date.getSeconds());
                case 'len':
                    return zeroize(date.getMilliseconds(), 3);
                case 'L':
                    var m = date.getMilliseconds();
                    if (m > 99) m = Math.round(m / 10);
                    return zeroize(m);
                case 'tt':
                    return date.getHours() < 12 ? opts.daySeparators[0] : opts.daySeparators[1];
                case 'TT':
                    return date.getHours() < 12 ? opts.daySeparators[0].toUpperCase() : opts.daySeparators[1].toUpperCase();
                case 'Z':
                    return date.toUTCString().match(/[A-Z]+$/);
                default:
                    return $0.substr(1, $0.length - 2);
            }
        });
    };

    // Helpers
    // ----------------

    var toString = Object.prototype.toString;

    function isObject(value) {
        return value && toString.call(value) === '[object Object]';
    }

    function isDate(value) {
        return value && toString.call(value) === '[object Date]';
    }

    function int(value) {
        return parseInt(value, 10);
    }

    function zeroize(value, length) {
        // zero fix
        length || (length = 2);
        value = '' + value; // toString

        var i,
            len = value.length,
            zeros = '';
        for (i = 0; i < (length - len); i++) {
            zeros += '0';
        }
        return zeros + value;
    }

    function string2Date(str) {
        // source from AngularJS
        // https://github.com/angular/angular.js/blob/dc57fe97e1be245fa08f25143302ee9dd850c5c9/src/ng/filter/filters.js#L387
        // ref: http://en.wikipedia.org/wiki/ISO_8601
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/,
            match;
        if (match = str.match(R_ISO8601_STR)) {
            var date = new Date(0),
                tzHour = 0,
                tzMin = 0,
                dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                timeSetter = match[8] ? date.setUTCHours : date.setHours;

            if (match[9]) {
                tzHour = int(match[9] + match[10]);
                tzMin = int(match[9] + match[11]);
            }
            dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
            var h = int(match[4] || 0) - tzHour;
            var m = int(match[5] || 0) - tzMin;
            var s = int(match[6] || 0);
            var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
            timeSetter.call(date, h, m, s, ms);
            return date;
        }
        return str;
    }

    function merge(target, source) {
        var key;
        target = target || {};
        source = source || {};
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                // Replace values with source only if `undefined` (allow empty/zero values)
                if (target[key] == null) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }


    // Export
    // ----------------
    if (typeof define === 'function') {
        // RequireJS && SeaJS
        define(function () {
            return datetime;
        });
    } else if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            // NodeJS
            module.exports = datetime;
        }
    } else {
        datetime.noConflict = (function (old) {
            return function () {
                // reset the value of the root's `currency` object
                global.datetime = old;
                // reset the noConflict method with a noop function
                datetime.noConflict = function () {
                };
                // return reference to the library to re-assign it
                return datetime;
            };
        })(global.datetime);

        // attach datetime to global
        global['datetime'] = datetime;
    }


})(this);