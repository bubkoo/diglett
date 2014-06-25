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

    function isObject(value) {
        return typeof value === 'object';
    }

    function isString(value) {
        return typeof value === 'string';
    }

    function int(value) {
        return parseInt(value, 10);
    }

    function copyArray(array) {
        var arrayCopy = [],
            i = 0,
            len = array.length;
        for (; i < len; i++) {
            arrayCopy.push(array[i]);
        }
        return arrayCopy;
    }

    function trim(str) {
        str = str.replace(/^\s+/g, '');
        for (var i = str.length - 1; i >= 0; i--) {
            if (/\S/.test(str.charAt(i))) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return str;
    }

    function compare(value1, value2) {
        var type1 = typeof value1;
        var type2 = typeof value2;
        if (type1 == type2) {
            if (type1 === 'string') {
                value1 = value1.toLowerCase();
                value2 = value2.toLowerCase();
            } else if (type1 === 'undefined') {
                return 0;
            }
            if (value1 === value2) return 0;
            return value1 < value2 ? -1 : 1;
        } else {
            return type1 < type2 ? -1 : 1;
        }
    }

    function compareEx(value1, value2) {
        var type1 = typeof value1;
        if (type1 === 'boolean') {
            if ((/true|false/ig).test(value2)) {
                value2 = value2.toLowerCase() === 'true';
            } else {
                value2 = !!value2;
            }
        } else if (type1 === 'number') {
            var temp = parseFloat(value2);
            if (!isNaN(temp)) {
                value2 = temp;
            }
        }
        return compare(value1, value2);
    }

    // ---------------

    var register;
    if (global.diglett) {
        register = global.diglett.registerFilter;
        if (!register || !isFunction(register)) {
            return;
        }
    } else {
        return;
    }


    register('filter', function (array) {

        if (!isArray(array)) {
            return array;
        }

        var expressions = Array.prototype.slice.call(arguments, 1),
            i = 0,
            len = expressions.length,
            getUserFilter = function (name) {
                var cache = diglett.userFilter || (diglett.userFilter = {});
                return cache[name];
            };


        if (len === 1) {
            var cusFilter = getUserFilter(expressions[0]);
            if (cusFilter && isFunction(cusFilter)) {
                return cusFilter(array);
            }
        }

        var
            out = [],
            field,
            operator,
            value,
            compares = [],
            compare,
            matches;

        for (; i < len; i++) {
            matches = expressions[i].match(/(\S+?)\s*([>=<^]{1,2})\s*(.+)/);
            if (matches) {
                field = matches[1];
                operator = matches[2];
                value = matches[3];

                compare = (function (field, operator, value) {

                    switch (operator) {
                        case '>':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }
                                var comp = compareEx(obj[field], value);
                                return comp === 1;
                            };
                            break;
                        case '>=':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }
                                var comp = compareEx(obj[field], value);
                                return comp === 1 || comp === 0;
                            };
                            break;
                        case '<':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }
                                var comp = compareEx(obj[field], value);
                                return comp === -1;
                            };
                            break;
                        case '<=':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }
                                var comp = compareEx(obj[field], value);
                                return comp === -1 || comp === 0;
                            };
                            break;
                        case '<>':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }
                                var comp = compareEx(obj[field], value);
                                return  comp !== 0;
                            };
                            break;
                        case '=':
                        case '==':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }
                                var comp = compareEx(obj[field], value);
                                return comp === 0;
                            };
                            break;
                        case '^': // contains
                        case '^^':
                            return function (obj) {
                                if (!isObject(obj)) {
                                    return true;
                                }

                                function contains(value1, value2) {
                                    var type = typeof value1;
                                    if (type === 'string') {
                                        return value1.toLowerCase().indexOf(value2.toLowerCase()) > -1;
                                    } else if (isArray(value1)) {
                                        var nativeItem;
                                        while (nativeItem = value1.shift()) {
                                            if (compareEx(nativeItem, value2) === 0) {
                                                return true;
                                            }
                                        }
                                        return false;
                                    } else if (type === 'object') {
                                        return contains(value1[field], value2);
                                    } else if (type === 'undefined') {
                                        return false;
                                    }
                                    return true;
                                }

                                return contains(obj[field], value);
                            };
                            break;
                        default :
                            break;
                    }
                })(field, operator, value);

                if (compare) {
                    compares.push(compare);
                }
            }
        }

        i = 0;
        len = array.length;
        var j = 0,
            k = compares.length,
            flag;

        for (; i < len; i++) {
            flag = true;
            for (j = 0; j < k; j++) {
                if (!compares[j](array[i])) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                out.push(array[i]);
            }
        }
        return out;
    });

    diglett.addUserFilter = function (name, fn, overwrite) {
        var cache = diglett.userFilter || (diglett.userFilter = {});
        if (cache.hasOwnProperty(name)) {
            if (overwrite) {
                cache[name] = fn;
            }
        } else {
            cache[name] = fn;
        }
    };

    diglett.removeUserFilter = function (name) {
        var cache = diglett.userFilter || (diglett.userFilter = {});
        if (cache.hasOwnProperty(name)) {
            delete cache[name];
        }
    };

    register('orderBy', function (array) {
            // not an array or not assigned sort predicate
            if (!isArray(array)) {
                return array;
            }

            var sortFields = Array.prototype.slice.call(arguments, 1),
                getUserOrderBy = function (name) {
                    var cache = diglett.userOrderBy || (diglett.userOrderBy = {});
                    return cache[name];
                },
                reverse,
                i = 0,
                len = sortFields.length;

            if (len > 0) {
                // the last argument is boolean
                if (typeof sortFields[len - 1] === 'boolean') {
                    reverse = sortFields[len - 1] === true;
                    sortFields.pop();
                    len = sortFields.length;
                }
            }

            var arrayCopy = copyArray(array);

            if (len === 1) {
                var cusOrder = getUserOrderBy(sortFields[0]);
                if (cusOrder && isFunction(cusOrder)) {
                    return arrayCopy.sort(cusOrder);
                }
            } else if (len === 0) {
                sortFields.push('+');
                len = 1;
            }

            var sorters = [],
                sorter,
                flag,
                field;
            for (; i < len; i++) {
                field = sortFields[i];
                if (!field) {
                    continue;
                }
                flag = field.charAt(0);
                if (flag === '+' || flag === '-') {
                    reverse = flag === '-' || reverse;
                    field = field.substring(1);
                }

                sorter = (function (field, descending) {
                    return function (obj1, obj2) {
                        if (isObject(obj1)) {
                            obj1 = obj1[field];
                        }
                        if (isObject(obj2)) {
                            obj2 = obj2[field];
                        }
                        if (descending) {
                            return compare(obj2, obj1);
                        }
                        return compare(obj1, obj2);
                    }
                })(field, reverse);

                sorters.push(sorter);
            }

            function doCompare(obj1, obj2) {
                var i = 0,
                    len = sorters.length;
                for (; i < len; i++) {
                    var comp = sorters[i](obj1, obj2);
                    if (comp !== 0) {
                        return comp;
                    }
                }
                return 0;
            }

            return arrayCopy.sort(doCompare);
        }
    );

    diglett.addUserOrderBy = function (name, fn, overwrite) {
        var cache = diglett.userOrderBy || (diglett.userOrderBy = {});
        if (cache.hasOwnProperty(name)) {
            if (overwrite) {
                cache[name] = fn;
            }
        } else {
            cache[name] = fn;
        }
    };

    diglett.removeUserOrderBy = function (name) {
        var cache = diglett.userOrderBy || (diglett.userOrderBy = {});
        if (cache.hasOwnProperty(name)) {
            delete cache[name];
        }
    };


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
            return out;
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


    if (typeof define === 'function') {
        // RequireJS && SeaJS
        define('registerFilter', 'diglett', function () {
            return diglett;
        });
    } else if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            // NodeJS
            module.exports = diglett;
        }
    } else {
        global.diglett = diglett;
    }
})(this);