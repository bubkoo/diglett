/*
 *
 * currency.js v0.0.6
 * by bubkoo@163.com
 *
 * MIT license
 *
 */


(function (global) {

    // create a local object, to be exported or add to global object later
    var currency = {};

    // current version
    currency.version = '0.0.6';

    currency.options = {
        money: {
            symbol: '$',    // default money symbol is '$'
            format: '%s%v', // controls output: %s = symbol, %v = value (can be object, see docs)
            precision: 2,   // decimal places
            grouping: 3,    // digit grouping (not implemented yet)
            thousand: ',',  // thousands separator
            decimal: '.',   // decimal point separator
            positivePre: '',
            positiveSuf: '',
            negativePre: '(',
            negativeSuf: ')'
        },
        number: {
            precision: 0,   // default precision on numbers is 0
            grouping: 3,    // digit grouping (not implemented yet)
            thousand: ',',
            decimal: '.',
            positivePre: '',
            positiveSuf: '',
            negativePre: '-',
            negativeSuf: ''
        }
    };

    var unformat = currency.unformat = function (value, decimal) {

        /// TODO: need to do more check
        value = value || 0;

        // return the value as-is if it's already a number:
        if (typeof value === 'number') {
            return value;
        }

        decimal = decimal || currency.options.number.decimal;

        // build regex to strip out everything except digits, decimal point and minus sign
        var regex = new RegExp('[^0-9-' + decimal + 'e]', 'g'),
            ret = parseFloat(
                ('' + value)
                    .replace(/\((.*)\)/, '-$1') // replace bracketed values with negatives
                    .replace(regex, '')         // strip out any cruft
                    .replace(decimal, '.')      // make sure decimal point is standard
            );

        /// TODO: may cause bugs
        return !isNaN(ret) ? ret : 0;
    };

    // fixes native `toFixed` rounding issues (eg. (0.615).toFixed(2) === "0.61")
    currency.toFixed = function (value, precision) {
        precision = checkPrecision(precision, currency.options.number.precision);
        var power = Math.pow(10, precision);

        // multiply up by precision, round accurately, then divide and use native `toFixed`
        return (Math.round(unformat(value) * power) / power).toFixed(precision);
    };

    var formatNumber = currency.formatNumber = function (number, precision, grouping, thousand, decimal) {
        if (number == null || !isFinite(number) || isObject(number)) {
            return number;
        }

        number = unformat(number);

        var isNegative = number < 0,
            opts,
            numStr,
            formattedText = '',
            parts = [];

        number = Math.abs(number);
        numStr = '' + number;


        opts = merge((isObject(precision) ? precision : {
            precision: precision,
            grouping: grouping,
            thousand: thousand,
            decimal: decimal
        }), currency.options.number);

        precision = checkPrecision(opts.precision, currency.options.number.precision);
        grouping = checkPrecision(opts.grouping, currency.options.number.grouping);
        thousand = opts.thousand;
        decimal = opts.decimal;

        // check the fraction length
        // precision = Math.min((numStr.split(decimal)[1] || '').length, precision);

        // eg. 6.156 -> 6.16
        var pow = Math.pow(10, precision);
        number = Math.round(number * pow) / pow;

        var section = ('' + number).split(decimal),
            whole = section[0],             // the integer part
            fraction = section[1] || '',    // the fraction part
            i,
            len = whole.length;

        // format the integer part
        for (i = 0; i < len; i++) {
            if ((len - i) % grouping === 0 && i !== 0) {
                formattedText += thousand;
            }
            formattedText += whole.charAt(i);
        }

        // format the fraction part
        while (fraction.length < precision) {
            fraction += '0';
        }

        if (precision) {
            formattedText += decimal + fraction;
        }

        parts.push(isNegative ? opts.negativePre : opts.positivePre);
        parts.push(formattedText);
        parts.push(isNegative ? opts.negativeSuf : opts.positiveSuf);
        return parts.join('');
    };

    currency.formatMoney = function (number, currencySymbol, precision, grouping, thousand, decimal, format) {

        if (number == null || !isFinite(number) || isObject(number)) {
            return number;
        }

        number = unformat(number);
        var isNegative = number < 0,
            isObj = isObject(currencySymbol),
            positivePre = isObj ? (currencySymbol.positivePre || currency.options.money.positivePre) : currency.options.money.positivePre,
            positiveSuf = isObj ? (currencySymbol.positiveSuf || currency.options.money.positiveSuf) : currency.options.money.positiveSuf,
            negativePre = isObj ? (currencySymbol.negativePre || currency.options.money.negativePre) : currency.options.money.negativePre,
            negativeSuf = isObj ? (currencySymbol.negativeSuf || currency.options.money.negativeSuf) : currency.options.money.negativeSuf,

            opts = merge((isObj ? currencySymbol : {
                symbol: currencySymbol,
                format: format,
                precision: precision,
                grouping: grouping,
                thousand: thousand,
                decimal: decimal,
                positivePre: '',
                positiveSuf: '',
                negativePre: '',
                negativeSuf: ''
            }), currency.options.money);

        var useFormat;

        if (isNegative) {
            useFormat = negativePre + opts.format + negativeSuf;
        } else {
            useFormat = positivePre + opts.format + positiveSuf;
        }

        return  useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), opts));
    };

    // Helpers
    // ----------------

    var toString = Object.prototype.toString;

    function isObject(value) {
        return value && toString.call(value) === '[object Object]';
    }

    // check and normalise the value of precision
    // (must be positive integer)
    function checkPrecision(val, base) {
        val = Math.round(Math.abs(val));
        return isNaN(val) ? base : val;
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
            return currency;
        });
    } else if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            // NodeJS
            module.exports = currency;
        }
    } else {

        currency.noConflict = (function (old) {
            return function () {
                // reset the value of the root's `currency` object
                global.currency = old;
                // reset the noConflict method
                currency.noConflict = function () {
                };
                // return reference to the library to re-assign it
                return currency;
            };
        })(global.currency);

        global['currency'] = currency;
    }
})(this);