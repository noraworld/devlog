---
title: "[Ruby] 標準入力を受け付ける際に ^H などの ASCII 制御文字を意図した通りに認識させる"
emoji: "🌊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "readline", "stdin", "ascii"]
published: false
order: 66
---

# 結論
**`STDIN.gets` ではなく `Readline.readline` を使おう**

# STDIN.gets
Ruby で標準入力を受け取る方法を調べると、多くの場合、以下の実装方法が出てきます。

```ruby:stdin.rb
print '> '
text = STDIN.gets.strip
puts "You said #{text}!"
```

```bash
$ ruby stdin.rb
> hello
You said hello!
```

`gets` の他にも `read` や `readline`、`readlines` があるようです。
[Ruby 標準入力から複数行読み取りたい](https://nnnamani.hateblo.jp/entry/2016/08/14/150900)

## 欠点
しかし、上記の方法だと ASCII 制御文字を意図した挙動で認識させることができません。

```bash
$ ruby stdin.rb
> hello^H^H^H
You said he!lo
```

上記の例では、`hello` と入力したあとに、ASCII 制御文字の backspace (`ctrl` + `H` で入力可能) を 3 回入力しています。

本当は `hello` と入力したあとに 3 回 backspace の制御文字を入力しているので `he` となってほしいのですが、`hello^H^H^H` となってしまい、標準入力の受け付けを終了したあとに backspace が適用されています。

# 解決方法
これを意図した通りにするためには以下のように実装します。

```ruby:readline.rb
require 'readline'

print '> '
text = Readline.readline
puts "You said #{text}!"
```

```bash
$ ruby readline.rb
> he # "hello" と入力したあとに ctrl + H を 3 回押した
You said he!
```

# その他
`Readline.readline` は、他にもヒストリを使うことができたりして便利です。カーソルの上キーや `ctrl` + `P` を押すと、前に入力した文字列を表示することができます。詳しくは [module Readline のリファレンスマニュアル](https://docs.ruby-lang.org/ja/latest/class/Readline.html) を参照ください。
