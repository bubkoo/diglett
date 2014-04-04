;
(function (global) {
    'use strict';


    function Template(options) {
        this.options = options;
        this.filters = options.filters || {};

        this.rEachStart = /{{\s*[#@]each\s+(\S+)(?:\s+as\s+)?(\S*)?\s*(\S*)?\s*}}/igm;
        this.rEachEnd = /{{\s*\/each\s*}}/igm;
        this.rIfStart = /{{\s*[#@]if\s+(.*?)\s*}}/igm;
        this.rIfEnd = /{{\s*\/if\s*}}/igm;
        this.rElse = /{{\s*[#@]else\s*}}/igm;
        this.rElseIf = /{{\s*[#@]else\s*if\s+(.*?)\s*}}/igm;
        this.rInterpolate = /{{\s*((?!\/|#|@|\/\/|!--)[\s\S]+?)\s*}}/igm;
        this.rComment = /{{!--[\s\S]*--}}\s*/igm;
        this.rInline = /{{\s*\/\/(.*)\s*}}/igm;
    }

    Template.prototype = {
        constructor: Template,
        _lexer: function (source) {
            var variables = [],
                declare;

            var indexOf = function (array, item) {
                if (Array.prototype.indexOf) {
                    return Array.prototype.indexOf.call(array, item);
                }

                var i,
                    len;

                for (i = 0, len = array.length; i < len; i++) {
                    if (array[i] === item) {
                        return i;
                    }
                }

                return -1;
            };

            var variableAnalyze = function (input, statement) {
                statement = statement.match(/\w+/igm)[0];

                if (indexOf(variables, statement) === -1) {
                    variables.push(statement);
                }
            }

            source.replace(this.rEachStart, variableAnalyze).
                replace(this.rIfStart, variableAnalyze).
                replace(this.rElseIf, variableAnalyze).
                replace(this.rInterpolate, variableAnalyze);

            var i,
                len = variables.length;
            if (len > 0) {
                declare = 'var ';
                for (i = 0; i < len; i++) {
                    declare += variables[i] + '=__.' + variables[i] + ',';
                }
            }
            if (declare) {
                return '<%' + declare.substr(0, declare.length - 1) + '; %>';
            } else {
                return '';
            }
        },
        _unshell: function (source) {
            var counter = 0;
            source = source
                // each expression
                // {{#each items}} // default key is $index, default $value
                // {{#each items as $value}}
                // {{#each items as $value $index}}
                .replace(this.rEachStart, function (input, data, item, key) {
                    item = item || '$value';
                    key = key || '$index';
                    var iterate = 'i' + counter++;

                    return '<% ~function() {' +
                        'var __isArray = Object.prototype.toString.call(' + data + ') === \'[object Array]\' , ' + item + ' , ' + key + ';' +
                        'for(var ' + iterate + ' in ' + data + ') {' +
                        'if(' + data + '.hasOwnProperty(' + iterate + ')) {' +
                        item + ' = ' + data + '[' + iterate + '];' +
                        key + ' = ' + iterate + ';' +
                        '__isArray && (' + key + ' = parseInt(' + key + '));' +
                        ' %>';
                })
                .replace(this.rEachEnd, '<% }}}(); %>')

                // if expression
                .replace(this.rIfStart, function (input, condition) {
                    return '<% if(' + condition + ') { %>';
                })
                .replace(this.rIfEnd, '<% } %>')

                // else expression
                .replace(this.rElse, function (input) {
                    return '<% } else { %>';
                })

                // else if expression
                .replace(this.rElseIf, function (input, condition) {
                    return '<% } else if(' + condition + ') { %>';
                })

                // interpolate
                .replace(this.rInterpolate, function (input, variable) {
                    var filters = variable.split(/\s*\|\s*/g),
                        content = filters.shift(),
                        filter,
                        args,
                        buffer,
                        i,
                        len = filters.length;
                    if (len) {
                        for (i = 0; i < len; i++) {
                            args = filters[i].split(/\s*:\s*/g);
                            filter = args.shift();
                            buffer = content+(args.length?',"'+args.join('","')+'"':'');
                            content = '__filters["' + filter + '"].call(this,' + buffer +')';
                        }
                    }
                    return '<%=' + content + '%>';
                })

                // clean up comments
                .replace(this.rComment, '')

                // inline
                .replace(this.rInline, function (input, text) {
                    return '{{' + text + '}}';
                })
            ;
            return source;
        },
        _toNative: function (source) {
            var buffer = "'use strict';"; // use strict mode
            buffer += "var __ = __ || {};";
            buffer += "var __filters = __filters || {};";
            buffer += "var __out='';__out+='";
            if (this.options.uglify !== false) {
                buffer += source
                    .replace(/\\/g, '\\\\')
                    .replace(/[\r\t\n\s]+/g, ' ')
                    .replace(/'(?=[^%]*%>)/g, '\t')
                    .split("'").join("\\'")
                    .split("\t").join("'")
                    .replace(/<%=(.+?)%>/g, "';__out+=$1;__out+='")
                    .split("<%").join("';")
                    .split("%>").join("__out+='") +
                    "';return __out;";
            } else {
                buffer += source
                    .replace(/\\/g, "\\\\")
                    .replace(/[\r]/g, "\\r")
                    .replace(/[\t]/g, "\\t")
                    .replace(/[\n]/g, "\\n")
                    .replace(/'(?=[^%]*%>)/g, "\t")
                    .split("'").join("\\'")
                    .split("\t").join("'")
                    .replace(/<%=(.+?)%>/g, "';__out+=$1;__out+='")
                    .split("<%").join("';")
                    .split("%>").join("__out+='") +
                    "';return __out.replace(/[\\r\\n]\\s+[\\r\\n]/g, '\\r\\n');";
            }
            return buffer;
        },
        parse: function (source) {
            source = this._lexer(source) + source;
            source = this._unshell(source);
            source = this._toNative(source);

            this._render = new Function('__, __filters', source);
            var that = this;
            this.render = function (data, filters) {
                filters = merge(filters, that.filters);
                return that._render.call(this, data, filters);
            };

            return this;
        }
    };

    var diglett = function (source, data) {
        // call `compile` or `render` with default options
        if (data) {
            return diglett.render.call(diglett, source, data, diglett.options);
        } else {
            return diglett.compile.call(diglett, source, diglett.options);
        }
    };

    diglett.version = '0.0.6';

    diglett.cache = {};
    diglett.method = {};
    diglett.filters = {
        'html': function (content) {
            var escapeMap = {
                '<': '&#60;',
                '>': '&#62;',
                '"': '&#34;',
                '\'': '&#39;',
                '&': '&#38;'
            };
            return new String(content)
                .replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
                    s = escapeMap[s];
                    return  s || '&#38;';
                });
        }
    };

    diglett.options = {
        'cache': true,  // cache the compiled template
        'debug': true,
        'uglify': true  // compress HTML output, remove line break and additional blank space.
    };

    diglett.compile = function (source, options) {
        options = fixOptions(options);
        options.filters = this.filters;

        // source is element's ID, like this #nodeId
        var regId = /^\s*#([\w:\-\.]+)\s*$/igm;
        if (source.match(regId)) {
            source.replace(regId, function (input, id) {
                var doc = document,
                    ele = doc && doc.getElementById(id);
                source = ele ? (ele.value || ele.innerHTML) : input;
            });
        }

        var engine = options.cache !== false && this.cache[source]
            ? this.cache[source]
            : new Template(options).parse(source);

        // set cache
        if (options.cache !== false) {
            this.cache[source] = engine;
        }

        return engine;

    };

    diglett.render = function (source, data, options) {
        return  this.compile(source, options).render(data);
    };


    function merge(target, source) {
        var key;
        target || (target = {});
        if (source) {
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    function fixOptions(options) {
        var ret = {};
        merge(ret, diglett.options);
        merge(ret, options);
        return ret;
    }

    if (typeof define === 'function') {
        // RequireJS && SeaJS
        define(function () {
            return diglett;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // NodeJS
        module.exports = diglett;
    } else {
        global.diglett = diglett;
    }

})(this);