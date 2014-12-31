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

    __toNative: function (source) {},

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

        source = instance._unshell(source);
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
