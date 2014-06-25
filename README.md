# diglett

Diglett 是一个友好的前端（JavaScript）模板引擎，用来将数据和模板组合出最终的 HTML。模板本身比较轻量级，除了支持常用的模板语法之外，开发者还可以扩展自己的语法；此外，Diglett 还支持类似 Angular 的过滤器。

- [快速开始](#quick-start)
  - [引用 Diglett](#add-diglett-script)
  - [编写模板](#build-template)
  - [渲染模板](#render-template)

- [模板语法](#grammar)
  - [变量替换 {{ 变量 }}](#grammar-placehoder)
  - [流程控制](#grammar-logic)
    - [if](#grammar-logic-if)
    - [if-else](#grammar-logic-if-else)
    - [if-elseif-else](#grammar-logic-if-elseif-else)
    - [ifnot](grammar-logic-ifnot)
  - [循环遍历](#grammar-traverse)
  - [子模板](#grammar-include)
  - [模板注释](#grammar-annotation)
  - [内联](#grammar-inline)

- [过滤器](#filter)
 - [语法](#filter-grammar)
 - [内置过滤器](#filter-native)
   
   - [html HTML 转义](#filter-native-html)
   - [lowercase 小写](#filter-native-lower)
   - [uppercase 大写](#filter-native-upper)
 
 - [外置过滤器](#filter-ext)
   
   - [limitTo 限制字符串或数组的长度](#filter-ext-limitto)
   - [orderBy 排序](#filter-ext-orderby)
   - [datetime 格式化日期时间](#filter-ext-datetime)
   - [number 格式化数字](#filter-ext-number)
   - [currency 格式化货币](#filter-ext-currency)
   - [filter](#filter-ext-filter)

- [API 参考](#api)
      
<a name="quick-start" id="quick-start"></a>
## 快速开始

<a name="add-diglett-script" id="add-diglett-script"></a>
### 引用 Diglett

在页面中引入 diglett：

```html
<script src="src/diglett.js"></script>
```

也可以通过支持 CMD（[SeaJS](http://seajs.org/)）或 AMD（[RequireJS](http://requirejs.org/)）规范的模块加载器来加载 Diglett。

<a name="build-template" id="build-template"></a>
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

<a name="render-template" id="render-template"></a>
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
<a name="grammar" id="grammar"></a>
## 模板语法

<a name="grammar-placehoder" id="grammar-placehoder"></a>
### 变量替换 {{ 变量 }}

支持简单的变量替换

```js
var tpl = 'hello {{ name }} !';

var data = {
    name: 'diglett'
};

var html = diglett(tpl, data);
```

<a name="grammar-logic" id="grammar-logic"></a>
### 流程控制

<a name="grammar-logic-if" id="grammar-logic-if"></a>
#### if 语句

```js
var tpl = '{{#if title1}} has title1. {{/if}}';

var data = {
    title1: 'title',
    title2: ''
};

var html = diglett(tpl, data);
```

<a name="grammar-logic-if-else" id="grammar-logic-if-else"></a>
#### if-else 语句

```js
var tpl = '{{#if title2}} has title2. {{#else}} not has title2. {{/if}}';

var data = {
    title1: 'title',
    title2: ''
};

var html = diglett(tpl, data);
```

<a name="grammar-logic-if-elseif-else" id="grammar-logic-if-elseif-else"></a>
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

<a name="grammar-logic-ifnot" id="grammar-logic-ifnot"></a>
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

<a name="grammar-traverse" id="grammar-traverse"></a>
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

<a name="grammar-include" id="grammar-include"></a>
### 子模板

- `{{#include subtpl subdata}}`

  `subtpl` 为数据中的模板字符串，`subdata` 为子模板的数据，例如：

  ``` js
  var data = {
      subtpl: 'Hello, {{name}}'
      subdata: {name: 'Diglett'}
  };
  ```

- `{{#include '#subtpl' subdata}}`

  `#subtpl` 为定义在页面中的模板的 ID

<a name="grammar-annotation" id="grammar-annotation"></a>
### 模板注释

{{!--这里是注释，将不会被渲染到页面上--}}

<a name="grammar-inline" id="grammar-inline"></a>
### 内联

由于这里的 `{{` 和 `}}` 被当做了语法结构，所以需要在页面上显示 `{{}}` 时需要用内联语法：

`{{// 内联显示}}`

<a name="filter" id="filter"></a>
## 过滤器

<a name="filter-grammar" id="filter-grammar"></a>
### 语法

过滤器的语法结构如下，可以同时指定多个过滤器，可以给过滤器传递参数：

`{{ value | filter1 | filter2:arg1:arg2...  ... }}`

<a name="filter-native" id="filter-native"></a>
### 内置过滤器

<a name="filter-native-html" id="filter-native-html"></a>
#### html

转义 html 标签中的 `<`、`>`、`"`、`\` 和 `&`

示例：

```js
var tpl = '{{ value | html }}';
var data = { value: '<span>这里是HTML<\span>' };

var result = diglett(tpl, data);
```

<a name="filter-native-lower" id="filter-native-lower"></a>
#### lowercase 转换为全小写

```js
var tpl = '{{ value | lowercase }}'
var data = { value: 'HELLO WORLD' };

var result = diglett(tpl, data);
```

<a name="filter-native-upper" id="filter-native-upper"></a>
#### uppercase 转换为全大写

```js
var tpl = '{{ value | uppercase }}'
var data = { value: 'hello world' };

var result = diglett(tpl, data);
```

<a name="filter-ext" id="filter-ext"></a>
### 外置过滤器

使用外置过滤器前，需要在页面中引入下面三个 JS 文件：

```html
<script src="currency.js"></script> // 需要使用货币过滤器时引入
<script src="datetime.js"></script> // 需要日期时间格式化时候引入
<script src="registerFilter.js"></script>
```

<a name="filter-ext-limitto" id="filter-ext-limitto"></a>
#### limitTo 限制字符串或数组的长度

限制字符串长度：`{{longStr | limitTo : 4 }}`

限制数组长度：

```txt
{{#each list | limitTo : 4 as item }}
<li>{{ item }}</li>
{{/each}}
```

<a name="filter-ext-orderby" id="filter-ext-orderby"></a>
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

<a name="filter-ext-datetime" id="filter-ext-datetime"></a>
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

<a name="filter-ext-number" id="filter-ext-number"></a>
#### number

`{{ value | number:precision:grouping:thousand:decimal}}`

参数说明：
- precision - 浮点数的精度，默认为 `0`
- grouping - 分组长度，默认为 `3`
- thousand - 分组的风格符，默认为 `,`
- decimal - 小数点符号，默认为 `.`

<a name="filter-ext-currency" id="filter-ext-currency"></a>
#### currency

`{{ value | currency:currencySymbol:precision:grouping:thousand:decimal:format}}`

参数说明：
- currencySymbol - 货币符号，默认为 `$`
- grouping - 分组长度，默认为 `3`
- thousand - 分组的风格符，默认为 `,`
- decimal - 小数点符号，默认为 `.`
- format - 货币格式，默认为 `%s%v`，%s = 货币符号, %v = 货币值

<a name="filter-ext-filter" id="filter-ext-filter"></a>
#### filter 

`{{ objArray | filter:[字段][比较符][值]}}`

参数由三部分构成：字段、比较符、值

支持的比较符：
- `>` 大于
- `>=` 大于等于
- `<` 小于
- `<=` 小于等于
- `==` 等于
- `<>` 不等于
- `^` 包含

例如：筛选出名字包含 `M` 并且电话包含 `4` 的子数组

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
    {{#each objArr as item | filter : name ^ M : phone ^ 4}}
    <tr>
        <td>{{item.name}}</td>
        <td>{{item.phone}}</td>
        <td>{{item.age}}</td>
    </tr>
    {{/each}}
</table>
```

<a name="api" id="api"></a>
## API 参考

- diglett(source, data)
  
  渲染模板
  
  参数：
  
  - `source`: 模板字符串或模板 ID
  - `data`: 模板数据

  返回值：生成后的 HTML

- diglett.options

  全局设置：
  
  - `diglett.options.cache`: 是否缓存编译的模板，默认为 `true`
  - `diglett.options.uglify`: 是否去除生成的 HTML 中多余的空格和注释，默认为 `true`

- diglett.compile(source, options)

  编译模板

  参数：
  
  - `source`: 模板字符串或模板 ID
  - `options`: 选项，参看 `diglett.options`
  
  返回值：一个 `render` 函数，调用 `render(data)` 生成最后的 HTML

- diglett.render(source, data, options)

  渲染模板

  参数：
  
  - `source`: 模板字符串或模板 ID
  - `data`: 模板数据
  - `options`: 选项，参看 `diglett.options`
  
  返回值：生成后的 HTML

- diglett.registerFilter(filterName, fn, overwrite)

  注册自定义过滤器

  参数：
  
  - `filterName`: 过滤器名称
  - `fn`: 过滤器方法，参数顺序与使用时的参数顺序相同
  - `overwrite`: 是否覆盖重名的过滤器

- diglett.removeFilter(filterName)

  删除自定义过滤器
  
  参数：
  
  - `filterName`: 过滤器名称











