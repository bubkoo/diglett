;
(function (global) {
    'use strict';


    function Template(options) {
        this.options = options;
        this.filters = options.filters || {};

        //
        this.rEachStart = new RegExp(this.options.openTag + '\\s*[#@]each\\s+(\\S+)(?:\\s+as\\s+)?(\\S*)?\\s*(\\S*)?\\s*' + this.options.closeTag, 'igm');
        this.rEachEnd = new RegExp(this.options.openTag + '\\s*\\/each\\s*' + this.options.closeTag, 'igm');
        this.rIfStart = new RegExp(this.options.openTag + '\\s*[#@]if\\s+(.*?)\\s*' + this.options.closeTag, 'igm');
        this.rIfEnd = new RegExp(this.options.openTag + '\\s*\\/if\\s*' + this.options.closeTag, 'igm');
        this.rElse = new RegExp(this.options.openTag + '\\s*[#@]else\\s*' + this.options.closeTag, 'igm');
        this.rElseIf = new RegExp(this.options.openTag + '\\s*[#@]else\\s*if\\s+(.*?)\\s*' + this.options.closeTag, 'igm');
        this.rInterpolate = new RegExp(this.options.openTag + '\\s*((?!\\/|#|@|\\/\\/|!--)[\\s\\S]+?)\\s*' + this.options.closeTag, 'igm');
        this.rComment = new RegExp(this.options.openTag + '!--[\\s\\S]*--' + this.options.closeTag, 'igm');
        this.rInline = new RegExp(this.options.openTag + '\\s*\\/\\/(.*)\\s*' + this.options.closeTag, 'igm');
    }

    Template.prototype = {
        constructor: Template,

        method: {
            each: function (data, callback) {
                var i,
                    l,
                    isArray = Array.isArray || function (obj) {
                        return '[object Array]' === Object.prototype.toString.call(obj);
                    };
                if (isArray(data)) {
                    for (i = 0, l = data.length; i < l; i++) {
                        callback.call(data, data[i], i);
                    }
                } else {
                    for (i in data) {
                        if (data.hasOwnProperty(i)) {
                            callback.call(data, data[i], i);
                        }
                    }
                }
            }
        },

        filter: {
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
        },

        _unshell: function (source) {
            var that = this;
            source = source
                // each expression
                // {{#each items}} // default key is $index, default $value
                // {{#each items as $value}}
                // {{#each items as $value $index}}
                .replace(this.rEachStart, function (input, data, value, key) {
                    value = value || '$value';
                    key = key || '$index';
                    return '<% __method["each"](' + data + ', function(' + value + ', ' + key + '){ %>';
                })
                .replace(this.rEachEnd, '<% }); %>')

                // if expression
                .replace(this.rIfStart, function (input, condition) {
                    return '<% if(' + condition + ') { %>';
                })
                .replace(this.rIfEnd, '<% } %>')

                // else expression
                .replace(this.rElse, function () {
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
                            buffer = content + (args.length ? ',"' + args.join('","') + '"' : '');
                            content = '__filter["' + filter + '"].call(this,' + buffer + ')';
                        }
                    }
                    return '<%=' + content + '%>';
                })

                // clean up comments
                .replace(this.rComment, '')

                // inline
                .replace(this.rInline, function (input, text) {
                    return that.options.openTag + text + that.options.closeTag;
                });

            return source;
        },

        _toNative: function (source) {
            var buffer = "'use strict';"; // use strict mode
            buffer += "__ = __ || {};";
            buffer += "__filter = __filter || {};";
            buffer += "__method = __method || {};";
            buffer += "var __out='';__out+='";
            buffer += source
                .replace(/\\/g, '\\\\')
                .replace(/[\r\t\n]/g, ' ')
                .replace(/'(?=[^%]*%>)/g, '\t')
                .split("'").join("\\'")
                .split("\t").join("'")
                .replace(/<%=(.+?)%>/g, "';__out+=$1; __out+='")
                .split('<%').join("';")
                .split('%>').join("__out+='") +
                "';return __out.replace(/[\\r\\n]\\s+[\\r\\n]/g, '\\r\\n');";
            return buffer;
        },

        _getVariable: function (source) {
            var variables = [],
                declare,
                method = [],
                reserved = [
                    // keywords
                    'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'false',
                    'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'null', 'return', 'switch', 'this',
                    'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with',

                    // reserved
                    'abstract', 'boolean', 'byte', 'char', 'class', 'const', 'double', 'enum', 'export', 'extends',
                    'final', 'float', 'goto', 'implements', 'import', 'int', 'interface', 'long', 'native',
                    'package', 'private', 'protected', 'public', 'short', 'static', 'super', 'synchronized',
                    'throws', 'transient', 'volatile',

                    // ECMA 5 - use strict
                    'arguments', 'let', 'yield',

                    'undefined', 'NaN'
                ],

                indexOf = function (array, item) {
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
                },

                variableAnalyze = function (input, variable) {
                    // variable name should start with A-Z, a-z, _ or $
                    variable = variable.match(/[A-Za-z_$][A-Za-z0-9_$]+/igm)[0];
                    if (variable && indexOf(variables, variable) === -1) {
                        variables.push(variable);
                    }
                };

            source.replace(this.rEachStart, variableAnalyze).
                replace(this.rIfStart, variableAnalyze).
                replace(this.rElseIf, variableAnalyze).
                replace(this.rInterpolate, function (input, statement) {
                    // filter
                    statement = statement.split('|')[0];
                    // match variables
                    var match = statement.match(/[A-Za-z_$][A-Za-z0-9_$]+/igm),
                        variable,
                        i,
                        len = match.length;
                    for (i = 0; i < len; i++) {
                        variable = match[i];
                        if (variable && indexOf(variables, variable) === -1) {
                            variables.push(variable);
                        }
                    }
                    // contains operator
                    if (/[\+\-\*\/%!\?\|\^&~<>=,\(\)\[\]]/.test(input)) {
                        return '(' + input + ')';
                    }
                });

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

        parse: function (source) {
            source = this._getVariable(source) + source;
            source = this._unshell(source);
            source = this._toNative(source);

            this._render = new Function('__, __method, __filter', source);
            var that = this;
            this.render = function (data, options) {
                options = options || {};
                var filter = merge(options.filter, that.filter),
                    method = merge(options.method, that.method);
                return that._render.call(this, data, method, filter);
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

    // cache the compiled template
    diglett.cache = {};

    diglett.options = {
        'openTag': '{{',
        'closeTag': '}}',
        'cache': true,  // cache the compiled template
        'debug': true
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
        return this.compile(source, options).render(data, options);
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