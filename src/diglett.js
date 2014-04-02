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
        this.commands = diglett.commands;
        this.filters = diglett.filters;


        // 在 IE6-8 下，数组 push 方法拼接字符串会比 += 快
        // 现代浏览器使用 += 会比数组 push 方法快
        // 在 v8 引擎中，使用 += 方式比数组拼接快 4.7 倍
        var mordern = ''.trim;
        this.out = mordern
            ? ["$out='';", "$out+=", ";", "$out"]
            : ["$out=[];", "$out.push(", ");", "$out.join('')"];
    }

    compiler.prototype = {
        constructor: compiler,
        compile: function () {
            var that = this;
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
            if (grammar) {
                var start = grammar[0];
                var command = grammar.substr(1);
                switch (start) {
                    case '#':
                    case '@':
                        // 开始
                        this.commands[command].call();
                        break;
                    case '^':

                        break;
                    case '/':
                        // 结束或双括号转义
                        if ('/' === grammar[1]) {

                        }
                        break;
                    case '!':
                        // 注释
                        break;
                    default :
                        // 普通变量
                        break;
                }
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
        try {
            new compiler(tpl).compile()
        }
        catch (e) {

        }
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
            'if': function () {
            },
            'elseif': function () {
            },
            'else': function () {
            },
            'each': function () {
            },
            'with': function () {
            }
        };
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
