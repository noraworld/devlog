---
title: "マストドン運営に必要なデイリータスクとキャッシュ削除タスクを cron ジョブに登録する"
emoji: "🐠"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "マストドン", "cron", "crontab"]
published: false
order: 35
---

# はじめに
マストドンを運営する上で非常に重要な購読処理の実行や不要な画像キャッシュを削除する作業を cron ジョブで自動的に実行する方法を紹介します。

:warning: この記事ではマストドンの構築に Docker を使用していることを前提としています。Docker を使用していない場合は[こちら](http://qiita.com/clworld/items/bc3d8f97d38f2ba58492#%E8%BF%BD%E8%A8%983-cron%E3%81%AF%E5%BF%85%E3%81%9A%E5%9B%9E%E3%81%9B%E7%B5%B6%E5%AF%BE%E5%9B%9E%E3%81%9Bdocker%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%A6%E3%81%A6%E3%82%82%E8%87%AA%E5%8B%95%E3%81%A7%E3%81%AF%E8%A8%AD%E5%AE%9A%E3%81%97%E3%81%A6%E3%81%8F%E3%82%8C%E3%81%AA%E3%81%84%E3%81%AE%E3%81%A7%E8%A8%AD%E5%AE%9A%E3%81%99%E3%81%B9%E3%81%97mastodon-132%E4%BB%A5%E4%B8%8B%E3%81%AE%E5%A0%B4%E5%90%88)を参考にして適宜ジョブの内容を読み替えてください。

# デイリータスクとは
マストドンは、相手のインスタンスにデータをプッシュするときに、相手のサーバがエラー系のステータスコードを返却すると、購読を解除する仕組みになっています。購読が解除されると、そのインスタンスに属するユーザがトゥートをしてもそれが自分のインスタンスに表示されなくなってしまいます。

それを解消するために購読が切れてしまったインスタンスを再購読するためのコマンド `mastodon:daily` が用意されています。これを定期的に実行することで特定のインスタンスのトゥートが表示されないという問題を解消できます。

一時的にメンテナンス等でサーバがダウンしていて、購読が切られてしまったインスタンスは基本的には相手のインスタンスが再購読を行ってくれるのを待つしかないです。なので「再購読のためのタスクを定期的に実行することはインスタンス管理者の義務である」と言及している人もいます。マストドン管理者全員が再購読のタスクを定期的に実行することが望ましいです。

購読に関する詳細な仕組みや現象については「[Mastodon でリモートインスタンスから自分のトゥートがみえなくなることがある](http://cryks.hateblo.jp/entry/2017/04/18/125351)」を参考にしてください。

# キャッシュ削除タスクとは
マストドンは、他のインスタンスの画像を含むトゥートが自分のインスタンス（の連合タイムライン）に流れてくると、その画像のキャッシュをサーバに保存します。

つまり、何もせずに放置しているとサーバのディスクが他のインスタンスの画像ファイルで溢れかえってしまいます。僕自身もそれを知らずにマストドンを運営していたら、他のインスタンスの画像のキャッシュが、最大で 5GB 以上たまってしまいました。

この問題を解消するために、マストドンでは 1 週間以上前の他のインスタンスの画像キャッシュをまとめて削除する `mastodon:media:remove_remote` タスクが用意されています。これを定期的に実行することでサーバのディスクが、不要な画像ファイルで溢れかえるのを防ぐことができます。

これらのタスクは、手動で実行することもできますが、定期的に実行するものなので、cron を使用して自動で実行させるのが一般的です。ただ単に cron を登録すれば良いのですが、ログを取ったりそのログを綺麗に整形したほうが良いと考え、僕が実際に登録している cron ジョブをここで紹介しようと思います。

# TL;DR
`~/.cron/root_cron.conf` を作成し、以下を書き込む

```bash:root_cron.conf
00 18 * * * echo "" >> /home/username/.log/mastodon/daily.log && cd /path/to/mastodon && date >> /home/username/.log/mastodon/daily.log && /usr/local/bin/docker-compose run --rm web rake mastodon:daily >> /home/username/.log/mastodon/daily.log 2>&1

30 18 * * 0 echo "" >> /home/username/.log/mastodon/remove_remote.log && cd /path/to/mastodon && date >> /home/username/.log/mastodon/remove_remote.log && /usr/local/bin/docker-compose run --rm web rake mastodon:media:remove_remote >> /home/username/.log/mastodon/remove_remote.log 2>&1
```

以下のコマンドを実行する

```bash
$ mkdir -p ~/.log/mastodon
$ touch ~/.log/mastodon/daily.log
$ touch ~/.log/mastodon/remove_remote.log
$ sudo crontab < root_cron.conf
$ sudo crontab -l
```

# ジョブの登録と確認
以下の手順に沿って説明します。

1. ジョブの内容をファイルに保存
2. ログファイルの生成
3. ジョブの登録
4. ジョブが自動実行されているか確認

## ジョブの内容をファイルに保存
cron にジョブを登録するには `crontab` コマンドを使用します。直接 `crontab` コマンドを実行して登録したいジョブを書き込んでも良いですが、コマンドを誤ってうっかり削除してしまうとリカバリーが面倒なので、ファイルに、登録するジョブを書き込んで、それを `crontab` で読み込ませるようにします。

まずは適当な場所に適当な名前でファイルを作成します。僕の場合はホームディレクトリ以下に `.cron` というディレクトリを作り、その中に `root_cron.conf` というファイル名で登録しています。拡張子は適当なので、好きにつけてください。つけなくても良いです。

作成したファイルに以下の内容を書き込みます。

```bash:root_cron.conf
00 18 * * * echo "" >> /home/username/.log/mastodon/daily.log && cd /path/to/mastodon && date >> /home/username/.log/mastodon/daily.log && /usr/local/bin/docker-compose run --rm web rake mastodon:daily >> /home/username/.log/mastodon/daily.log 2>&1

30 18 * * 0 echo "" >> /home/username/.log/mastodon/remove_remote.log && cd /path/to/mastodon && date >> /home/username/.log/mastodon/remove_remote.log && /usr/local/bin/docker-compose run --rm web rake mastodon:media:remove_remote >> /home/username/.log/mastodon/remove_remote.log 2>&1
```

`username` にはユーザ名、`/path/to/mastodon` にはマストドンがあるディレクトリの**絶対パス**を指定します。

## ログファイルの生成
上記の cron では、`~/.log/mastodon` 以下にある `daily.log` と `remove_remote.log` というファイルにそれぞれデイリータスクとキャッシュ削除タスクのログを書き込むようにしています。そのため `~/.log/mastodon` というディレクトリと `daily.log`, `remove_remote.log` ファイルを事前に作成しておきます。

```bash
$ mkdir -p ~/.log/mastodon
$ touch ~/.log/mastodon/daily.log
$ touch ~/.log/mastodon/remove_remote.log
```

保存するログの出力先を変更したい場合は、cron ジョブの、該当するリダイレクト先と、作成するディレクトリ、ファイルを読み替えてください。

## ジョブの登録
先ほどファイルに保存した cron ジョブの内容を cron を登録させます。

```bash
$ sudo crontab < root_cron.conf
```

ここで注意すべき点は、必ず **root で実行すること**（**`sudo` をつけること**）です。マストドンの環境を Docker コンテナ内に作っている場合は、タスクの実行（`docker-compose` コマンドの実行）に root 権限が必要になります。`sudo` をつけずに cron を登録してしまうと一般ユーザで登録され、cron ジョブの実行も一般ユーザとして実行されることになり、タスクの実行時に権限がないと怒られてしまいます。

root で cron ジョブが登録されたかどうかは以下のコマンドで確認できます。

```bash
$ sudo crontab -l
```

先ほどファイルに書き込んだ内容が登録されていれば OK です。

なお、今後登録するジョブを登録したり変更したりする場合は `root_cron.conf` を編集してから `crontab` コマンドを実行すれば良いです。

## ジョブが自動実行されているか確認
これで cron ジョブが自動実行されているはずです。上記のジョブは、毎日 18:00 にデイリータスクを実行し、毎週日曜日の 18:30 にキャッシュ削除タスクを実行します。

実行する日時を変更したい場合は `root_cron.conf` の `00 18 * * *` や `30 18 * * 0` の箇所を変更してください。数値の詳細に関しては「[crontabの書き方](http://www.server-memo.net/tips/crontab.html)」を参考にしてください。

ただし、デイリータスクはその名の通り、**1 日に 1 回**、キャッシュ削除タスクは、1 週間以上の前の画像キャッシュを削除するので **1 週間に 1 回**、実行するのが望ましいです。これ以上多くても 1 週間以内に保存されたキャッシュは削除されませんし、サーバの負荷も大きくなるのでおすすめしません。

`~/.log/mastodon` 以下の `daily.log` と `remove_remote.log` に以下のようなログが書き込まれていればタスクが正常に実行されています。

```:daily.log
Wed Apr 26 18:00:01 JST 2017
Scoped order and limit are ignored, it's forced to be batch order and batch size.

...省略...

Sat Apr 29 18:00:01 JST 2017
Scoped order and limit are ignored, it's forced to be batch order and batch size.
[paperclip] deleting /mastodon/public/system/media_attachments/files/000/002/692/original/3cb794783b704c96.png
[paperclip] deleting /mastodon/public/system/media_attachments/files/000/002/692/small/3cb794783b704c96.png

...省略...

Sat May  5 18:00:01 JST 2017
Starting mastodon:feeds:clear at 2017-05-06 09:00:06 UTC
Starting mastodon:media:clear at 2017-05-06 09:00:07 UTC
Scoped order and limit are ignored, it's forced to be batch order and batch size.
[paperclip] deleting /mastodon/public/system/media_attachments/files/000/004/650/original/d7d4c6d098ec93bc.jpeg
[paperclip] deleting /mastodon/public/system/media_attachments/files/000/004/650/small/d7d4c6d098ec93bc.jpeg
Starting mastodon:users:clear at 2017-05-06 09:00:07 UTC
Starting mastodon:push:refresh at 2017-05-06 09:00:07 UTC
Completed daily tasks at 2017-05-06 09:00:09 UTC

...省略...

Sun May  7 18:00:01 JST 2017
Starting mastodon:feeds:clear at 2017-05-07 09:00:07 UTC
Starting mastodon:media:clear at 2017-05-07 09:00:08 UTC
Scoped order and limit are ignored, it's forced to be batch order and batch size.
Starting mastodon:users:clear at 2017-05-07 09:00:08 UTC
Starting mastodon:push:refresh at 2017-05-07 09:00:08 UTC
Completed daily tasks at 2017-05-07 09:00:11 UTC

...省略...
```

```:remove_remote.log
Sun Apr 30 18:30:01 JST 2017
Scoped order and limit are ignored, it's forced to be batch order and batch size.
[paperclip] deleting /mastodon/public/system/media_attachments/files/000/000/010/original/6dfab2d9963d2811.mp4

...省略...

Sun May  7 18:30:01 JST 2017
Scoped order and limit are ignored, it's forced to be batch order and batch size.
[paperclip] deleting /mastodon/public/system/media_attachments/files/000/001/692/original/e185ed8b82d34407.jpeg

...省略...
```

### ログの内容が "command not found" の場合
ここで紹介したジョブは、`docker-compose` のインストール先を `/usr/local/bin/docker-compose` としています。`docker-compose` コマンドのインストール手順によっては別の場所にインストールされている可能性があります。`docker-compose` がどこにインストールされているかを以下のコマンドで確認して、異なっていた場合は、`docker-compose` のパスを変更してください。

```bash
$ which docker-compose
/usr/local/bin/docker-compose  # これじゃない場合は root_cron.conf の該当箇所を変更
```

# 参考サイト

* [小規模Mastodonインスタンスを運用するコツ](https://blog.potproject.net/archives/977)
* [Mastodonインスタンス立ち上げ後にやること](http://yukota.hatenablog.com/entry/2017/04/23/193822)
* [Mastodonのサーバ間通信が切れた場合のリカバリ](http://qiita.com/clworld/items/bc3d8f97d38f2ba58492)
