;
(function (global) {

    // Helpers
    // ----------------

    var toString = Object.prototype.toString;


    function isFunction(val) {
        return toString.call(val) === '[object Function]';
    }

    function isArray(val) {
        if (Array.isArray) {
            return Array.isArray(val);
        } else {
            return toString.call(val) === '[object Array]';
        }
    }

    function isString(value) {
        return typeof value === 'string';
    }

    function int(value) {
        return parseInt(value, 10);
    }


    var register;
    if (global.diglett) {
        register = global.diglett.registerFilter;
        if (!register || !isFunction(register)) {
            return;
        }
    } else {
        return;
    }


//        register('filter', filter);

//        register('orderBy', filter);

    // limitTo filter
    // limit the length of an array or string
    register('limitTo', function (input, limit) {
        limit = int(limit);
        if (isNaN(limit)) {
            return input;
        }
        if (isString(input)) {
            if (limit) {
                return limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length);
            } else {
                return '';
            }
        } else if (isArray(input)) {
            var out = [],
                start,
                end,
                len = input.length;
            if (limit > len) {
                limit = len;
            } else if (limit < -len) {
                limit = -len;
            }

            if (limit > 0) {
                start = 0;
                end = limit;
            } else {
                start = len + limit;
                end = len;
            }

            for (; start < end; start++) {
                out.push(input[start]);
            }
        } else {
            return input;
        }
    });


    // register datetime filter
    var datetimeFilter = global.datetime && global.datetime.parse;
    if (datetimeFilter && isFunction(datetimeFilter)) {
        register('datetime', datetimeFilter);
    }

    // register currency and number filter
    var numberFilter = global.currency && global.currency.formatNumber;
    if (numberFilter && isFunction(numberFilter)) {
        register('number', numberFilter);
    }
    var currencyFilter = global.currency && global.currency.formatMoney;
    if (currencyFilter && isFunction(currencyFilter)) {
        register('currency', currencyFilter);
    }



})(this);