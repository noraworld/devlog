---
title: "Ruby: クラス名の先頭につける :: (先頭二重コロン) は何？"
emoji: "💎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "Ruby2.5", "Ruby2.5.1"]
published: true
order: 52
---

# TL;DR
- `ClassA` は相対指定、`::ClassA` は絶対指定
- 相対指定は、その呼び出し元から最も近く、呼び出し元と同階層か、それより上の階層にあるクラスを参照する
- 絶対指定は、トップレベルを指す
- `::ClassA` と `Object::ClassA` は同じ挙動になる

# はじめに
業務で Ruby を書いているのですが、クラス名を指定するときに先頭に `::` をつける記法が、`::` をつけない記法とどう違うのか、について教えていただいたので、自分の頭の中の整理も兼ねてまとめたいと思います。

Ruby の文法に関する内容なので N 番煎じだとは思いますが、自分なりにできるだけ丁寧に説明してみました。参考になれば幸いです。また、誤っている箇所があればご指摘いただけると幸いです。

動作確認したバージョンは、Ruby 2.5.1 です。

# 3 種類のクラスの指定方法
```ruby
class ClassA
  def greet
    "Hello from ClassA"
  end
end
```

上記のコードで `ClassA` の `greet` メソッドを呼び出したいとき、以下の 3 つのクラスの指定方法があります。

1. `ClassA.new.greet`
2. `::ClassA.new.greet`
3. `Object::ClassA.new.greet`

実際に実行してみると、以下のようになります。

```ruby
ClassA.new.greet          #=> "Hello from ClassA"
::ClassA.new.greet        #=> "Hello from ClassA"
Object::ClassA.new.greet  #=> "Hello from ClassA"
```

1 つめの記法はごく自然だと思いますが、実は 2 つめや 3 つめの記法でも、上記のコードでは同じ結果が得られます。ではこれらの違いは一体何でしょうか？

# 絶対的な指定と相対的な指定
また別のコード例を見てみましょう。

```ruby
class ClassA
  def greet
    "Hello from ClassA"
  end

  class ClassB
    def greet
      "Hello from ClassA::ClassB"
    end

    class ClassA
      def greet
        "Hello from ClassA::ClassB::ClassA"
      end
    end

    class ClassC
      def relative
        ClassA.new.greet
      end

      def absolute_by_double_colon
        ::ClassA.new.greet
      end

      def absolute_by_object
        Object::ClassA.new.greet
      end
    end
  end
end
```

`ClassA::ClassB::ClassC` に 3 つのメソッドがあります。`relative` は 1 つめの記法、`absolute_by_double_colon` は 2 つめの記法、`absolute_by_object` は 3 つめの記法でそれぞれクラス内のメソッドを呼び出しています。

これらのメソッドを実行してみると以下のような結果になります。

```ruby
ClassA::ClassB::ClassC.new.relative                  #=> "Hello from ClassA::ClassB::ClassA"
ClassA::ClassB::ClassC.new.absolute_by_double_colon  #=> "Hello from ClassA"
ClassA::ClassB::ClassC.new.absolute_by_object        #=> "Hello from ClassA"
```

1 つめは `ClassA::ClassB::ClassA` を参照しているのに対し、2 つめと 3 つめは `ClassA` を参照しています。これはどういうことでしょう。

メソッド名が若干ヒントになっていましたが、1 つめは相対的に参照しているのに対し、2 つめと 3 つめは絶対的に参照しています。

もう少し詳しく見てみましょう。

## relative
`ClassA.new.greet` のように直接クラス名を書くと、その呼び出し元から最も近く、呼び出し元と同階層か、それより上の階層にあるクラスを参照します。同階層に該当するクラス (今回は `ClassA`) がなければ上の階層へ、上の階層にもなければそのまた上の階層へ... と辿っていきます。

今回の場合は、`ClassA::ClassB::ClassC` の `relative` メソッドを呼び出したときに、まず同階層に `ClassA` があるかどうかを探索します。`ClassC` には `ClassA` がないので、上の階層に行きます。

すると `ClassB` には `ClassA` がありました。そのため、`ClassA::ClassB::ClassA` が `new` でインスタンス化され、`greet` メソッドが呼ばれました。

## absolute_by_double_colon
`::ClassA.new.greet` のように先頭に `::` をつけるとトップレベルの階層を意味します。つまり、`::ClassA` は一番外側の `ClassA` を指します。そのため、もし、`ClassA::ClassB::ClassA` をこの記法で参照したい場合は、`::ClassA::ClassB::ClassA` と書く必要があります。

少しややこしいですが、`ClassA.new.greet` のように、相対的に指定する場合は、同階層から上の階層へ順番に探索していくのに対し、`::ClassA.new.greet` のように、絶対的に指定した場合は、トップレベルから見て、該当する階層にそのクラスがなければエラーになります。

たとえば、`relative` メソッドの中身を `ClassB.new.greet` に書き換えると、`ClassA::ClassB` を参照しますが、`absolute_by_double_colon` を `::ClassB.new.greet` に書き換えるとエラーになります。なぜなら、トップレベルは `ClassA` であり、`ClassB` ではないからです。もし `ClassA::ClassB` を参照したい場合は `::ClassA::ClassB` と書く必要があります。

## absolute_by_object
`Object::ClassA.new.greet` のような記法は `::ClassA.new.greet` と同じです。

# 相対指定で下には辿らないか確認
`ClassA.new.greet` のような相対指定の場合は、まず同階層を探索し、なければ上へ上へと探索します。

しかし、先ほどのコードだけを見ると、「下の階層がないから上を探索したのでは？ もし下の階層のほうにも `ClassA` があり、そちらのほうがトップレベルの `ClassA` よりも近い場所にあれば下の階層が参照されるのでは？」という疑問が湧いてくるかもしれません。

では、本当に下には辿らないのか試してみましょう。

```ruby
class ClassA
  def greet
    "Hello from ClassA"
  end

  class ClassB
    class ClassC
      class ClassD
        def relative
          ClassA.new.greet
        end

        class ClassE
          class ClassA
            def greet
              "Hello from ClassA::ClassB::ClassC::ClassD::ClassE::ClassA"
            end
          end
        end
      end
    end
  end
end
```

`ClassA` は、トップレベルから見た `ClassA` と、`ClassA::ClassB::ClassC::ClassD::ClassE::ClassA` があります。そして呼び出すのは `ClassA::ClassB::ClassC::ClassD` の `relative` メソッドです。

ここで `relative` メソッドを呼び出してみましょう。

```ruby
ClassA::ClassB::ClassC::ClassD.new.relative  #=> "Hello from ClassA"
```

トップレベルの `ClassA` が参照されました。`ClassA::ClassB::ClassC::ClassD` に近いのは、`ClassA::ClassB::ClassC::ClassD::ClassE::ClassA` のほうですが、こちらは参照されませんでした。この結果から、「最も近い階層にあるクラス」ではなく、「最も近くて、自身よりも同階層か上の階層にあるクラス」が参照されることがわかります。

# まとめ
- `ClassA` は相対指定、`::ClassA` は絶対指定
- 相対指定は、その呼び出し元から最も近く、呼び出し元と同階層か、それより上の階層にあるクラスを参照する
- 絶対指定は、トップレベルを指す
- `::ClassA` と `Object::ClassA` は同じ挙動になる
