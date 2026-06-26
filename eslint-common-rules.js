/**
 * ESLint 通用 JS 校验规则
 * 参考：demo/eslint.config.cjs
 *
 * 供根 eslint.config.js 和 packages/web/eslint.config.js 复用
 * 避免规则重复定义，保持各配置模块独立
 */

export const commonJsRules = {
  // Promise 函数不应异步
  'no-async-promise-executor': 0,
  // 是否禁止使用 var
  'no-var': 1,
  // 在对象中使用 getter/setter
  'accessor-pairs': 2,
  // => 的前/后括号格式
  'arrow-spacing': [2, { before: true, after: true }],
  // 块是否需要空格
  'block-spacing': [2, 'always'],
  // if while function 后面的{必须与if在同一行，java风格。
  'brace-style': [2, '1tbs', { allowSingleLine: true }],
  // 强制驼峰法命名（关闭）
  camelcase: [0, { properties: 'always' }],
  // 控制逗号前后的空格
  'comma-spacing': [2, { before: false, after: true }],
  // 控制逗号在行尾出现还是在行首出现
  'comma-style': [2, 'last'],
  // 强制在子类构造函数中用super()调用父类构造函数，TypeScrip的编译器也会提示
  'constructor-super': 2,
  // 强制object.key 中 . 的位置，参数:
  // property，'.'号应与属性在同一行
  // object, '.' 号应与对象名在同一行
  'dot-location': [2, 'property'],
  // 文件末尾强制换行（关闭）
  'eol-last': 0,
  // 使用 === 替代 ==
  eqeqeq: [0, 'allow-null'],
  // 生成器函数 * 的前后空格（关闭）
  'generator-star-spacing': 0,
  // nodejs 处理错误（关闭）
  'handle-callback-err': 0,
  // JSX 属性中一致使用双引号或单引号（关闭）
  'jsx-quotes': [0, 'prefer-single'],
  // 对象字面量中冒号的前后空格
  'key-spacing': [2, { beforeColon: false, afterColon: true }],
  // 关键字前后空格
  'keyword-spacing': [2, { before: true, after: true }],
  // 函数名首行大写必须使用new方式调用，首行小写必须用不带new方式调用
  'new-cap': [2, { newIsCap: true, capIsNew: false }],
  // new 时必须加小括号
  'new-parens': 2,
  // 禁止使用数组构造器
  'no-array-constructor': 2,
  // 禁止使用 arguments.caller 或 arguments.callee
  'no-caller': 2,
  // 禁止使用 console（这里关闭）
  'no-console': 0,
  // 禁止给类赋值
  'no-class-assign': 2,
  // 禁止在条件表达式中使用赋值语句
  'no-cond-assign': 2,
  // 禁止修改 const 声明的变量
  'no-const-assign': 2,
  // 禁止在正则表达式中使用控制字符（关闭）
  'no-control-regex': 0,
  // 不能对 var 声明的变量使用 delete 操作符
  'no-delete-var': 2,
  // 函数参数不能重复
  'no-dupe-args': 2,
  // 不允许类中出现重复的声明
  'no-dupe-class-members': 2,
  // 在创建对象字面量时不允许键重复 {a:1,a:1}
  'no-dupe-keys': 2,
  // switch 中的 case 标签不能重复
  'no-duplicate-case': 2,
  // 正则表达式中的 [] 内容不能为空（关闭）
  'no-empty-character-class': 0,
  // 正则表达式允许空 pattern（关闭）
  'no-empty-pattern': 0,
  // 禁止使用 eval（关闭）
  'no-eval': 0,
  // 禁止给 catch 语句中的异常参数赋值
  'no-ex-assign': 2,
  // 禁止扩展 native 对象
  'no-extend-native': 2,
  // 禁止不必要的函数绑定
  'no-extra-bind': 2,
  // 禁止不必要的 bool 转换
  'no-extra-boolean-cast': 2,
  // 禁止非必要的括号
  'no-extra-parens': [2, 'functions'],
  // 禁止 switch 穿透
  'no-fallthrough': 2,
  // 禁止省略浮点数中的 0（例如 .5）
  'no-floating-decimal': 2,
  // 禁止重复的函数声明
  'no-func-assign': 2,
  // 禁止使用隐式 eval
  'no-implied-eval': 2,
  // 禁止在块语句中使用声明（变量或函数）
  'no-inner-declarations': [2, 'functions'],
  // 禁止无效的正则表达式
  'no-invalid-regexp': 2,
  // 不能有不规则的空格
  'no-irregular-whitespace': 2,
  // 禁止使用 __iterator__ 属性
  'no-iterator': 2,
  // label 名不能与 var 声明的变量名相同
  'no-label-var': 2,
  // 禁止标签声明
  'no-labels': [2, { allowLoop: false, allowSwitch: false }],
  // 禁止不必要的嵌套块
  'no-lone-blocks': 2,
  // 禁止混用 tab 和空格
  'no-mixed-spaces-and-tabs': 2,
  // 不能用多余的空格
  'no-multi-spaces': 2,
  // 字符串不能用 \\ 换行
  'no-multi-str': 2,
  // 空行最多不能超过 1 行（关闭）
  'no-multiple-empty-lines': [0, { max: 1 }],
  // 不能重写 native 对象
  'no-native-reassign': 2,
  // in 操作符的左边不能有 !
  'no-negated-in-lhs': 2,
  // 禁止使用 new Object()
  'no-new-object': 2,
  // 禁止使用 new require
  'no-new-require': 2,
  // 禁止使用 new symbol
  'no-new-symbol': 2,
  // 禁止使用 new 创建包装实例（new String/new Boolean/new Number）
  'no-new-wrappers': 2,
  // 不能调用内置的全局对象，比如 Math() / JSON()（关闭）
  'no-obj-calls': 0,
  // 禁止使用八进制数字
  'no-octal': 2,
  // 禁止使用八进制转义序列
  'no-octal-escape': 2,
  // node 中不能使用 __dirname 或 __filename 做路径拼接
  'no-path-concat': 2,
  // 禁止使用 __proto__ 属性
  'no-proto': 2,
  // 禁止重复声明变量
  'no-redeclare': 2,
  // 禁止在正则表达式字面量中使用多个空格 /foo bar/
  'no-regex-spaces': 2,
  // return 语句中不能有赋值表达式
  'no-return-assign': [2, 'except-parens'],
  // 自我赋值
  'no-self-assign': 2,
  // 不能比较自身
  'no-self-compare': 2,
  // 禁止使用逗号运算符
  'no-sequences': 2,
  // 严格模式中限制标识符不能作为声明时的变量名
  'no-shadow-restricted-names': 2,
  // 函数调用时，函数名与 () 之间不能有空格
  'no-spaced-func': 2,
  // 禁止稀疏数组（[1,,2]）
  'no-sparse-arrays': 2,
  // 在调用 super() 之前不能使用 this 或 super
  'no-this-before-super': 2,
  // 禁止抛出字面量错误 throw 'error'
  'no-throw-literal': 2,
  // 一行结束后面不要有空格（关闭）
  'no-trailing-spaces': 0,
  // 不能有未定义的变量
  'no-undef': 2,
  // 变量初始化时不能直接给它赋值为 undefined
  'no-undef-init': 2,
  // 避免多行表达式（关闭）
  'no-unexpected-multiline': 0,
  // 检查引用是否在循环中被修改（关闭）
  'no-unmodified-loop-condition': 0,
  // 禁止不必要的嵌套三元表达式（关闭）
  'no-unneeded-ternary': 0,
  // 不能有无法执行的代码
  'no-unreachable': 2,
  // 允许 finally 中写不安全代码（关闭）
  'no-unsafe-finally': 0,
  // 不能有声明后未被使用的变量或参数
  'no-unused-vars': [1, { vars: 'all', args: 'after-used' }],
  // 禁止不必要的 call 和 apply
  'no-useless-call': 2,
  // 没有必要使用带文字的计算属性（关闭）
  'no-useless-computed-key': 0,
  // 可以在不改变类的工作方式的情况下安全地移除的类构造函数
  'no-useless-constructor': 2,
  // 允许不必要的转义字符（关闭）
  'no-useless-escape': 0,
  // 允许在属性访问前出现多余空格（关闭）
  'no-whitespace-before-property': 0,
  // 禁用 with
  'no-with': 2,
  // 连续声明（关闭）
  'one-var': 0,
  // 换行时二元/三元表达式运算符在行尾还是行首
  'operator-linebreak': [
    2,
    'after',
    { overrides: { '?': 'before', ':': 'before' } },
  ],
  // 块语句内行首行尾是否要空行（关闭）
  'padded-blocks': 0,
  // 引号类型：使用单引号（关闭）
  quotes: [0, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
  // 语句强制分号结尾（关闭）
  semi: [0],
  // 分号前后空格
  'semi-spacing': [2, { before: false, after: true }],
  // 不以新行开始的块 { 前面是否要空格
  'space-before-blocks': [2, 'always'],
  // 小括号里面要不要有空格
  'space-in-parens': [2, 'never'],
  // 中缀操作符周围要不要有空格
  'space-infix-ops': 2,
  // 一元操作符的前/后要不要加空格
  'space-unary-ops': [2, { words: true, nonwords: false }],
  // 注释风格：不要在注释内容和前缀处强制空格
  'spaced-comment': 1,
  // switch 语句内的空格
  'switch-colon-spacing': 2,
  // 模板字符串花括号内不要空格
  'template-curly-spacing': [2, 'never'],
  // 禁止比较时使用 NaN，只能用 isNaN()
  'use-isnan': 2,
  // 必须使用合法的 typeof 的值
  'valid-typeof': 2,
  // IIFE（立即执行函数）的小括号风格
  'wrap-iife': [2, 'any'],
  // yield 的 * 前后空格规则不强制（关闭）
  'yield-star-spacing': 0,
  // 禁止尤达条件（Yoda conditions）
  yoda: [2, 'never'],
  // 首选 const
  'prefer-const': 1,
  // 禁止使用 debugger（关闭）
  'no-debugger': 0,
  // 大括号内是否允许不必要的空格
  'object-curly-spacing': [2, 'always', { objectsInObjects: true }],
  // 数组字面量里面是否允许多余空格
  'array-bracket-spacing': [2, 'never'],
  // 允许空块语句（如 catch 块中无意留下的空块，禁用）
  'no-empty': 0,
  // 无用的赋值（降为 warn）
  'no-useless-assignment': 1,
  // catch 捕获异常时，抛出需携带 cause（降为 warn）
  'preserve-caught-error': 1,
};