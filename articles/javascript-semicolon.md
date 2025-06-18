---
title: "JavaScript (Node.js) にはセミコロンをつけよう！"
emoji: "🐊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["javascript", "nodejs"]
published: true
order: 175
layout: article
---

### セミコロンをつけないとエラーになることがある
JavaScript ではセミコロンを省略できます。以下のコードは正しく動作します。

```javascript:greet.js
function greet() {
  return 'hello'
}

let hello = ''

hello = greet()

console.log(hello)
```

```shell:Shell
node greet.js
```

```text:Result
hello
```

ところが以下のコードはうまく動きません。

```javascript:greet.js
function greet() {
  return ['hello', 'world']
}

let hello = ''
let world = ''

[hello, world] = greet()

console.log(hello, world)
```

```shell:Shell
node greet.js
```

```text:Result
/Users/kosuke/Workspace/issue-recorder/greet.js:8
[hello, world] = greet()
        ^

ReferenceError: Cannot access 'world' before initialization
    at Object.<anonymous> (/Users/kosuke/Workspace/issue-recorder/greet.js:8:9)
    at Module._compile (node:internal/modules/cjs/loader:1378:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1437:10)
    at Module.load (node:internal/modules/cjs/loader:1212:32)
    at Module._load (node:internal/modules/cjs/loader:1028:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:142:12)
    at node:internal/main/run_main_module:28:49

Node.js v21.6.2
```

`[hello, world] = greet()` の前の文の末尾にセミコロンをつけるとエラーが解消できます。

```javascript:greet.js
function greet() {
  return ['hello', 'world']
}

let hello = ''
let world = '';

[hello, world] = greet()

console.log(hello, world)
```

```shell:Shell
node greet.js
```

```text:Result
hello world
```

なぜでしょうか？

### 自動セミコロン挿入の正体
少しややこしいですが、JavaScript はセミコロンが不要な言語ではありません。ではなぜ省略できるかというと、省略した際に JavaScript のエンジンがここで文が終了しているのだろうということを推測して自動的にセミコロンを挿入して解釈してくれるためです。これを ASI (Automatic Semicolon Insertion; 自動セミコロン挿入) といいます。

ただしこの ASI、想定通りに動いてくれないことがあります。先述したコードの例がまさにそうです。人間の目から見ると改行されたところで文が終了しているというふうに解釈してほしいところですが、次の文がカッコなどの記号で始まる場合、前の文の続きであると解釈されてしまいます。

先述の例では

```javascript
[hello, world] = greet()
```

は `[` から始まっています。この場合、ASI では前の文である

```javascript
let world = ''
```

の続きであると解釈します。つまり

```javascript
let world = '' [hello, world] = greet()
```

のように解釈されていることになります。構文的に明らかにおかしくなってしまいますね。

### エラー文は多岐にわたる
どういう（意図しない）構文解釈をされているかによってエラー内容が変わるので非常に厄介です。たとえば今回の例だと変数 `world` を定義する際に、まだ未定義である `world` の値を参照しようとしているというエラーになっていますが

```diff:greet.js
function greet() {
  return ['hello', 'world']
}

let hello = ''
let world = ''

+console.log('howdy?')

[hello, world] = greet()

console.log(hello, world)
```

のように `[hello, world] = greet()` の前に `console.log('howdy?')` を入れるとまた別のエラーになります。

```text:Result
howdy?
/Users/kosuke/Workspace/issue-recorder/greet.js:10
[hello, world] = greet()
               ^

TypeError: Cannot set properties of undefined (setting '')
    at Object.<anonymous> (/Users/kosuke/Workspace/issue-recorder/greet.js:10:16)
    at Module._compile (node:internal/modules/cjs/loader:1378:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1437:10)
    at Module.load (node:internal/modules/cjs/loader:1212:32)
    at Module._load (node:internal/modules/cjs/loader:1028:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:142:12)
    at node:internal/main/run_main_module:28:49

Node.js v21.6.2
```

これも先ほどと同じく `console.log('howdy?')` の末尾にセミコロンを挿入することで解消されます。

### REPL では再現しないことがある
さらにややこしいのが、REPL (Read-Eval-Print Loop) ではこの問題が再現しない場合があることです。REPL 上では、`{` や `[` などで終わっていない限りは、行ごとに即時コードが解釈されるのでセミコロンをつけていなくても実質セミコロンを毎回つけているような挙動になります。実際に先ほどエラーが発生したコードを REPL 上で実行するとエラーになりません。

```shell:Shell
node
```

```javascript
Welcome to Node.js v21.6.2.
Type ".help" for more information.
> function greet() {
...   return ['hello', 'world']
... }
undefined
>
> let hello = ''
undefined
> let world = ''
undefined
>
> [hello, world] = greet()
[ 'hello', 'world' ]
>
> console.log(hello, world)
hello world
undefined
```

セミコロンをつけていないことによるエラーが発生した際に、その原因を特定するために該当の部分のみを REPL で実行しても再現できない、、、なんてことが発生します。

### 結論
**JavaScript ではセミコロンをつけましょう**。これですべてが解決します。

```javascript:greet.js
function greet() {
  return ['hello', 'world'];
}

let hello = '';
let world = '';

[hello, world] = greet();

console.log(hello, world);
```

この問題に出くわすまで、「省略できるんだったら省略したほうがコードがきれいに見えるじゃん」とか思っていたんですが、セミコロンをつけないことによるエラーに何時間も溶かしてしまったことを考えるとセミコロンをつけたほうが断然いいです。[ASI のことがわかっていないと、ChatGPT にエラー文を投げてもセミコロンが省略されていることが原因ってところを教えてくれるまでに時間がかかります](https://chatgpt.com/share/68525f53-f030-8004-ba29-ec82bf956c79) からね……。それに、セミコロンが必要なところに局所的にセミコロンを書くんだったら、文の終わりすべてにセミコロンを書いたほうがむしろ統一感があります。

具体的にどこにセミコロンをつけるべきかに関しては [ChatGPT とのやり取り](https://chatgpt.com/share/67fb91b8-4d20-8004-b4b5-afa464c3534f) が参考になりました。

[すでにセミコロンをつけずに実装してしまった JavaScript のコードに一括でセミコロンを付与するには Prettier や ESLint を使う](https://chatgpt.com/share/685261aa-08b0-8004-96da-5ab8c1c2534b) とよさそうです。

### リンク
* [foo 関数 エラー](https://chatgpt.com/share/68525f53-f030-8004-ba29-ec82bf956c79)
* [カンマの使い方](https://chatgpt.com/share/67fb91b8-4d20-8004-b4b5-afa464c3534f)
* [変数の初期化エラー](https://chatgpt.com/share/68526145-293c-8004-8c61-7ba27a4dd952)
* [ASI エラー解析](https://chatgpt.com/share/68526157-3e54-8004-9dce-f006bd621b19)
* [Node.js セミコロン 自動追加](https://chatgpt.com/share/685261aa-08b0-8004-96da-5ab8c1c2534b)
