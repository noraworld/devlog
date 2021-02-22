---
title: "Docker を使ってデータの永続化をせずにマストドンをデプロイしてしまったときの対処法"
emoji: "🐳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "マストドン", "Docker", "docker-compose"]
published: false
order: 34
---

# はじめに
マストドンを GitHub からクローンして、`docker-compose.yml` を編集せずにデプロイしてしまうと、PostgreSQL と Redis のデータの永続化がされません。データの永続化を行わずに稼働させていると、コンテナが消えてしまったときにデータベースのリカバリーができなくなってしまいます。

今回は、データの永続化をせずにデプロイしてしまった場合に、どのような手順で永続化を行えばいいかを紹介します。

データの永続化と、取るべきバックアップファイルに関しては「[小規模Mastodonインスタンスを運用するコツ](https://blog.potproject.net/archives/977)」を参考にさせていただきました。

# データの永続化とは
Docker におけるデータの永続化とは、Docker コンテナで使用するデータ（リソース）を、コンテナのボリュームではなくメインのボリューム（コンテナ本体ではなくサーバ直下）に置き、コンテナはサーバ直下のファイルから Docker で使用するデータを参照する仕組みです。

データの永続化を行わない場合、Docker で使用するデータ（データベースのファイルなど）は Docker コンテナが属するボリュームに保存されます。コンテナが削除されない限りはデータは残り続けますが、コンテナを削除してしまうとデータごと消えてしまいます。

そうならないために、Docker で使用するデータはサーバ直下に置き、コンテナを削除してもデータは消えないようにするのが一般的です。コンテナの構成を変更する場合だけでなく、うっかりコンテナを削除してしまうリスクも含めて、データの永続化を行うことを推奨します。

# 注意事項
データの永続化を行わずにデプロイしてしまった場合、稼働中のコンテナを削除する（再構成する）必要があります。コンテナを削除するとデータが消えてしまうので、**コンテナを削除する前に、コンテナ内のデータのバックアップを取ってください**。**必ず取ってください**。

この記事ではバックアップの取り方についても説明しますが、バックアップを取り忘れたり、コマンドを間違えてバックアップが取れていなかったことによる責任は一切持ちませんので、ご了承ください。もう一度言います。**バックアップは必ず取ってください**。

また、この作業中は稼働中のコンテナを停止しなければいけません。作業が長引く可能性や思わぬエラーにはまる可能性も考慮して、コンテナを停止させる前にユーザにアナウンスをしておくことを推奨します。

# 永続化の手順
以下の手順に沿ってデータの永続化を行います。

1. コンテナの停止
2. バックアップを取得
3. コンテナの削除
4. 所定の位置にバックアップファイルを配置
5. `docker-compose.yml` の設定を変更
6. ビルド、マイグレーション、プリコンパイル、デプロイ

## コンテナの停止
コンテナを停止させます。停止後は、この記事内の作業が完了するまでマストドンが利用できなくなります。停止する前にユーザにアナウンスしておきましょう。

```bash
$ sudo docker-compose stop
```

あまりにも長時間ダウンしていると他のインスタンスから購読を切られてしまう可能性もあるので、なるべく短い時間で済むように事前に処理の内容を把握しておくと良いです。

### なぜ最初に停止させるのか
なるべくダウンタイムを短くするためには、再起動の直前に停止させたいものです。しかし、データの永続化作業をするためには、一番最初にコンテナを停止させる必要があります。

コンテナを停止させた後、バックアップを取りますが、バックアップを取った後に他のユーザがトゥートしたり画像を投稿したりすると、そのデータはバックアップに含まれないので、復旧した後に消えてしまうことになります。

なので、こうしたトラブルにならないために、一番最初に停止させなければいけません。最初に停止させてしまうので、この作業時間中の進捗によってダウンタイムが長くなる可能性があります。これがユーザにアナウンスをしておくべき理由です。

## バックアップを取得
バックアップを取ります。これが今回の作業で最も重要なフェーズです。ミスがないように確実にバックアップを取ってください。バックアップを取るには以下のコマンドを実行します。

```bash
$ mkdir ~/mastodon_backup
$ cd /path/to/mastodon
$ sudo docker cp mastodon_db_1:/var/lib/postgresql/data     ~/mastodon_backup/postgres
$ sudo docker cp mastodon_redis_1:/data                     ~/mastodon_backup/redis
$ sudo docker cp mastodon_web_1:/mastodon/public/assets     ~/mastodon_backup/web_assets
$ sudo docker cp mastodon_web_1:/mastodon/public/system     ~/mastodon_backup/web_system
$ sudo docker cp mastodon_sidekiq_1:/mastodon/public/assets ~/mastodon_backup/sidekiq_assets
$ sudo docker cp mastodon_sidekiq_1:/mastodon/public/system ~/mastodon_backup/sidekiq_system
```

ホームディレクトリに `mastodon_backup` ディレクトリを作り、この中にバックアップファイルをコピーします。次にマストドンがあるディレクトリに移動して、`docker cp` コマンドで Docker コンテナにあるデータをサーバ直下にコピーさせます。

本来バックアップすべきなのは `mastodon_db_1:/var/lib/postgresql/data` と `mastodon_redis_1:/data` だけですが、念には念を入れて重要なデータをすべてバックアップしています。

## コンテナの削除
PostgreSQL と Redis のコンテナを削除します。これが一番センシティブな作業です。

:warning: **以下のコマンドを実行するとコンテナが削除されます。バックアップが正しく取れているかどうかもう一度よく確認して、確実に取れていることを確認したら実行してください。**

```bash
$ sudo docker-compose rm db
$ sudo docker-compose rm redis
```

「本当に削除しますか？」という内容のメッセージが表示されます。バックアップが確実に取れていることを確認した場合は、`y` を押して削除します。

### コンテナを削除する理由
コンテナを削除しなくても、データの永続化をするように設定を変更して、ビルドし直せば良いのではないかと僕自身もはじめは思っていました。

しかし、実際にコンテナを削除せずにビルドしようとすると「設定が変更されているがコンテナを削除しないと意味をなさない（データの永続化はされない）ぞ」という警告が表示されます。

ビルド後に確認してみると確かにデータの永続化はされていませんでした。なので、データの永続化を後から行う場合は、残念ながらコンテナを削除しなければいけません。そのためのバックアップです。

## 所定の位置にバックアップファイルを配置
さきほどホームディレクトリ以下の `mastodon_backup`　に保存したバックアップファイルを所定の位置に移動させます。

```bash
$ cp -r ~/mastodon_backup/postgres path/to/mastodon
$ cp -r ~/mastodon_backup/redis    path/to/mastodon
```

`path/to/mastodon` にはマストドンがあるディレクトリを指定します。これで、マストドンのディレクトリ以下に `postgres` ディレクトリと `redis` ディレクトリが配置されたはずです。この 2 つがサーバ直下に置かれていて、それを Docker コンテナ側が参照（読み書き）します。

本来なら `docker cp` コマンドを実行するときに直接マストドンのディレクトリに配置すれば良いのですが、心配症な性格なため、一旦ホームディレクトリにコピーして、もう一度、所定の位置にコピーするという冗長なことをしています。マストドンのディレクトリで作業することが多いので、万が一のことを考えてこのようにしています。

## `docker-compose.yml` の設定を変更
データの永続化をするように設定を変更します。マストドンのディレクトリ以下に `docker-compose.yml` というファイルがあるので、これをテキストエディタで開きます。

```yaml:docker-compose.yml
version: '2'
services:

  db:
    restart: always
    image: postgres:alpine
### Uncomment to enable DB persistance
#    volumes:
#      - ./postgres:/var/lib/postgresql/data

  redis:
    restart: always
    image: redis:alpine
### Uncomment to enable REDIS persistance
#    volumes:
#      - ./redis:/data

  web:
    restart: always
    build: .
    image: gargron/mastodon
    env_file: .env.production
    command: bundle exec rails s -p 3000 -b '0.0.0.0'
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    volumes:
      - ./public/assets:/mastodon/public/assets
      - ./public/system:/mastodon/public/system

  streaming:
    restart: always
    build: .
    image: gargron/mastodon
    env_file: .env.production
    command: npm run start
    ports:
      - "4000:4000"
    depends_on:
      - db
      - redis

  sidekiq:
    restart: always
    build: .
    image: gargron/mastodon
    env_file: .env.production
    command: bundle exec sidekiq -q default -q mailers -q pull -q push
    depends_on:
      - db
      - redis
    volumes:
      - ./public/system:/mastodon/public/system
```

上記はマストドンのバージョン `v1.3.2` 時点での `docker-compose.yml` の内容です。上記ファイルの 8, 9, 15, 16 行目にあるコメントをアンコメントします。

```diff:docker-compose.yml
version: '2'
services:

  db:
    restart: always
    image: postgres:alpine
### Uncomment to enable DB persistance
- #    volumes:
- #      - ./postgres:/var/lib/postgresql/data
+     volumes:
+       - ./postgres:/var/lib/postgresql/data

  redis:
    restart: always
    image: redis:alpine
### Uncomment to enable REDIS persistance
- #    volumes:
- #      - ./redis:/data
+     volumes:
+       - ./redis:/data

  web:
    restart: always
    build: .
    image: gargron/mastodon
    env_file: .env.production
    command: bundle exec rails s -p 3000 -b '0.0.0.0'
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    volumes:
      - ./public/assets:/mastodon/public/assets
      - ./public/system:/mastodon/public/system

  streaming:
    restart: always
    build: .
    image: gargron/mastodon
    env_file: .env.production
    command: npm run start
    ports:
      - "4000:4000"
    depends_on:
      - db
      - redis

  sidekiq:
    restart: always
    build: .
    image: gargron/mastodon
    env_file: .env.production
    command: bundle exec sidekiq -q default -q mailers -q pull -q push
    depends_on:
      - db
      - redis
    volumes:
      - ./public/system:/mastodon/public/system
```

パウンド記号を削除するだけで OK です。編集したら保存してエディタを閉じます。

### 今後マストドンをアップデートする際の注意点
`docker-compose.yml` を編集したことにより、Git で管理されていないファイルの差分が発生します。この状態だと、マストドンのアップデートをする際に、エラーが発生してしまうので、アップデート前に上記の変更をスタッシュに退避する必要があります。詳細は「[Docker を利用したマストドンのアップデートメモ](http://qiita.com/noraworld/items/54216d13332f9ecb2846)」を参考にしてください。

マストドンをアップデートする際に注意すべきことなので、現時点ではとりあえず無視して進めていただいて構いません。

## ビルド、マイグレーション、プリコンパイル、デプロイ
ここまで来たら後はお決まりの作業です。ビルドして、マイグレーションを実行して、プリコンパイルして、コンテナを起動させましょう。

```bash
$ sudo docker-compose build
$ sudo docker-compose run --rm web rails db:migrate
$ sudo docker-compose run --rm web rails assets:precompile
$ sudo docker-compose up -d
```

コンテナ起動後、ブラウザからマストドンにアクセスして、コンテナを停止させる前のデータがちゃんと残っていれば、無事復旧完了です。お疲れさまでした！

ちなみに起動直後にアクセスすると 500 Server Error が表示されることがあります。数秒間待ってからアクセスしてみましょう。

### ビルドでエラーが発生する場合
僕が本番環境で試したときは、なぜかビルドでエラーが発生しました。エラー内容は、Postgres で使用するポートが空いていないといったものでした。

なぜこのようなエラーが発生したのかはわかりませんが、僕の場合はコンテナをもう一度削除して再びビルドしたら問題なく通りました。

このような原因不明のエラーが発生した場合は、コンテナの削除をもう一度行って、再度ビルドをしてみてください。何度もしつこいように言いますが、コンテナを削除する際はバックアップがきちんと取れていることを確認してから行ってください。

# データの永続化の確認
バックアップが取れていることは、起動後にデータが消えていないことを確認すれば良いですが、データの永続化が正しくされているかどうかは、現時点ではいまいちよくわかりません。なので、データの永続化がされているかどうか確認してみましょう。

```bash
$ sudo docker inspect mastodon_db_1
$ sudo docker inspect mastodon_redis_1
```

上記コマンドを実行すると長い JSON が返ってきます。この JSON から "Mounts" と書かれた箇所を探してください。

```json:mastodon_db_1
[
    {

    ...省略...

        "Mounts": [
            {
                "Type": "bind",
                "Source": "/path/to/mastodon/postgres",
                "Destination": "/var/lib/postgresql/data",
                "Mode": "rw",
                "RW": true,
                "Propagation": ""
            }
        ],

    ...省略...

    }
]
```

```json:mastodon_redis_1
[
    {

    ...省略...

        "Mounts": [
            {
                "Type": "bind",
                "Source": "/path/to/mastodon/redis",
                "Destination": "/data",
                "Mode": "rw",
                "RW": true,
                "Propagation": ""
            }
        ],

    ...省略...

    }
]
```

`"Mounts"` 内の `"Source"` の箇所が、`"/path/to/mastodon/postgres"` や `"/path/to/mastodon/redis"` のように、所定の位置に配置したバックアップファイルのパスになっていればデータの永続化がされています！

ちなみに、データの永続化がされていないと、`/var/lib/docker/volumes/ff775cbad97baf566614/_data` のような形式になっています。

Docker のデータボリュームの調べ方に関しては「[Docker: データボリュームとデータボリュームコンテナ](http://blog.amedama.jp/entry/2016/02/18/011125)」を参考にしました。

# アドバイス
この作業は、データの削除を伴うため、一歩間違えるとユーザのデータを消し飛ばしかねません。どうしても不安な場合は、本番環境のバックアップをローカルにダウンロードしてきて、開発環境でそのデータを使って起動してみることをおすすめします。

正しくバックアップが取れていれば、ユーザ、トゥート等のデータがすべて再現されていることを確認できるはずです。

画像やコンパイル済みファイルに関してはデフォルトの設定でデータの永続化がされているので確認する必要はないかもしれませんが、もし確認したい場合は、バックアップの作業で取った `~/mastodon_backup/web_assets` と `~/mastodon_backup/web_system` をそれぞれ、`path/to/mastodon/public/assets` と `path/to/mastodon/public/system` に配置すれば OK です。

ただし、画像に関しては他のインスタンスから取得したキャッシュも含まれるため、場合によっては 5GB 以上あるかもしれません。それをサーバからローカルにダウンロードするのはかなりの時間がかかるので、おすすめはしません。

繰り返しになりますが、画像やコンパイル済みファイルはデフォルトでデータの永続化がされているので、`path/to/mastodon/public/assets` と `path/to/mastodon/public/system` にそれぞれコンパイル済みファイル、画像ファイルが置かれていることを確認できればそれで大丈夫です。デフォルトの設定でデータの永続化がされていないのは、`postgres` と `redis` の 2 つです。

# あわせて読みたい

* [Docker を利用したマストドンのアップデートメモ](http://qiita.com/noraworld/items/54216d13332f9ecb2846)
* [マストドン運営に必要なデイリータスクとキャッシュ削除タスクを cron ジョブに登録する](http://qiita.com/noraworld/items/9c1be562a717141b5c14)
