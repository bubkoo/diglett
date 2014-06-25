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

### 语法

过滤器的语法结构如下，可以同时指定多个过滤器，可以给过滤器传递参数：

`{{ value | filter1 | filter2:arg1:arg2...  ... }}`

### 内置过滤器

#### html

转义 html 标签中的 `<`、`>`、`"`、`\` 和 `&`

示例：

```js
var tpl = '{{ value | html }}';
var data = { value: '<span>这里是HTML<\span>' };

var result = diglett(tpl, data);
```

#### lowercase 转换为全小写

```js
var tpl = '{{ value | lowercase }}'
var data = { value: 'HELLO WORLD' };

var result = diglett(tpl, data);
```

#### uppercase 转换为全大写

```js
var tpl = '{{ value | uppercase }}'
var data = { value: 'hello world' };

var result = diglett(tpl, data);
```

### 外置过滤器

使用外置过滤器前，需要在页面中引入下面三个 JS 文件：

```html
<script src="currency.js"></script> // 需要使用货币过滤器时引入
<script src="datetime.js"></script> // 需要日期时间格式化时候引入
<script src="registerFilter.js"></script>
```

#### limitTo 限制字符串或数组的长度

限制字符串长度：`{{longStr | limitTo : 4 }}`

限制数组长度：

```txt
{{#each list | limitTo : 4 as item }}
<li>{{ item }}</li>
{{/each}}
```

#### orderBy 排序

**简单数组**

```js
var data = { arr: [8, 3, 9, 6, 7, 5, 1, 2, 4] };
```

升序(orderBy:+)：

```html
{{#each arr as item|orderBy:+}}
{{item}}
{{/each}}
```
降序(orderBy:-)：

```html
{{#each arr as item|orderBy:-}}
{{item}}
{{/each}}
```
**注意：**`+` 表示升序，`-` 表示降序，符号省略时默认为升序

**对象数组**

示例数据：
```js
var data = {
reverse: true,
objArr: [
	{name: 'Adam', phone: '555-5678', age: 35},
    {name: 'Julie', phone: '555-8765', age: 29},
    {name: 'Mike', phone: '555-4321', age: 21},
    {name: 'Mike', phone: '555-2321', age: 21},
    {name: 'Mike', phone: '555-6321', age: 21},
    {name: 'Mary', phone: '555-9876', age: 19},
    {name: 'John', phone: '555-1212', age: 10}]
};
```

语法：`{{#each objArr as item | orderBy:(+/-)排序的字段1:(+/-)排序字段2...:reverse }}`

**注意：**
1. 排序字段前面的 `+` 和 `-` 分别表示升序和降序，省略时默认为升序
2. 最后一个参数 `reverse` 为 `true` 时，表示对其紧靠的排序字段进行降序排列，否则进行升序排列
3. `reverse` 的使用方式[请参看](https://github.com/bubkoo/diglett/blob/master/test/sortable.html)

 
将示例数据按 `name` 升序，`phone` 降序：

```html
<table style="border:1px solid #ddd">
    <tr>
        <td style="width: 80px">
            Name
        </td>
        <td style="width: 140px">
            Phone Number
        </td>
        <td style="width: 40px">
            Age
        </td>
    </tr>
    {{#each objArr as item | orderBy : name : -phone}}
    <tr>
        <td>{{item.name}}</td>
        <td>{{item.phone}}</td>
        <td>{{item.age}}</td>
    </tr>
    {{/each}}
</table>
```
#### datetime

`{{ value | datetime:"yyyy-MM-dd HH:mm:ss" }}`

参数是时间格式，由于参数中有 `:`，**所以需要将参数放在双引号内**，可以使用如下占位符：
- `yyyy` - 完整的年份，如 2014
- `yy` - 短年份，如 14
- `MMMM` - 长月份名称，如 March
- `MMM` - 短月份名称，如 Mar，	
- `MM` - 月份，不足两位用前置 `0` 补全，如 03
- `M` - 月份，如 3
- `dddd` - 长星期名称，如 Sunday
- `ddd` - 短星期名称，如 Sun
- `dd` - 一月中的第几天，不足两位用前置 `0` 补全，如 09
- `d` - 一月中的第几天，如 9
- `HH` - 24 小时制的小时，不足两位用前置 `0` 补全，如 07
- `H` - 24 小时制的小时，如 7
- `hh` - 12 小时制的小时，不足两位用前置 `0` 补全
- `h` - 12 小时制的小时
- `mm` - 分钟，不足两位用前置 `0` 补全
- `m` - 分钟
- `ss` - 秒，不足两位用前置 `0` 补全
- `s` - 秒
- `len` - 毫秒数，保留三位
- `L` -毫秒数，只保留两位
- `tt` - 12 小时制中的 "am"、"pm"
- `TT` - 12 小时制中的 "AM"、"PM"
**注意**：月份名称和星期名称可以在引入 `datetime.js` 后，调用 `datetime.options` 来修改

#### number

`{{ value | number:}}`

#### currency













