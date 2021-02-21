---
title: "【CentOS7(+Ubuntu16)】Ruby / Rails のインストールから Rails サーバの起動までの(ほぼ)完全ガイド"
emoji: "🌟"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Rails", "Rails4", "Ruby", "Gem"]
published: true
order: 8
---

# はじめに
大学のサークルでRailsをやることになったので予習するためにRailsの環境構築をさくっとやってみようと思います。

💥 CentOSを中心に説明します。CentOSと異なる部分に関しては💥のマークをつけ、個別にUbuntuでのコマンドを紹介します。Ubuntuで環境構築をされる方は必要に応じて`yum`と表記されている部分を`apt`または`apt-get`に置き換えて試してください。

環境
CentOS 7.1
Ubuntu 16.04 LTS

# rbenvのインストール
CentOSでは、以下の4種類の方法でRubyをインストールすることができます。

* rbenvを使ってインストール
* RVMを使ってインストール
* yumを使ってインストール
* ソースからビルドしてインストール

おそらく一番簡単な方法はyumを使ってインストールする方法ですが、yumでインストールされるRubyはインストール時点での最新版です。

Ruby on Rails はRubyのバージョン依存が激しいので、Railsのバージョンに合わせてRubyをインストールすることをおすすめします。

Rubyのバージョンを指定してインストールする方法は、上記4種類のうち、rbenv, RVM の2種類です。どちらでも良いですが、今回はrbenvを使ってRubyをインストールする方法を説明します。

[GitHubのリポジトリ](https://github.com/rbenv/rbenv)からrbenvのパッケージをダウンロードします。
`$ git clone https://github.com/rbenv/rbenv.git ~/.rbenv`

‼️ `コマンドが見つかりません`と表示されたら`git`をインストールしてください。
エラーが出なければ下記のコマンドは実行する必要はありません。
`$ sudo yum -y install git`

下記コマンドはrbenvの実行速度を速めるためのおまじないのようなものです。もし失敗しても無視してOKです。
`$ cd ~/.rbenv && src/configure && make -C src`

💥 上記コマンドを実行させるには`gcc`と`make`が必要です。CentOS7にははじめからインストールされていますが、Ubuntuではインストールされていないことがあるので、インストールする必要があります。
`$ sudo apt -y install gcc make`

rbenvコマンドを汎用的に使えるようにパスを通します。
`$ echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile`

⚠️ `>>` は必ず `>` を2つ続けてタイプしてください。
書き込み先ファイルは環境に合わせて変更してください。たとえばzshを使っている場合は `~/.zshrc` に置き換えてください。またUbuntuの場合は `~/.bashrc` に変更してください。

続いて、下記を実行します。
`$ ~/.rbenv/bin/rbenv init`

すると以下のようなメッセージが出るはずです。

```
# Load rbenv automatically by appending
# the following to ~/.bash_profile:

eval "$(rbenv init -)"
```

言われた通りに ~/.bash_profile に上記コマンドを書き加えます。
`$ echo 'eval "$(rbenv init -)"' >> ~/.bash_profile`

パスの変更が反映されるように書きを実行します。
`$ type rbenv`

何やら数行のシェルスクリプトが出てきますが、`rbenv は関数です` と表示されていれば成功です。

# ruby-buildのインストール
これがなくてもrbenvは使えますが、一部のコマンドが使えなかったりするので、通常は導入することが推奨されています。

rbenv同様に[GitHubのリポジトリ](https://github.com/rbenv/ruby-build)からパッケージをダウンロードします。

```bash
$ git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
```

# Rubyのインストール
いよいよRubyのインストールです。説明通りに進めていくと、ここでRubyのバージョンを選んでインストールすることができます。

まずは利用可能なRubyのバージョン一覧を確認します。
`$ rbenv install -l`
ずらずらっとRubyのバージョンが表示されます。

インストールしたいバージョンを選んでインストールします。今回は `ruby 2.0.0-p353` をインストールすることにします。別のバージョンをインストールしたい場合はバージョンの箇所を適宜変更してください。
`$ rbenv install 2.0.0-p353`

するとここでエラーが、、、

```
Downloading yaml-0.1.6.tar.gz...
-> https://dqw8nmjcqpjn7.cloudfront.net/7da6971b4bd08a986dd2a61353bc422362bd0edcc67d7ebaac68c95f74182749
Installing yaml-0.1.6...
Installed yaml-0.1.6 to /home/vagrant/.rbenv/versions/2.0.0-p353

Downloading ruby-2.0.0-p353.tar.bz2...
-> https://cache.ruby-lang.org/pub/ruby/2.0/ruby-2.0.0-p353.tar.bz2
Installing ruby-2.0.0-p353...

WARNING: ruby-2.0.0-p353 is past its end of life and is now unsupported.
It no longer receives bug fixes or critical security updates.


BUILD FAILED (CentOS Linux 7 using ruby-build 20160426-33-g3304f96)

Inspect or clean up the working tree at /tmp/ruby-build.20160529190342.3310
Results logged to /tmp/ruby-build.20160529190342.3310.log

Last 10 log lines:
The Ruby openssl extension was not compiled.
The Ruby readline extension was not compiled.
The Ruby zlib extension was not compiled.
ERROR: Ruby install aborted due to missing extensions
Try running `yum install -y openssl-devel readline-devel zlib-devel` to fetch missing dependencies.

Configure options used:
  --prefix=/home/vagrant/.rbenv/versions/2.0.0-p353
  LDFLAGS=-L/home/vagrant/.rbenv/versions/2.0.0-p353/lib
  CPPFLAGS=-I/home/vagrant/.rbenv/versions/2.0.0-p353/include
```

何だがよくわかりませんが、以下のコマンドを実行してみてねとのことなので素直に実行してみましょう。
`$ sudo yum install -y openssl-devel readline-devel zlib-devel`

💥 Ubuntuの場合は上記コマンドの代わりに以下のコマンドを実行してください。
`$ sudo apt -y install libssl-dev libreadline-dev zlib1g-dev`

そして再びRubyのインストールを試みます。
`$ rbenv install 2.0.0-p353`

なお、Rubyのインストールは結構時間がかかります。コーヒーでも飲んで気長に待ちましょう ☕️

以下のように表示されればインストール完了です。
`Installed ruby-2.0.0-p353 to /home/vagrant/.rbenv/versions/2.0.0-p353`

本当にインストールされたかどうか確認してみましょう。
`$ ruby -v`

するとこのように表示されます。

```
rbenv: ruby: command not found

The `ruby' command exists in these Ruby versions:
  2.0.0-p353
```

このエラーは「Rubyはちゃんとインストールされてるけど、どのバージョンのRubyを使うかが設定されてないよ」ということらしいです。

ググったら解決法が見つかりました。[ 参考元: [Ruby - rbenv で複数バージョンを切り替える(1)](http://babiy3104.hateblo.jp/entry/2014/01/28/185726) ]

なので次のコマンドで、使用するRubyのバージョンを設定してあげましょう。
`$ rbenv global 2.0.0-p353`

⚠️ バージョンのところは自分がインストールしたバージョンを入力してください。

そして再びバージョンを確認します。

```
$ ruby -v
ruby 2.0.0p353 (2013-11-22 revision 43784) [x86_64-linux]
```

このように表示されればRubyが正しくインストールされています。Rubyの環境構築が目的の方はここで終了になります。おつかれさまでした ☺️

# Railsのインストール
ようやくRailsがインストールできるようになります。rbenvを通してRubyが正しくインストールされていれば、`gem` コマンドが使えるようになっているはずです。確認してみましょう。

```
$ which gem
~/.rbenv/shims/gem
```

パスはRubyのインストール方法によって異なりますが、rbenvでインストールした場合は上記のように表示されるはずです。上記のパスではなくてもとりあえず何かしらのパスが返ってくれば問題はないです。

Railsはgemを通してインストールします。`gem`コマンドが使えることを確認したら以下のコマンドでRailsをインストールします。
`$ gem install rails`

インストールには結構時間がかかります。実行してしばらくは何も表示されないので不安になりますが、もう少し待っているとごちゃごちゃとメッセージが出てくるので安心してください。

最後に `33 gems installed` と表示されれば正しくインストールされています。( `33` は環境によって変わる可能性があります)

本当にインストールされたか確認してみましょう。

```
$ rails --version
Rails 4.2.6
```

バージョンが表示されれば正しくインストールできています。おつかれさまでした！……と言いたいところですが、この後Railsサーバを起動したらエラーが多発したので、せっかくなのでRailsのwelcome画面が出てくるところまでやってみます。

# Railsサーバを立ち上げる
まずはRailsのプロジェクトファイルを生成します。
`$ rails new myapp`

‼️ `myapp` の部分は好きなプロジェクト名をつけてください。たとえばRailsでブログアプリを作りたいなら、`myapp` の部分を `blog` などにしてください。

Railsで汎用的に使うファイル一式が生成されます。`run bundle install` の箇所で時間がかかりますがしばらくすれば完了します。

作られたディレクトリに移動してRailsサーバを起動します。

```
$ cd myapp/
$ rails s
```

⚠️ `myapp` の箇所は `rails new` で指定したプロジェクト名を指定してください。今後 `myapp` と出てきたら、各自で設定したプロジェクト名に読み替えて試してください。

しかし、ここでエラーが出ます。

```
Could not find gem 'sqlite3' in any of the gem sources listed in your Gemfile or available on this machine.
Run `bundle install` to install missing gems.
```

`bundle install` を実行してねとのことなので素直に

`$ bundle install`

と入力して実行するも、最後にこんなエラーが発生します、、、

```
An error occurred while installing sqlite3 (1.3.11), and Bundler cannot continue.
Make sure that `gem install sqlite3 -v '1.3.11'` succeeds before bundling.
```

どうやらSQLite3をインストールするときにエラーが発生したみたいです。元々あるSQLite3じゃダメみたいですね…

ということで、書いてある通り `gem` を使ってインストールします。
`$ gem install sqlite3 -v '1.3.11'`

しかし、またまたエラーが発生します。

```
Building native extensions.  This could take a while...
ERROR:  Error installing sqlite3:
	ERROR: Failed to build gem native extension.

    /home/vagrant/.rbenv/versions/2.0.0-p353/bin/ruby extconf.rb
checking for sqlite3.h... no
sqlite3.h is missing. Try 'port install sqlite3 +universal',
'yum install sqlite-devel' or 'apt-get install libsqlite3-dev'
and check your shared library search path (the
location where your sqlite3 shared library is located).
*** extconf.rb failed ***
Could not create Makefile due to some reason, probably lack of necessary
libraries and/or headers.  Check the mkmf.log file for more details.  You may
need configuration options.

...省略
```

`gem` でSQLite3をインストールするためには `sqlite-devel` が必要みたいです。[ 参考: [bundle install で エラーが起きたとき…](http://qiita.com/emahiro/items/fd20764de5160f9611f3) ]
`$ sudo yum -y install sqlite-devel`

💥 Ubuntuの場合は`sqlite-devel`の代わりに`libsqlite3-dev`をインストールしてください。
`$ sudo apt -y install libsqlite3-dev`

インストールが完了したらもう一度 `gem` を実行します。
`$ gem install sqlite3 -v '1.3.11'`

するとこんなメッセージが表示されます。

```
Building native extensions.  This could take a while...
Successfully installed sqlite3-1.3.11
Parsing documentation for sqlite3-1.3.11
Installing ri documentation for sqlite3-1.3.11
Done installing documentation for sqlite3 after 0 seconds
1 gem installed
```

今度はうまくいったようです。

`gem` がうまくいったので、先ほど失敗した `bundle install` を再実行します。
`$ bundle install`

たくさんインストールされますが最後に

```
Bundle complete! 12 Gemfile dependencies, 55 gems now installed.
Use `bundle show [gemname]` to see where a bundled gem is installed.
```

のように表示されればOKです。

今度こそ！ と意気込んでRailsサーバを起動します。
`$ rails s`

またまたエラー、、、
長いので全部は貼り付けませんが、最後に

```
	from bin/rails:4:in `require'
	from bin/rails:4:in `<main>'
```

と表示されサーバが起動してくれません。

どうやら、JavaScript Runtime が導入されていないのが原因みたいです。JavaScript Runtime を使えるようにするために、Railsのプロジェクトディレクトリ以下にある`Gemfile`を編集します。お使いのテキストエディタで`Gemfile`を開いてください。

Gemfileを開くと15行目あたりに

```lang:Gemfile
# gem 'therubyracer', platforms: :ruby
```

こんな1行があるはずです。コメントアウトされているので以下のようにコメントを外してください。

```lang:Gemfile
gem 'therubyracer', platforms: :ruby
```

そしてまたまた `bundle install` を実行します。
`$ bundle install`

最後にこんな表記がされていればOKです。

```
Bundle complete! 13 Gemfile dependencies, 58 gems now installed.
Use `bundle show [gemname]` to see where a bundled gem is installed.
```

💥 ここで`therubyracer`をインストールするのに失敗した場合は先に`g++`をインストールしてから実行してください。Ubuntuでは`g++`がインストールされていなかったのでインストールします。

```
$ sudo apt -y install g++
$ bundle install
```

3度目の正直！ Railsサーバを立ち上げてみます。
`$ rails s`

そして以下のように表示されサーバが起動されればOKです！

```
=> Booting WEBrick
=> Rails 4.2.6 application starting in development on http://localhost:3000
=> Run `rails server -h` for more startup options
=> Ctrl-C to shutdown server
[2016-05-29 21:17:33] INFO  WEBrick 1.3.1
[2016-05-29 21:17:33] INFO  ruby 2.0.0 (2013-11-22) [x86_64-linux]
[2016-05-29 21:17:33] INFO  WEBrick::HTTPServer#start: pid=4211 port=3000
```

Vagrantを使用せずにローカル開発環境で起動している場合はお使いのブラウザで
`http://localhost:3000`
と入力してください。以下のようなwelcome画面が表示されれば無事成功です！！ おつかれさまでした！！

![rails_welcome_screen.png](https://qiita-image-store.s3.amazonaws.com/0/113895/bade80a1-fa21-d5c3-d931-7c2132d22dfa.png)


# Vagrantでは起動できない…
Vagrantを使用している方は、おそらく `http://192.168.33.10:3000` のようなアドレスでアクセスできるはずですが、なぜかアクセスできません。Rails以外のWebサーバは3000番ポートで起動できるのでファイアウォールの問題でもなさそう……

‼️ `192.168.33.10` はVagrantで設定したIPアドレスです。適宜読み替えてください。

調べたら、同じ問題で悩んでいた方がいました。
[ 参考元: [Vagrant CentOS上のlocalhost:3000がホストから開けない](http://qiita.com/hurukiyokimura/items/bd517c463d24ea9059f3) ]

どうやらRailsの仕様変更でほかのPCからRailsサーバにアクセスすることができなくなったようです。Vagrantはローカルから見れば別のPCのように見えるので、同じことがいえます。

これを解決するには `rails s` の代わりに以下のコマンドを実行します。
`$ rails s -b 0.0.0.0`

サーバ起動中に `http://192.168.33.10:3000` (Vagrantで設定したIPアドレス) にアクセスしてRailsのwelcome画面が表示されれば成功です！ 本当におつかれさまでした！！！

# 参考サイト
* [Rubyのインストール](https://www.ruby-lang.org/ja/documentation/installation/)
* [Rails をはじめよう](http://railsguides.jp/getting_started.html)
* [rbenv - GitHub](https://github.com/rbenv/rbenv)
* [ruby-build - GitHub](https://github.com/rbenv/ruby-build)
* [Ruby - rbenv で複数バージョンを切り替える(1)](http://babiy3104.hateblo.jp/entry/2014/01/28/185726)
* [bundle install で エラーが起きたとき…](http://qiita.com/emahiro/items/fd20764de5160f9611f3)
* [Vagrant CentOS上のlocalhost:3000がホストから開けない](http://qiita.com/hurukiyokimura/items/bd517c463d24ea9059f3)
