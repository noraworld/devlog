---
title: "PostgreSQL の文字コードを LATIN1 から UTF8 に修正する方法"
emoji: "👻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PostgreSQL", "Ubuntu", "Debian"]
published: false
order: 43
---

# はじめに
新しく用意した Ubuntu サーバに PostgreSQL をインストールして使おうとしたところ、以下のエラーが発生しました。

```
PG::InvalidParameterValue: ERROR:  encoding "UTF8" does not match locale "en_US"
DETAIL:  The chosen LC_CTYPE setting requires encoding "LATIN1".
```

データベースにログインして文字コードとロケールを確認してみると、以下のようになっていました。

```bash
$ sudo -u postgres psql
```

```postgresql-console
psql (9.5.10)
Type "help" for help.

postgres=# \l
                             List of databases
   Name    |  Owner   | Encoding | Collate | Ctype |   Access privileges
-----------+----------+----------+---------+-------+-----------------------
 postgres  | postgres | LATIN1   | en_US   | en_US |
 template0 | postgres | LATIN1   | en_US   | en_US | =c/postgres          +
           |          |          |         |       | postgres=CTc/postgres
 template1 | postgres | LATIN1   | en_US   | en_US | =c/postgres          +
           |          |          |         |       | postgres=CTc/postgres
(3 rows)
```

あれ、文字コードが LATIN1 になっている！

Ubuntu サーバにインストールした PostgreSQL の文字コードを UTF8 に変更する方法を紹介します。なお、CentOS の場合は、`initdb` コマンド実行時に文字コードやロケールの設定をオプションで追加できるので、そちらをお調べください。

# 環境
* Ubuntu 16.04 xenial
* PostgreSQL 9.5.10

# 手順
PostgreSQL サービスが起動している場合は停止させます。

```bash
$ sudo systemctl stop postgresql
```

次に、PostgreSQL クラスタを削除します。`9.5` には、お使いの PostgreSQL のバージョンを入れてください。以降の `9.5` も適宜、置き換えてください。

```bash
$ sudo pg_dropcluster --stop 9.5 main
```

環境変数の言語を `en_US.UTF-8` に変更します。

```bash
$ export LANGUAGE="en_US.UTF-8"
$ export LANG="en_US.UTF-8"
$ export LC_ALL="en_US.UTF-8"
```

先ほど停止させた PostgreSQL サービスを起動します。

```bash
$ sudo systemctl start postgresql
```

PostgreSQL クラスタを、文字コード UTF8 として作成します。

```bash
$ sudo pg_createcluster -e UTF8 --start 9.5 main
```

以下のように表示されれば OK です。

```
Creating new cluster 9.5/main ...
  config /etc/postgresql/9.5/main
  data   /var/lib/postgresql/9.5/main
  locale en_US.UTF-8
  socket /var/run/postgresql
  port   5432
Redirecting start request to systemctl
```

必要ないかもしれませんが、念のため PostgreSQL サービスを再起動しておきます。

```bash
$ sudo systemctl restart postgresql
```

では、文字コードが UTF8 になったか確認してみましょう。

```bash
$ sudo -u postgres psql
```

```postgresql-console
psql (9.5.10)
Type "help" for help.

postgres=# \l
                                  List of databases
   Name    |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges
-----------+----------+----------+-------------+-------------+-----------------------
 postgres  | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 template0 | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
(3 rows)
```

無事、意図した初期設定になりました！

# まとめ
今まで使ってきたサーバは、このようなことをしなくてもデフォルトで UTF8 になっていたため、なぜ、今回使用したサーバは、デフォルトが LATIN1 になっていたのかわかりません。

しかも、CentOS の場合は、`initdb` コマンド実行時にオプションを指定できるので、まだ良いですが、Ubuntu の場合は `initdb` コマンドが存在しないです。(つまり実行する必要もないです)

どうやら、Ubuntu の場合は、PostgreSQL をインストールした時点で、勝手に初期の文字コードやロケールが決まってしまうみたいなので、厄介です。

こんなことは PostgreSQL の環境構築をしていてはじめて起こりましたが、同じような問題に直面している人の参考になれば幸いです。

# 参考
* [Debian系でPostgreSQLのロケールを変更する](https://qiita.com/unarist/items/70588183f9d05a474015)
* [encoding UTF8 does not match locale en_US; the chosen LC_CTYPE setting requires encoding LATIN1](https://stackoverflow.com/questions/13115692/encoding-utf8-does-not-match-locale-en-us-the-chosen-lc-ctype-setting-requires)
