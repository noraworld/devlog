---
title: "Docker で稼働しているマストドンを Docker を使用しない環境に移行する方法"
emoji: "👋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "マストドン", "Docker", "docker-compose", "PostgreSQL"]
published: false
order: 38
---

# はじめに
先日、僕が運営しているマストドンインスタンス ([mastodon.noraworld.jp](https://mastodon.noraworld.jp)) を Docker 環境から Docker を使わない環境 (non-Docker 環境) に移行しました。

そのときの作業が僕にとってかなり大変で、特にデータベースの移行で苦労しました。ネットで調べると、Docker でマストドンインスタンスを立てる方法や、non-Docker で立てる方法はたくさん情報が出てくるのですが、Docker で稼働しているインスタンスを non-Docker に移行する記事は、そんなにありませんでした。

今回は、僕と同じように環境の移行を検討されている人で、ネットの情報が少なく困っている人の参考になればと思い、僕が行った作業をここにまとめようと思います。参考になれば幸いです。

## Docker をやめた理由
**Docker は、環境を構築するのは簡単ですが、パフォーマンスやリソースの面でネックになる**ということが、約 4 ヶ月半 Docker でマストドンを運用していてわかったことです。

Docker は、パフォーマンスをあまり下げずに、複数の環境でほぼ同じ環境を構築することができるのが特徴です。しかし、数ヶ月マストドンインスタンスを運用していて、やはり Docker だと応答が少し遅くて、だんだん重くなってくるのが体感でわかりました。[mastodon.noraworld.jp](https://mastodon.noraworld.jp) は、4 月下旬から運用を続けていましたが、8 月の下旬辺りから、気になるほど応答が遅くなってきたので、non-Docker への以降を検討しました。

また、Docker はかなり容量を食います。コンテナの中に必要なバイナリやライブラリをすべてインストールするので、サーバ直下にインストールされているものでも、別途コンテナ内に必要です。当然サーバ直下にインストールするより容量の面での効率が悪いです。コンテナの中をいくら綺麗にしても、マストドンだけで 2GB くらいは食ってしまいます。

運用していて唯一良かった点は、マストドン自体のアップデートや、各ライブラリのアップデート (セキュリティアップデート含む) などがすべて、`docker-compose pull` と `docker-compose build` だけで完結する点ですが、マストドンをアップデートするだけなら、non-Docker でも作業量は変わらないです。

マストドンの運用でわかった、僕の中での結論としては、Docker はあくまで**開発環境を簡単に構築**できて、しかも削除して再構築するなどが非常に簡単にできるだけで、本番環境では、**最初の環境構築以外はほとんど利点がない**ということです。

# この記事を読む前に
この記事では、以下のことを想定して書かれています。

* 作業はすべて**マストドンのディレクトリ以下**で行っていること
* バックアップを取る際のバックアップ先は **~/backup** としていること
* マストドン以外のアプリケーションで Redis を使用していないこと

これらの事柄は特に注意書きなしで説明しています。バックアップ先のディレクトリは状況に応じて変更してください。

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
* Redis 4.0.1
* Mastodon v1.6.0rc1

# Ruby と Bundler のインストール
サーバ直下に、まだ Ruby がインストールされていない、もしくはインストールされていても、Docker 内と同じバージョンの Ruby がインストールされていない場合はインストールします。Docker 内と違うバージョンの Ruby を使用しても大きな問題は出ないかもしれませんが、あまり古いとエラーになる可能性があるので同じバージョンのインストールをおすすめします。

Docker 内の Ruby のバージョンを確認します。

```bash
$ cat .ruby-version
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

Node.js のインストールに関しては `ndenv` を使用することを個人的におすすめします。`ndenv` 以外のインストール方法でも構いませんが、以降の説明では `ndenv` を使用してインストールしたと想定して説明を進めます。その際は各々読み替えてください。`ndenv` の導入および Node.js のインストールに関しては「[ndenv を使用して複数のバージョンの Node.js を管理する方法と基本的な使い方](http://qiita.com/noraworld/items/462689e108c10102d51f)」を参考にしてください。

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
$ sudo yum -y install epel-release
$ wget http://rpms.famillecollet.com/enterprise/remi-release-7.rpm
$ sudo rpm -Uvh remi-release-7*.rpm
$ sudo yum -y --enablerepo=remi,remi-test,epel install redis
```

参考: [CentOS7.xに最新版のRedisをインストールする最も簡単な方法](http://qiita.com/kentarosasaki/items/d6157e9334a8902413e7)

Redis のインストールが完了したら、`remi-release-7.rpm` は削除して大丈夫です。

# PostgreSQL のインストール
**重要: Docker 内の PostgreSQL と同じバージョンものを使用することを強く推奨します**。

ここはかなり重要なことなので、慎重に判断してください。PostgreSQL のバージョンが、Docker 内のものと異なる場合、互換性の理由で、バックアップをリストアする際にエラーが発生することがあります。エラーを無視しても最低限重要なデータはリストアできるのですが、**一部のデータが消失してしまう可能性**があります。僕が試したときには、**全ユーザのお気に入り一覧、認証済みアプリ一覧、画像リンクの参照データなど**が消失してしまいました。

もちろんデータベースに詳しい人なら、PostgreSQL のバージョンアップ、バージョンダウンによる互換性の問題を修正する術をご存知かと思いますが、そうでない人にとってはかなりリスキーな手段です。ちなみに僕は上記の問題を自力で解決することができませんでした。

なので、**PostgreSQL は Docker 内と同じバージョンのものをインストールすることを強く推奨**します。この記事では、Docker 内の PostgreSQL のバージョンを確認して、それと同じバージョンのものをインストールする方法を説明します。

## バージョンの確認
Docker 内で使用されている PostgreSQL のバージョンを確認するには以下のファイルを見ます。

```bash
$ sudo cat postgres/PG_VERSION
9.6
```

上記の例では PostgreSQL 9.6 が使用されていることがわかりました。

**以降の説明では、PostgreSQL 9.6 を使用することを前提としています。もし、表示されたバージョンが 9.6 でない場合は `9.6` や `96` となっている箇所を適宜読み替えてください**。

### postgres/PG_VERSION が見つからない場合
もし、マストドンのディレクトリの中に `postgres` というディレクトリがない場合は、Docker コンテナ内のデータの永続化がされていないと考えられます。その場合は、以下のように、Docker コンテナ内に入って、ファイルを確認します。

```bash
# PG_VERSION が見つからない場合のみ
$ docker-compose up -d
$ docker exec -it mastodon_db_1 /bin/bash
$ su - postgres
$ cat data/PG_VERSION
9.6
$ exit
$ exit
```

## 該当するバージョンの PostgreSQL をインストール
上記の例では 9.6 だったので、PostgreSQL 9.6 をインストールします。9.6 のインストールに必要なリポジトリを追加し、インストールします。

```bash
$ sudo rpm -Uvh https://yum.postgresql.org/9.6/redhat/rhel-7-x86_64/pgdg-centos96-9.6-3.noarch.rpm
$ sudo yum -y install postgresql96 postgresql96-devel postgresql96-contrib postgresql96-server
```

参考: [How to Install PostgreSQL 9.6 on CentOS/RHEL 7/6/5 and Fedora 25/24/23](https://tecadmin.net/install-postgresql-9-on-centos/)

9.6 ではない場合は、`9.6` や `96` となっている部分を、該当する数字に置き換えてください。うまくいかない場合は、該当バージョンのインストール方法を各自調べてください。

### PostgreSQL 関連のコマンドのバージョンが異なる場合
上記の例では PostgreSQL 9.6 をインストールしたので、関連するコマンドも 9.6 であるべきですが、そうなっていない場合があります。それは、古いバージョンまたは、別のバージョンの PostgreSQL がすでにインストールされていたからです。

これを確認するにはたとえば `psql` コマンドのバージョンを調べます。

```bash
$ psql --version
psql (PostgreSQL) 9.2.18
```

9.6 をインストールしたにもかかわらず 9.2 となっています。このような状態になっていると、今後いろいろと不都合が生じるので、修正します。以下のコマンドを実行して、バージョン 9.6 のコマンドがインストールされたバイナリのパスを通します。

```bash
# バージョンが異なる場合のみ
$ echo 'export PATH="/usr/pgsql-9.6/bin:$PATH"' >> ~/.bash_profile
```

通したパスを反映させます。

```bash
$ exec -l $SHELL
```

これでもう一度、`psql` コマンドのバージョンを確認します。インストールした PostgreSQL のバージョンになっていることを確認してください。

```bash
$ psql --version
psql (PostgreSQL) 9.6.5
```

他にも、`pg_restore` を使用するので、バージョンがそろっているか念のため確認してください。

```bash
$ pg_restore --version
```

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

```/etc/systemd/system/mastodon-sidekiq.service
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

```/etc/systemd/system/mastodon-streaming.service
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
`User` の箇所を該当ユーザに書き換えてください

### マストドンのあるディレクトリが `/home/mastodon/live` ではない場合
`WorkingDirectory` の箇所を、マストドンのディレクトリになるように**フルパスで**指定してください。

### 起動する npm のパスが異なる場合
ndenv を使用した場合は特に気にする必要はありません。しかしそれ以外の方法で Node.js (npm) をインストールした場合は、適切なパスに書き替える必要があります。

まずは npm のパスを確認してください。

```bash
$ which npm
~/.ndenv/shims/npm
```

mastodon-streaming.service の `ExecStart` のパスは、ここで表示されたパスに置き換えてください。ただし、`~` は `/home/ユーザ名` と読み替えてください。

### 途中でサービスファイルを変更する場合
ここで定義したサービスファイルを使って起動し、後からタイプミス等があったとしてファイルの内容を変更した場合は、デーモンをリロードする必要があります。

```bash
$ sudo systemctl daemon-reload
```

## 苦労話
上記のファイルは、[マストドン公式リポジトリのプロダクションガイド](https://github.com/tootsuite/documentation/blob/master/Running-Mastodon/Production-guide.md#mastodon-systemd-service-files)に書かれていたものを参考にしているのですが、なぜかこのガイドのサービスファイルだと、エラーが発生してデーモンが起動できませんでした。(厳密には起動するのですが、その数秒後に謎のエラーが出て落ちてしまいます)

エラーログを細かく見ながらひたすら調べていたら、やっと解決策が見つかりました。

[Doesn't seem to work with production mode on DigitalOcean](https://github.com/tootsuite/mastodon/issues/1402#issuecomment-308779054)

この通りにファイルを変更したら問題なく動作しました。なぜこれでうまくいくのか、そしてなぜプロダクションガイドの例ではうまくいかないのかはわかりませんが、この解決策にたどり着くまで数時間かかりました…

# PostgreSQL と Redis のデータのバックアップとリストア
## **【重要】PostgreSQL と Redis のデータは、必ず同時に、同時期のデータのバックアップを取ること**

これは PostgreSQL のバージョンに次いで重要なことです。Docker 内で使用していた PostgreSQL と Redis のデータをサーバ直下に置くわけですが、このとき、稼働していた時期がそれぞれ別々の状態のデータをリストアしてしまうと予期せぬ問題が発生します。僕のインスタンスで起こった問題は、**ホームタイムラインが空になり、何も表示されない状態**になってしまったことです。

たとえば、9 月 5 日に取った PostgreSQL のバックアップデータと、9 月 6 日に取った Redis のバックアップデータを同時に使用してはならないということです。**必ず同時期に稼働していた状態のデータを使用**してください。具体的には、Docker で稼働している PostgreSQL と Redis のデータは、一緒にバックアップを取らないといけません。

Docker が稼働している状態で、PostgreSQL のデータをリストアして、しばらく経ったあとに Redis のデータをリストアしてしまうと、PostgreSQL のリストアをしてから Redis のリストアをする間にこれらのデータが書き換わってしまうので、同時期のデータではなくなってしまいます。

そのため、PostgreSQL と Redis のデータをリストアする際には、まずマストドンの Docker コンテナを停止させてから、同じタイミングで行う必要があります。

## **【重要】9 月 11 日より前に記載していたバックアップとリストアに関して**
この記事では、PostgreSQL のバックアップとリストアの推奨方法として、マストドンディレクトリ以下の postgres と redis ディレクトリの中身をそのままコピーする、という紹介をしていました。

しかし、これは結果的にバッドケースでした。この方法で [mastodon.noraworld.jp](https://mastodon.noraworld.jp) の移行メンテナンスを行って、この記事を書いたのですが、その後、このインスタンス内で、**一部のユーザアカウントが分裂したり、特定のユーザのトゥートが流れず、検索したりメンションを送ったりできなくなるという不具合**が発生してしまいました。

この不具合の原因は、マストドンの開発コアメンバーに診てもらったところ、データベース内のインデックスが壊れているということがわかりました。インデックスが壊れたことにより、アカウントのスクリーンネームとドメインが全く同じレコードは存在してはいけないというユニーク制約を無視してレコードが追加されたことで、アカウントが 2 つに分裂するなどの不具合が起こりました。

参考: [Something is wrong with DB of my instance #4856](https://github.com/tootsuite/mastodon/issues/4856)

本来このようなことは起こるはずがないのですが、Docker 内で使われていたデータベースファイルをそのままコピーすると、このような不具合を招く可能性が出てきてしまいます。そのため、そのようなバックアップ方法はおすすめしません。併せて、この記事内のその説明を削除しました。ファイルをそのままコピーしてバックアップを取るのではなく、以降の説明で紹介する `pg_dump` と `pg_restore` を利用したバックアップとリストアを行ってください。

## マストドンへのアクセスを拒否
以降の説明で `pg_dump` コマンドを使用します。このコマンドを使用した PostgreSQL のバックアップ方法を「論理バックアップ」と呼びます。論理バックアップは、PostgreSQL サーバが起動している最中に実行しなければなりません。なので、バックアップをしている最中にデータベースが書き換わって、整合性が失われることがないように、ここでマストドンへの外部アクセスを止める必要があります。

アクセスを止めるには、Web サーバ (Nginx) を停止するのが一番手っ取り早いですが、すべてのサービスを止めたくない場合は、マストドンの `server` コンテキストに `deny all;` を追加して、マストドンに対するすべてのアクセスを一時的に拒否してください。

```diff
server {
    server_name マストドンで使用しているドメイン;

+   deny all;
}
```

`deny all;` を追加したら、シンタックスエラーがないか確認して、リロードします。

```bash
$ sudo nginx -t
$ sudo nginx -s reload
```

## PostgreSQL の論理バックアップ
Docker 内のデータベースのバックアップを取ります。マストドンの Docker コンテナが起動していない場合は、起動します。

```bash
$ docker-compose up -d
```

DB コンテナに接続します。

```bash
$ docker exec -it mastodon_db_1 /bin/bash
```

postgres ユーザでログインします。

```bash
$ su - postgres
```

論理バックアップを行います。バックアップファイル名を `mastodon_docker.dump` とします。

```bash
$ pg_dump -Fc -U username dbname > mastodon_docker.dump
```

`username` と `dbname` にはそれぞれユーザ名と DB 名を入れます。ユーザ名と DB 名を確認するには、`.env.production` ファイル内の `DB_USER` と `DB_NAME` を見てください。

生成されたバックアップファイルはカスタムアーカイブ形式と呼ばれます。他にもスクリプト形式や tar 形式などがありますが、カスタムアーカイブ形式は、ファイルサイズを小さくできる上に、後からスクリプト形式に変化させることもできるので、汎用性が高いです。カスタムアーカイブ形式が個人的におすすめです。

参考: [論理バックアップ（pg_dump と pg_dumpall）](https://lets.postgresql.jp/documents/technical/backup/2)
参考: [PostgresSQLのbackup, restore方法まとめ](http://qiita.com/rice_american/items/ceae28dad13c3977e3a8)

バックアップを取ったら、Docker コンテナからログアウトします。

```bash
$ exit
$ exit
```

Docker コンテナにあるバックアップファイルを、サーバ直下に移動させます。

```bash
$ docker cp mastodon_db_1:/var/lib/postgresql/mastodon_docker.dump ~/backup
```

## Redis のバックアップ
PostgreSQL の次は Redis のデータをバックアップします。Redis コンテナに接続します。

```bash
$ docker exec -it mastodon_redis_1 /bin/sh
```

データのバックアップを取るのですが、接続した直後のディレクトリ (`/data`) にはすでに `dump.rdb` があるかと思います。もしこのファイルがある場合は別の名前に変更します。

```bash
# dump.rdb が存在する場合
$ mv dump.rdb dump.rdb.old
```

`redis-cli` コマンドでバックアップを取ります。

```bash
$ redis-cli save
```

すると、`dump.rdb` というファイルが生成されます。生成されていたら、Docker コンテナからログアウトします。

```bash
$ exit
```

先ほどと同じように、Docker コンテナにあるバックアップファイルを、サーバ直下に移動させます。

```bash
$ docker cp mastodon_redis_1:/data/dump.rdb ~/backup
```

`mastodon_docker.dump` と `dump.rdb` をバックアップしたら、Docker コンテナを停止させます。

```bash
$ docker-compose stop
```

## PostgreSQL のリストア
もし、今回はじめて PostgreSQL 9.6 をインストールした場合は、初期化を行う必要があります。以前から PostgreSQL 9.6 を使用していた場合は実行する必要はありませんし、実行するとエラーになります。

```bash
# はじめて PostgreSQL 9.6 を使用する場合
$ sudo /usr/pgsql-9.6/bin/postgresql96-setup initdb
```

また、マストドンのアプリケーションからアクセスできるように、`/var/lib/pgsql/9.6/data/pg_hba.conf` を変更します。これは PostgreSQL 9.6 をすでに使用していた場合も、念のため確認してください。ファイルを編集する際は root 権限が必要です。

```diff:/var/lib/pgsql/9.6/data/pg_hba.conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
- local   all             all                                     peer
+ local   all             all                                     trust
# IPv4 local connections:
- host    all             all             127.0.0.1/32            ident
+ host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
- host    all             all             ::1/128                 ident
+ host    all             all             ::1/128                 trust
```

参考: [PostgreSQLのerror FATAL: Ident authentication failed for user](http://qiita.com/pugiemonn/items/7ec47bc82bd56b0458b9)

この状態で、PostgreSQL 9.6 サーバを起動して、状態を確認します。

```bash
$ sudo systemctl start postgresql-9.6
$ systemctl status postgresql-9.6
```

`active` となっていれば起動しています。

先ほどバックアップしたファイルを PostgreSQL のデータがあるディレクトリにコピーします。

```bash
$ sudo cp ~/backup/mastodon_docker.dump /var/lib/pgsql
```

バックアップファイルの所有者を postgres に変更します。

```bash
$ sudo chown postgres:postgres /var/lib/pgsql/mastodon_docker.dump
```

postgres ユーザにログインして、`psql` で SQL が実行できる状態にします。

```bash
$ sudo -u postgres psql
```

以下の SQL 文を実行します。

```postgres
sql> CREATE USER username CREATEDB;
sql> CREATE DATABASE dbname WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8';
sql> ALTER DATABASE dbname OWNER TO username;
sql> \q
```

`username` と `dbname` は変更してください。

再び、postgres ユーザでログインします。

```bash
$ sudo su - postgres
```

バックアップファイルをリストアします。

```bash
$ pg_restore -U username -C -d dbname mastodon_docker.dump --schema=public
```

参考: [pg_restore で --table オプションを指定しないほうがよい](http://d.hatena.ne.jp/dayflower/20060717/1153120647)
参考: [PostgreSQL: 非特権ユーザーによる pg_dump と pg_restore](http://tkrd.hatenablog.com/entry/2017/04/27/012832)

`username` と `dbname` は変更してください。

色々なオプションをつけていますが、このオプションの通りに実行すれば、おそらくエラーは出ないはずです。PostgreSQL のバージョンが、Docker 内とこことで異なる場合は、互換性の問題によりエラーが出力されるかもしれません。これが、**同じバージョンの PostgreSQL をインストールすることを推奨する理由**です。

特にエラーがなければ、これでマストドンのデータを復帰させることができました。postgres からログアウトします。

```bash
$ exit
```

一旦、PostgreSQL 9.6 サーバを停止させます。

```bash
$ sudo systemctl stop postgresql-9.6
```

## Redis のリストア
**【重要】リストアを行う前に、もし Redis サーバがすでに起動していた場合は、必ず停止してからリストアしてください。**

```bash
$ sudo systemctl stop redis
```

Redis のバックアップをリストアします。こちらは PostgreSQL のようにリストアするためのコマンドはありません。単にファイルを移すだけです。

```bash
$ sudo cp ~/backup/dump.rdb /var/lib/redis
```

所有者を redis に変更します。

```bash
$ sudo chown redis:redis /var/lib/redis/dump.rdb
```

これだけかと心配になりますが、これで大丈夫です。簡単ですね。

ちなみにサーバ直下で、他のアプリケーションで、すでに Redis を使用していた場合は、これだと他のアプリケーションのデータが消えてしまいます。Docker で使用していたマストドンの Redis データと、すでにサーバ直下で別のアプリケーション用に使われていた Redis データをどのようにリストアするかは、他の記事を調べてください。

# マストドンの環境設定ファイルを編集
Docker から non-Docker に移行したことで、マストドンの環境設定ファイルを変更する必要があります。具体的には、`REDIS_HOST` と `DB_HOST` を `localhost` に変更します。

```diff:.env.production
- REDIS_HOST=redis
+ REDIS_HOST=localhost
- DB_HOST=db
+ DB_HOST=localhost
```

今後、何かしらの事情でマストドン Docker コンテナを一時的に起動しないといけない場合は、サーバ直下の PostgreSQL, Redis, mastodon-web, mastodon-sidekiq, mastodon-streaming を停止させたあとに、必ず上記のファイルを Docker の環境のものに書き換えるのを忘れないでください。

# マイグレーション
PostgreSQL サーバを起動してマイグレーションを実行します。

```bash
$ sudo systemctl start postgresql-9.6
$ RAILS_ENV=production bundle exec rails db:migrate
$ sudo systemctl stop postgresql-9.6
```

# プリコンパイル
Docker で運用していた場合は、`public/assets`、`public/packs`、`public/system` の所有者、所有グループが Docker のものになっているので、まずは所有者を変更します。その後、プリコンパイルを実行します。

```bash
$ sudo chown -R $(whoami):$(whoami) public/assets public/packs public/system
$ RAILS_ENV=production bundle exec rails assets:precompile
```

今後、何かしらの事情でマストドン Docker コンテナを一時的に起動しないといけない場合は、サーバ直下の PostgreSQL, Redis, mastodon-web, mastodon-sidekiq, mastodon-streaming を停止させたあとに、必ず `public/assets`、`public/packs`、`public/system` の所有者、所有グループの変更を忘れないでください。

# デーモンの起動
マストドンの Docker コンテナが起動している場合は、デーモンを起動することができないので、コンテナが起動している場合は停止します。

```bash
$ docker-compose stop
```

コンテナを停止させたら、いよいよサービスを起動させます。

```bash
$ sudo systemctl start postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

## デーモンの状態を確認
すべてのデーモンが起動しているか確認します。

```bash
$ systemctl status postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

すべてのサービスの状態が `active` になっていれば OK です。

## デーモンの自動起動を有効
すべてのデーモンが正しく起動していることを確認したら、サーバをリブートしたときにこれらのサービスが自動で起動されるように設定を有効にしましょう。

```bash
$ sudo systemctl enable postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

## マストドンへのアクセスを許可
拒否していたマストドンへのアクセスを許可します。

```diff
server {
    server_name マストドンで使用しているドメイン;

-   deny all;
}
```

シンタックスエラーがないか確認して、再起動します。

```bash
$ sudo nginx -t
$ sudo nginx -s reload
```

正しく起動しているかどうか、またデータがちゃんとリストアできているかどうかを、実際に Web にアクセスして確認してみてください。個人のトゥートやタイムライン、通知一覧、お気に入り一覧、設定、自己紹介文、サイト説明文、画像、認証済みアプリの一覧など、すべてのデータが正しく読み取れれば成功です！ お疲れさまでした！

# 後日談
## 不要になった Docker コンテナを削除
non-Docker 環境で問題なく稼働したことを確認したら、もうマストドンの Docker コンテナは必要ありません。もし、もう一度 Docker で稼働させたくなったとしても、[データの永続化](http://qiita.com/noraworld/items/ff775cbad97baf566614)をしていれば、またいつでも Docker 稼働に戻すことができます。

現状、マストドンの Docker コンテナが動いていなければ空き容量を増やすために削除してしまったほうが良いでしょう。以下のコマンドで、現在稼働していないコンテナ、現在使われていないイメージ、ボリュームを削除することができます。

```bash
$ docker system prune -a
```

これで、マストドンで使用していた Docker コンテナが削除されます。ちなみに僕のサーバの環境では約 3GB ほど開放されました。これは結構大きいです。

さらに数日経った 9 月 13 日の話ですが、サーバ内で Docker コンテナで稼働させていたすべての Web サービスを non-Docker 環境に移行しました。今回の件で、Docker は本番環境には向いていないなと思い、もうサーバでは Docker を使うことはないだろうと思ったので、Docker そのものをアンインストールしました。すると、マストドンの Docker コンテナを削除する前から累計して、**約 15GB** も空き容量ができました。Docker はとにかく容量を食うようです。

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
マイグレーションや、その他データベースに関する処理を行った際にこのようなエラーが出る場合があります。

このエラーが起きた場合は `/var/lib/pgsql/9.6/data/pg_hba.conf` を開き、以下の該当する箇所を変更してください。

```diff:/var/lib/pgsql/9.6/data/pg_hba.conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
- local   all             all                                     peer
+ local   all             all                                     trust
# IPv4 local connections:
- host    all             all             127.0.0.1/32            ident
+ host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
- host    all             all             ::1/128                 ident
+ host    all             all             ::1/128                 trust
```

すべて `trust` に変更します。

変更したら、PostgreSQL を再起動して、変更を反映させます。

```bash
$ sudo systemctl stop postgresql-9.6
$ sudo systemctl start postgresql-9.6
```

参考: [PostgreSQLのerror FATAL: Ident authentication failed for user](http://qiita.com/pugiemonn/items/7ec47bc82bd56b0458b9)

## Data directory is not empty!

```bash
$ sudo /usr/pgsql-9.6/bin/postgresql96-setup initdb
```

上記コマンドを実行したときに起こる可能性のあるエラーです。これは PostgreSQL を初期化しようとしたときに、すでにデータが入っていて初期化できないことを意味します。なので、このエラーが表示されたということは、このコマンドを実行する必要はなかった、ということになります。

それでも、PostgreSQL サーバが起動できず、どうしてもこのコマンドを実行したい場合は、先に PostgreSQL のデータを削除または別の場所に退避する必要があります。

```bash
$ sudo mv /var/lib/pgsql/9.6/data ~/backup
```

その後、該当のコマンドを実行してください。

参考: [Postgres CentOS and Amazon Linux initdb error: Data directory is not empty! [FAILED]](https://gist.github.com/kennwhite/2a3227165b14eca73b99)

## ERROR:  permission denied to create database
おそらくこのエラーに遭遇することはないと思います。もしこのエラーに当たった場合は、何かを間違えている (勘違いやコマンドミス、実行順序ミス等の) 可能性が高いので、実行したコマンドの履歴を見ておかしなところがないか確認してください。

## FATAL:  role "username" is not permitted to log in
`"username"` の箇所にはデータベースのロールが入ります。

これはエラーの内容通り、ログインする権限がないということです。まずは PostgreSQL に接続します。

```bash
$ sudo systemctl start postgresql-9.6
$ sudo -u postgres psql
```

以下のコマンドで権限を与えます。

```postgres
sql> ALTER ROLE "username" WITH LOGIN;
sql> \q
```

`"username"` は読み替えてください。

参考: [Superuser is not permitted to login](https://dba.stackexchange.com/questions/57723/superuser-is-not-permitted-to-login), [PostgreSQL: role is not permitted to log in](https://stackoverflow.com/questions/35254786/postgresql-role-is-not-permitted-to-log-in)

## We're sorry, but something went wrong
サービスを立ち上げて Web にアクセスしたときにこのエラーページが出たら、以下の 4 点を確認してください。

### Docker コンテナが立ち上がっていないか
原因はわからないのですが、`docker-compose stop` して止めたはずなのに、non-Docker への移行をしているときの何らかのタイミングで勝手にマストドンの Docker コンテナが立ち上がるときがあります。原因はよくわかりませんが、このときはマストドン Docker コンテナを止めましょう。

```bash
$ docker-compose stop
```

### .env.production を書き換え忘れていないか
これはよくあるミスです。うっかり忘れてしまいます。`REDIS_HOST` と `DB_HOST` を、ともに `localhost` に変更しましょう。

```diff
- REDIS_HOST=redis
+ REDIS_HOST=localhost
- DB_HOST=db
+ DB_HOST=localhost
```

### assets, packs, system の所有者が docker になっていないか
`public/assets` や `public/packs` の所有者、所有グループが Docker のものになっていると、CSS や JS ファイルを読み取ることができないので、このエラーページが出力されます。また、`public/system` が読み取れないと、画像を読取ることができません。所有者、所有グループを変更して、読み取れる状態にしましょう。

```bash
$ sudo chown -R $(whoami):$(whoami) public/assets public/packs public/system
```

### マイグレーションやプリコンパイルをし忘れていないか
マイグレーションやプリコンパイルを忘れるとこのエラーページが表示されることがあります。マイグレーションに関しては、データベースを移行する前にすでに行われていた場合はする必要はないですが、不安なら念のためやっておくと良いでしょう。

```bash
$ RAILS_ENV=production bundle exec rails db:migrate
$ RAILS_ENV=production bundle exec rails assets:precompile
```

上記の 4 点を確認したら、PostgreSQL, Redis, mastodon-web, mastodon-sidekiq, mastodon-streaming を再起動します。

```bash
$ sudo systemctl stop postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
$ sudo systemctl start postgresql-9.6 redis mastodon-web mastodon-sidekiq mastodon-streaming
```

# 失敗歴 (おまけ)
今回の環境の移行は、僕の知識が浅かったせいで、様々な不具合に直面しました。その失敗歴を個人的な戒めとして残しておきます。

## 1 回目
標準 Yum リポジトリで PostgreSQL をインストールしたところ、Docker 内よりも古いバージョンがインストールされてしまった。その状態で、Docker 内の PostgreSQL のデータをスクリプト形式で論理バックアップして、サーバ直下にリストアしたところ、一部の SQL が互換性の問題でエラーになり、**全ユーザのお気に入り一覧、認証済みアプリ一覧、画像リンクの参照データなどが復元できない不具合**が発生した。

## 2 回目
Docker 内と同じバージョンの PostgreSQL をインストールした。今回は論理バックアップではなく、Docker 内で使用されていた PostgreSQL のデータファイルを直接移行し、データを復元した。ところが、その際に Redis のダンプファイルを、1 回目でリストアしたものをそのまま使用していたためデータの不整合が生じ、**ホームタイムラインが空になり、何も表示されない不具合**が発生した。

## 3 回目
PostgreSQL と Redis のデータの不整合が生じないように、同時期に使用していたデータを移行した。しかし、2 回目と同じく、PostgreSQL の論理バックアップをせず、データファイルをそのまま移行したことが原因で、データベース内のインデックスが壊れ、**一部のユーザアカウントが分裂したり、特定のユーザのトゥートが流れず、検索したりメンションを送ったりできなくなるという不具合**が発生した。
