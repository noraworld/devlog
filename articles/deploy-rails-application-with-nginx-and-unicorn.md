---
title: "【CentOS 7】Nginx + Unicorn で Rails アプリケーションを本番環境で立ち上げる方法"
emoji: "🐥"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["unicorn", "nginx", "Rails", "CentOS"]
published: true
order: 14
layout: article
---

# はじめに
Rails で作ったアプリケーションを本番環境で動かすときには Phusion Passenger か Unicorn を使うのが一般的なようです。

これらの特徴は Apache や Nginx などのWebサーバとうまく連携して処理を行うというものです。

ぼくの借りているサーバではしばらく Apache が動いていましたが、Rails のアプリケーションを動かすのを機に Nginx に乗り換えました。

Nginx と連携して Rails のアプリケーションを動かすには Unicorn が良いというのを聞いたので Nginx + Unicorn で動かそうとしました。ところが実際にやってみたらかなりはまったので、他のサイトで紹介されている「はまる間違い」に注意しながら説明していきたいと思います。

# 環境
CentOS 7.1
Nginx 1.10.1
Unicorn 5.1.0
Rails 4.2.6
Ruby 2.0.0p353

# Nginx のインストール
はじめにNginxをダウンロードします。Ubuntuでは `$ sudo apt install nginx` だけでインストールできると思いますが、CentOS は少し特殊な設定をしなければなりません。

詳しくは別の記事で書いたのでこちらを参照してください。
[CentOS 7 (5, 6) で安定版 (最新版) の Nginx をインストールする方法](https://zenn.dev/noraworld/articles/how-to-install-latest-or-stable-version-of-nginx)

# Rails アプリケーション側の設定
まずはじめに Rails 側での設定を行います。

## Unicorn のインストール
Gem を使って Unicorn をインストールします。まずは Gemfile を編集します。おそらく Rails 4 系を使っている人は、30行目あたりに

```ruby:Gemfile
# Use Unicorn as the app server
# gem 'unicorn'
```

という箇所があるはずなので、ここの `# gem 'unicorn'` のコメント外してください。
この1行がなければ `gem 'unicorn'` をどこかに追加してください。

編集したら保存して Unicorn をインストールします。

`$ bundle install`

これで Unicorn がインストールされます。

## Unicorn の設定ファイルを作成
Rails アプリケーションがあるディレクトリの `config` ディレクトリに `unicorn.rb` というファイルを新規作成します。

そのファイルに以下を追加します。

```ruby:config/unicorn.rb
worker_processes Integer(ENV["WEB_CONCURRENCY"] || 3)
timeout 15
preload_app true

listen '/home/vagrant/myapp/tmp/unicorn.sock'
pid    '/home/vagrant/myapp/tmp/unicorn.pid'

before_fork do |server, worker|
  Signal.trap 'TERM' do
    puts 'Unicorn master intercepting TERM and sending myself QUIT instead'
    Process.kill 'QUIT', Process.pid
  end

  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.connection.disconnect!
end

after_fork do |server, worker|
  Signal.trap 'TERM' do
    puts 'Unicorn worker intercepting TERM and doing nothing. Wait for master to send QUIT'
  end

  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.establish_connection
end

stderr_path File.expand_path('log/unicorn.log', ENV['RAILS_ROOT'])
stdout_path File.expand_path('log/unicorn.log', ENV['RAILS_ROOT'])
```

⚠️ `listen` と `pid` のパスは `/home/{ユーザ名}/{Railsアプリケーション名}/tmp/unicorn.sock(.pid)` としてください。言い換えると、`{Railsアプリケーションのあるディレクトリ}/tmp/unicorn.sock(pid)` です。

## Unicorn の起動・停止スクリプトを作成する
これは作らなくてもできますが、一度作っておけば後々の操作がかなり楽になるのでここで紹介します。なお、スクリプトは「[Rakefileにunicorn起動・停止のコマンドを追加する](http://qiita.com/teitei_tk/items/2f997d1b916905da6c80)」を参考にしました。

まず以下のコマンドを実行してファイルを生成します。
`$ rails g task unicorn`

すると `lib/tasks` ディレクトリに `unicorn.rake` というファイルが生成されます。このファイルを開いて以下を追加します。

```ruby:lib/tasks/unicorn.rake
namespace :unicorn do

  # Tasks
  desc "Start unicorn"
  task(:start) {
    config = Rails.root.join('config', 'unicorn.rb')
    sh "unicorn -c #{config} -E development -D"
  }

  desc "Stop unicorn"
  task(:stop) {
    unicorn_signal :QUIT
  }

  desc "Restart unicorn with USR2"
  task(:restart) {
    unicorn_signal :USR2
  }

  desc "Increment number of worker processes"
  task(:increment) {
    unicorn_signal :TTIN
  }

  desc "Decrement number of worker processes"
  task(:decrement) {
    unicorn_signal :TTOU
  }

  desc "Unicorn pstree (depends on pstree command)"
  task(:pstree) do
    sh "pstree '#{unicorn_pid}'"
  end

  # Helpers
  def unicorn_signal signal
    Process.kill signal, unicorn_pid
  end

  def unicorn_pid
    begin
      File.read("/home/vagrant/myapp/tmp/unicorn.pid").to_i
    rescue Errno::ENOENT
      raise "Unicorn does not seem to be running"
    end
  end

end
```

‼️ ちなみに上記は本番環境ではなく開発環境で起動するためのスクリプトです。本番環境での起動方法を知っている方は `development` の箇所を `production` にしてください。ただし、いきなり本番環境で起動しようとすると別のエラーが発生する可能性があるので、問題を切り分けるために、まずは開発環境で起動してみて、一通りうまくいったら本番環境で起動する、という流れで説明していきます。

⚠️ `def unicorn_pid` の `File.read` の引数のパスは `/home/{ユーザ名}/{Railsアプリケーション名}/tmp/unicorn.pid` としてください。

これで便利な Unicorn の起動・停止スクリプトが完成しました。

## Unicorn を起動する
では Unicorn を起動してみましょう。以下のコマンドを実行します。
`$ rake unicorn:start`

`unicorn -c /home/{ユーザ名}/{Railsアプリケーション名}/config/unicorn.rb -E production -D` の1行が表示され、ほかにエラーが表示されなければ起動成功です。

Unicorn が起動しているかどうかを確認するには以下のコマンドを実行します。
`$ ps -ef | grep unicorn | grep -v grep`

起動していれば、上記の設定であればおそらく4つほどプロセスが稼働しているのが確認できると思います。停止している場合はコマンドを実行しても何も表示されません。

ちなみに Unicorn を停止するには以下のコマンドを実行します。
`$ rake unicorn:stop`

停止に成功すれば特に何も表示されません。先ほどの `ps` コマンドを実行して何も表示されなければ停止したことがわかります。

停止した場合はもう一度起動しておいてください。
`$ rake unicorn:start`

### 起動できなかった場合
起動しようとしたらエラーが発生した場合は、`/tmp` 以下に `unicorn.sock` というファイルがないかチェックしてください。ここでいう `/tmp` は Rails アプリケーション内の `tmp` ではなく、Unix システムのルート `/` 以下の `tmp` であることに注意してください。

もし `/tmp/unicorn.sock` があった場合は、このファイルを先ほどの設定ファイル内で指定したパスに移動させてください。

`$ sudo mv /tmp/unicorn.sock /home/{ユーザ名}/{Railsアプリケーション}/tmp`

⚠️ `{}` は入力しません。

そしてもう一度 Unicorn 起動コマンドを実行してください。
`$ rake unicorn:start`

これで起動できるはずです。

🌀 ここがまさにはまるポイントで、いくつかのサイトでは、`unicorn.sock` を置く場所として `/tmp/unicorn.sock` を指定していますが、これが大きな落とし穴です。いつからかはわかりませんが、`/tmp` 内のファイルは Nginx と Unicorn 間で共有できないようになったらしいです。

昔はできたっぽいので、ちょっと古い記事だと `/tmp` 内にソケットファイル(.sock)を置くようにしていますが、現在はここだとうまくいかないので、`/home/{ユーザ名}/{Railsアプリケーション名}/tmp` に置くようにしましょう。厳密には、Unicorn 自体は起動できますが、後に Nginx を起動して動作確認しても `502 Bad Gateway` もしくは Rails のサーバエラーのページが表示されてしまいます。

# Nginx 側の設定
次に Nginx の設定を行います。

## Nginx の設定ファイルを作成
Nginx の設定ファイルは、`/etc/nginx/conf.d/default.conf` です。そのままこのファイルを編集してもいいですが、通常これらの設定ファイルはバックアップを取るのが一般的なので、今回は、このファイルは直接いじらずに `rails.conf` というファイルを作って編集することにしましょう。

‼️ `default.conf` にはじめから設定されていたものとバッティングする可能性があるので、Rails のアプリケーションがうまく動くまでは、`default.conf` 内に書かれている内容はすべてコメントアウトしてから行ったほうがいいかもしれません。

`/etc/nginx/conf.d` 以下に `rails.conf` を新規作成して、以下を追加します。`vi` 等のエディタを使う場合は `sudo` が必要になるかもしれません。

```nginx:/etc/nginx/conf.d/rails.conf
upstream unicorn {
    server  unix:/home/vagrant/myapp/tmp/unicorn.sock;
}

server {
    listen       80;
    server_name  192.168.33.12;

    access_log  /var/log/nginx/access.log;
    error_log   /var/log/nginx/error.log;

    root /home/vagrant/myapp/public;

    client_max_body_size 100m;
    error_page  404              /404.html;
    error_page  500 502 503 504  /500.html;
    try_files   $uri/index.html $uri @unicorn;

    location @unicorn {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_pass http://unicorn;
    }
}
```

⚠️ `upstream` 内の `server` のパスは `/home/{ユーザ名}/{Railsアプリケーション名}/tmp/unicorn.sock` としてください。同様に、`server` 内の `root` は `/home/{ユーザ名}/{Railsアプリケーション名}/public` としてください。

⚠️ `server` 内の `server_name` は使用するサーバのドメイン名もしくはIPアドレスを指定してください。

## Nginx の起動
設定ファイルを編集したら Nginx を起動します。なお、すでに起動していた場合でも設定ファイルを編集した場合は再起動が必要になりますので再起動してください。

Nginx が起動しているか停止しているかを確認するには以下のコマンドを実行します。
`$ systemctl status nginx`

`Active:` の箇所が `active (running)` となっていれば起動していて、`inactive (dead)` となっていれば停止しています。

停止している場合は起動します。
`$ sudo systemctl start nginx`

起動している場合は再起動します。
`$ sudo systemctl restart nginx`

これでエラーがでなければOKです。

# 確認する
設定が間違っていなければとりあえず開発環境では起動できているはずです。Nginx の設定ファイルの `server_name` で指定したドメイン名もしくはIPアドレス(今回の説明では `192.168.33.12` の部分)にアクセスして Rails アプリケーションが表示されればOKです！

ほかのサイトを参考にしている場合は、ほとんどの人が `unicorn.sock` の置き場所でつまづくと思うので、そこさえ気をつけていれば特に問題はないと思います。もし、どこかでエラーが発生した場合はもう一度設定を確認してください。特にここの記事のコードをそのままコピペするとパスの部分が違っているというミスが起こりそうなので、パスをよく確認してみてください。また、今回は CentOS での環境で説明しているので、Ubuntu の場合は Nginx の設定ファイルの場所が少し違うので注意してください。

# 本番環境で起動する
ここまで来たら、後は開発環境から本番環境へ移行します。
本番環境に移行する前に、開発環境で起動している Unicorn を停止します。
`$ rake unicorn:stop`

最初に、Unicorn で Rails アプリケーションが本番環境で起動されるようにスクリプトを編集します。さきほど Rails 側の設定で編集した、`lib/tasks/unicorn.rake` を開き、7行目の `development` と書かれている部分を `production` に変更します。

```diff:lib/tasks/unicorn.rake
-    sh "unicorn -c #{config} -E development -D"
+    sh "unicorn -c #{config} -E production -D"
```

マイグレーションを実行します。
`$ rake db:migrate RAILS_ENV=production`

SCSS ファイルや CoffeeScript ファイルをコンパイルします。
`$ rake assets:precompile RAILS_ENV=production`

次に、`config/secret.yml` を開いて以下の行があるか確認してください。

```ruby:config/secret.yml
production:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
```

これは本番環境で起動するためのキーを設定するものです。`secret_key_base:` の値が `<%= ENV["SECRET_KEY_BASE"] %>` となっていて、ここに環境変数で設定したランダムな文字列が設定されます。このファイルは特に編集する必要はないので、確認だけでOKです。もし `<%= ENV["SECRET_KEY_BASE"] %>` ではなくランダムな文字列が設定されていたら `<%= ENV["SECRET_KEY_BASE"] %>` に書き換えてください。

では、環境変数に `SECRET_KEY_BASE` を設定しましょう。まずはランダムなキーを生成します。Railsのプロジェクトディレクトリで以下のコマンドを実行します。
`$ rake secret`

実行して出てきたランダムな文字列をコピーします。

次に `.bash_profile` ( `.bashrc` ) に以下の1行を追加します。

```:.bash_profile
export SECRET_KEY_BASE=ランダムなキー
```

`ランダムなキー`の箇所に `$ rake secret` で生成した文字列をペーストしてください。

そして `.bash_profile` を再読み込みして反映させます。
`$ source ~/.bash_profile`

これで環境変数が設定できました。ちゃんと設定できているかを確認するには以下のコマンドを実行します。
`$ env | grep SECRET_KEY_BASE`

`SECRET_KEY_BASE=先ほど設定したランダムなキー` が表示されればOKです。

最後に Unicorn をもう一度起動します。
`$ rake unicorn:start`

ブラウザで開発環境のときと同様のドメイン名もしくはIPアドレスにアクセスしてページが表示されればOKです。お疲れさまでした！

# 2回目以降の起動方法
ここまでがちゃんと動いていたら、2回目以降、コードを編集したりしてUnicornを再起動する際に行うコマンドは以下の通りです。

```bash
$ rake db:migrate RAILS_ENV=production
$ rake assets:precompile RAILS_ENV=production
$ rake unicorn:stop && rake unicorn:start
```

マイグレーションと、SCSSやCoffeeScriptのコンパイルは、それぞれマイグレーションをしていない場合、CSSやJavaScriptを編集していない場合は実行する必要がありませんが、実行しても特に問題はないです。勘違いを防ぐためにとりあえず実行しておくのでも良いでしょう。

また、作成した`unicorn.rake`のスクリプトには、`restart`というコマンドが用意されていますが、これは前回起動していたプロセスをキルしないので、不要なUnicornプロセスがたまってしまい良くないので、`stop`してから`start`する、というコマンドにしました。

# 参考サイト
## Unicorn や Nginx の設定ファイルの書き方
* [Rails 4.2 + Unicorn + Nginx でアプリケーションサーバの構築](http://qiita.com/Salinger/items/5350b23f8b4e0dcdbe23)
* [Rails unicorn](https://github.com/herokaijp/devcenter/wiki/Rails-unicorn)
* [rails + nginx + unicorn連携](http://qiita.com/shinyashikis@github/items/ace49154f0c71c65b2c9)

## Unicorn の起動・停止スクリプト
* [Rakefileにunicorn起動・停止のコマンドを追加する](http://qiita.com/teitei_tk/items/2f997d1b916905da6c80)

## `/tmp` にソケットファイルを置くと失敗するときの解決策
* [CentOS 7でNginx、Unicornにハマる](http://blog.tnantoka.com/posts/49)
* [nginx＋unicorn、ソケットファイルを/tmp上に置くとNo such file or directoryになる](http://blog.naichilab.com/entry/2015/12/27/234631)

## 本番環境での起動方法
* [RailsをローカルでProductionモードで起動させる方法](http://ruby-rails.hatenadiary.com/entry/20141110/1415623670)
* [[Rails]production環境で動かす](http://qiita.com/a_ishidaaa/items/74de8bdaecd637063c40)

## 気になったこと
* [unicornとunicorn_railsのオプションの違い](http://unlearned.hatenablog.com/entry/2014/02/28/015554)
