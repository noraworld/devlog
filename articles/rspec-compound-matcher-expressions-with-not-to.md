---
title: "RSpec の Compound Matcher Expressions (合成マッチャ式) を使う際に not_to (〜でないこと) と同等の検証をする方法"
emoji: "😽"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "RSpec", "rspec3"]
published: false
order: 61
---

# はじめに
RSpec 3 から登場した Compound Matcher Expressions (合成マッチャ式) を使って、検証したい複数の事象を一つの `expect` にまとめることができるようになりました。

しかし、Compound Matcher Expressions では `not_to` (「〜でないこと」) を使うことはできません。この記事では、Compound Matcher Expressions を使う際に、`not_to` と同等のテストを書くための方法を紹介します。

# TL;DR
Define Negated Matcher と組み合わせることで、`not_to` に相当する反転マッチャを定義することができる。

```ruby
RSpec::Matchers.define_negated_matcher :not_start_with, :start_with
RSpec::Matchers.define_negated_matcher :not_end_with, :end_with

expect(alphabet).to not_start_with("あ").and not_end_with("ん")
```

```ruby
RSpec::Matchers.define_negated_matcher :not_end_with, :end_with

expect(alphabet).to start_with("a").and not_end_with("ん")
```

# そもそも Compound Matcher Expressions (合成マッチャ式) とは何か？
RSpec のブログにわかりやすいコード例が紹介されています。

[Compound Matcher Expressions - New in RSpec 3: Composable Matchers](https://rspec.info/blog/2014/01/new-in-rspec-3-composable-matchers/#compound-matcher-expressions)

上記リンク先のコード例を引用して簡単に説明します。

アルファベットが `"a"` で始まり、`"z"` で終わることを検証したかったとします。RSpec 3 以前では、このように書く必要がありました。

```ruby
expect(alphabet).to start_with("a")
expect(alphabet).to end_with("z")
```

RSpec 3 で登場した Compound Matcher Expressions を使うと、上記のコードを以下のように書くことができるようになります。

```ruby
expect(alphabet).to start_with("a").and end_with("z")
```

`and` を使うことで、二つの `expect` を一つにまとめることができました。

`and` は二つの条件を両方満たす場合にパスしますが、どちらか片方のみ条件を満たす場合にパスする `or` も用意されています。

たとえば、信号機の色が、赤、青、黄色のいずれかであることを検証したい場合は以下のように書くことができます。

```ruby
expect(stoplight.color).to eq("red").or eq("green").or eq("yellow")
```

# 問題点
本題に戻ります。

上記のコード例では「〜であること」を検証しているため、`to` を使っています。「アルファベットが `"a"` で始まり、`"z"` で**終わること**」や「信号機の色が、赤、青、黄色のいずれか**であること**」のように。

ときには、「〜でないこと」を検証したいこともあるでしょう。しかし、残念ながら Compound Matcher Expressions で `not_to` を使うことはできません。

```
Failures:

  1)   should not start with "a" and end with "z"
     Failure/Error: expect(alphabet).not_to start_with('a').and end_with('z')

     NotImplementedError:
       `expect(...).not_to matcher.and matcher` is not supported, since it creates a bit of an ambiguity. Instead, define negated versions of whatever matchers you wish to negate with `RSpec::Matchers.define_negated_matcher` and use `expect(...).to matcher.and matcher`.
```

「`expect(...).not_to matcher.and matcher` はサポートされていません。」というエラーが表示されてしまいます。

# 解決策
実は先ほどのエラーメッセージの中に解決策が書かれていました。**Define Negated Matcher (反転マッチャ) を使います**。

Define Negated Matcher は、**マッチャの条件を反転させたものを新たに定義することができます**。

`start_with` は文字列の先頭が、引数で与えられた文字 (列) であることを検証するマッチャですが、反対に文字列の先頭が引数で与えられた文字 (列) **ではないこと**を検証するマッチャを以下のように定義することができます。

```ruby
RSpec::Matchers.define_negated_matcher :not_start_with, :start_with
```

`define_negated_matcher` の第一引数に、定義したいマッチャの名前を指定し、第二引数に、反転したい対象のマッチャを指定します。

これで、文字列の先頭が、引数で与えられた文字 (列) **ではないこと**を検証できる `not_start_with` マッチャが使えるようになりました。

これを使って、「アルファベットが `"あ"` で始まらず、`"ん"` で終わらないこと」を検証するコードを Compound Matcher Expressions と Define Negated Matcher を使って以下のように書くことができます。

```ruby
RSpec::Matchers.define_negated_matcher :not_start_with, :start_with
RSpec::Matchers.define_negated_matcher :not_end_with, :end_with

expect(alphabet).to not_start_with("あ").and not_end_with("ん")
```

もちろん、「〜であること」と「〜でないこと」を同時に検証することもできます。たとえば「アルファベットが `"a"` で始まり、`"ん"` で終わらないこと」を検証するコードは以下のように書くことができます。

```ruby
RSpec::Matchers.define_negated_matcher :not_end_with, :end_with

expect(alphabet).to start_with("a").and not_end_with("ん")
```

# Compound Matcher Expressions はどういうときに有用か
Compound Matcher Expressions の利点は、単にまとめて書けることだけではありません。**まとめて書かないと都合が悪いとき**に活躍します。

## 標準出力せずに他の検証もしたい場合
たとえば、以下のような実装コードがあったとします。

```ruby
def alphabet
  puts 'abcdefghijklmnopqrstuvwxyz'
end
```

上記のコードは `puts` を使ってアルファベットを標準出力しています。

上記のコードにおいて、例外が発生しないことだけを検証するシンプルなテストを書くと以下のようになります。

```ruby
expect { alphabet }.not_to raise_error
```

上記のテストは正常に動作しますが、以下のように標準出力にアルファベットが表示されてしまいます。

```
abcdefghijklmnopqrstuvwxyz
.

Finished in 0.00476 seconds (files took 0.1303 seconds to load)
1 example, 0 failures
```

当然といえば当然なのですが、この標準出力を RSpec では表示しないようにするために、標準出力を検証する方法があります。

```ruby
expect { alphabet }.to output("abcdefghijklmnopqrstuvwxyz\n").to_stdout_from_any_process
```

上記のコードは `alphabet` メソッド実行後の出力が `"abcdefghijklmnopqrstuvwxyz\n"` であることを検証しています。

上記のテストを実行しても画面上にはアルファベットが表示されません。このように標準出力をチェックすると画面上には出力されないというテクニックが使えます。

ところが、例外が発生しないかどうかの検証と、出力の検証を別々の `expect` で書くとやはりアルファベットが出力されてしまいます。

```ruby
expect { alphabet }.not_to raise_error
expect { alphabet }.to output("abcdefghijklmnopqrstuvwxyz\n").to_stdout_from_any_process
```

なぜなら、`expect { alphabet }.not_to raise_error` のほうで `alphabet` メソッドが実行されて標準出力されてしまうからです。

これを解決するために、Compound Matcher Expressions が使えます。

```ruby
RSpec::Matchers.define_negated_matcher :not_raise_error, :raise_error

expect { alphabet }.to not_raise_error.and output("abcdefghijklmnopqrstuvwxyz\n").to_stdout_from_any_process
```

例外が発生しないことを検証するマッチャ `not_raise_error` を Define Negated Matcher を使って定義します。そして、`not_raise_error` と `output` を組み合わせて、一つの `expect` で表現します。

これにより、例外が発生しないことと出力が正しいことを検証しつつ、RSpec 実行時に画面にアルファベットを出力しないようにすることができます。

## exit せずに他の検証もしたい場合
もう一つ別の例を挙げましょう。

```ruby
def bye
  puts 'Bye!'
  exit
end
```

`Bye!` と表示して exit するコードです。

このコードに対して、`Hello!` と出力されずに、`exit` されることを検証したかったとします。

素直に書くと以下のようなコードになります。

```ruby
it 'does not output hello' do
  expect { bye }.not_to output("Hello!\n").to_stdout_from_any_process
end

it 'exits' do
  expect { bye }.to raise_error(SystemExit)
end
```

上記のテストは、失敗はしませんが正しくテストできていません。

```


Finished in 0.01792 seconds (files took 0.11834 seconds to load)
1 example, 0 failures
```

テストが成功している際に表示される `.` が表示されていません。また、テストは 2 つあるにも関わらず `1 example` となっています。

実装コード内で exit するようなコードがある際に RSpec を実行すると、実際に `exit` が実行された時点で RSpec が終了してしまいます。実装コードを実行するプロセスと RSpec を実行するプロセスが同じためです。

実は、それを解消する方法として、`SystemExit` という例外を補足すると、exit せずに次のテストに進むことができます。

上記のテストコードはまさにそのテクニックが使われているのですが、標準出力を検証する `expect` を実行した段階で exit されてしまっているのでそこで RSpec が終了してしまいます。

これを解決するためには、やはり Compound Matcher Expressions を使って「`Hello!` と出力されないこと」と「`exit` されること」を一つの `expect` で表現します。

```ruby
RSpec::Matchers.define_negated_matcher :not_output, :output

it 'does not output hello and exits' do
  expect { bye }.to not_output("Hello!\n").to_stdout_from_any_process.and raise_error(SystemExit)
end
```

上記のテストコードを実行すると正しくテストできます。

```
.

Finished in 0.02079 seconds (files took 0.1141 seconds to load)
1 example, 0 failures
```

# まとめ
Compound Matcher Expressions で `not_to` を使うことはできませんが、代わりに Define Negated Matcher を使って `not_to` に相当するマッチャを定義することで同等の検証を行う方法を紹介しました。

最後の「Compound Matcher Expressions はどういうときに有用か」は若干こじつけ感がありますが、実際に自分がテストコードを書くなかで使ったテクニックです。

Ruby で CLI ツールを作る際に、標準出力したり、エラー時に exit したりする実装にすることはあるかと思います。

そういうときに Compound Matcher Expressions や Define Negated Matcher を使うと、検証したいテストが簡潔に書けるようになります。

# 参考にしたサイト
- [今日から使える！RSpec 3で追加された8つの新機能](https://qiita.com/jnchito/items/a4a51852c2c678b57868)
- [RSpec 3の新機能: コンポーザブルマッチャー](http://nilp.hatenablog.com/entry/2014/02/28/215056)
- [New in RSpec 3: Composable Matchers](https://rspec.info/blog/2014/01/new-in-rspec-3-composable-matchers/)
- [Define negated matcher](https://relishapp.com/rspec/rspec-expectations/docs/define-negated-matcher)
