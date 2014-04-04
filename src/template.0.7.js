;
(function (global) {
    'use strict';


    function Template(options) {
        this.options = options;
        this.filters = options.filters || {};
    }

    Template.prototype = {
        constructor: Template,
        method: {
            isArray: Array.isArray || function (obj) {
                return '[object Array]' === Object.prototype.toString.call(obj);
            },
            each: function (data, callback) {
                var i,
                    l;
                if (this.method.isArray(data)) {
                    for (i = 0, l = data.length; i < l; i++) {
                        callback.call(data, data[i], i, data);
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
                        'for(var ' + iterate + ' in ' + data + ') {' +
                        'if(' + data + '.hasOwnProperty(' + iterate + ')) {' +
                        'var ' + item + '=' + data + '[' + iterate + '];' +
                        'var ' + key + '=' + iterate + ';' +
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
                    return '<%=' + variable + '%>';
                })

                // clean up comments
                .replace(this.rComment, '')

                // inline
                .replace(this.rInline, function (input, text) {
                    // %7B - {
                    // %7D - }
                    return '%7B%7B' + text + '%7D%7D';
                })
            ;
            return source;
        },
        _toNative: function (source) {
            var buffer = '';
            if (this.options.uglify != false) {
                buffer += source
                    .replace(/\\/g, '\\\\')
                    .replace(/[\r\t\n]/g, ' ')
                    .replace(/'(?=[^%]*%>)/g, '\t')
                    .split("'").join("\\'")
                    .split("\t").join("'")
                    .replace(/<%=(.+?)%>/g, "';_out+=$1;_out+='")
                    .split("<%").join("';")
                    .split("%>").join("_out+='") +
                    "';return _out;";
            } else {
                buffer += source
                    .replace(/\\/g, "\\\\")
                    .replace(/[\r]/g, "\\r")
                    .replace(/[\t]/g, "\\t")
                    .replace(/[\n]/g, "\\n")
                    .replace(/'(?=[^%]*%>)/g, "\t")
                    .split("'").join("\\'")
                    .split("\t").join("'")
                    .replace(/<%=(.+?)%>/g, "';_out+=$1;_out+='")
                    .split("<%").join("';")
                    .split("%>").join("_out+='") +
                    "';return _out.replace(/[\\r\\n]\\s+[\\r\\n]/g, '\\r\\n');";
            }
            return buffer;
        },
        parse: function (source) {
            var
                that = this,
                mordern = ''.trim,
                openTag = that.options.openTag,
                closeTag = that.options.closeTag,
                output = mordern
                    ? ["__out__ = '';", "__out__ += ", ";", "__out__"]
                    : ["__out__ = [];", "__out__.push(", ");", "__out__.join('')"]
                ,
                buffer = '',

                trim = function (str) {
                    str = str.replace(/^\s+/g, '');
                    for (var i = str.length - 1; i >= 0; i--) {
                        if (/\S/.test(str.charAt(i))) {
                            str = str.substring(0, i + 1);
                            break;
                        }
                    }
                    return str;
                },

                stringify = function (html) {
                    return "'" + html
                        // escape the single quotation marks and backslash
                        .replace(/('|\\)/g, '\\$1')
                        // escape the newline character(windows + linux)
                        .replace(/\r/g, '\\r')
                        .replace(/\n/g, '\\n') + "'";
                },

                handleHTML = function (html) {
                    if (that.uglify && html) {
                        // compress html
                        html = html
                            // remove additional line and blank space
                            .replace(/[\n\r\t\s]+/g, ' ')
                            // remove html comment
                            .replace(/<!--.*?-->/g, '');
                    }
                    return output[1] + stringify(html) + output[2] + '\n';
                },

                unshell = function (lexer) {
                    lexer = trim(lexer);
                    if (!lexer) {
                        return '';
                    }
                };

            this.method.each(source.split(openTag), function (section) {
                var sections = section.split(that.closeTag),
                    p1 = sections[0],
                    p2 = sections[1];
                if (1 === sections.length) {
                    buffer += handleHTML(p1);
                } else {
                    p1 && (buffer += unshell(p1));
                    buffer += handleHTML(p2);
                }
            });


            if (this.options.loose) {
                source = this._lexer(source) + source;
            }
            source = this._unshell(source);
            source = this._toNative(source);

            this._render = new Function('__, __filter', source);
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
    diglett.filters = {};

    diglett.options = {
        'openTag': '{{',
        'closeTag': '}}',
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
        this.compile(source, options);
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

})
    (this);