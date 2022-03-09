---
title: "Heroku × Rails × MySQL でアプリケーションをデプロイする際のトラブルシューティング集"
emoji: "😵‍💫"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Heroku", "Rails", "MySQL", "JawsDB", "ClearDB"]
published: true
order: 127
layout: article
---

# はじめに
Heroku では、PostgreSQL は手厚くサポートされているが、MySQL で構築しようとするとハマることが多い。

今回は筆者が MySQL を使って Rails アプリケーションを Heroku にデプロイした際にハマった部分とその解決策を紹介する。




# 前提知識 (読み飛ばし可)
## MySQL で `rails new` する方法
既存のアプリケーションコードではなく、今回新しくアプリケーションを立ち上げる場合、つまり `rails new` からスタートさせる場合は、`-d mysql` オプションをつけると、データベースに MySQL を使用する前提でアプリケーションコードの雛形を生成することができる。

```shell:Shell
rails new app -d mysql
```

デフォルトだと SQLite なので、それを MySQL に書き換える手間が省けて便利。

## MySQL を使用するために必要なアドオンについて
Heroku で MySQL を使用する際には、JawsDB または ClearDB のいずれかのアドオンを使用する必要がある。

アドオンは、リポジトリルートに `app.json` という名前でファイルを作り、そこに以下のような JSON を追加することで Heroku 上で使用することができる。

## JawsDB の場合
```json:app.json
{
  "addons": [
    "jawsdb"
  ]
}
```

## ClearDB の場合
```json:app.json
{
  "addons": [
    "cleardb"
  ]
}
```



# トラブルシューティング
ここから先は筆者が遭遇したエラーとその解決方法について解説する。

## `Failed to install gems via Bundler`
`bundle install` で失敗している。

### エラー内容

```
-----> Building on the Heroku-18 stack
-----> Determining which buildpack to use for this app
 !     Warning: Multiple default buildpacks reported the ability to handle this app. The first buildpack in the list below will be used.
			Detected buildpacks: Ruby,Node.js
			See https://devcenter.heroku.com/articles/buildpacks#buildpack-detect-order
-----> Ruby app detected
-----> Installing bundler 2.2.33
-----> Removing BUNDLED WITH version in the Gemfile.lock
-----> Compiling Ruby/Rails
-----> Using Ruby version: ruby-2.5.7
-----> Installing dependencies using bundler 2.2.33
       Running: BUNDLE_WITHOUT='development:test' BUNDLE_PATH=vendor/bundle BUNDLE_BIN=vendor/bundle/bin BUNDLE_DEPLOYMENT=1 bundle install -j4
       Your bundle only supports platforms ["x86_64-darwin-20"] but your local platform
       is x86_64-linux. Add the current platform to the lockfile with `bundle lock
       --add-platform x86_64-linux` and try again.
       Bundler Output: Your bundle only supports platforms ["x86_64-darwin-20"] but your local platform
       is x86_64-linux. Add the current platform to the lockfile with `bundle lock
       --add-platform x86_64-linux` and try again.
 !
 !     Failed to install gems via Bundler.
 !
 !     Push rejected, failed to compile Ruby app.
 !     Push failed
```

### 解決策
Heroku で動作するプラットフォーム `x86_64-linux` が追加されていないのが原因。

以下のコマンドを実行して `x86_64-linux` を追加する。

```shell:Shell
bundle lock --add-platform x86_64-linux
```

`Gemfile.lock` が更新されるはずなので、それをプッシュする。

https://qiita.com/m6mmsf/items/fb8a8672df98bdb59c9c






## `Can't connect to local MySQL server through socket`
MySQL に接続できない。

ソケット名が環境によって異なる (下記の例では `'/tmp/mysql.sock'` となっている) かもしれないが、そこは本質ではないので無視して良い。

### エラー内容

```
Can't connect to local MySQL server through socket '/tmp/mysql.sock' (2)
Couldn't create 'app_production' database. Please check your configuration.
rails aborted!
Mysql2::Error::ConnectionError: Can't connect to local MySQL server through socket '/tmp/mysql.sock' (2)
/app/vendor/bundle/ruby/2.5.0/gems/mysql2-0.5.3/lib/mysql2/client.rb:90:in `connect'
/app/vendor/bundle/ruby/2.5.0/gems/mysql2-0.5.3/lib/mysql2/client.rb:90:in `initialize'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/mysql2_adapter.rb:22:in `new'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/mysql2_adapter.rb:22:in `mysql2_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:830:in `new_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:874:in `checkout_new_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:853:in `try_to_checkout_new_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:814:in `acquire_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:538:in `checkout'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:382:in `connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_adapters/abstract/connection_pool.rb:1033:in `retrieve_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_handling.rb:118:in `retrieve_connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/connection_handling.rb:90:in `connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/mysql_database_tasks.rb:6:in `connection'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/mysql_database_tasks.rb:14:in `create'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/database_tasks.rb:119:in `create'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/database_tasks.rb:139:in `block in create_current'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/database_tasks.rb:316:in `block in each_current_configuration'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/database_tasks.rb:313:in `each'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/database_tasks.rb:313:in `each_current_configuration'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/tasks/database_tasks.rb:138:in `create_current'
/app/vendor/bundle/ruby/2.5.0/gems/activerecord-5.2.6.3/lib/active_record/railties/databases.rake:29:in `block (2 levels) in <top (required)>'
/app/vendor/bundle/ruby/2.5.0/gems/railties-5.2.6.3/lib/rails/commands/rake/rake_command.rb:23:in `block in perform'
/app/vendor/bundle/ruby/2.5.0/gems/railties-5.2.6.3/lib/rails/commands/rake/rake_command.rb:20:in `perform'
/app/vendor/bundle/ruby/2.5.0/gems/railties-5.2.6.3/lib/rails/command.rb:48:in `invoke'
/app/vendor/bundle/ruby/2.5.0/gems/railties-5.2.6.3/lib/rails/commands.rb:18:in `<top (required)>'
/app/vendor/bundle/ruby/2.5.0/gems/bootsnap-1.11.1/lib/bootsnap/load_path_cache/core_ext/kernel_require.rb:30:in `require'
/app/vendor/bundle/ruby/2.5.0/gems/bootsnap-1.11.1/lib/bootsnap/load_path_cache/core_ext/kernel_require.rb:30:in `require'
bin/rails:9:in `<main>'
Tasks: TOP => db:create
(See full trace by running task with --trace)
```

### 解決策
Heroku で動作させるためにはデータベースの URL を指定する必要がある。具体的には `config/database.yml` の `production` に `url` を追加する必要がある。

MySQL では、Heroku のアドオンとして JawsDB または ClearDB を使用するが、それぞれで環境変数が異なる。

#### JawsDB の場合
`ENV['JAWSDB_URL']` を使う。

```diff:config/database.yml
 production:
   <<: *default
   database: app_production
   username: app
   password: <%= ENV['APP_DATABASE_PASSWORD'] %>
+  url: <%= ENV['JAWSDB_URL']&.sub(/\Amysql/, 'mysql2') %>
```

#### ClearDB の場合
`ENV['CLEARDB_DATABASE_URL']` を使う。

```diff:config/database.yml
 production:
   <<: *default
   database: app_production
   username: app
   password: <%= ENV['APP_DATABASE_PASSWORD'] %>
+  url: <%= ENV['CLEARDB_DATABASE_URL']&.sub(/\Amysql/, 'mysql2') %>
```

#### どっちを使っているのかわからない場合
JawsDB を使っているのか ClearDB を使っているのかわからない場合は、`heroku config` コマンドを使って、設定されている環境変数を見る。

```shell:Shell
heroku config --app <APP_NAME>
```

`<APP_NAME>` の調べ方は下記を参照。

https://zenn.dev/noraworld/articles/heroku-pipeline-app-name

出力された環境変数一覧の中に `JAWSDB_URL` が含まれていたら JawsDB、`CLEARDB_DATABASE_URL` が含まれていたら ClearDB が使われている。

| 含まれている環境変数 | 使用されている DB |
| --- | --- |
| `JAWSDB_URL` | JawsDB |
| `CLEARDB_DATABASE_URL` | ClearDB |

##### 補足 (読み飛ばし可)
環境変数 `JAWSDB_URL` または `CLEARDB_DATABASE_URL` の先頭が `mysql://` となっているが、`url` に指定する際は `mysql2://` に変更するのがポイント。

これらの環境変数の中身は、先ほど紹介した `heroku config` コマンドを実行すると確認できる。

```shell:Shell
heroku config --app <APP_NAME>
```

```
JAWSDB_URL: mysql://xxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxx@xxxxxxxxxxxxxxxx.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:3306/xxxxxxxxxxxxxxxx
```

```ruby:irb
ENV['JAWSDB_URL'] = 'mysql://xxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxx@xxxxxxxxxxxxxxxx.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:3306/xxxxxxxxxxxxxxxx'
ENV['JAWSDB_URL']&.sub(/\Amysql/, 'mysql2')
# => "mysql2://xxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxx@xxxxxxxxxxxxxxxx.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:3306/xxxxxxxxxxxxxxxx
```

Safe Navigation Operator (`&` 記号) をつけているのは、ローカル開発環境で Heroku の環境変数 (`JAWSDB_URL` または `CLEARDB_DATABASE_URL`) がないときにエラーにならないようにするため。

ちなみに、MySQL **2** を使用しているかどうかは `Gemfile` を見るとわかる[^1]。

[^1]: バージョンが指定されていることもある。その場合はそのバージョンで固定しておいたほうが無難。

```ruby:Gemfile
gem 'mysql2'
```






## `We're sorry, but something went wrong`
デプロイは成功するが、デプロイされた Rails のページでサーバエラーが表示される。

### エラー内容

```
We're sorry, but something went wrong.
```

### 解決策
これに関しては、アプリケーションエラーに起因するすべての原因が当てはまるので一概にこれが原因とはいえない。

しかし、よくあるミスとしては、マイグレーションを忘れているというもの。

以下のコマンドを実行して Heroku 上の Rails アプリケーションでマイグレーションを実行する。

```shell:Shell
heroku run --app <APP_NAME> bundle exec rails db:migrate
```

`<APP_NAME>` の調べ方は下記を参照。

https://zenn.dev/noraworld/articles/heroku-pipeline-app-name
