---
title: "Vagrant や Docker を使わずに macOS でマストドンの開発環境を構築する"
emoji: "🍣"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "development", "Mac", "Ruby", "Rails"]
published: true
order: 41
layout: article
---

# なぜ Vagrant を使わないのか
Vagrant を使うメリットは、以下が考えられます。

* macOS 直の環境を汚すことなく開発環境を整えられる
* Linux の環境を使用できるので、production と同じ環境にすることができる
* 真っ白な状態でインストールできるので、既存の環境による問題にハマることが少ない
* 特にマストドンの場合は予め Vagrant がサポートされているので、環境構築がとても簡単

Vagrant を使うデメリットは、以下が考えられます。

* CPU やメモリに制限があり、処理が遅い
* 開発を行う前に VM を起動する必要があり、時間がかかる

CPU やメモリに制限がある、という点が最もネックで、特にマストドンは、CSS や JS を変更した際に Webpacker のコンパイルが走ります。これが VM 上 (Vagrant) だとかなり時間がかかります。

ちょっと変更するだけでもかなり時間がかかり、さらに、もともと Rails の開発を行うだけでもそれなりにパワーが必要になるので、今回は Mac のパワーを最大限に使用するために、Vagrant を使用しないことにしました。

頻繁にマストドンの開発を行う場合は、最初の一回の環境構築を楽にするより、その時その時の開発をスムーズに行えるようになったほうが効率的だと思います。

# なぜ Docker を使わないのか
この理由は、マストドンの公式ドキュメントに記載されています。以下は、公式ドキュメントからの引用です。

> Don't use Docker to do development. It's a quick way to get Mastodon running in production, it's really really inconvenient for development. Normally in Rails development environment you get hot reloading of backend code and on-the-fly compilation of assets like JS and CSS, but you lose those benefits by compiling a Docker image. If you want to contribute to Mastodon, it is worth it to simply set up a proper development environment.

[Development guide](https://github.com/tootsuite/documentation/blob/master/Running-Mastodon/Development-guide.md)

日本語に要約された記事を見つけましたので、引用します。

> Dockerを開発環境では使わないでください。プロダクションで素早くマストドンを動かすにはよいのですが、開発には本当に不便です。大抵Railsの開発ではリアルタイムでリロードしてJSやCSSのコンパイルもリアルタイムに行うことができます。しかしDockerだとその良さが失われます。

[マストドン開発環境のMacへの構築方法|サクサク開発！ユーザ増！](http://webfood.info/mac-mastodon-dev/)

これはマストドンの開発に限ったことではなく、基本的に Docker は production で使用するものだと個人的には考えています。

設定を変更するなどして Rails サーバを再起動しないといけないとき、Docker だと、コンテナをストップして、もう一度アップするのに結構時間がかかります。

Docker も、macOS 直の環境を汚すことは防げますし、構築も簡単ですが、やはりパフォーマンスという点では、かなり劣ります。

# macOS にマストドンの環境を構築
以上の理由から、Vagrant や Docker を使用せずに、macOS 直の環境にマストドンを構築していきます。

## 目次
* [リポジトリをフォークしてクローン](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#%E3%83%AA%E3%83%9D%E3%82%B8%E3%83%88%E3%83%AA%E3%82%92%E3%83%95%E3%82%A9%E3%83%BC%E3%82%AF%E3%81%97%E3%81%A6%E3%82%AF%E3%83%AD%E3%83%BC%E3%83%B3)
* [Ruby のインストール](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#ruby-%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
* [Yarn のインストール](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#yarn-%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
* [bundle install](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#bundle-install)
* [yarn install](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#yarn-install)
* [PostgreSQL のインストール](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#postgresql-%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
* [Redis のインストール](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#redis-%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
* [データベースのセットアップ](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#%E3%83%87%E3%83%BC%E3%82%BF%E3%83%99%E3%83%BC%E3%82%B9%E3%81%AE%E3%82%BB%E3%83%83%E3%83%88%E3%82%A2%E3%83%83%E3%83%97)
* [サーバを起動](https://qiita.com/noraworld/items/65233e6da9c03cc4dbb7#%E3%82%B5%E3%83%BC%E3%83%90%E3%82%92%E8%B5%B7%E5%8B%95)

## リポジトリをフォークしてクローン
[マストドンの公式リポジトリ](https://github.com/tootsuite/mastodon)にアクセスして、リポジトリをフォークします。

![fork_mastodon.png](https://qiita-image-store.s3.amazonaws.com/0/113895/c02a69fb-d572-f14e-8666-0a227d0937f7.png)

フォークすると、ログインしているユーザのリポジトリ一覧に、フォークされたマストドンのリポジトリが追加されます。例えば僕の場合は https://github.com/noraworld/mastodon が、フォークされたマストドンのリポジトリになります。

フォークされたリポジトリを、コマンドラインでクローンします。ユーザ名の部分は各自置き換えてください。

```bash
$ git clone git@github.com:noraworld/mastodon.git
```

次に、本家のリポジトリを upstream に追加します。これにより、フォークしたリポジトリを、本家の最新のリポジトリに追従することができるようになります。

```bash
$ git remote add upstream git@github.com:tootsuite/mastodon.git
```

### 本家のリポジトリに追従する場合
フォークした直後は、本家とフォークしたリポジトリが同じ状態になっていると思うのでこれで OK ですが、しばらく経って本家のリポジトリが更新された場合は、以下のコマンドで本家のリポジトリに追従します。

```bash
$ git fetch upstream
$ git merge upstream/master
```

## Ruby のインストール
まずは rbenv と rbenv-build をインストールします。

```bash
$ git clone https://github.com/rbenv/rbenv.git ~/.rbenv
$ cd ~/.rbenv && src/configure && make -C src
$ echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
$ echo 'eval "$(rbenv init -)"' >> ~/.bashrc
$ exec $SHELL -l
$ type rbenv
$ git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
```

次に、rbenv を使って Ruby をインストールします。マストドンで使用する Ruby のバージョンは、`.ruby-version` というファイルに記載されています。

```bash
$ cd path/to/mastodon
$ cat .ruby-version
2.4.2
```

今回は `2.4.2` と表示されたので、Ruby 2.4.2 をインストールします。

```bash
$ rbenv install 2.4.2
$ rbenv rehash
$ rbenv global 2.4.2
```

マストドンのディレクトリで以下を実行して、Ruby がインストールされていることを確認してください。

```bash
$ ruby -v
ruby 2.4.2p198 (2017-09-14 revision 59899) [x86_64-darwin16]
```

参考: [【CentOS7(+Ubuntu16)】Ruby / Rails のインストールから Rails サーバの起動までの(ほぼ)完全ガイド](https://qiita.com/noraworld/items/d92cca9bb449b48a97aa)

## Yarn のインストール
Node と NPM をインストールします。Node をインストールすると NPM もインストールされます。

```bash
$ git clone https://github.com/riywo/ndenv ~/.ndenv
$ echo 'export PATH="$HOME/.ndenv/bin:$PATH"' >> ~/.bashrc
$ echo 'eval "$(ndenv init -)"' >> ~/.bashrc
$ exec $SHELL -l
$ git clone https://github.com/riywo/node-build.git $(ndenv root)/plugins/node-build
```

インストールする Node のバージョンは、6.x の最終バージョンで良いかと思います。Node のバージョン一覧を調べるには以下のコマンドを実行します。

```bash
$ ndenv install -l
```

現時点では、6.x の最終バージョンは、`v6.11.5` だったので、Node v6.11.5 をインストールします。バージョンは更新されるので、上記のコマンドで確認してください。

```bash
$ ndenv install v6.11.5
$ ndenv rehash
$ ndenv global v6.11.5
```

Node と NPM がインストールされていることを確認してください。

```bash
$ node -v
v6.10.3
$ npm -v
3.10.10
```

Node と NPM がインストールされたら、NPM を使用して Yarn をインストールします。

```bash
$ npm install -g yarn
```

参考: [ndenv を使用して複数のバージョンの Node.js を管理する方法と基本的な使い方](https://qiita.com/noraworld/items/462689e108c10102d51f)

## bundle install
まずは必要なライブラリを brew でインストールします。

```bash
$ brew install autoconf ffmpeg gcc gdbm imagemagick libffi libidn libxml2 libxslt libyaml openssl pkg-config protobuf readline
```

抜け落ちているライブラリがありましたら、教えていただけると嬉しいです。

次に、ライブラリのパスを指定しないと、うまくインストールすることができない Ruby のライブラリを、gem で個別にインストールします。

```bash
$ gem install nokogiri -v 'x.x.x' -- --use-system-libraries --with-xml2-include=/usr/local/opt/libxml2/include/libxml2
$ gem install nokogumbo -v 'x.x.x' -- --use-system-libraries --with-xml2-include=/usr/local/opt/libxml2/include/libxml2
$ gem install idn-ruby -- --with-idn-dir=/usr/local/Cellar/libidn/x.xx
```

伏せ字になっている箇所は、それぞれのライブラリのバージョンを指定してください。nokogiri と nokogumbo に関しては、Gemfile に記載されているバージョン、idn-ruby に関しては、以下のコマンドを実行した際のバージョンを、それぞれ指定します。

```bash
$ idn --version
```

参考: [`bundle install`でnokogiriとnokogumboが入らない](http://linuxserver.jp/%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0/ruby/on-rails/nokogiri-ruby-2-3-1)
参考: [macOS で idn-ruby がインストールできないときの解決法](https://qiita.com/noraworld/items/7b8ba64d413f3f424b5b)

ここまでできたら、bundle install を実行します。

```bash
$ bundle install
```

必要な Ruby のライブラリがインストールされます。エラーが表示されなければ OK です。

## yarn install
yarn install を実行します。

```bash
$ yarn install --pure-lockfile
```

## PostgreSQL のインストール
PostgreSQL をインストールします。

```bash
$ brew install postgresql
```

データベースの初期設定を行います。

```bash
$ initdb /usr/local/var/postgres -E utf8
```

PostgreSQL を起動します。

```bash
$ brew services start postgresql
```

起動したかどうかは、`brew services list` でも確認できますが、こちらは DB エラーで接続できていなくても、起動していると表示されてしまうので、DB のプロセスが起動できていることをちゃんと確認します。

```bash
$ ps -ef | grep postgresql | grep -v grep
```

起動できていなかった場合は、[こちら](https://openbook4.me/sections/1307)を参考にしてみてください。

## Redis のインストール
Redis をインストールします。

```bash
$ brew install redis
```

Redis を起動します。

```bash
$ brew services start redis
```

以下のコマンドで、Redis プロセスが起動していることを確認します。

```bash
$ ps -ef | grep redis | grep -v grep
```

## データベースのセットアップ
初回のみ、データベースのセットアップを行います。

````bash
$ rails db:setup
```

## サーバを起動
これで環境は整ったので、サーバを起動して確認してみます。`rails server` でも良いのですが、開発中は foreman が便利なので、foreman を使用します。まずは foreman をインストールします。

```bash
$ gem install foreman
```

foreman でサーバを起動します。

```bash
$ foreman start
```

起動中に以下のウィンドウが表示されたら、「許可」をクリックします。

![allow_ruby_network_connection.png](https://qiita-image-store.s3.amazonaws.com/0/113895/01eda6cc-7b1f-5656-c976-e16f17817911.png)

アクセス可能になるタイミングは、`webpack: Compiled successfully.` と表示され、そのままの状態 (コマンド入力のプロンプトに戻らない状態) になったときです。

http://localhost:3000 にアクセスして、ウェルカムページが表示されたら成功です！ お疲れさまでした。

# ログイン
development 環境では、`admin` というユーザがすでに用意されています。

|data|value|
|---|---|
|メールアドレス|admin@localhost:3000|
|パスワード|mastodonadmin|

# 本家にプルリクエストを送信
`Ctrl-C` を押して、一旦 foreman を停止させます。

そのまま開発を行ってしまうと master ブランチを編集してしまうことになるので、ブランチを切ります。ブランチ名は、変更を行った内容をわかりやすく短縮したものにすると良いです。

例えば、プライバシーポリシーに関する項目の、日本語翻訳の追加をするなら、`i18n-ja-terms` などとすると良いでしょう。

```bash
$ git branch i18n-ja-terms
$ git checkout i18n-ja-terms
```

日本語翻訳の場合は特に必要ないかもしれませんが、Ruby のコードを編集した場合は、テストの実行とコーディングスタイルが正しいかどうかの確認を行いましょう。

```bash
$ rspec
$ rubocop
```

ファイルを変更したらコミットして、フォークした自分のリポジトリにプッシュします。あとは、GitHub のページから、プルリクエストを送信すれば OK です。
