---
title: "MySQL × Rails でサーバのデータベースをダンプし、ローカルにリストアする"
emoji: "🐬"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["SQL", "MySQL", "Rails", "Ruby"]
published: true
order: 103
layout: article
---

# はじめに
開発中、ローカル環境だとデータのサンプル数が少なすぎて動作確認しづらいときがある。

そこで、開発用のサーバにあるデータをローカルに移行する方法について紹介する。



# リモート側の操作
SSH で開発用サーバにログインして、Rails Console を起動する。

```shell:Shell
cd /path/to/remote/app
bundle exec rails console
```

Rails Console 内で以下の Ruby を実行する。

```ruby:Console
environment = Rails.env
configuration = ActiveRecord::Base.configurations[environment]
cmd = "mysqldump -u #{configuration['username']} -p#{configuration['password']} -h #{configuration['host']} -P #{configuration['port']} #{configuration['database']} > db/#{Date.today}.dump"
exec cmd
```

Rails アプリケーションのルートディレクトリ内に `db/2021-08-18.dump` のようなダンプファイルが生成される。

## `mysqldump: Error 2020: Got packet bigger than 'max_allowed_packet' bytes` と表示された場合
`mysqldump` コマンドのオプションとして `--max_allowed_packet=1G` を追加する。

```diff:Diff
-cmd = "mysqldump -u #{configuration['username']} -p#{configuration['password']} -h #{configuration['host']} -P #{configuration['port']} #{configuration['database']} > db/#{Date.today}.dump"
+cmd = "mysqldump --max_allowed_packet=1G -u #{configuration['username']} -p#{configuration['password']} -h #{configuration['host']} -P #{configuration['port']} #{configuration['database']} > db/#{Date.today}.dump"
```

参考: [mysqldumpでmax_allowed_packetが最大値にもかかわらずエラー](https://qiita.com/MasamotoMiyata/items/be123813ea535cd3e320)



# ローカル側の操作
`scp` で、先ほどダンプしたファイルをローカルにダウンロードする。その後、Rails Console を起動する。

```shell:Shell
cd /path/to/local/app
scp <USERNAME>@<IP_ADDR_OR_HOSTNAME>:/path/to/remote/app/db/<YYYY-MM-DD>.dump db
bundle exec rails console
```

Rails Console 内で以下の Ruby を実行する。

```ruby:Console
environment = Rails.env
configuration = ActiveRecord::Base.configurations[environment]
cmd = "mysql -u #{configuration['username']} -p#{configuration['password']} -h #{configuration['host']} -P #{configuration['port']} #{configuration['database']} < db/#{Date.today}.dump"
exec cmd
```

これで開発用サーバのデータをローカルで使えるようになった。

## `ERROR 1153 (08S01) at line 824: Got a packet bigger than 'max_allowed_packet' bytes` と表示された場合
MySQL にログインし、`max_allowed_packet=1000000000` を実行する。

```shell:Shell
mysql
```

```sql:MySQL
SET GLOBAL max_allowed_packet=1000000000;
\q
```

そして上記の操作をもう一度繰り返す。

参考: [【MySQL】ERROR 1153 (08S01) at line 58: Got a packet bigger than ‘max_allowed_packet’ bytes](https://www.softel.co.jp/blogs/tech/archives/2449)



# 後片付け
開発用サーバにダンプファイルが残ったままなので削除しに行く。SSH で開発用サーバにログインして、以下のコマンドを実行する。

```shell:Shell
cd /path/to/remote/app
rm db/<YYYY-MM-DD>.dump
```



# 注意点
この手順を試すときは、開発用サーバのデータベース内に個人情報や秘匿情報が含まれていないことを確認すること。

もしそれらの情報が含まれていた場合は、それらを含まない形でダンプするか、個人情報や秘匿情報をマスキング (別の値に変えること) した状態でローカルにリストアすること。

間違っても本番サーバのデータベースをローカルにリストアしないように！



# 補足
頻繁にこのオペレーションを行うなら、[こちらの記事](https://qiita.com/hmuronaka/items/e778b234e8c4798953f6) のように Rake Task (または Rails Runner) にしても良いかも。

PostgreSQL に関しては、[こちらの記事](https://coderwall.com/p/2e088w/rails-rake-tasks-to-dump-restore-postgresql-databases) が参考になるだろう。



# 参考サイト
* [mysqldumpでダンプするrakeタスク](https://qiita.com/hmuronaka/items/e778b234e8c4798953f6)
* [Rails rake tasks to dump & restore PostgreSQL databases](https://coderwall.com/p/2e088w/rails-rake-tasks-to-dump-restore-postgresql-databases)
* [4.5.4 mysqldump — A Database Backup Program](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)
* [MySQLダンプ、リストア](https://qiita.com/macer_fkm/items/d920ff77f0f5ae5484f9)
