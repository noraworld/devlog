---
title: "RSpec における double / spy / instance_double / class_double のそれぞれの違いについて"
emoji: "🐡"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "RSpec"]
published: true
order: 59
---

# はじめに
RSpec でモックを作る際の `double`、`spy`、`instance_double`、`class_double` のそれぞれの違いについて説明します。

# TL;DR
- `double` と比較した際に
  - `spy` は呼び出されるすべてのメソッドを明示的にスタブする必要がない
  - `instance_double` は未定義のインスタンスメソッドをスタブしようとした際にエラーになる
  - `class_double` は未定義のクラスメソッドをスタブしようとした際にエラーになる

# double
まずは最も一般的（？）な `double` から説明します。

```ruby:experiment.rb
class Human
  def conduct_experiment
    experiment = Experiment.new

    experiment.succeed
    experiment.fail
  end
end

class Experiment
  def succeed
    'succeed!'
  end

  def fail
    raise StandardError
  end
end
```

上記のコードで `Human#conduct_experiment` をテストする際に、`experiment.fail` をスタブして、例外が発生する代わりにメッセージを表示するようにしたかったとします。

その際に以下のようなテストコードを書いたとします。

```ruby:spec/experiment_spec.rb
require_relative '../experiment'

describe Human do
  context 'conduct_experiment' do
    it 'returns a failure message instead of exception' do
      experiment_double = double(Experiment)

      allow(Experiment).to receive(:new).and_return(experiment_double)
      allow(experiment_double).to receive(:fail).and_return('fail!')

      expect(Human.new.conduct_experiment).to eq('fail!')
    end
  end
end
```

このテストコードを実行すると、以下のようなエラーが発生します。

```
Failures:

  1) Human conduct_experiment returns a failure message instead of exception
     Failure/Error: expect(Human.new.conduct_experiment).to eq('fail!')
       #<Double Experiment> received unexpected message :succeed with (no args)
     # ./experiment.rb:5:in `conduct_experiment'
     # ./spec/experiment.rb:11:in `block (3 levels) in <top (required)>'
```

「`Experiment` のモックは `succeed` というメソッドを知らないよ」というエラーです。

`double` を使ってモックした場合、**呼び出されるすべてのメソッドを明示的にスタブしなければいけません**。上記のテストコードは以下のように書き換えると正しく動作します。

```diff:spec/experiment_spec.rb
 require_relative '../experiment'

 describe Human do
   context 'conduct_experiment' do
     it 'returns a failure message instead of exception' do
       experiment_double = double(Experiment)

       allow(Experiment).to receive(:new).and_return(experiment_double)
+      allow(experiment_double).to receive(:succeed)
       allow(experiment_double).to receive(:fail).and_return('fail!')

       expect(Human.new.conduct_experiment).to eq('fail!')
     end
   end
 end
```

`experiment_double` (`Experiment` のモック) に `succeed` メソッドがあるということを教えてあげれば正しく動作します。

# spy
`double` の場合は呼び出されるメソッドすべてを明示的にスタブする必要がありましたが、`spy` の場合はその必要がありません。

```ruby:experiment.rb
class Human
  def conduct_experiment
    experiment = Experiment.new

    experiment.succeed
    experiment.fail
  end
end

class Experiment
  def succeed
    'succeed!'
  end

  def fail
    raise StandardError
  end
end
```

上記のコードにおいて、以下のようなテストコードを書いたとします。

```ruby:spec/experiment_spec.rb
require_relative '../experiment'

describe Human do
  context 'conduct_experiment' do
    it 'returns a failure message instead of exception' do
      experiment_spy = spy(Experiment)

      allow(Experiment).to receive(:new).and_return(experiment_spy)
      allow(experiment_spy).to receive(:fail).and_return('fail!')

      expect(Human.new.conduct_experiment).to eq('fail!')
    end
  end
end
```

このテストコードは正しく動作します。`spy` の場合は**すべてのメソッドを受け入れる**ため、`succeed` メソッドに関しては明示的にスタブしなくても動作するようになります。

もちろん、`succeed` メソッドの返り値を変更したい (`and_return` で別の値を返したい) 場合は明示的にスタブする必要があります。

# instance_double
呼び出されるすべてのメソッドを明示的にスタブしなければいけない点は `double` と同じです。異なるのは、**定義されていないインスタンスメソッドをスタブした際にエラーになってくれるかどうか**です。

```ruby:experiment.rb
class Human
  def conduct_experiment
    experiment = Experiment.new

    experiment.succeed
    experiment.fail
  end
end

class Experiment
  def succeed
    'succeed!'
  end

  def fail
    raise StandardError
  end
end
```

上記のコードにおいて、以下のようなテストコードを書いたとします。

```ruby:spec/experiment_spec.rb
require_relative '../experiment'

describe Human do
  context 'conduct_experiment' do
    it 'returns a failure message instead of exception' do
      experiment_instance_double = instance_double(Experiment)

      allow(Experiment).to receive(:new).and_return(experiment_instance_double)
      allow(experiment_instance_double).to receive(:succeed)
      allow(experiment_instance_double).to receive(:failure).and_return('fail!')

      expect(Human.new.conduct_experiment).to eq('fail!')
    end
  end
end
```

`allow(experiment_double).to receive(:failure).and_return('fail!')` という行に注目してください。定義されているのは `fail` メソッドですが、間違えて `failure` メソッドをスタブしてしまったとします。

このテストコードを実行すると以下のようなエラーが発生します。

```
Failures:

  1) Human conduct_experiment returns a failure message instead of exception
     Failure/Error: allow(experiment_instance_double).to receive(:failure).and_return('fail!')
       the Experiment class does not implement the instance method: failure
     # ./spec/experiment.rb:10:in `block (3 levels) in <top (required)>'
```

「`Experiment` クラスには `failure` というインスタンスメソッドは実装されていないよ」というエラーです。このように `instance_double` を使うと**未定義のインスタンスメソッドをスタブしようとした際にエラーが発生します**。`double` や `spy` では上記のエラーは発生しません。

# class_double
`class_double` は、`instance_double` のクラス版だと考えるとわかりやすいでしょう。`instance_double` が未定義のインスタンスメソッドを指摘するのに対し、`class_double` は**未定義のクラスメソッドを指摘します**。

```ruby:experiment.rb
class Human
  def conduct_experiment
    Experiment.succeed
    Experiment.fail
  end
end

class Experiment
  class << self
    def succeed
      'succeed!'
    end

    def fail
      raise StandardError
    end
  end
end
```

先ほどまでの `Experiment` クラスのインスタンスメソッドをすべてクラスメソッドに変更しました。

上記のコードにおいて、今まで通り `Experiment` クラスのメソッドをスタブするのに加えて、**それらのクラスメソッドが定義されているかどうか**を検証します。

```ruby:spec/experiment_spec.rb
require_relative '../experiment'

describe Human do
  context 'conduct_experiment' do
    it 'returns a failure message instead of exception' do
      experiment_class_double = class_double(Experiment)

      allow(experiment_class_double).to receive(:succeed)
      allow(experiment_class_double).to receive(:fail)

      allow(Experiment).to receive(:fail).and_return('fail!')

      expect(Human.new.conduct_experiment).to eq('fail!')
    end
  end
end
```

`Experiment` クラスのメソッドをインスタンスメソッドからクラスメソッドに変更したため、スタブの仕方が若干変わっていますが、ここで注目してほしいのは追加された以下の 2 行です。

```ruby
allow(experiment_class_double).to receive(:succeed)
allow(experiment_class_double).to receive(:fail)
```

`class_double` を使って生成した `experiment_class_double` という `Experiment` クラスのモックを使って、`succeed` と `fail` というクラスメソッドが定義されているかどうかを検証しています。

ここで、定義されていないクラスメソッドをスタブしてみましょう。

```diff:spec/experiment_spec.rb
 require_relative '../experiment'

 describe Human do
   context 'conduct_experiment' do
     it 'returns a failure message instead of exception' do
       experiment_class_double = class_double(Experiment)

       allow(Experiment).to receive(:succeed)
       allow(Experiment).to receive(:fail).and_return('fail!')

       allow(experiment_class_double).to receive(:succeed)
-      allow(experiment_class_double).to receive(:fail)
+      allow(experiment_class_double).to receive(:failure)

       expect(Human.new.conduct_experiment).to eq('fail!')
     end
   end
 end
```

すると以下のようなエラーが発生します。

```
Failures:

  1) Human conduct_experiment returns a failure message instead of exception
     Failure/Error: allow(experiment_class_double).to receive(:failure)
       the Experiment class does not implement the class method: failure
     # ./spec/experiment.rb:12:in `block (3 levels) in <top (required)>'
```

「`Experiment` クラスには `failure` というクラスメソッドは実装されていないよ」というエラーです。このように `class_double` を使うと**未定義のクラスメソッドをスタブしようとした際にエラーが発生します**。なお、`class_double` に関してはすべてのクラスメソッドをスタブする必要はありません。

`class_double` に関しては他と違って少し特殊な使い方をするようです。筆者自身も上記以外の `class_double` の使い方がよくわかっておらず、もしかしたらここで紹介した例は副次的な使い方なのかもしれません。

# まとめ
RSpec に関してはまだまだ初心者なので最適な使い分けがあまりよくわかっていないのですが、`spy` よりも `double`、`double` よりも `instance_double` のほうがより厳密なので、基本的には `instance_double` を使うのが良いのかと考えています。

`instance_double` ほど厳密にメソッドの定義を検証しなくて良い場合は `double` を使い、呼び出しているすべてのメソッドをまとめてスタブしたい場合 (返り値がなんでも良い場合に限る) は `spy` を使う、という使い分けになるのかと思います。

# 参考にしたサイト
- [Spy vs Double vs Instance Double](https://www.ombulabs.com/blog/rspec/ruby/spy-vs-double-vs-instance-double.html)
- [RSpec のテストダブルで呼び出しているクラスメソッドの変更を検出する方法について](http://tbpgr.hatenablog.com/entry/2017/03/25/080000)
