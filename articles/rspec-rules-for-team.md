---
title: "RSpec 導入時にチーム内で意識・決定しておきたいルール"
emoji: "🤝"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "RSpec"]
published: true
order: 98
layout: article
---

# はじめに
Ruby / Rails の代表的なテストフレームワークである RSpec ですが、書き方の流派やポリシーは人によって異なります。

ここでは、筆者個人がベストだと思っている、あるいは単純に好みな書き方やポリシーを紹介します。

必ずしもこれに従うべきというわけではありませんが、導入時にチーム内で決めておかなければならないこととして参考にしていただければ幸いです。



# 自然言語を統一する
これは、テストケースの文言を英語で書くか日本語で書くか (あるいはもっと他の言語で書くか)、ということです。

これはどちらにすべきというのは一概には決められず、チーム内でどちらが良いか議論して判断すべきです。

もちろん、チーム内の開発者全員が、何の問題もなく英語を読み書きできるのであれば、英語を選定すべきでしょう。なぜなら、RSpec は、自然言語、特に英語として自然に読めるような DSL になっているからです。

とはいえ、チーム全員が日本人で、必ずしも全員が英語を難なく読み書きできるわけではなく、なおかつ今後も英語話者の人がチームに参画する予定がないのであれば、日本語で書くほうが良いかもしれません。がんばって英語で読み書きするために、辞書を引いたり翻訳したりする工数が発生するのは効率的ではないからです。

結論としては、**全員が英語を難なく読み書きできる** のであれば **英語** を選定し、全員が英語をできるわけではなく、かつ **英語話者が今後もチームに入ってくる予定がない** のであれば **日本語** を選定すると良いでしょう。

ただしこれはあくまで一つの基準なので、チーム内でよく話し合って決めるのが良いと思います。

ちなみに英語と日本語が混ざっていると、単に統一感がないだけではなく、英語と日本語の両方が読める人でないと読むのにストレスがかかるかもしれないので注意しましょう。導入時だからこそ、どちらかに統一する絶好のチャンスです。



# エイリアスを適切に使い分ける
RSpec にはエイリアスが存在します。そのエイリアスをどのように使い分けるかについて、あらかじめ決めておくと統一感がありスッキリします。

## it / example / specify
`it`, `example`, `specify` はどれも全く同じ挙動です。つまり、どれを使っても処理としては全く変わりません。

しかし、これらを適当に使ってしまうと、せっかくのエイリアスとしての存在が台無しになってしまいます。

そもそもなぜ RSpec にはこのようなエイリアスが存在するのでしょうか？ 先ほども言いましたが、これは自然言語 (英語) として自然に読めるようにするためです。

`it` というのは英単語の代名詞である "it" のことです。なので、"it is ..." や "it returns ..." のように自然な英語の文章として成り立つようにするために `it` という名前になっているのです。

同様に、`example` は「例」という意味なので、「〜をテストする例」という意味として使えます。`specify` は「明記する」という意味なので、「〜を (仕様として) 明記する」という意味として使えます。

```ruby
# HTTP ステータスが 200 OK である
it 'returns HTTP status as 200 OK' do
end

# パスワードが変更される例
example 'password changed' do
end

# ユーザがログインページにリダイレクトされることを仕様として明記する
specify 'user is redirected to the sign in page' do
end
```

テストケースの文言を書いたときに、これらの意味に一致するように `it`, `example`, `specify` を使い分けるのが良いと思います。または、つねに `it` に続くような形で文言を決めるというのもありです。

さて、ここまでは英語の話をしてきました。日本語の場合はどうでしょうか？

これらの英単語は、あくまで英語として自然に読めるように決められた名前なので、日本語で書くとなると少々違和感が発生することがしばしばあります。

たとえば「it HTTP ステータスが 200 OK である」は個人的には不自然に感じます。

なので、筆者としてのオススメは、日本語で書く際は `specify` に統一することです。また、この後ろに続く文言は「〜こと」で終わらせるときれいに表記できます。

先ほどの例を書き換えると、「specify HTTP ステータスが 200 OK であること」となります。これなら、「HTTP ステータスが 200 OK であること」を (仕様として) 明記するというふうに読めるので、さっきよりは自然です。

もちろん英語と日本語が混ざっている時点ですでに不自然な感じはありますが、無理に英語にすると返って効率が悪くなることは先ほどもご説明したとおりです。



# describe / context / it (example, specify) を適切に使う
`RSpec` には `describe` / `context` / `it` などのブロックを構成するための表現がいくつかあります。

もちろん、これらは全く一緒のものではない[^1]ため、挙動としてある程度の使い分けは存在するのですが、たまに使い分けがされていないテストコードを見かけることがあります。

[^1]: ただし `describe` と `context` は同じ挙動

ここでこれらの使い分けについて整理しておきましょう。

## describe
`describe` は **テストの対象** を記述します。とりわけ、クラスやメソッドなどを指定することが多いです。

たとえば、`UsersController` クラスにある `index` メソッドや `show` メソッドなどのテストを書きたい場合は以下のようにします。

```ruby
RSpec.describe UsersController do
  describe '#index' do
    # ここに UsersController クラスの index メソッドのテストを書く
  end

  describe '#show' do
    # ここに UsersController クラスの show メソッドのテストを書く
  end

  describe '#new' do
    # ここに UsersController クラスの new メソッドのテストを書く
  end

  describe '#create' do
    # ここに UsersController クラスの create メソッドのテストを書く
  end

  describe '#edit' do
    # ここに UsersController クラスの edit メソッドのテストを書く
  end

  describe '#update' do
    # ここに UsersController クラスの update メソッドのテストを書く
  end

  describe '#destroy' do
    # ここに UsersController クラスの destroy メソッドのテストを書く
  end
end
```

`describe` の後ろは文字列を指定しますが、`UsersController` のようにクラス名やモジュール名を直接記述することができます。

また、メソッドを表す意味で `#` をつけることがよくあります。たとえば `index` メソッドなら `describe '#index'` のように書きます。

ネストされている `describe` に関しては、`RSpec.` を省略することができます。シンプルにするためにも省略できる箇所は省略するのが良いでしょう。

## context
`context` は **特定の条件** を記述します。

たとえば、正常系の処理と異常系の処理をそれぞれ記述する際に使用します。

以下は `UsersController` クラスの `create` メソッドの例です。

```ruby
RSpec.describe UsersController do
  describe '#create' do
    context 'when normal case' do
      # ここに UsersController クラスの create メソッドの正常系のテストを書く
    end

    context 'when abnormal case' do
      context 'when user is not signed in' do
        # ユーザがサインインしていない場合 (異常系) の処理のテストを書く
      end

      context 'when user has no permission to access' do
        # ユーザがアクセス権限を持っていない場合 (異常系) の処理のテストを書く
      end

      context 'when the sent value is illegal' do
        # 送られてきた値が不正な場合 (異常系) の処理のテストを書く
      end
    end
  end
end
```

上記の例のように、`context` をネストさせて、異常系の中でもサインインしていない場合や権限を持っていない場合、値が不正な場合のように、処理に応じて細かくグループを分けるとよりわかりやすくなります。

## it (example, specify)
`it` (`example`, `specify`) は **具体的な振る舞い** を記述します。

たとえば、正常な処理だった場合に、HTTP ステータスが 200 OK であることを明記したり、ログインが必要な画面でログインせずにアクセスした場合にログインページにリダイレクトされることを明記したりします。

```ruby
RSpec.describe UsersController do
  describe '#create' do
    # 正常系
    context 'when normal case' do
      # HTTP ステータス 200 OK を返す
      it 'returns HTTP status as 200 OK' do
        expect(response.status).to eq 200
      end
    end

    # 異常系
    context 'when abnormal case' do
      # ユーザがサインインしていない場合
      context 'when user is not signed in' do
        # HTTP ステータス 302 Found を返す
        it 'returns HTTP status as 302 Found' do
          expect(response.status).to eq 302
        end

        # ログインページにリダイレクトされる
        it 'redirects the sign in page' do
          expect(response.status).to redirect_to sign_in_path
        end
      end

      # ユーザがアクセス権限を持っていない場合
      context 'when user has no permission to access' do
        # HTTP ステータス 403 Forbidden を返す
        it 'returns HTTP status as 403 Forbidden' do
          expect(response.status).to eq 403
        end
      end

      # 送られてきた値が不正な場合
      context 'when the sent value is illegal' do
        # 例外が発生する
        it 'raises an exception' do
          expect { post user_path, params: { id: 'illegal value' } }.to raise_error(SomeError)
        end

        # ユーザ作成ページに戻される
        it 'takes back to the edit page' do
          expect(response.status).to redirect_to user_new_path
        end
      end
    end
  end
end
```

`it` が一番下の階層になりますので、ここに具体的な振る舞いとその結果を記述していきます。



<!-- TODO -->
<!-- # 自然言語の表記方法を統一する -->
<!-- * `context` は「〜のとき」「〜の場合」で終わる -->
<!-- * `it` は「〜こと」で終わる -->
<!-- * `shared_examples` の中身は名詞にする -->
<!-- * など -->



# なるべく細分化する
テストケースをより読みやすくする手段として、それぞれのテストケースはなるべく細かく書くことを推奨します。

これは `describe` / `context` / `it` の使い分けに似ています。たとえば、極端な話、`describe` や `context` を使わずに、`it` だけでテストケースを説明することもできるでしょう。

```ruby
RSpec.describe UsersController do
  it '正常な処理の場合、create メソッドが HTTP ステータス 200 OK を返すこと' do
  end

  it 'ユーザがサインインしていない場合、create メソッドが HTTP ステータス 302 Found を返すこと' do
  end

  it 'ユーザがサインインしていない場合、create メソッドでログインページにリダイレクトされること' do
  end

  it 'ユーザがアクセス権限を持っていない場合、create メソッドが HTTP ステータス 403 Forbidden を返すこと' do
  end

  it '送られてきた値が不正な場合、create メソッドで例外が発生すること' do
  end

  it '送られてきた値が不正な場合、create メソッドでユーザ作成ページに戻されること' do
  end
end
```

上記のテストは果たして読みやすいでしょうか？

単に文言が冗長的なだけではなく、それぞれのケースごとに共通する処理をまとめられないため、コードとしても冗長になります。

なにより、正常系と異常系、サインインしていない場合と、アクセス権限を持っていない場合と、送られてきた値が不正な場合の処理にそれぞれまとまりがないため、読みづらくなります。

それぞれのテストケースがどのクラスの、どのメソッドで、どのような場合に、どのような処理になるのかを明確にするためにも、テストケースはなるべく細かく分けるように心がけましょう。



# 原則、1 つの it 内には 1 つの expect にする
1 つの `it` の中には複数の `expect` を書くことができます。

```ruby
RSpec.describe UsersController do
  describe '#create' do
    # 異常系
    context 'when abnormal case' do
      # ユーザがサインインしていない場合
      context 'when user is not signed in' do
        # HTTP ステータス 302 Found を返し、ログインページにリダイレクトされること
        it 'returns HTTP status as 302 Found, and redirects the sign in page' do
          expect(response.status).to eq 302
          expect(response.status).to redirect_to sign_in_path
        end
      end

      # 送られてきた値が不正な場合
      context 'when the sent value is illegal' do
        # 例外が発生し、ユーザ作成ページに戻されること
        it 'raises an exception, and takes back to the edit page' do
          expect { post user_path, params: { id: 'illegal value' } }.to raise_error(SomeError)
          expect(response.status).to redirect_to user_new_path
        end
      end
    end
  end
end
```

上記の例では、`it` の中に `expect` が 2 つ入っています。

ユーザがサインインしていない場合の挙動として、HTTP ステータス 302 Found を返すことと、ログインページにリダイレクトされることは、1 回のレスポンスで連続して発生します。

また、送られてきた値が不正な場合も、例外が発生することと、ユーザ作成ページに戻されることは、同時に発生します。

1 回の処理で発生することなのだから、1 つの `it` にまとめて書いたほうが良いのでは？ と思うかもしれません。

たしかにまとまっていたほうが読みやすさは上がるかもしれません。また、上記の例では 1 つの `it` につき 2 つしか `expect` が入っていないため、そこまで大きな問題になることはないかもしれません。

ですが、たとえば `it` の中に 10 個の `expect` があったとして、テスト実行時にその中のどれか 1 つが失敗していたら、どの `expect` が失敗しているかすぐに見つけるのは難しいでしょう。

つまり、1 つの `it` の中に複数の `expect` があると、テスト実行時にどの `expect` が失敗したのかがわかりづらくなるのです。

そうならないために、`it` の中には原則として 1 つの `expect` のみを入れるように心がけましょう。いずれかの `expect` が失敗した場合に、どのケースなのかが一目瞭然になります。



# describe / example / it の文言 (引数) を省略しない
実は `describe` / `example` / `it` の後ろに続く文言 (引数) は省略が可能です。

```ruby
RSpec.describe UsersController do
  describe do
    context do
      context do
        it do
          expect(response.status).to eq 200
        end
      end

      context do
        it do
          expect(response.status).to eq 403
        end
      end
    end
  end
end
```

これは説明しなくてもお分かりかと思いますが、文言を省略すると、どのメソッドの、どういう場合の、どういうテストなのかがわかりづらくなります。

コードを見たときもそうですし、テストを実行させたときにも空行で表示されてしまう (`it` の中身は "is expected to eq 200" のように表示される) ので非常にわかりづらくなります。

もちろん文言を考えるよりも先に実際のテストコードの処理を書くために、一時的に引数を省略することは問題ありませんが、最終的には文言を記述するようにしましょう。



# 共通化できる部分は適切な範囲内でまとめる
この記事では詳しくは紹介しませんが、RSpec には以下のような、共通する処理をまとめる仕組みがいくつかあります。いわゆる DRY のための機構です。

* `before`
* `subject`
* `shared_examples` / `it_behaves_like`
* `shared_context` / `include_context`

これらの仕組みを利用することで、何度も登場する処理をまとめて、コードの可読性を向上させることができます。

しかし一方で、やりすぎなくらいこれらの仕組みを使ってしまうと、どこに共通化されているのかがわからず、コードを読む際にあっちへいったりこっちへいったりで可読性が下がってしまいます。

[こちらの記事](https://qiita.com/jnchito/items/42193d066bd61c740612#%E6%B3%A8%E6%84%8F-%E6%8A%80%E5%B7%A7%E7%9A%84%E3%81%AA%E3%83%86%E3%82%B9%E3%83%88%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AF%E9%81%BF%E3%81%91%E3%81%BE%E3%81%97%E3%82%87%E3%81%86) でも言及されていますが、DRY よりも可読性を求めるようにしましょう。



# 極力、変数を使わない
アプリケーションのコードと同じく、テストコード内で変数を使いたくなることは多々あるでしょう。

でも、ちょっと待ってください。変数の代わりに `let` や `let!` を使いましょう。理由に関しては [こちらの記事](https://qiita.com/jnchito/items/cdd9eef2ed193267c651) に詳しくまとめられています。

一点、注意してほしいのは、`let` は遅延評価されることです。つまり、コードが上から順番に読まれるタイミングではなく、呼び出されるときにはじめて評価されます。

しかし、たとえばパスワードを更新した際にパスワードのハッシュ値が更新されていることを確認したかったとしましょう。その場合は、比較する前、つまりパスワードが更新される前に現在のハッシュ値を取得しておかなければなりません。

そういうときは `let!` を使います。`let!` は `let` と異なり、即時評価されます。これで上記の問題を解決することができます。

必ずしも `let` を使わなければいけないわけではないのですが、たいていの場合は `let` を使ったほうが簡潔にテストコードを表現することができます。

どうしても通常の変数を使わざるを得ない場合以外は `let` や `let!` を使うようにしましょう。



# 非推奨の機能を使わない
RSpec は変化の激しい RubyGems です。これまで Rails のバージョンアップに伴い、様々な仕様の変更がありました。その中で、非推奨の機能もいくつかあります。

これからプロジェクトに RSpec を導入する際は、最新版では何が非推奨なのかを把握しておく必要があります。インターネット上にあるコードサンプルは、もしかしたら今は非推奨かもしれません。

ここでは、バージョン 3.10 時点で非推奨である (あるいは推奨されている代替が存在する) 代表的なものを簡単に紹介します。

## Controller spec を使わない
現在は Request spec の利用が推奨されています。

Request spec と Controller spec の違いに関しては [こちらの記事](https://qiita.com/t2kojima/items/ad7a8ade9e7a99fb4384) を参照してください。

## Feature spec を使わない
Feature spec は現時点では非推奨というわけではないのですが、System spec の利用が推奨されています。

System spec と Feature spec の違いに関しては [こちらの記事](https://qiita.com/shima-zu/items/3eb08662f2da05196ec9) を参照してください。

# should を使わない
これはもうあまり見かけなくなりましたが、`should` が使われていたら、`expect` に書き換えるようにしましょう。



# まとめ
ここでは RSpec 導入時に、これは決めておきたいということや、これは事前に意識してテストコードを書いてほしいという内容を紹介しました。

他にもチームごとにさまざまなルールがあるかもしれません。状況に応じて議論すると良いでしょう。

最後に、ここで書いた内容を箇条書きにしてまとめたマークダウンを以下に掲載します。これをプロジェクトのリポジトリの README やドキュメントツールの目に付く場所ににコピペしておくことをおすすめします。

`[]` 内はチームごとに方針を決めるのが良いかと思いますので、チーム内で話し合って、選定してください。

```markdown
* 自然言語を統一する
  * 本プロジェクト内では [ 英語 | 日本語 ] で書く
* エイリアスを適切に使い分ける
  * `it` / `example` / `specify` は [ 文脈に応じて使い分ける | (特定のエイリアス) に固定する ]
* describe / context / it を適切に使う
* なるべく細分化する
* 原則、1 つの it 内には 1 つの expect にする
* describe / example / it の文言 (引数) を省略しない
* 共通化できる部分は適切な範囲内でまとめる
* 極力、変数を使わない
* 非推奨の機能を使わない
* Controller spec を使わない
* Feature spec を使わない
* should を使わない
```

テストは正しく運用すればエンバグを未然に防ぎ、アプリケーションコードの保守性や安全性を向上させることができます。

その役割を担うはずのテストコードが読みづらく負債にならないようにするために、適切にルールを守って運用しましょう。



# 参考
* [使えるRSpec入門・その1「RSpecの基本的な構文や便利な機能を理解する」](https://qiita.com/jnchito/items/42193d066bd61c740612)
* [RSpecのletを使うのはどんなときか？（翻訳）](https://qiita.com/jnchito/items/cdd9eef2ed193267c651)
* [Rails5でコントローラのテストをController specからRequest specに移行する](https://qiita.com/t2kojima/items/ad7a8ade9e7a99fb4384)
* [Request Specを使おう](https://qiita.com/kagesumi3m/items/10244978273ffffa9b92)
* [System SpecとFeature Specは何が違うの？](https://qiita.com/shima-zu/items/3eb08662f2da05196ec9)
* [RSpecの(describe/context/example/it)の使い分け](https://qiita.com/uchiko/items/d34c5d1298934252f58f)
