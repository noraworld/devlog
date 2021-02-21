---
title: "【Rails】Qiita::Markdownをインストールして使ってみる"
emoji: "😺"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "Rails", "Markdown", "Qiita"]
published: false
order: 12
---

# 環境
CentOS 7.1
Rails 4.2.6
Ruby 2.0.0p353

# Qiita::Markdownとは？
Qiita::Markdownは、いわゆるQiitaの新規投稿画面で使えるQiitaのMarkdownを自分の作った Ruby on Rails のアプリケーションに導入できるパッケージです。
[increments/qiita-markdown](https://github.com/increments/qiita-markdown)

---

`input`
\`\`\`ruby:hello.rb
puts 'hello world!'
\# コードを埋め込んだり
\`\`\`

`output`

```ruby:hello.rb
puts 'hello world!'
# コードを埋め込んだり
```

---

`input`
\* こんな感じの
\* リスト形式にしてみたり

`output`

* こんな感じの
* リスト形式にしてみたり

---

Markdownはとにかくシンプル！ 書きやすい！

さらに、Markdownだけではなく以下のような絵文字も使えるので、Railsのシステムで気軽にMarkdownを使いたい！ という場合におすすめです。

😄 `:smile:`
☺️ `:relaxed:`
🐶 `:dog:`
🐱 `:cat:`
:octocat: `:octocat:`
👍 `:+1:`

他にも使える絵文字はもっとあります。詳しくは Emoji cheat sheet を参照してください。
[Emoji cheat sheet](http://www.webpagefx.com/tools/emoji-cheat-sheet/)

# 導入
さて、そんな便利なQiita::MarkdownをRailsに導入してみましょう。
なお、インストール手順だけを知りたいという人は一番下の`Quick Usage Guide`を参照してください。

まずはGemfileに`qiita-markdown`を追加します。

```ruby:Gemfile
gem 'qiita-markdown'
```

そしてコマンドラインで bundle install を実行。
`$ bundle install`

するとエラーが2つほど発生します。
以下のコマンドを実行してみてねとのことなので、素直に実行してみます。
`$ gem install charlock_holmes -v '0.7.3'`

しかしこのコマンドでもエラーが発生してしまいます。
エラーだけではどうすればいいのかわからないのでググッてみました。
そしたら、以下のコマンドを先に実行しないといけないことがわかりました。

`$ sudo yum -y install libicu-devel`

参考元: [Gitlab : charlock_holmesのインストールエラー](http://qiita.com/tmf16/items/efcb3a85730d78957249)

そして先ほど失敗したコマンドを再び実行します。
`$ gem install charlock_holmes -v '0.7.3'`

```
Building native extensions.  This could take a while...
Successfully installed charlock_holmes-0.7.3
Parsing documentation for charlock_holmes-0.7.3
Installing ri documentation for charlock_holmes-0.7.3
Done installing documentation for charlock_holmes after 0 seconds
1 gem installed
```

今度は成功しました。

ここでもう一度 `$ bundle install` を実行するとエラーの数は減りますが、まだ1つ残っています。
そのエラーによると、以下のコマンドを実行してねとのことなので実行してみます。

`$ gem install rugged -v '0.25.0b4'`

しかしここでもまたエラーが発生します。
こちらも同じく先に実行すべきコマンドがあるようです。

`$ sudo yum -y install cmake`

参考元: [Qiita::Markdownを使う on Yosemite](http://qiita.com/kwappa/items/020f745f880538f0b0ec#rugged)

そしてさっき失敗したコマンドを実行します。

`$ gem install rugged -v '0.25.0b4'`

```
Building native extensions.  This could take a while...
Successfully installed rugged-0.25.0b4
Parsing documentation for rugged-0.25.0b4
Installing ri documentation for rugged-0.25.0b4
Done installing documentation for rugged after 3 seconds
1 gem installed
```

うまくいきました。

これで2つのエラーの問題が解決したので、もう一度 `$ bundle install` を実行します。
`$ bundle install`

```
Bundle complete! 15 Gemfile dependencies, 75 gems now installed.
Use `bundle show [gemname]` to see where a bundled gem is installed.
Post-install message from html-pipeline:
```

無事インストール完了しました！
ところが最後に見慣れないメッセージが表示されました。

```
-------------------------------------------------
Thank you for installing html-pipeline!
You must bundle Filter gem dependencies.
See html-pipeline README.md for more details.
https://github.com/jch/html-pipeline#dependencies
-------------------------------------------------
```

依存関係のあるgemパッケージがありますよ、詳しくはGitHubのリポジトリのREADMEを見てね、とのことだったのでREADMEを見てみたら以下をGemfileに追加しておいてね、と書いてあったので追加します。

```ruby:Gemfile
gem 'github-linguist'
```

これでQiita::Markdownが使えるようになりました！

# 絵文字を使いたい
Qiitaで使える絵文字を使いたい人はあとちょっとだけ作業があります。絵文字を使わない人は飛ばしてもかまいません。

まずはGemfileに以下を追加します。

```ruby:Gemfile
gem 'gemoji'
```

次にRakefileに以下を追加します。

```ruby:Rakefile
load 'tasks/emoji.rake'
```

そして以下のコマンドを実行します。
`$ rake emoji`

成功していれば特にメッセージは表示されず、`public/images`以下に`emoji`というディレクトリが出来ているはずです。

# 実際に使ってみる
最初にヘルパーを定義します。`app/helpers/application_helper.rb`に以下を追加します。

```ruby:app/helpers/application_helper.rb
module ApplicationHelper
  def qiita_markdown(markdown)
    processor = Qiita::Markdown::Processor.new(hostname: "example.com")
    processor.call(markdown)[:output].to_s.html_safe
  end
end
```

⚠️ "example.com" の箇所に自分のサイトのドメインを入れてください。開発環境のときやドメインがないときはとりあえず "example.com" のままでもOKです。(v0.15.0以降。それ以前の場合はhostnameオプションを外してください)

Qiitaの仕様変更により、Qiita::Markdownでは外部のサイトへのリンクがすべて新しいタブで開かれるようになりました。

[外部リンクへの属性が変わります](http://blog.qiita.com/post/149486954709/externallinkattrib)

そのため、バージョン0.15.0(v0.15.0)からはhostnameオプションにドメイン名を指定することで、指定したドメイン以外はすべて新しいタブで開かれるようになります。

このhostnameオプションに関してですが、オプションなのでなしでも動くと思っていたのですが、実際に試してみたらエラーになってしまったので、どうやら必須のようです。

そのため、インストールしたQiita::Markdownのバージョンがv0.15.0以降の場合はhostnameオプションをつけるようにしてください。反対に、それ以前のバージョンをお使いの場合はつけるとエラーになると思うのでつけないでください。

そのほか、v0.15.0からは外部リンクに`rel="nofollow"`が付与されます。

次にRailsで、Markdownで書きたいところをQiitaのMarkdownにそって自由に書いてみます。

```
# 見出し1
## 見出し2
### 見出し3

* リスト

[リンク](https://qiita.com)

```ruby:hello.rb
puts 'hello world!'
\```

猫を見つけた:cat:
```

‼️ 上記のMarkdownの`\`は必要ありません。

そして、これを表示するshow.html.erbでMarkdown形式で表示されるように編集します。

```ruby:app/views/コントローラ名/show.html.erb
<%= qiita_markdown(@変数名.カラム名) %>
```

‼️ `@変数名.カラム名`はコントローラから渡されたActiveRecordの検索結果を持つ変数とデータベース上のMarkdownで書いた部分を保存するカラムを設定してください。すでにshow.html.erbを作っていた場合はMarkdownで書く前に表示していた@変数名とカラム名をそのまま使えばOKです。

これでshowのパスにアクセスし、Markdownになっていて、最後に猫の絵文字が表示されていたらOKです！ お疲れさまでした！

# おまけ
コードを埋め込んだときにシンタックスハイライトにならないのがちょっと残念です。
これに関してはSCSS(スタイルシート)に自分で記述する必要があります。
ぼくは面倒だったので、他の方が紹介しているスタイルをお借りしました。

[Ruby on Rails で Qiita::Markdown を使えるようにするまで (on Yosemite)](http://qiita.com/5t111111/items/55ad30a85372ec6febf5#%E3%81%82%E3%81%A8renderer-%E3%81%A3%E3%81%A6%E8%81%9E%E3%81%8F%E3%81%9F%E3%81%B3%E3%81%AB%E3%82%B9%E3%83%9E%E3%83%83%E3%83%97%E3%81%AE%E7%9C%9F%E4%BC%BC%E3%81%99%E3%82%8B%E3%81%AE%E3%81%82%E3%82%8C%E3%81%AF%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E9%9D%A2%E7%99%BD%E3%81%84%E3%81%8B%E3%82%89%E4%BF%BA%E3%81%8C%E3%82%82%E3%82%89%E3%81%86%E3%82%8F%E3%81%8A%E5%89%8D%E3%81%AF2%E5%BA%A6%E3%81%A8%E3%82%84%E3%82%8B%E3%81%AA%E3%82%88)

この記事のCSSを追加している部分のコードをスタイルシートに追加してください。
これでシンタックスハイライトが出るようになりました！ あとはお好みで好きなスタイルにしてください。

# Quick Usage Guide

```ruby:Gemfile
gem 'qiita-markdown'
gem 'github-linguist'
gem 'gemoji'
```

```ruby:Rakefile
load 'tasks/emoji.rake'
```

```
$ sudo yum -y install libicu-devel`
$ gem install charlock_holmes -v '0.7.3'
$ sudo yum -y install cmake
$ gem install rugged -v '0.25.0b4'
$ rake emoji
$ bundle install
```

⚠️ この順番でうまくいくことは確認していないので、もしうまくいかなかった場合は記事の最初から読んでみてください。

# 参考サイト
[Gitlab : charlock_holmesのインストールエラー](http://qiita.com/tmf16/items/efcb3a85730d78957249)
[Qiita::Markdownを使う on Yosemite](http://qiita.com/kwappa/items/020f745f880538f0b0ec#rugged)
[Ruby on Rails で Qiita::Markdown を使えるようにするまで (on Yosemite)](http://qiita.com/5t111111/items/55ad30a85372ec6febf5#%E3%81%82%E3%81%A8renderer-%E3%81%A3%E3%81%A6%E8%81%9E%E3%81%8F%E3%81%9F%E3%81%B3%E3%81%AB%E3%82%B9%E3%83%9E%E3%83%83%E3%83%97%E3%81%AE%E7%9C%9F%E4%BC%BC%E3%81%99%E3%82%8B%E3%81%AE%E3%81%82%E3%82%8C%E3%81%AF%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E9%9D%A2%E7%99%BD%E3%81%84%E3%81%8B%E3%82%89%E4%BF%BA%E3%81%8C%E3%82%82%E3%82%89%E3%81%86%E3%82%8F%E3%81%8A%E5%89%8D%E3%81%AF2%E5%BA%A6%E3%81%A8%E3%82%84%E3%82%8B%E3%81%AA%E3%82%88)
