/**
 * Created by Johnny.Peng on 14-4-2.
 */
;
(function (global) {
    'use strict';


    var toString = Object.prototype.toString;

    var isArray = Array.isArray || function (obj) {
        return '[object Array]' === toString.call(obj);
    };

    var isFunction = function (value) {
        return typeof value === 'function';
    };
    // fallback for older versions of Chrome and Safari
    if (isFunction(/x/)) {
        isFunction = function (value) {
            return typeof value === 'function' && toString.call(value) === '[object Function]';
        };
    }

    var forEach = function (data, callback) {
        var i,
            l;
        if (isArray(data)) {
            for (i = 0, l = data.length; i < l; i++) {
                callback.call(data, data[i], i, data);
            }
        } else {
            for (i in data) {
                callback.call(data, data[i], i);
            }
        }
    };

    var trim = function (str) {
        str = str.replace(/^\s+/g, '');
        for (var i = str.length - 1; i >= 0; i--) {
            if (/\S/.test(str.charAt(i))) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return str;
    };

    var merge = function (target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                // 在 iPhone 1 代等设备的 Safari 中，prototype 也会被枚举出来，需排除
                if (key !== 'prototype') {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };

    var compiler = function (tpl, options) {
        this.tpl = tpl;
        this.openTag = diglett.options.openTag;
        this.closeTag = diglett.options.closeTag;
        this.line = 0;
        this.debug = true;
        this.uglify = false;
        this.buffer = '';
        this.declareList = {};
        this.commands = diglett.commands;
        this.filters = diglett.filters;


        // 在 IE6-8 下，数组 push 方法拼接字符串会比 += 快
        // 现代浏览器使用 += 会比数组 push 方法快
        // 在 v8 引擎中，使用 += 方式比数组拼接快 4.7 倍
        var mordern = ''.trim;
        this.out = mordern
            ? ["__out__ = '';", "__out__ += ", ";", "__out__"]
            : ["__out__ = [];", "__out__.push(", ");", "__out__.join('')"];
    }

    compiler.prototype = {
        constructor: compiler,
        compile: function () {
            var that = this,
                fnBody,
                declare = '\'use strict\';\n'
                    + 'var __ = __ || {},\n'
                    + '__filters = __.__filters || {},\n';

            forEach(this.tpl.split(this.openTag), function (section) {
                var sections = section.split(that.closeTag),
                    p1 = sections[0],
                    p2 = sections[1];

                if (1 === sections.length) {
                    that.buffer += that.parser(p1);
                } else {
                    p1 && (that.buffer += that.lexer(p1));
                    that.buffer += that.parser(p2);
                }
            });

            for (var key in this.declareList) {
                if (this.declareList.hasOwnProperty(key)) {
                    declare += key + ' = __.' + key + ',\n';
                }
            }
            declare += this.out[0] + '\n\n';
            fnBody = declare + that.buffer + 'return ' + this.out[3] + ';';

            console.log(fnBody);
        },
        compress: function (html) {
            // 压缩 HTML，删除多余的空白和注释
            if (this.uglify && html) {
                html = html
                    .replace(/[\n\r\t\s]+/g, ' ')
                    .replace(/<!--.*?-->/g, '');
            }
            return html;
        },
        stringify: function (html) {
            return "'" + html
                // 单引号与反斜杠转义
                .replace(/('|\\)/g, '\\$1')
                // 换行符转义(windows + linux)
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n') + "'";
        },
        parser: function (html) {
            // 记录行号
            this.line += html.split(/\n/).length;
            if (html) {
                html = this.compress(html);
                html = this.out[1] + this.stringify(html) + this.out[2] + '\n';
            }
            return html;
        },
        lexer: function (grammar) {
            grammar = trim(grammar);
            if (!grammar) {
                return;
            }
            var start = grammar[0],
                command = grammar.substr(1),
                params = command.split(/[\s]+/);
            command = params.shift();
            command += '^' === start ? start : '';
            command = command.toLowerCase();
            switch (start) {
                case '#':// #if #elseif #each #else
                case '@':// @if @elseif @each @else
                case '^':// ^if ^else
                    // #if arg
                    // #if arg | filter1:param | filter2
                    // #each items
                    // #each items as $item $index
                    // #each items | filter:param | filter2 as $item $index
                    // #each items | filter:param as $item $index

                    if (!this.declareList.hasOwnProperty(params[0])) {
                        this.declareList[params[0]] = 1;
                    }
                    if (this.commands.hasOwnProperty(command)) {
                        var fn = this.commands[command];
                        if (isFunction(fn)) {
                            return fn.call(this.commands, params);
                        }
                    }
                    break;
                case '/':
                    // 结束或双括号转义
                    if ('/' === grammar[1]) {
                        return '{{' + grammar.substr(2) + '}}';
                    } else {
                        command = ('end' + command).toLowerCase();
                        if (this.commands.hasOwnProperty(command)) {
                            var fn = this.commands[command];
                            if (isFunction(fn)) {
                                return fn.call(this.commands, params);
                            }
                        } else {
                            return '}';
                        }
                    }
                    break;
                case '!':
                    // 注释
                    return '';
                    break;
                default :
                    // 普通变量
                    // data | filter1:param | filter2

                    params = grammar.split(/\s*\|\s*/);
                    grammar = params[0];
                    if (!this.declareList.hasOwnProperty(grammar)) {
                        this.declareList[grammar] = 1;
                    }

                    var i,
                        len = params.length,
                        filter,
                        filterArgs;
                    if (len > 1) {
                        for (i = 1; i < len; i++) {
                            filterArgs = params[i].split(/\s*:\*/);
                            filter = filterArgs.shift();
                            filterArgs.unshift(grammar)
                            grammar = '__filters[' + filter + '] ? __filters[' + filter + '].apply(null,' + filterArgs + ') : ' + grammar;
                        }
                    }
                    return this.out[1] + grammar + this.out[2] + '\n';
                    break;
            }
        }
    };


    var diglett = function (tpl, data, options) {

    };

    diglett.version = '0.0.6';

    var cache = diglett.cache = {};
    var commands = diglett.commands = {};
    var filters = diglett.filters = {};

    diglett.options = {
        openTag: '{{',
        closeTag: '}}',
        cache: true,
        debug: true,
        uglify: true
    };

    diglett.config = function (options) {

    };

    diglett.compile = function (tpl) {
//        try {
        new compiler(tpl).compile()
//        }
//        catch (e) {

//        }
    };

    diglett.render = function () {

    };

    diglett.addCommand = function (name, command) {
        if (!commands.hasOwnProperty(name)) {
            commands[name] = command;
        }
    };

    diglett.removeCommand = function (name) {
        if (commands.hasOwnProperty(name)) {
            delete commands[name];
        }
    };

    diglett.addFilter = function (name, filter) {
        if (!filters.hasOwnProperty(name)) {
            filters[name] = filter;
        }
    };

    diglett.removeFilter = function (name) {
        if (filters.hasOwnProperty(name)) {
            delete filters[name];
        }
    };


    (function (commands) {
        var nativeCommands = {
            'if': function (params) {
                return 'if(' + params.join(' ') + '){';
            },
            '^if': function (params) {
                return 'if(!(' + params.join(' ') + ')){';
            },
            'elseif': function (params) {
                return 'else if(' + params.join(' ') + '){';
            },
            'else': function (params) {
                return '{';
            },
            'each': function (params) {
                var buffer = '~function(){';

                return buffer;
            },
            'endeach': function () {
                return '}();'
            },
            'with': function (params) {
                return '~function() {}();'
            }
        };
        nativeCommands['^else'] = nativeCommands['elseif'];
        merge(commands, nativeCommands);
    })(diglett.commands);

    (function (filters) {
        var nativeFilters = {
            'html': function () {
            },
            'money': function () {
            },
            'datetime': function () {
            }
        };
        merge(filters, nativeFilters);
    })(diglett.filters);

    if (typeof define === 'function') {
        // RequireJS && SeaJS
        define(function () {
            return diglett;
        })
    } else if (typeof exports !== 'undefined') {
        // NodeJS
        module.exports = diglett;
    }

    global.diglett = diglett;

})(this);
