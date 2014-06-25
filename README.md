# diglett

Diglett 是一个友好的前端（JavaScript）模板引擎，用来将数据和模板组合出最终的 HTML。模板本身比较轻量级，除了支持常用的模板语法之外，开发者还可以扩展自己的语法；此外，Diglett 还支持类似 Angular 的过滤器。

## 快速开始

### 引用 Diglett

在页面中引入 diglett：

```html
<script src="src/diglett.js"></script>
```

也可以通过支持 CMD（[SeaJS](http://seajs.org/)）或 AMD（[RequireJS](http://requirejs.org/)）规范的模块加载器来加载 Diglett。

### 编写模板

使用一个 `type=”text/template”` 的 `script` 标签存放模板：

```html
<script id="tpl" type="text/template">
<h1>{{ title }}</h1>
<ul>
    {{#each list}}
    <li>条目内容 {{ $index + 1 }} ：{{ $value }}</li>
    {{/each}}
</ul>
</script>
```

### 渲染模板

指定一个容器来存放渲染后的模板

```html
<div id="container"></div>
```
准备数据

```js
var data = {
    title: 'Language',
    list: ['JavaScript', 'C++', 'CSharp', 'Java', 'Python', 'PHP']
};
```

渲染模板

```js
var html = diglett('#tpl', data);
document.getElementById('container').innerHTML = html;
```

## 模板语法
### 变量替换 {{ 变量 }}

支持简单的变量替换

```js
var tpl = 'hello {{ name }} !';

var data = {
    name: 'diglett'
};

var html = diglett(tpl, data);
```

### 流程控制

#### if 语句

```js
var tpl = '{{#if title1}} has title1. {{/if}}';

var data = {
    title1: 'title',
    title2: ''
};

var html = diglett(tpl, data);
```

#### if-else 语句

```js
var tpl = '{{#if title2}} has title2. {{#else}} not has title2. {{/if}}';

var data = {
    title1: 'title',
    title2: ''
};

var html = diglett(tpl, data);
```

#### if-elseif-else 语句

```js
var tpl = '{{#if title2}}'
            + 'has title2.'
        + '{{#elseif title1}}'
            + 'has title1.'
        + '{{#else}}'
            + 'not has title.'
        + '{{/if}}';

var data = {
    title1: 'title',
    title2: ''
};

var html = diglett(tpl, data);
```

#### ifnot 语句

```js
var tpl = '{{#ifnot title2}}'
            + 'not has title2.'
        + '{{#else}}'
            + 'has title2'
        + '{{/if}}';

var data = {
    title1: 'title',
    title2: ''
};

var html = diglett(tpl, data);
```

### 循环遍历

可以对数组和对象进行循环遍历，遍历对象时相当于 `for-in` 循环，而且进行了 `hasOwnProperty` 判断，只会列举本地属性。

最简使用方式 `{{#each list}} ... {{/each}}`，默认会注入 `$value`、`$index`、`$first`、`$last`、`$even` 和 `$odd` 这些变量供循环内部使用：

```js
var tpl = '{{#each list}}'
            + '索引：{{ $index + 1 }}，值：{{ $value }}'
        + '{{/each}}';

var data = {
    list: ['JavaScript', 'C++', 'CSharp', 'Java', 'Python', 'PHP']
};
```

指定 value 和 key

```js
var tpl = '{{#each as item index}}'
            + '索引：{{ index + 1 }}，值：{{ item }}'
        + '{{/each}}';

var data = {
    list: ['JavaScript', 'C++', 'CSharp', 'Java', 'Python', 'PHP']
};
```

只指定 value

```js
var tpl = '{{#each as item}}'
            + '索引：{{ $index + 1 }}，值：{{ item }}'
        + '{{/each}}';

var data = {
    list: ['JavaScript', 'C++', 'CSharp', 'Java', 'Python', 'PHP']
};
```

## 过滤器