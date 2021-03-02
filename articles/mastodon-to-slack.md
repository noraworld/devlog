---
title: "Mastodon のトゥート (発言) を Slack に流す方法"
emoji: "🐙"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "Slack"]
published: false
order: 56
---

<img width="658" alt="mastodon_to_slack.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/f5f99674-e266-0e12-2f0b-fc5a93bd6a9b.png">

こんな感じで Mastodon のトゥートを Slack に流すことができます。

# はじめに
この方法で常に Mastodon のトゥートを Slack に流すようにするためには、**Ruby が実行できるサーバが必要** です。サーバがなくても、ローカルで試すことはできます。

# Twitter はあるが Mastodon はない
Twitter のツイートを Slack に流す手段は、すでに Slack 側が提供しています。そしてその設定方法はすでにインターネット上のたくさんの記事で紹介されています。

- [Twitter と Slack を連携させる](https://get.slack.help/hc/ja/articles/205346227-Twitter-%E3%81%A8-Slack-%E3%82%92%E9%80%A3%E6%90%BA%E3%81%95%E3%81%9B%E3%82%8B)
- [SlackとTwitterを連携してみた](https://qiita.com/YuukiOgino/items/54f427544fe2fa304a80)

しかし、Mastodon のトゥート (Twitter でいうツイート) を Slack に流す方法は提供されていません。この記事では、Mastodon のトゥートを Slack に流す方法について紹介します。

# アクセストークンを取得
以下の手順に沿って Mastodon のアクセストークンを取得します。

## アプリケーション作成ページにアクセス
`https://<YOUR_MASTODON_INSTANCE_HOST>/settings/applications/new` にアクセスします。`<YOUR_MASTODON_INSTANCE_HOST>` には自分のアカウントがある Mastodon のインスタンスのホスト名を入力します。

## アプリケーションの作成
以下のスクリーンショットとテーブルに従ってアプリケーションを作成します。

![new_application.png](https://qiita-image-store.s3.amazonaws.com/0/113895/e0cf5ab9-632e-1a0e-02ef-954c1ab2a62b.png)

| 項目 | 値 |
|:---:|:---:|
| アプリの名前 | なんでもいいです |
| アプリのウェブサイト | なんでもいいです |
| リダイレクトURI | `urn:ietf:wg:oauth:2.0:oob` (デフォルト値のまま) |
| アクセス権 | `read` にだけチェック |

必要項目を入力したら「送信」ボタンをクリックしてアプリケーションを作成します。

## アクセストークンをコピー
遷移したページにアクセストークンが書かれているので、それをコピーしてメモしておきます。

# 着信 Web フックの作成
Slack に post するための着信 Web フックを作成します。

## Slack App ディレクトリにアクセス
[このリンク](https://slack.com/apps) から Slack App ディレクトリにアクセスします。

## Incoming WebHooks を検索
Slack App ディレクトリの検索フィールドに `Incoming WebHooks` と入力して着信 Web フックを選択します。

## 着信 Web フックをチャンネルに追加
着信 Web フックのページから「設定を追加」ボタンをクリックします。

続いて表示されるページで、Mastodon のトゥートを流したい Slack のチャンネルをセレクトボックスから選択し、「着信 Web フック インテグレーションの追加」ボタンをクリックします。

## Web フック URL をコピー
遷移したページに Webhook URL が書かれているので、それをコピーしてメモしておきます。

## 着信 Web フックの設定の変更 (任意)
※ これは任意であるため必ず設定する必要はありません。設定はいつでも変更可能なため、とりあえず試験的に動かしたいだけの場合はやらなくても良いです。

「インテグレーションの設定」の項目にある「説明ラベル」「名前をカスタマイズ」「アイコンをカスタマイズする」をお好みの設定に変更します。一例として、以下のスクリーンショットのようになっているとわかりやすいでしょう。

<img width="970" alt="integration_preview.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/8088d0f2-7112-ef2e-477d-6d23a93c360b.png">

# Mastodon-to-Slack の設定
Mastodon のトゥートを検知し、Slack に流すためのツールの設定を行います。

## Mastodon-to-Slack をダウンロード
```
$ git clone git@github.com:noraworld/mastodon-to-slack.git
$ cd mastodon-to-slack
```

## ライブラリのインストール
```
$ bundle install
```

## 環境変数の設定
環境変数を設定します。サンプルファイルがあるのでそれをコピーして `.env` とします。

```
$ cp .env.sample .env
```

設定ファイルは以下のようになっています。

```
MASTODON_INSTANCE_HOST=''
MASTODON_USERNAME=''
MASTODON_ACCESS_TOKEN=''
SLACK_WEBHOOK_URI=''
```

以下のテーブルに従って環境変数を設定していきます。

| 環境変数 | 値 |
|---|---|
| MASTODON_INSTANCE_HOST | 自分のアカウントがある Mastodon のインスタンスのホスト名 |
| MASTODON_USERNAME | 自分のアカウントのユーザ名 (表示名ではない) |
| MASTODON_ACCESS_TOKEN | 先ほどメモした Mastodon のアクセストークン |
| SLACK_WEBHOOK_URI | 先ほどメモした Slack の Web フック URL |

### 注意点
`MASTODON_INSTANCE_HOST` には `https://` や最後のスラッシュをつけてはいけません。

```
# NG
MASTODON_INSTANCE_HOST='https://mastodon.social'
MASTODON_INSTANCE_HOST='mastodon.social/'

# OK
MASTODON_INSTANCE_HOST='mastodon.social'
```

`MASTODON_USERNAME` には `@` やホスト名を含めてはいけません。

```
# NG
MASTODON_USERNAME='@noraworld'
MASTODON_USERNAME='noraworld@mastodon.social'
MASTODON_USERNAME='@noraworld@mastodon.social'

# OK
MASTODON_USERNAME='noraworld'
```

# サーバを起動
サーバを起動します。起動方法はとてもシンプルです。

```
$ ruby src/mastodon_to_slack.rb
```

試しに何かをトゥートしてみましょう。すると、設定した Slack チャンネルでそのトゥートが流れてくるでしょう。

### 注意点
サーバを起動するときには、プロジェクトルートディレクトリからパスを指定する必要があります。

```
# NG
$ cd src
$ ruby mastodon_to_slack.rb

# OK
$ ruby src/mastodon_to_slack.rb
```

### 終了させる方法
`Ctrl+C` を押します。

# デーモン化
上記の方法でサーバを起動させることができますが、常時稼働させておくためにはデーモン化する必要があります。Linux サーバがあれば、以下の方法で常時稼働させることができます。

## システムファイルの追加
常時稼働させるためのシステムファイルを設定します。`/etc/systemd/system/mastodon-to-slack.service` を生成し以下の内容を書き込みます。なお、このファイルに書き込むには root 権限が必要です。

```/etc/systemd/system/mastodon-to-slack.service
[Unit]
Description=mastodon-to-slack
After=network.target

[Service]
Type=simple
User=<USERNAME>
WorkingDirectory=/path/to/mastodon-to-slack
ExecStart=/bin/bash -lc 'ruby src/mastodon_to_slack.rb'
TimeoutSec=15
Restart=always

[Install]
WantedBy=multi-user.target
```

### User
`User` の `<USERNAME>` には、このスクリプトを実行するユーザのユーザ名を入力します。

### WorkingDirectory
`WorkingDirectory` の `/path/to/mastodon-to-slack` は Mastodon-to-Slack をダウンロードしたディレクトリのパスを指定します。

## 自動起動オプションを有効化
サーバが何らかの理由で再起動したときに、このデーモンも自動で起動するように設定を加えます。

```
$ sudo systemctl enable mastodon-to-slack
```

設定が有効になっていることを確認するには以下のコマンドを実行します。

```
$ systemctl is-enabled mastodon-to-slack
enabled
```

## デーモンを起動
以下のコマンドでデーモンを起動します。

```
$ sudo systemctl start mastodon-to-slack
```

正しく起動していることを確認するには以下のコマンドを実行します。

```
$ systemctl status mastodon-to-slack
```

`Active: active (running)` となっていれば正しく起動しています。試しに何かトゥートして問題なく動作していることを確認してみましょう。

# ブーストは流れない点に注意
このツールを使用すれば Mastodon の自分のつぶやきをリアルタイムで Slack に流すことができますが、**自分がブーストしたトゥートは流れない** ことに注意してください。

## 技術的な話 (興味がある人向け)
ここから先はツールを使用する側ではなく実装する側の立場になって説明します。よくわからなければ無視して構いません。

Mastodon は、すでにタイムラインに流れてきているトゥートをブーストしても新しく流れてくることはありません。そして、このツール Mastodon-to-Slack は Streaming API を使用してトゥートを取得する実装になっています。つまり自分がブーストしたトゥートを完全に検知することができないのです。

[app/lib/feed_manager.rb:56-79 · tootsuite/mastodon](https://github.com/tootsuite/mastodon/blob/47bca3394590b59fb818d16bc05b9ad08cdc64dd/app/lib/feed_manager.rb#L56-L79)

もちろん、ブーストしたトゥートが、監視しているタイムラインにまだ流れていなかった場合はブーストしたトゥートも拾うことができます。たとえば、ホームタイムラインを監視していたとして、まだホームタイムラインに流れていないトゥートをブーストした場合は、そのトゥートがホームタイムラインに新たに追加されるため、ブーストしたトゥートを取得することが可能です。

しかし、タイムラインにすでに流れてきているかどうかで、ブーストしたトゥートが取得できたりできなかったりするのは実装としてイマイチだと判断したため、ブーストは検知しない仕様にしました。

Streaming API を使わずに、定期的に自分のトゥートをポーリングする方法もありますが、以下の難点が挙げられます。

- 前回どこまでポーリングしたかを記録しておく必要がある
- 前回 Slack に流した最後のトゥートを削除していた場合、「前回どこまでポーリングしたか」の記録が機能しなくなってしまうため、そうならないような実装にする必要がある
- ポーリングであるため、リアルタイムで Slack に流すことができない

以上の理由からポーリングを諦め、ブーストを検知しない妥協案として現在の実装になっています。

もしストリーミングで、ブーストしたすべてのトゥートまで検知できる実装を見つけた方はぜひ PR をお待ちしております。「Mastodon サーバ側の実装に手を加える」以外の方法でお願いしますｗ

[noraworld/mastodon-to-slack](https://github.com/noraworld/mastodon-to-slack)
