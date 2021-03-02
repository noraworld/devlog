---
title: "Ruby で class や module をネストして書く場合と Foo::Bar のようにコンパクトに書く場合の挙動の違いについて"
emoji: "🦔"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "RuboCop"]
published: false
order: 58
---

# はじめに
Ruby では、階層的に class や module を定義する際に、2 種類の書き方があります。

```ruby
class Foo
  class Bar
  end
end
```

```ruby
class Foo::Bar
end
```

この 2 種類の書き方にはどのような違いがあるのかについて説明します。

なお、本稿では便宜上、前者のような書き方をネスト記法、後者のような書き方をコンパクト記法と呼ぶことにします。

# TL;DR
- ネスト記法は各階層の名前空間ごとに class か module かを明確に指定するが、コンパクト記法は指定しない
- ネスト記法は未定義の場合に新たに定義するが、コンパクト記法は未定義の場合は例外が発生する

# class と module を明確に区別するかどうか
ネスト記法ではそれぞれの名前空間に対して class か module かを明確に指定します。

```ruby
class Foo
  class Bar
  end
end
```

上記のコードにおいて、`Foo` は class であり、`Bar` も class です。

一方で、コンパクト記法では、最後の（一番右端の）名前空間に対して class や module が指定されるのみで、途中の名前空間に関しては適用されません。

```ruby
class Foo::Bar
end
```

上記のように書かれていると、一見、`Foo` も `Bar` も class として指定しているように見えますが、実際に class を指定しているのは `Bar` のみで、`Foo` は class なのか module なのかは指定していないことになります。

この違いにより、例えば以下のようなコードを書いたときに挙動が異なります。

## ネスト記法の場合
```ruby:foo.rb
module Foo
end
```

```ruby:bar.rb
require './foo.rb'

class Foo
  class Bar
    def greet
      puts 'Hello'
    end
  end
end

Foo::Bar.new.greet
```

上記のコード `bar.rb` を実行すると、`Foo is not a class (TypeError)` という例外が発生します。`foo.rb` で `Foo` が module として定義されているのに `Foo` を class として定義しようとしているためです。

`bar.rb` を以下のように書き換えれば正しく動作します。

```diff:bar.rb
  require './foo.rb'

- class Foo
+ module Foo
    class Bar
      def greet
        puts 'Hello'
      end
    end
  end

  Foo::Bar.new.greet
```

# コンパクト記法の場合
```ruby:foo.rb
module Foo
end
```

```ruby:bar.rb
require './foo.rb'

class Foo::Bar
  def greet
    puts 'Hello'
  end
end

Foo::Bar.new.greet
```

上記のコードは正しく動作します。`class Foo::Bar` と書いた場合、この部分だけでは `Foo` は class として参照するのか module として参照するのかはわかりません。`Foo` が module として定義されていれば module になり、class として定義されていれば class になります。

上記のコードにおいては、`bar.rb` の `Foo` は module となりますが、`foo.rb` を以下のように書き換えた場合は `bar.rb` の `Foo` は class として参照されます。

```ruby:foo.rb
class Foo
end
```

`class Foo::Bar` と書いた場合の `Foo` は、`class Foo` があれば class になり、`module Foo` があれば module になるということですね。

# 未定義の場合に定義されるか例外になるか
ここまでの話を聞くと `Foo::Bar` のほうがよしなに判断してくれて便利だと思いますが、実はもうひとつ違いがあります。それは、未定義の場合の挙動です。

先ほどの例において、`foo.rb` がなかった場合（`bar.rb` で `require './foo.rb'` をしなかった場合）を考えてみましょう。

## ネスト記法の場合
```ruby:bar.rb
class Foo
  class Bar
    def greet
      puts 'Hello'
    end
  end
end

Foo::Bar.new.greet
```

上記のコードは正しく動作します。

ネスト記法では、`Foo` という class が存在しなかった場合には、新しく定義されます。つまり、`Foo` という class が存在していればそれを参照し、存在していなければ定義するという挙動になります。

上記のコード例の場合だと、`class Foo` で `Foo` という class が定義されたことになります。

以下のように、すでに `Foo` という class が `foo.rb` で定義されていて、それを読み込んでいる場合は、`bar.rb` の `class Foo` では `foo.rb` の `Foo` が参照されることになります。

```ruby:foo.rb
class Foo
end
```

```ruby:bar.rb
require './foo.rb'

class Foo
  class Bar
    def greet
      puts 'Hello'
    end
  end
end

Foo::Bar.new.greet
```

## コンパクト記法の場合
```ruby:bar.rb
class Foo::Bar
  def greet
    puts 'Hello'
  end
end

Foo::Bar.new.greet
```

上記のコードを実行すると `uninitialized constant Foo (NameError)` という例外が発生します。`Foo` が未定義であるためです。

コンパクト記法では、最後（一番右端）以外の名前空間（上記のコード例だと `Foo`）がすでにどこかで定義されていることが前提となります。`Foo` という class もしくは module が定義されていれば上記のコードは正しく動きますが、今回は `Foo` がどこにも定義されていないため例外が発生してしまいます。

つまり、このケースにおけるネスト記法とコンパクト記法の違いは、最後（一番右端）以外の名前空間が定義されていなかった場合に定義するかしないかの違いとなります。コンパクト記法では、定義されていなかった場合は例外が発生します。

# RuboCop のルール
RuboCop ではこの 2 種類の記法を統一するためのルールがあります。`RuboCop::Cop::Style::ClassAndModuleChildren` というルールです。

[Class: RuboCop::Cop::Style::ClassAndModuleChildren](https://www.rubydoc.info/gems/rubocop/RuboCop/Cop/Style/ClassAndModuleChildren)

`nested` もしくは `compact` のいずれかの値を設定でき、`nested` だとネスト記法、`compact` だとコンパクト記法になります。デフォルトは `nested` になっています。

参考: [RuboCop | Style/ClassAndModuleChildren EnforcedStyle](https://qiita.com/tbpgr/items/61b9da235701df919ae5)

おそらく RuboCop の方針としては、うっかり未定義の class や module を参照しようとして例外が発生して落ちるということを防ぐために `nested` がデフォルト値になっているのではないかと思います。

一方で、コンパクト記法のほうは class か module かを意識する必要がなく、かつ、すっきり書けるというメリットもあります。class や module が定義されていることが確実に保証される場合においてはコンパクト記法を使うのもありかと思います。

# まとめ
## ネスト記法
- ネスト記法では各階層の名前空間ごとに class か module かを明確に指定する
  - module として定義されているのに class を指定すると例外が発生する（逆も然り）
- ネスト記法ではその名前空間が定義されていれば参照し、定義されていなければ新たに定義する

## コンパクト記法
- コンパクト記法では最後（一番右端）以外の名前空間に対しては class か module かを指定しない
  - class として定義されていれば class になり、module として定義されていれば module になる
- コンパクト記法ではその名前空間が定義されていれば参照するが、定義されていなければ例外が発生する
