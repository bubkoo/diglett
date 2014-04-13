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
            l = array.length;
        for (; i < l; i++) {
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


    register('filter', function (array, expression) {
        if (!isArray(array) || !expression) {
            return array;
        }
        if (!(expression = trim(expression))) {
            expression = '+';
        } else {
            var userFilter = diglett.getUserFilter(expression);
            if (userFilter && isFunction(userFilter)) {
                expression = userFilter;
            }
        }

        if (isString(expression)) {
            var out = [],
                sections = expression.split(','),
                rField = /(\S+?)([>=<^]{1,2})(.+)/g,
                field,
                compares = [],
                compare,
                operator,
                value,
                matches,
                i = 0,
                l = sections.length;
            for (; i < l; i++) {
                matches = rField.exec(sections[i]);// sections[i].match(rField);
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
                                            while (nativeItem = native.shift()) {
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
            l = array.length;
            var j = 0,
                k = compares.length,
                flag;
            for (; i < l; i++) {
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

        } else if (isFunction(expression)) {
            return expression(array);
        }

        return array;

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

    diglett.getUserFilter = function (name) {
        var cache = diglett.userFilter || (diglett.userFilter = {});
        return cache[name];
    };

    diglett.removeUserFilter = function (name) {
        var cache = diglett.userFilter || (diglett.userFilter = {});
        if (cache.hasOwnProperty(name)) {
            delete cache[name];
        }
    };

    register('orderBy', function (array, sortFields) {
            // not an array or not assigned sort predicate
            if (!isArray(array)) {
                return array;
            }
            if (!sortFields || !(sortFields = trim(sortFields))) {
                sortFields = '+';
            } else {
                var cusOrder = diglett.getUserOrderBy(sortFields);
                if (cusOrder && isFunction(cusOrder)) {
                    sortFields = cusOrder;
                }
            }

            var arrayCopy = copyArray(array);

            if (isString(sortFields)) {
                sortFields = sortFields.replace(/\s*/g, '');
                var fields = sortFields.split(','),
                    sorters = [],
                    sorter,
                    descending = false,
                    flag,
                    field,
                    i = 0,
                    l = fields.length;
                for (; i < l; i++) {
                    field = fields[i];
                    flag = field.charAt(0);
                    if (flag == '+' || flag == '-') {
                        descending = flag == '-';
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
                    })(field, descending);

                    sorters.push(sorter);
                }

                arrayCopy.sort(doCompare);

                function doCompare(obj1, obj2) {
                    var i = 0,
                        l = sorters.length;
                    for (; i < l; i++) {
                        var comp = sorters[i](obj1, obj2);
                        if (comp !== 0) {
                            return comp;
                        }
                    }
                    return 0;
                }

            }

            else if (isFunction(sortFields)) {
                arrayCopy.sort(sortFields);
            }

            return arrayCopy;
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

    diglett.getUserOrderBy = function (name) {
        var cache = diglett.userOrderBy || (diglett.userOrderBy = {});
        return cache[name];
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


})(this);