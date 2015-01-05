var toString = Object.prototype.toString;
var hasOwn = Object.prototype.hasOwnProperty;
var arrayPrototype = Array.prototype;
var nativeIndexOf = arrayPrototype.indexOf;
var nativeIsArray = arrayPrototype.isArray;

function indexOf(array, item) {
    if (nativeIndexOf) {
        return nativeIndexOf.call(array, item);
    } else {
        for (var i = 0, len = array.length; i < len; i++) {
            if (array[i] === item) {
                return i;
            }
        }
    }

    return -1;
}

function isArray(obj) {
    if (nativeIsArray) {
        return nativeIsArray.call(obj);
    }
    return '[object Array]' === toString.call(obj);
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

var DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(",");
for (var i in {
    toString: 1
}) {
    DONT_ENUM = false;
}

Object.keys = Object.keys || function (obj) {
    var result = [];
    for (var key in obj) if (hasOwn.call(obj, key)) {
        result.push(key)
    }
    if (DONT_ENUM && obj) {
        for (var i = 0; key = DONT_ENUM[i++];) {
            if (hasOwn.call(obj, key)) {
                result.push(key);
            }
        }
    }
    return result;
};

function objectLength(obj) {
    return Object.keys(obj).length;
}