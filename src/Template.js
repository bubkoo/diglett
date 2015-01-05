var defaults = {
    cached: true,
    debug: true,
    open: '{{',
    close: '}}'
};

function Template(options) {
    var instance = this;

    instance.options = options;

    return instance;
}

Template.cache = {};
Template.version = '0.0.1';

Template.prototype = {
    constructor: Template,

    _unShell: function (source) {},

    _toNative: function (source) {},

    parse: function (source) {
        var instance = this;
        var options = instance.options;
        var cache = Template.cache;
        var cached = options.cached; // cache or not

        var result;
        // get cache
        cached && (result = cache[source]);
        if (result) {
            return result;
        }

        // source is element's ID (PS: #nodeId)
        var regId = /^\s*#([\w:\-\.]+)\s*$/igm;
        if (source.match(regId)) {
            source.replace(regId, function (input, id) {
                var doc = document;
                var ele = doc && doc.getElementById(id);
                source = ele ? (ele.value || ele.innerHTML) : input;
            });
        }

        source = instance._unShell(source);
        source = instance._toNative(source);

        var fn = new Function('__, __method, __filter', source);

        result = function (data) {

        };

        // set cache
        cached && (cache[source] = result);

        return result;
    }
};

// Helpers
// -------

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

var nativeIndexOf = Array.prototype.indexOf;

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
