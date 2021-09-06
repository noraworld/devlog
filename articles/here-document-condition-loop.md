---
title: "Ruby でヒアドキュメント内で条件分岐やループ処理を行う方法"
emoji: "😎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "ERB"]
published: true
order: 105
layout: article
---

# はじめに
複数行に渡る文字列を生成したいとき、ヒアドキュメントは便利だが、ヒアドキュメント内で条件分岐やループ処理を行う際に少し苦労したのでまとめておく。



# 実装方法
例として、以下のような仕様のコマンドラインスクリプトを実装してみる。

* マークダウンで記述されるブログ記事に、自動で YAML ヘッダをつける機能を持つ
* 引数としてタイトルやサムネイル画像、タグを与えると、`@options` 変数で各引数の値を取得できる

その際の、YAML ヘッダをヒアドキュメントで記述する。

```ruby
require 'erb'

header = <<~'HEADER'
  ---
  layout: post
  title: "<%= @options[:title] %>"
  image: "<%= @options[:image] %>"
  date: "<%= Time.now.strftime('%Y-%m-%d') %>"
  tags:
  <%- @options[:tags]&.each do |tag| -%>
  - <%= tag %>
  <%- end -%>
  ---
HEADER

puts ERB.new(header, nil, '-').result(binding)
```

`\n` を実際の改行に変換した結果は以下のように出力される。

```yaml
---
layout: post
title: "Hello world!"
image: "/images/2021/09/hello_world.png"
date: "2021-09-06 22:37:34"
tags:
- greeting
- first-post
---
```



# 解説
ヒアドキュメント内で条件分岐やループ処理を行いたい場合は ERB を使用する。

* `<%-` と `-%>` で囲まれた箇所で Ruby が実行される
* `<%=` と `%>` で囲まれた箇所は Ruby が実行された際の戻り値が出力される

上記 2 つのどちらも、囲まれた箇所で Ruby が実行されるが、違いとしては出力結果がそのまま表示されるかされないかだ。

`@options[:tags]&.each do |tag|` や `end` の部分は、結果を出力するわけではなく、単に Ruby を実行してほしいだけなので `<%-` と `-%>` で囲む。



# trim_mode について
なお、`<%-` と `-%>` の記法は ERB のインスタンスを生成する際の第 3 引数に `'-'` を指定することで使用可能となる。これは `trim_mode` と呼ばれる。

```ruby
# 第 3 引数に '-' を指定
ERB.new(header, nil, '-').result(binding)
```

`trim_mode` を使わずに、ヒアドキュメントの出力のみを引数に指定するならば、以下のように記述することもできる。

```ruby
require 'erb'

erb = ERB.new <<~'HEADER'
  ---
  layout: post
  title: "<%= @options[:title] %>"
  image: "<%= @options[:image] %>"
  date: "<%= time %>"
  tags:
  <% @options[:tags]&.each do |tag| %>
  - <%= tag %>
  <% end %>
  ---
HEADER

puts erb.result(binding)
```

ERB インスタンス生成時の第 1 引数に直接ヒアドキュメントを渡す書き方だ。`trim_mode` を用いないので `<%-` と `-%>` ではなく `<%` と `%>` を使用している。

この場合、出力が以下のようになる。

```yaml
---
layout: post
title: "Hello world!"
image: "/images/2021/09/hello_world.png"
date: "2021-09-06 22:43:28"
tags:

- greeting

- first-post

---
```

余計な空行が出力されてしまっている。これは `<% @options[:tags]&.each do |tag| %>` の部分と `<% end %>` の部分が、行としては存在しているが、何も出力されないためである。

このように、ただ Ruby のコードを実行させたいだけの行でも、存在している以上は出力結果に反映されてしまう。

これを解決するのが `trim_mode` である。今回の例では第 3 引数に `-` を指定したので `<%` と `%>` の代わりに `<%-` と `-%>` を使うことで、余計な改行が入らなくなる。

`trim_mode` についての詳細は [ERB のリファレンスマニュアル](https://docs.ruby-lang.org/ja/latest/class/ERB.html) を参照すること。



# 弱点
ERB を使用するとヒアドキュメント内で条件分岐やループ処理を行うことができるが、以下のデメリットがある。

* シンタックスエラーが発生した際に、行数が若干わかりづらい

ERB を用いたヒアドキュメント内でシンタックスエラーが発生すると、そのエラーが発生した箇所が、ヒアドキュメント内の行数で表示される。ファイルの行数ではない。

そのため、ぱっと見で何行目にシンタックスエラーがあるのかがわからない。あまりヒアドキュメントが長くなりすぎると、シンタックスエラーが発生した際の追跡が難しくなる点に注意すること。



# 参考
* [While loop in a here documents](https://www.ruby-forum.com/t/while-loop-in-a-here-documents/154598)
* [class ERB](https://docs.ruby-lang.org/ja/latest/class/ERB.html)
