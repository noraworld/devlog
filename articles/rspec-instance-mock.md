---
title: "RSpec でインスタンスメソッドがスタブできないときはインスタンスをモックする必要があるよという話"
emoji: "👻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "RSpec"]
published: true
order: 60
layout: article
---

# はじめに
下記のようなコードを書いたとします。

```ruby:instance_stub.rb
class Human
  def meet
    greeting = Greeting.new
    greeting.hello
  end
end

class Greeting
  def hello
    'Hello!'
  end
end
```

上記のコードに対して、`Human#meet` をテストしたいのですが、`Greeting#hello` は実際には呼び出したくなかったとします。

そのため、`Greeting#hello` をスタブする以下のようなテストコードを書いたとします。わかりやすいように、スタブした際の返り値を変更して、返り値が正しく変更されているかどうかを検証しています。

```ruby:spec/instance_stub_spec.rb
require_relative '../instance_stub'

describe Human do
  context 'meet' do
    it 'returns a stub message instead of a real message' do
      greeting = Greeting.new

      allow(greeting).to receive(:hello).and_return('Hello from stub!')

      expect(Human.new.meet).to eq('Hello from stub!')
    end
  end
end
```

このコードは正しく動作しません。以下のようなエラーが発生します。

```
Failures:

  1) Human meet returns a stub message instead of a real message
     Failure/Error: expect(Human.new.meet).to eq('Hello from stub!')

       expected: "Hello from stub!"
            got: "Hello!"

       (compared using ==)
     # ./spec/instance_stub_spec_miss.rb:10:in `block (3 levels) in <top (required)>'
```

テスト中は `Greeting#hello` を呼び出したくないのでスタブしようとしていたのに、スタブできていません (`Greeting#hello` が実際に実行されてしまっています)。

この原因と解決法について説明します。

# TL;DR
テストコード内で生成したインスタンスと実際のコード内で生成したインスタンスは別のオブジェクトであるため、スタブしたいインスタンスメソッドを持つクラスのインスタンスをテストコード内で生成しても正しくスタブすることはできない。

正しくスタブするためには、`new` をスタブする必要がある。

```diff:spec/instance_stub_spec.rb
require_relative '../instance_stub'

describe Human do
  context 'meet' do
    it 'returns a stub message instead of a real message' do
-      greeting = Greeting.new
+      greeting_mock = instance_double(Greeting)

-      allow(greeting).to receive(:hello).and_return('Hello from stub!')
+      allow(Greeting).to receive(:new).and_return(greeting_mock)
+      allow(greeting_mock).to receive(:hello).and_return('Hello from stub!')

      expect(Human.new.meet).to eq('Hello from stub!')
    end
  end
end
```

# 原因
まず原因に関してですが、行番号を付与して先ほどのテストコードを再掲します。

```ruby:spec/instance_stub_spec.rb
 1	require_relative '../instance_stub'
 2
 3	describe Human do
 4	  context 'meet' do
 5	    it 'returns a stub message instead of a real message' do
 6	      greeting = Greeting.new
 7
 8	      allow(greeting).to receive(:hello).and_return('Hello from stub!')
 9
10	      expect(Human.new.meet).to eq('Hello from stub!')
11	    end
12	  end
13	end
```

6 行目で `Greeting` クラスのインスタンスを生成しています。8 行目で `Greeting` インスタンスの `hello` メソッドをスタブして `'Hello from stub!'` を返すようにしています。

一見するとこれで `Greeting#hello` がスタブされるように見えますが、先ほど紹介したように、これだと正しくスタブされていません。

理由は、このテストコード内 (`spec/instance_stub_spec.rb`) で生成した `Greeting` インスタンスと、実際のコード内 (`instance_stub.rb`) で生成した `Greeting` インスタンスは、どちらも `Greeting` インスタンスですが、オブジェクトが別だからです。

これを説明するには、以下のプログラムを IRB で実行するとわかりやすいでしょう。

```irb
irb(main):001:0> class Foo; end
=> nil
irb(main):002:0> Foo.new == Foo.new
=> false
irb(main):003:0> Foo.new
=> #<Foo:0x00007faa9aafee88>
irb(main):004:0> Foo.new
=> #<Foo:0x00007faa99b1fa58>
```

中身が空の `Foo` クラスを作って、2 つの `Foo` インスタンスを比較していますが、`false` が返ってきます。

もう少し考察してみましょう。`Foo` インスタンスを生成した際の返り値を見てみると、インスタンスを生成するたびにオブジェクトの ID が変わっていることがわかります (ちなみに、オブジェクトの ID は `Foo.new.object_id` で取得することができます)。

つまり、全く同じ `Foo.new` を実行しても、実行するたびに別のオブジェクトが生成されるため、一致しないのです。

実際のコードとテストコードを再掲します。

```ruby:instance_stub.rb
 1	class Human
 2	  def meet
 3	    greeting = Greeting.new
 4	    greeting.hello
 5	  end
 6	end
 7
 8	class Greeting
 9	  def hello
10	    'Hello!'
11	  end
12	end
```

```ruby:spec/instance_stub_spec.rb
 1	require_relative '../instance_stub'
 2
 3	describe Human do
 4	  context 'meet' do
 5	    it 'returns a stub message instead of a real message' do
 6	      greeting = Greeting.new
 7
 8	      allow(greeting).to receive(:hello).and_return('Hello from stub!')
 9
10	      expect(Human.new.meet).to eq('Hello from stub!')
11	    end
12	  end
13	end
```

先ほどの話を踏まえて考えると、`instance_stub.rb` の 3 行目の `Greeting.new` と `spec/instance_stub_spec.rb` の 6 行目の `Greeting.new` は、見た目は同じに見えてもオブジェクトが異なります。

そのため、`spec/instance_stub_spec.rb` の 8 行目は、もし 6 行目で生成した `Greeting` インスタンスと同じオブジェクトであればスタブできますが、実際には `instance_stub.rb` の 3 行目で生成した `Greeting` インスタンスとは別のオブジェクトなのでスタブできていないということになります。

# 解決法
ではどのようにすれば良いかというと、`Greeting` インスタンスを生成する際の `new` メソッドをスタブすれば期待した通りにスタブできます。

```ruby:spec/instance_stub_spec.rb
require_relative '../instance_stub'

describe Human do
  context 'meet' do
    it 'returns a stub message instead of a real message' do
      greeting_mock = instance_double(Greeting)

      allow(Greeting).to receive(:new).and_return(greeting_mock)
      allow(greeting_mock).to receive(:hello).and_return('Hello from stub!')

      expect(Human.new.meet).to eq('Hello from stub!')
    end
  end
end
```

先ほどのテストコードでは `Greeting` インスタンスを直接生成していましたが、今回は `Greeting` クラスの `new` をスタブして、`greeting_mock` という名前のモックを返すようにしています。

そしてこの `greeting_mock` が `hello` というメソッドをスタブして、`'Hello from stub!'` を返すようにしています。

このテストコードを実行すると期待した通りに動作します。実際のコードで `Greeting` インスタンスを生成した際にモックオブジェクトにすげ替えられて、そのモックオブジェクトに対して `hello` メソッドが呼ばれるため、スタブされる際の返り値である `'Hello from stub!'` が返却されます。

# new をスタブしなくても良い例
ここまでの内容を理解したところで、自分は混乱してしまいました。それは『[使えるRSpec入門・その3「ゼロからわかるモック（mock）を使ったテストの書き方」](https://qiita.com/jnchito/items/640f17e124ab263a54dd)』を読んだときです。

この記事で紹介されているコード例を引用させていただきます。

```ruby
# 注：本当に動かす場合はtwitter gemが必要です
require 'twitter'

class WeatherBot
  def tweet_forecast
    twitter_client.update '今日は晴れです'
  end

  def twitter_client
    Twitter::REST::Client.new
  end
end
```

```ruby
it 'エラーなく予報をツイートすること' do
  # Twitter clientのモックを作る
  twitter_client_mock = double('Twitter client')
  # updateメソッドが呼びだせるようにする
  allow(twitter_client_mock).to receive(:update)

  weather_bot = WeatherBot.new
  # twitter_clientメソッドが呼ばれたら上で作ったモックを返すように実装を書き換える
  allow(weather_bot).to receive(:twitter_client).and_return(twitter_client_mock)

  expect{ weather_bot.tweet_forecast }.not_to raise_error
end
```

上記の実際のコードでは `twitter_client` メソッド内で `Twitter::REST::Client` クラスのインスタンスを生成しています。そして、テストコードでは `Twitter::REST::Client` の `new` メソッドをスタブしていません。

上記のテストコードは正しく動作するのですが、`new` メソッドをスタブしていないのになぜ正しくスタブできているのだろうと疑問に思いました。

しかし、落ち着いて考えれば正しくスタブできていることがわかります。`Twitter::REST::Client` クラスのインスタンスを生成しているだけの `twitter_client` メソッドを丸ごとスタブしているからです。

このテストコードでは `WeatherBot` クラスの `tweet_forecast` メソッドで例外が発生しないことを検証していますが、このメソッド内で呼び出されている `twitter_client` メソッドを丸ごとスタブしているため、`twitter_client` メソッドの中身の `Twitter::REST::Client.new` は実行されていないことになります。

そのため、正しくスタブできているというわけです。

# インスタンスを生成するメソッドを別で用意して丸ごとスタブしてみる
先ほどの `instance_stub.rb` において、上記の項目で取り上げさせていただいた Twitter クライアントのコード風に、インスタンスを生成するだけのメソッドを作って書き換えてみましょう。すると以下のようなコードになります。

```ruby:method_stub.rb
class Human
  def meet
    greeting_instance.hello
  end

  def greeting_instance
    Greeting.new
  end
end

class Greeting
  def hello
    'Hello!'
  end
end
```

以前は `Human#meet` で `Greeting` インスタンスを生成していましたが、`Greeting` インスタンスを生成するだけの `greeting_instance` メソッドを用意してそれを呼び出すように変更しました。

上記のコードにおいて、`greeting_instance` メソッドを丸ごとスタブして `Greeting#hello` の返り値を変更するようなテストコードを書くと以下のようになります。

```ruby:spec/method_stub_spec.rb
require_relative '../method_stub'

describe Human do
  context 'meet' do
    it 'returns a stub message instead of a real message' do
      greeting_mock = instance_double(Greeting)

      human = Human.new
      allow(human).to receive(:greeting_instance).and_return(greeting_mock)
      allow(greeting_mock).to receive(:hello).and_return('Hello from stub!')

      expect(human.meet).to eq('Hello from stub!')
    end
  end
end
```

先ほどの Twitter クライアントのテストコードと同様に、インスタンスを生成するだけの `greeting_instance` メソッドを丸ごとスタブして、モックオブジェクトを返すようにしています。

そのモックオブジェクトに対して `hello` メソッドが実行された際に、スタブして `'Hello from stub!'` を返すようにしています。

`greeting_instance` メソッドを丸ごとスタブしているため、`Greeting.new` は実際には実行されません。そのため、上記のテストコードも正しくスタブできていることになります。

もちろん、`Greeting.new` の部分をスタブした場合でも期待した通りに動作します。つまり、`method_stub.rb` のコードに対して、`spec/instance_stub_spec.rb` のテストコードを実行しても正しく動作するわけです (`require_relative` でロードするファイルの対象を変更する必要はあります)。

```ruby:method_stub.rb
class Human
  def meet
    greeting_instance.hello
  end

  def greeting_instance
    Greeting.new
  end
end

class Greeting
  def hello
    'Hello!'
  end
end
```

```ruby:spec/instance_stub_spec.rb
require_relative '../method_stub'

describe Human do
  context 'meet' do
    it 'returns a stub message instead of a real message' do
      greeting_mock = instance_double(Greeting)

      allow(Greeting).to receive(:new).and_return(greeting_mock)
      allow(greeting_mock).to receive(:hello).and_return('Hello from stub!')

      expect(Human.new.meet).to eq('Hello from stub!')
    end
  end
end
```

この場合は、`greeting_instance` メソッドをスタブする代わりに、その中身である `Greeting.new` をスタブしていることになります。どちらの場合でもインスタンスの生成部分をスタブしていることになるので、正しく動作します。

# まとめ
スタブしたいインスタンスメソッドを持つクラスのインスタンスをテストコード内で生成しても、実際のコード内のインスタンスとは別のオブジェクトなので、インスタンスメソッドを正しくスタブできないよというお話でした。

ところで、この記事ではモックオブジェクトを作る際に `instance_double` を使用しました。`double` や `instance_double` の違いについての記事も書きましたので、興味があれば併せてご覧ください。

[RSpec における double / spy / instance_double / class_double のそれぞれの違いについて](https://qiita.com/noraworld/items/3c6d13519ecde6b68fdf)

# 参考にしたサイト
- [使えるRSpec入門・その3「ゼロからわかるモック（mock）を使ったテストの書き方」](https://qiita.com/jnchito/items/640f17e124ab263a54dd)
