---
title: "Docker で稼働しているマストドンを Docker を使用しない環境に移行する方法"
emoji: "👋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "マストドン", "Docker", "docker-compose", "Rails"]
published: false
order: 38
---

# はじめに
先日、僕が運営しているマストドンインスタンス ([mastodon.noraworld.jp](https://mastodon.noraworld.jp)) を Docker 環境から Docker を使わない環境 (non-Docker 環境) に移行しました。

そのときの作業が僕にとってかなり大変で、特にデータベースの移行で苦労しました。ネットで調べると、Docker でマストドンインスタンスを立てる方法や、non-Docker で立てる方法はたくさん情報が出てくるのですが、Docker で稼働しているインスタンスを non-Docker に移行する記事は、そんなにありませんでした。

今回は、僕と同じように環境の移行を検討されている人で、ネットの情報が少なく困っている人の参考になればと思い、僕が行った作業をここにまとめようと思います。参考になれば幸いです。

# この記事を読む前に
この記事では、以下のことを想定して書かれています。

* 作業はすべて**マストドンのディレクトリ以下**で行っていること
* バックアップを取る際のバックアップ先は **~/backup** としていること
* マストドン以外のアプリケーションで PostgreSQL や Redis を使用していないこと

これらの事柄は特に注意書きなしで説明しています。バックアップ先のディレクトリは状況に応じて変更してください。

特に重要なこととして、3 つめの「マストドン以外のアプリケーションで PostgreSQL や Redis を使用していないこと」には注意してください。この記事では、サーバ直下には PostgreSQL や Redis はインストールされていない、もしくはインストールはしていても使用されていないことを前提としています。もし別のアプリケーションで PostgreSQL や Redis をすでに使用している場合は、この記事の説明に従って、データの移行を行うと、**それまで使用していたアプリケーションで PostgreSQL や Redis のデータが使用できなくなってしまいます**。その場合はファイル丸ごと移行するのではなく、マストドンに必要なデータだけを移行してください。

# エラーに困ったら
エラーが発生してどのように解決すれば良いかわからないときは、一番下のトラブルシューティングを確認してみてください。

またトラブルシューティングに記載されていないエラーが出た場合は、まず最初に**デーモン (サービス) が起動または停止しているか**をよく確認してください。

たとえば、PostgreSQL にログインしたり、Rails でマイグレーションするときなどは当然 PostgreSQL サーバが起動していないとエラーになります。その逆に、マストドンの Docker コンテナが起動しているときに PostgreSQL サーバを起動しようとしたりするとエラーになります。PostgreSQL サーバが起動している状態で、PostgreSQL 9.6 サーバを起動しようとしていた、なんていうミスもあるかもしれません。

このように、**デーモンの起動/停止がエラーの原因になっていること**は意外に多いです。

## デーモンやコンテナの起動状況の確認
デーモンが起動しているかどうかを確認するには以下のコマンドを実行します。

```bash
$ systemctl status [サービス名]
```

たとえば Redis サーバが起動しているか確認したい場合は `[サービス名]` の箇所に `redis` と入れます。

マストドンの Docker コンテナが起動しているか確認するには以下のコマンドを実行します。

```bash
$ docker-compose ps
```

トラブルシューティングを見たり、デーモンやコンテナの状況を確認しても解決しない場合は、エラーメッセージで検索してみてください。

# 環境
* CentOS 7
* Ruby 2.4.1
* Node.js 6.7.0
* PostgreSQL 9.6.5
* Mastodon v1.6.0rc1

# Ruby と Bundler のインストール
サーバ直下に、まだ Ruby がインストールされていない場合はインストールします。このときに Docker 内の Ruby と同じバージョンのものをインストールすることをおすすめします。

Docker 内の Ruby のバージョンを確認します。

```bash
$ cat mastodon/.ruby-version
2.4.1
```

上記の例では `2.4.1` なので、Ruby 2.4.1 をインストールします。

Ruby のインストールには `rbenv` を利用します。`rbenv` の導入および必要なライブラリ等に関しては「[【CentOS7(+Ubuntu16)】Ruby / Rails のインストールから Rails サーバの起動までの(ほぼ)完全ガイド](http://qiita.com/noraworld/items/d92cca9bb449b48a97aa)」を参考にしてください。

```bash
$ rbenv install 2.4.1
$ rbenv rehash
```

Ruby がインストールできたら Bundler をインストールします。

```bash
$ gem install bundler
```

# Yarn のインストール
Yarn がインストールされていない場合はインストールします。Yarn をインストールするためにはまず Node.js をインストールする必要があります。

Node.js のインストールに関しては `ndenv` を使用することを個人的におすすめします。`ndenv` 以外のインストール方法でも構いませんが、以降の説明では `ndenv` を使用してインストールしたと想定して説明を進めます。その際は各々読み替えてください。`ndenv` の導入および Node.js のインストールに関しては、各自で調べてください。ここではすでに Node.js がインストールされているものとします。

ちなみに Node.js のバージョンについては特に指定はないですが、v6.7.0 を使用したところ、問題なく動作しました。

Node.js がインストールされると、一緒に npm もインストールされます。npm を使って Yarn をインストールします。

```bash
$ npm install -g yarn
```

# bundle install
Bundler で、必要な Gem をインストールします。その前に、必要なネイティブライブラリをインストールします。

```bash
$ sudo yum -y install libidn-devel protobuf-lite-devel postgresql-contrib
```

今回僕が `bundle install` のためにインストールしたのは上記だけですが、おそらく他にもインストールが必要なライブラリがあります。`bundle install` で失敗したときに、どの Gem をインストールしようとして失敗したのかが表示されるので、その Gem のインストール方法を検索して、各自必要なネイティブライブラリをインストールしてください。この辺は、すでに僕が別の機会にインストールしてしまって、ここで何が必要なのかをすべて把握仕切れないので、投げやりな感じになってしまって申し訳ないです。

`bundle install` を実行します。

```bash
$ bundle install --deployment --without development test
```

`production` 環境なので、`development` と `test` のみで必要な Gem はスキップします。

# yarn install
`yarn install` を実行します。

```bash
$ yarn install --pure-lockfile
```

# Redis のインストール
Redis は以下のようにインストールすることはできます。

```bash
# 個人的に非推奨
$ sudo yum -y install epel-release
$ sudo yum -y install redis
```

ところがこの方法でインストールしたところ、Docker で使用していた Redis のダンプファイルを適用してデーモンを起動することができませんでした。エラーメッセージが、バージョンに関することだったことから、Docker 内で使用していた Redis と互換性が保たれないためにデーモンが起動できなかったと思われます。また、上記のコマンドでは、CentOS のバージョンによっては、パッケージが見つからないと言われインストールできません。

そのため、REMI リポジトリを利用してインストールします。

```bash
$ sudo yum install -y epel-release
$ wget http://rpms.famillecollet.com/enterprise/remi-release-7.rpm
$ sudo rpm -Uvh remi-release-7*.rpm
$ sudo yum -y --enablerepo=remi,remi-test,epel install redis
```

参考: [CentOS7.xに最新版のRedisをインストールする最も簡単な方法](http://qiita.com/kentarosasaki/items/d6157e9334a8902413e7)

Redis のインストールが完了したら、`remi-release-7.rpm` は削除して大丈夫です。

# PostgreSQL のインストール
**重要: Docker 内の PostgreSQL と同じバージョンものを使用することを強く推奨します**。

ここはかなり重要なことなので、慎重に判断してください。Docker 内で使用していたデータベースをサーバ直下にリストアするのですが、Docker 内の PostgreSQL とバージョンが一緒の場合、異なる場合でそれぞれリストアの仕方が異なります。

Docker 内と同じバージョンの PostgreSQL の場合、PostgreSQL で使用するデータベースファイルをそのまま移植すれば OK です。この場合は特に不具合もなく移行できます。

しかし、Docker 内と異なるバージョンの場合、単にデータベースファイルを移行するだけでは、PostgreSQL を起動できません。互換性によるものです。そのため、Docker 内で使用している PostgreSQL のデータベースをダンプし、サーバ直下の PostgreSQL にデータを流し込む必要があります。

ところが、互換性やその他何かしらの理由で、リストアの際にエラーが発生することがあります。エラーを無視しても最低限重要なデータはリストアできるのですが、**一部のデータが消失してしまう可能性**があります。僕が試したときには、全ユーザのお気に入り一覧、認証済みアプリ一覧、画像リンクの参照データなどが消失してしまいました。

もちろんデータベースに詳しい人なら、自力でリストアできるのかもしれませんが、たくさんのデータが入っていればいるほどエラーの数は多くなるので、すべてのエラーを人力で解消するのは、かなりの骨折りになるかと思います。ましてやデータベースに詳しくないともうお手上げです。

なので、もう一度言います。特別な理由がないかぎりは、**Docker 内と同じバージョンの PostgreSQL を使用することを推奨します**。

## **推奨**: Docker 内と同じバージョンの PostgreSQL をインストール
通常はこちらの方法でインストールしてください。どうしても別のバージョンの PostgreSQL を使用しなければいけない何らかの事情があるとき以外は、こちらの方法を強く推奨します。

### バージョンの確認
Docker 内で使用されている PostgreSQL のバージョンを確認するには以下のファイルを見ます。

```bash
$ sudo cat postgres/PG_VERSION
9.6
```

上記の例では PostgreSQL 9.6 が使用されていることがわかりました。

### postgres/PG_VERSION が見つからない場合
もし、マストドンのディレクトリの中に `postgres` というディレクトリがない場合は、Docker コンテナ内のデータの永続化がされていないと考えられます。その場合は、以下のように、Docker コンテナ内に入って、ファイルを確認します。

```bash
$ docker-compose up -d
$ docker exec -it mastodon_db_1 /bin/bash
$ su - postgres
$ cat data/PG_VERSION
9.6
$ exit
$ exit
```

### PostgreSQL のインストール
上記の例では 9.6 だったので、PostgreSQL 9.6 をインストールします。9.6 のインストールに必要なリポジトリを追加し、インストールします。

```bash
$ sudo rpm -Uvh https://yum.postgresql.org/9.6/redhat/rhel-7-x86_64/pgdg-centos96-9.6-3.noarch.rpm
$ sudo yum -y install postgresql96 postgresql96-devel postgresql96-contrib postgresql96-server
```

参考: [How to Install PostgreSQL 9.6 on CentOS/RHEL 7/6/5 and Fedora 25/24/23](https://tecadmin.net/install-postgresql-9-on-centos/)

9.6 ではない場合は、`9.6` や `96` となっている部分を、該当する数字に置き換えてください。うまくいかない場合は、該当バージョンのインストール方法を各自調べてください。

### psql コマンドが存在する場合
この時点ではまだ `psql` コマンドは使用できないはずですが、もし使用できた場合は、別のバージョンの PostgreSQL がすでにインストールされています。

```bash
$ psql --version
psql (PostgreSQL) 9.2.18
```

`command not found` とならなかった場合は、一旦 `psql` コマンドを別の場所に退避させてください。

```bash
# psql コマンドが存在する場合のみ

$ which psql
/usr/bin/psql
$ sudo mv /usr/bin/psql ~/backup
```

### psql コマンドのシンボリックリンクを貼る
現状だと、PostgreSQL はインストールされていますが、`psql` コマンドが使用できません。そのため、シンボリックリンクを貼って `psql` コマンドを使用できるようにします。

```bash
$ sudo ln -s /usr/pgsql-9.6/bin/psql /usr/bin/psql
```

9.6 ではない場合は該当する数字を置き換えてください。

シェルを再起動します。

```bash
$ exec $SHELL
```

`psql` コマンドが、インストールした PostgreSQL と同じバージョンになっていれば成功です。

```bash
$ psql --version
psql (PostgreSQL) 9.6.5
```

参考: [【PostgreSQL】psql version 8.4, server version 9.5](http://mementoo.info/archives/2146)

## **非推奨**: 標準リポジトリでインストールできるバージョンの PostgreSQL をインストール
何度も繰り返しになりますが、こちらの方法はおすすめしません。

### PostgreSQL のインストール
Yum リポジトリ標準の PostgreSQL をインストールします。

```bash
$ sudo yum -y install postgresql postgresql-devel postgresql-contrib postgresql-server
```

`psql` コマンドで PostgreSQL のバージョンを確認します。

```bash
$ psql --version
psql (PostgreSQL) 9.2.18
```

こちらのほうが PostgreSQL のインストール自体はシンプルですが、後々の問題が大きいです。

# マストドンサービスファイルの作成
マストドンを起動するのに必要なサービスファイルを作成します。作成するサービスは以下の 3 つです。

* mastodon-web.service
* mastodon-sidekiq.service
* mastodon-streaming.service

`/etc/systemd/system/` 以下に上記の 3 つのサービスファイルを作成します。

```/etc/systemd/system/mastodon-web.service
[Unit]
Description=mastodon-web
After=network.target

[Service]
Type=simple
User=mastodon
WorkingDirectory=/home/mastodon/live
Environment="RAILS_ENV=production"
Environment="PORT=3000"
ExecStart=/bin/bash -lc 'bundle exec puma -C config/puma.rb'
TimeoutSec=15
Restart=always

[Install]
WantedBy=multi-user.target
```

```etc/systemd/system/mastodon-sidekiq.service
[Unit]
Description=mastodon-sidekiq
After=network.target

[Service]
Type=simple
User=mastodon
WorkingDirectory=/home/mastodon/live
Environment="RAILS_ENV=production"
Environment="DB_POOL=5"
ExecStart=/bin/bash -lc 'bundle exec sidekiq -c 5 -q default -q mailers -q pull -q push'
TimeoutSec=15
Restart=always

[Install]
WantedBy=multi-user.target
```

```etc/systemd/system/mastodon-streaming.service
[Unit]
Description=mastodon-streaming
After=network.target

[Service]
Type=simple
User=mastodon
WorkingDirectory=/home/mastodon/live
Environment="NODE_ENV=production"
Environment="PORT=4000"
ExecStart=/home/mastodon/.ndenv/shims/npm run start
TimeoutSec=15
Restart=always

[Install]
WantedBy=multi-user.target
```

以下の 3 つを環境に合わせて変更してください。

### 実行ユーザが `mastodon` ではない場合
`User=` の箇所を該当ユーザに書き換えてください

### マストドンのあるディレクトリが `/home/mastodon/live` ではない場合
`WorkingDirectory=` の箇所を、マストドンのディレクトリになるように**フルパスで**指定してください。

### 起動する npm のパスが異なる場合
まずは npm のパスを確認してください。

```bash
$ which npm
~/.ndenv/shims/npm
```

mastodon-streaming.service の `ExecStart=` のパスは、ここで表示されたパスに置き換えてください。ただし、`~` は `/home/ユーザ名` と読み替えてください。

### 途中でサービスファイルを変更する場合
ここで定義したサービスファイルを使って起動し、後からタイプミス等があったとしてファイルの内容を変更した場合は、デーモンをリロードする必要があります。

```bash
$ sudo systemctl daemon-reload
```

### 雑談
上記のファイルは、[マストドン公式リポジトリのプロダクションガイド](https://github.com/tootsuite/documentation/blob/master/Running-Mastodon/Production-guide.md#mastodon-systemd-service-files)に書かれていたものを参考にしているのですが、なぜかこのガイドのサービスファイルだと、エラーが発生してデーモンが起動できませんでした。(厳密には起動するのですが、その数秒後に謎のエラーが出て落ちてしまいます)

エラーログを細かく見ながらひたすら調べていたら、やっと解決策が見つかりました。

[Doesn't seem to work with production mode on DigitalOcean](https://github.com/tootsuite/mastodon/issues/1402#issuecomment-308779054)

この通りにファイルを変更したら問題なく動作しました。なぜこれでうまくいくのか、そしてなぜプロダクションガイドの例ではうまくいかないのかはわかりませんが、この解決策にたどり着くまで数時間かかりました…

# PostgreSQL と Redis のデータのリストア
**重要: PostgreSQL と Redis のデータは、必ず同時に、同時期のデータをリストアしてください**。

これは PostgreSQL のバージョンに次いで重要なことです。Docker 内で使用していた PostgreSQL と Redis のデータをサーバ直下に置くわけですが、このとき、稼働していた時期がそれぞれ別々の状態のデータをリストアしてしまうと予期せぬ問題が発生します。僕のインスタンスで起こった問題は、**ホームタイムラインが空になり、何も表示されない状態**になってしまったことです。

たとえば、9 月 5 日に取った PostgreSQL のバックアップデータと、9 月 6 日に取った Redis のバックアップデータを同時に使用してはならないということです。**必ず同時期に稼働していた状態のデータを使用**してください。具体的には、Docker で稼働している PostgreSQL と Redis のデータは、一緒にリストアしないといけません。

Docker が稼働している状態で、PostgreSQL のデータをリストアして、しばらく経ったあとに Redis のデータをリストアしてしまうと、PostgreSQL のリストアをしてから Redis のリストアをする間にこれらのデータが書き換わってしまうので、同時期のデータではなくなってしまいます。

そのため、PostgreSQL と Redis のデータをリストアする際には、まずマストドンの Docker コンテナを停止させてから、同じタイミングで行う必要があります。

## **推奨**: Docker 内と同じバージョンの PostgreSQL をインストールした場合
こちらは Docker 内と同じバージョンの PostgreSQL をインストールした場合の方法です。違うバージョンをインストールした場合は、後述のダンプしてリストアする方法を参照してください。

### postgres と redis のディレクトリがない場合
マストドンディレクトリ以下に `postgres` ディレクトリと `redis` ディレクトリがない場合は、データの永続化を行っていないと考えられるので、Docker コンテナから引っ張ってきます。

```bash
# postgres と redis のディレクトリがない場合のみ実行

$ docker-compose up -d
$ sudo docker cp mastodon_db_1:/var/lib/postgresql/data /home/mastodon/live/postgres
$ sudo docker cp mastodon_redis_1:/data /home/mastodon/live/redis
```

参考: [小規模Mastodonインスタンスを運用するコツ](https://blog.potproject.net/archives/977)

マストドンのディレクトリが `/home/mastodon/live` ではない場合は読み替えてください。また、上記の 2 つの `docker cp` コマンドは、片方が終わったらすぐにもう片方のコマンドを実行してください。

### コピー先に古いファイルがある場合
この後、`/var/lib/pgsql/9.6` (PostgreSQL 9.6 の場合) と `/var/lib/redis` に Docker 内の PostgreSQL と Redis のデータをコピーするのですが、ここに不要なファイルやディレクトリがあった場合は一旦リストアします。

```bash
# すでにファイルやディレクトリがある場合のみ

$ sudo mv /var/lib/redis/* ~/backup
$ sudo mv /var/lib/pgsql/9.6/data ~/backup
```

`9.6` の箇所はインストールした PostgreSQL のバージョンに合わせて読み替えてください。なお、すでにそのサーバで PostgreSQL 9.6 (9.6 はこの記事の場合) や Redis を使用していた場合は、**今までのデータは使えなくなりますのでご注意ください**。

## データのリストア
Docker で使用していた PostgreSQL と Redis のデータをサーバ直下で使用する場所に置きます。先にマストドンの Docker コンテナを停止させてから、コピーします。また、それぞれのファイル、ディレクトリの所有者を変更します。

```bash
$ docker-compose stop
$ sudo cp -r postgres /var/lib/pgsql/9.6/data
$ sudo cp redis/* /var/lib/redis
$ sudo chown -R postgres:postgres /var/lib/pgsql/9.6/data
$ sudo chown redis:redis /var/lib/redis/*
```

`9.6` の箇所はインストールした PostgreSQL のバージョンに読み替えてください。

## **非推奨**: 標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合
この場合は単純にファイルをコピーすることはできないので、Docker で使用していた PostgreSQL をダンプしてリストアします。

マストドンの Docker コンテナを起動して DB コンテナに入ります。

```bash
$ docker-compose up -d
$ docker exec -it mastodon_db_1 /bin/bash
```

DB コンテナ内の `postgres` ユーザでログインして、ダンプします。

```bash
$ su - postgres
$ pg_dumpall -f mastodon.sql
$ exit
$ exit
```

参考: [PostgreSQLでバックアップ・リストアする方法](http://wp.tech-style.info/archives/563)

ダンプしたファイルをコンテナ内からサーバ直下へ持ってきます。その後、すぐにコンテナを停止させます。

```bash
$ docker cp mastodon_db_1:/var/lib/postgresql/mastodon.sql .
$ docker-compose stop
```

`mastodon.sql` を `/var/lib/pgsql` に移動させ、所有者を変更します

```bash
$ sudo mv mastodon.sql /var/lib/pgsql
$ sudo chown postgres:postgres /var/lib/pgsql/mastodon.sql
```

サーバ直下の PostgreSQL サーバを起動します。

```bash
$ sudo systemctl start postgresql
```

起動しているか確認します。

```bash
$ systemctl status postgresql
```

`active` となっていれば OK です。もし `failed` となっていて起動できなかった場合は、以下のコマンドで PostgreSQL の初期化を行ってください。

```bash
$ sudo postgresql-setup initdb
```

参考: [PostgreSQLの初期設定](http://www.nslabs.jp/postgresql-setup.rhtml)

サーバ直下の `postgres` ユーザでログインして、ダンプしたファイルでリストアします。

```bash
$ su - postgres
$ psql -f mastodon.sql
$ exit
```

これで、リストアはできますが、互換性の問題で一部のデータがリストアできていない可能性があります。`psql` コマンドを実行したときに表示されるエラーを確認してください。

一旦 PostgreSQL サーバを停止します。

```bash
$ sudo systemctl stop postgresql
```

あとは、Docker 内と同じバージョンの PostgreSQL をインストールした場合 (推奨) の手順と同じように、Redis のデータをリストアします。マストドンディレクトリ以下に `redis` ディレクトリがなかったり、`/var/lib/redis` 以下に何かファイルが入っていた場合は、推奨側の手順を参照してください。

```bash
$ docker-compose stop
$ sudo cp redis/* /var/lib/redis
$ sudo chown redis:redis /var/lib/redis/*
```

# マストドンの環境設定ファイルを編集
Docker から non-Docker に移行したことで、マストドンの環境設定ファイルを変更する必要があります。具体的には、`REDIS_HOST` と `DB_HOST` を `localhost` に変更します。

```diff:.env.production
- REDIS_HOST=redis
+ REDIS_HOST=localhost
- DB_HOST=db
+ DB_HOST=localhost
```

# マイグレーション
PostgreSQL サーバを起動してマイグレーションを実行します。

```bash
$ sudo systemctl start postgresql
$ RAILS_ENV=production bundle exec rails db:migrate
$ sudo systemctl stop postgresql
```

# プリコンパイル
Docker で運用していた場合は、`public/assets`、`public/packs`、`public/system` の所有者、所有グループが Docker のものになっているので、まずは所有者を変更します。その後、プリコンパイルを実行します。

```bash
$ sudo chown -R mastodon:mastodon public/assets public/packs public/system
$ RAILS_ENV=production bundle exec rails assets:precompile
```

`mastodon:mastodon` の箇所は、現在のユーザが `mastodon` ではない場合は、現在のユーザの名前に置き換えてください。

今後、何かしらの事情でマストドン Docker コンテナを一時的に起動しないといけない場合は、コンテナを停止させたあとに、必ず `public/assets`、`public/packs`、`public/system` の所有者、所有グループの変更を忘れないでください。

# デーモンの起動
マストドンの Docker コンテナが起動している場合は、デーモンを起動することができないので、コンテナが起動している場合は停止します。

```bash
$ docker-compose stop
```

コンテナを停止させたら、いよいよサービスを起動させます。

```bash
$ sudo systemctl start postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合 (非推奨) は、`postgresql-9.6` を `postgresql` に読み替えてください。

## デーモンの状態を確認
すべてのデーモンが起動しているか確認します。

```bash
$ systemctl status postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合 (非推奨) は、`postgresql-9.6` を `postgresql` に読み替えてください。

すべてのサービスの状態が `active` になっていれば OK です。

正しく起動しているかどうか、またデータがちゃんとリストアできているかどうかを、実際に Web にアクセスして確認してみてください。個人のトゥートやタイムライン、通知一覧、お気に入り一覧、設定、自己紹介文、サイト説明文、画像、認証済みアプリの一覧など、すべてのデータが正しく読み取れれば成功です！ お疲れさまでした！

ちなみに、気休めですが、トゥート 0, ユーザ数 0 のようにデータが真っ白な状態になってしまっていた場合は、一旦、サービスをすべて落として、再起動すると、治ることがあります。

```bash
$ sudo systemctl stop postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
$ sudo systemctl start postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合 (非推奨) は、`postgresql-9.6` を `postgresql` に読み替えてください。

# 後日談
## 不要になった Docker コンテナを削除
non-Docker 環境で問題なく稼働したことを確認したら、もうマストドンの Docker コンテナは必要ありません。もし、もう一度 Docker で稼働させたくなったとしても[データの永続化](http://qiita.com/noraworld/items/ff775cbad97baf566614)をしていれば、またいつでも Docker 稼働に戻すことができます (ただし non-Docker で動いていた直前のデータに戻す場合は、今回行ったデータのリストアの逆の手順を行う必要があります。つまり、`/var/lib/pgsql/9.6/data` と `/var/lib/redis` の中身をマストドンディレクトリ以下の `postgres` と `redis` にそれぞれコピーする必要があります)

現状マストドンの Docker コンテナが動いていなければ空き容量を増やすために削除してしまったほうが良いでしょう。以下のコマンドで、現在稼働していないコンテナ、現在使われていないイメージ、ボリュームを削除することができます。

```bash
$ docker system prune -a
```

これで、マストドンで使用していた Docker コンテナが削除されます。ちなみに僕のサーバの環境では約 3GB ほど開放されました。これは結構大きいです。

## cronjob の修正
もし、Docker でマストドンを稼働させていたときに、何かしらのタスクを、`docker` または `docker-compose` コマンドで定期的に実行していた場合は、それを Docker を使わないコマンドで置き換える必要があります。

たとえば

```bash
$ docker-compose run --rm web rails mastodon:remove_remote
```

というコマンドを cron で実行していた場合は

```bash
$ RAILS_ENV=production bundle exec rails mastodon:remove_remote
```

に変更する必要があります。また、注意すべきなのは、`RAILS_ENV=production` をつけないといけないことです。Docker のコマンドのときにはつけていなかったので意外に忘れるポイントです。

# トラブルシューティング
この記事の手順を進めていくに当たって、エラーが発生したときには、まずこちらを参考にしてください。それでも解決しなければ、他の記事をあたってください。

## FATAL: Ident authentication failed for user
マイグレーションや、その他データベースに関する処理を行った際にこのようなエラーが出る場合があります。このエラーは、おそらく標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合の手順 (非推奨手順) で起こる可能性があります。

このエラーが起きた場合は `/var/lib/pgsql/data/pg_hba.conf` を開き、以下の該当する箇所を変更してください。

```diff:/var/lib/pgsql/data/pg_hba.conf
# TYPE DATABASE USER ADDRESS METHOD

# "local" is for Unix domain socket connections only
- local all all peer
+ local all all trust
# IPv4 local connections:
- host all all 127.0.0.1/32 ident
+ host all all 127.0.0.1/32 trust
# IPv6 local connections:
- host all all ::1/128 ident
+ host all all ::1/128 trust
```

`METHOD` の部分をすべて `trust` に変更します。

変更したら、PostgreSQL を再起動して、変更を反映させます。

```bash
$ sudo systemctl reload postgresql
```

参考: [PostgreSQLのerror FATAL: Ident authentication failed for user](http://qiita.com/pugiemonn/items/7ec47bc82bd56b0458b9)

上記の例は、標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合です。もし、Docker 内と同じバージョンの PostgreSQL をインストールした場合で同じエラーが起きた場合は、`/var/lib/pgsql/data/pg_hba.conf` を `/var/lib/pgsql/data/9.6/pg_hba.conf` に、`sudo systemctl reload postgresql` を `sudo systemctl reload postgresql-9.6` に読み替えてください (9.6 はこの記事の場合)

## Data directory is not empty!

```bash
$ sudo postgresql-setup initdb
```

上記コマンドを実行したときに起こる可能性のあるエラーです。このコマンドは、標準リポジトリでインストールできるバージョンの PostgreSQL をインストールした場合に使用するかもしれないコマンドなので、その前提で説明します。

これは PostgreSQL を初期化しようとしたときに、すでにデータが入っていて初期化できないことを意味します。なので、このエラーが表示されたということは、このコマンドを実行する必要はなかった、ということになります。

それでも PostgreSQL サーバが起動できず、どうしてもこのコマンドを実行したい場合は、先に PostgreSQL のデータを削除または別の場所に退避する必要があります。

```bash
$ sudo mv /var/lib/pgsql/data ~/backup
```

その後、該当のコマンドを実行してください。

参考: [Postgres CentOS and Amazon Linux initdb error: Data directory is not empty! [FAILED]](https://gist.github.com/kennwhite/2a3227165b14eca73b99)

## ERROR: permission denied to create database
おそらくこのエラーに遭遇することはないと思います。もしこのエラーに当たった場合は、何かを間違えている (勘違いや、コマンドミス、実行順序ミス等) 可能性が高いので、実行したコマンドの履歴を見ておかしなところがないか確認してください。

## FATAL: role "username" is not permitted to log in
`"username"` の箇所にはデータベースのロールが入ります。

これはエラーの内容通り、ログインする権限がないということです。PostgreSQL に接続して、以下のコマンドで権限を与えます。

```bash
$ sudo -u postgres psql
postgres=# ALTER ROLE "username" WITH LOGIN;
postgres=# \q
```

`"username"` は読み替えてください。

参考: [Superuser is not permitted to login](https://dba.stackexchange.com/questions/57723/superuser-is-not-permitted-to-login), [PostgreSQL: role is not permitted to log in](https://stackoverflow.com/questions/35254786/postgresql-role-is-not-permitted-to-log-in)
