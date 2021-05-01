---
title: "Qiita に投稿する技術記事を GitHub で管理する方法"
emoji: "📑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHub", "Qiita", "Webhook"]
published: true
order: 86
layout: article
---

# はじめに
エンジニアのための技術記事共有サイトとして、Qiita は日本ではかなり有名なサービスです。

ご多分に漏れず、ぼく自身も Qiita を愛用しており、初投稿から 5 年が経過した[^1]わけですが、技術記事のオリジナルデータは Git / GitHub で管理したいと思いました。

[^1]: Qiita への初投稿は 2016 年 2 月 16 日で、この記事の執筆日は 2021 年 3 月 7 日。

Git / GitHub で技術記事を管理するメリットとしては以下のとおりです。

* 編集履歴をコマンドラインで見ることができる
* 好みのエディタで技術記事を執筆することができる
* Qiita のサーバがダウンしているかどうかを気にすることなく技術記事を書き始めることができる

そこで今回は、GitHub に技術記事を管理するリポジトリを作って、そのリポジトリに push したら自動的に Qiita に投稿する方法について紹介します。

# 仕組み
以下の 3 つを使用します。

* GitHub Webhook
* GitHub API v3
* Qiita API v2

主な流れとしては下記のとおりです。

1. GitHub リポジトリに技術記事を push する
2. GitHub Webhook の設定であらかじめ登録しておいた URL 宛に、GitHub のサーバから push event が送られる
3. GitHub API を使って、新しく追加または編集されたファイル (技術記事) を取得する
4. Qiita API を使用して、追加または編集されたファイル (技術記事) を Qiita に投稿する

# 必要なもの
* インターネットに常時接続し、常時稼働している Linux サーバ

この記事で紹介するツールを実運用するには、サーバが必要になります。とりあえずどんな感じで動作するのか確認するだけなら手元の PC でも問題ありません。

# セットアップ
以下の作業の中のコマンドはすべて、稼働しているサーバ内で実行します。

## ツールをダウンロードする
「GitHub リポジトリに push されたら Qiita に投稿する」というのを実現するツールをダウンロードします。

```shell
$ git clone https://github.com/noraworld/github-to-qiita.git
```

https://github.com/noraworld/github-to-qiita

## GitHub リポジトリを作成する
技術記事を管理する GitHub リポジトリを、以下の URL から作成します。

https://github.com/new

## GitHub Webhook を設定する
`https://github.com/<GITHUB_USERNAME>/<GITHUB_REPOSITORY>/settings/hooks/new` にアクセスします。

| 変数 | 説明 |
|---|---|
| `<GITHUB_USERNAME>` | あなたの GitHub のユーザ名 |
| `<GITHUB_REPOSITORY>` | 先ほど作成した GitHub リポジトリ名 |

アクセスしたページに、必要な情報を入力します。

| 項目 | 説明 | 例 | 備考 |
|---|---|---|---|
| Payload URL | GitHub Webhook を受け取る URL | `https://example.com/payload` | パスは `/payload` としてください |
| Content Type | `application/x-www-form-urlencoded` を選択 | | |
| Secret | 暗号論的に安全な文字列 | `35517d2a37e38bf9c8b5ac2f24fe34fb8e2b1510` | この値は他の人に知られてはいけません |
| SSL verification | `Enable SSL verification` を選択 | | |
| Which events would you like to trigger this webhook? | `Just the push event.` を選択 | | |
| Active | チェックを入れる | | |

`Secret` の部分は、以下のコマンドを実行した結果を貼り付けてください。

```shell
$ ruby -rsecurerandom -e 'puts SecureRandom.hex(20)'
```

必要事項を入力したら、ページ下部の `Add webhook` をクリックして Webhook を登録します。

## GitHub personal access token を生成する
以下の URL にアクセスします。

https://github.com/settings/tokens/new

アクセスしたページに、必要な情報を入力します。

| 項目 | 説明 | 例 | 備考 |
|---|---|---|---|
| Note | アクセストークンの名称 | `GitHub to Qiita` | |
| Select scopes | `repo` にチェック | | |

必要事項を入力したら、ページ下部の `Generate token` をクリックしてアクセストークンを生成します。

その後、アクセストークンが **1 度だけ表示される** ので、コピーしてローカルのどこかに一時的にメモしておきます。

**このトークンは他の人に知られないように注意してください**。

また、アクセストークンを忘れてしまった場合や、他人に知られてしまった場合は、同じ手順を踏んで新しく作り直してください。

## Qiita 個人用アクセストークンを生成する
以下の URL にアクセスします。

https://qiita.com/settings/tokens/new

アクセスしたページに、必要な情報を入力します。

| 項目 | 説明 | 例 | 備考 |
|---|---|---|---|
| アクセストークンの説明 | アクセストークンの名称 | `GitHub to Qiita` | |
| スコープ | `read_qiita` と `write_qiita` にチェック | | |

必要事項を入力したら、ページ下部の `発行する` をクリックしてアクセストークンを生成します。

その後、アクセストークンが **1 度だけ表示される** ので、コピーしてローカルのどこかに一時的にメモしておきます。

**このトークンは他の人に知られないように注意してください**。

また、アクセストークンを忘れてしまった場合や、他人に知られてしまった場合は、同じ手順を踏んで新しく作り直してください。

## 環境変数を設定する
「[ツールをダウンロードする](#ツールをダウンロードする)」でダウンロードしたディレクトリに移動します。

```shell
$ cd github-to-qiita
```

そのディレクトリ内の `.env` ファイルを開き、必要な環境変数を設定します。

| 環境変数 | 説明 | 例 | 備考 |
|---|---|---|---|
| `GITHUB_REPOS` | GitHub のユーザ名と作成したリポジトリ名をスラッシュ区切りで連結した文字列 | `noraworld/developers-blog-content` | |
| `INCLUDED_DIR` | この環境変数で指定したディレクトリ内のファイルのみが対象となる | `articles` | 末尾にスラッシュは不要です |
| `QIITA_ACCESS_TOKEN` | 先ほど生成した Qiita 個人用アクセストークン | `777fb820e25847dd659266a66dcdd99580b4b85f` | この値は他の人に知られてはいけません |
| `GITHUB_WEBHOOK_SECRET_TOKEN` | GitHub Webhook を設定する際に `Secret` の項目に入力した、暗号論的に安全な文字列 | `35517d2a37e38bf9c8b5ac2f24fe34fb8e2b1510` | この値は他の人に知られてはいけません |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | 先ほど生成した GitHub personal access token | `d77af6cff2dd13f58886f6eff890eea93e53bdc9` | この値は他の人に知られてはいけません |

### `INCLUDED_DIR` について補足説明
技術記事を管理するリポジトリ内に `articles` というディレクトリを作り、このディレクトリ内に技術記事を作成する場合は `INCLUDED_DIR` に `articles` を指定します。

GitHub リポジトリに変更が push された際、`INCLUDED_DIR` で指定されたディレクトリ内のファイルの変更のみ監視されます。それ以外の変更、たとえば `README.md` を作成したり編集したりした場合などは無視します。

## デーモンファイルを生成
`/etc/systemd/system/github-to-qiita.service` ファイルを新規作成し、以下の内容を記入して保存します。

```conf:/etc/systemd/system/github-to-qiita.service
[Unit]
Description=github-to-qiita
After=network.target

[Service]
Type=simple
User=<LINUX_USERNAME>
EnvironmentFile=/etc/sysconfig/<LINUX_USERNAME>
WorkingDirectory=/path/to/github-to-qiita
ExecStart=/usr/bin/env ruby main.rb -p 4567 -e production
TimeoutSec=15
Restart=always

[Install]
WantedBy=multi-user.target
```

`<LINUX_USERNAME>` はサーバに存在するユーザのユーザ名を指定します。現在ログイン中のユーザで良い場合は `whoami` コマンドを実行すればユーザ名がわかります。

`WorkingDirectory` にはツールをダウンロードしたパスを指定します。

このツールを稼働させる際のポート番号は `4567` としていますが、他のポート番号にする必要がある場合は適宜書き換えてください。

## Web サーバの設定ファイルを編集
「[GitHub Webhook を設定する](#github-webhook-を設定する)」で設定した `Payload URL` を、実際にインターネット上で公開できるように Nginx / Apache などの設定を編集します。

また、HTTPS で受け付けるため、Let’s Encrypt などを利用して HTTPS 対応します。

Nginx & Let’s Encrypt で SSL 証明書を発行してもらう方法については以下を参考にしてください。

https://ja.developers.noraworld.blog/auto-renew-letsencrypt-for-nginx-reverse-proxies

## Ruby と RubyGems のインストール
ツールがあるディレクトリで以下のコマンドを実行します。

なお、rbenv のインストールについては以下を参考にしてください。

https://ja.developers.noraworld.blog/ruby-and-rails-installation-guide

```shell
$ rbenv install $(cat .ruby-version)
$ bundle install
```

## デーモンの起動
以下のコマンドを実行します。

```shell
$ sudo systemctl start github-to-qiita
```

数秒後、以下のコマンドで問題なく起動していることを確認します。

```shell
$ systemctl status github-to-qiita
```

## GitHub Webhook の ping event を成功させる
「[GitHub Webhook を設定する](#github-webhook-を設定する)」で GitHub Webhook を最初に登録した直後に、おそらく GitHub サーバから ping event が `Payload URL` 宛に飛んでいると思います。

しかし、その時点ではまだ `Payload URL` で待ち受けていなかったはずなので、delivery (ping event) が失敗していると思います。

なので、再送要求を送り、ping event を成功させます。

1. `https://github.com/<GITHUB_USERNAME>/<GITHUB_REPOSITORY>/settings/hooks` にアクセスします
2. 作成した GitHub Webhook をクリックして詳細・編集ページにアクセスします
3. ページ下部に `Recent Deliveries` という項目があるので、失敗している (⚠️ マークがついている) delivery をクリックして展開します
4. `Redeliver` ボタンをクリックします
5. `Yes, redeliver this payload` ボタンをクリックします
6. ページをリロードします

一番上に追加された delivery のステータスが成功していたら (⚠️ マークではなく、✅ マークがついていたら) OK です。

---

これでセットアップは完了です。

# 技術記事をローカルで執筆して投稿してみる
これで技術記事を GitHub リポジトリに push すると自動的に Qiita に投稿されるようになっているはずです。試しに何か記事を投稿してみましょう。

環境変数 `INCLUDED_DIR` で設定したディレクトリ以下 (例だと `articles` 以下) にファイルを追加します。ファイル名は任意で、拡張子は `.md` とします。

## 形式
基本的にマークダウンで記述すれば良いのですが、記事のタイトルやタグなどは YAML ヘッダに記述します。

以下は例です。

```markdown
---
title: "記事のタイトル"
topics: ["tag1", "tag2", "tag3"]
published: true
---

ここから技術記事を書き始めます。
```

`---` で囲まれた中身が YAML ヘッダです。注意点として、始まりの `---` は必ずファイルの 1 行目に記述してください。1 行目に空行を入れたりしてはいけません。

| 項目 | 説明 | 型 | 備考 |
|---|---|---|---|
| `title` | 記事のタイトル | 文字列 | |
| `topics` | 記事のタグ | 配列 | タグの数は 1 〜 5 個にします |
| `published` | 公開有無 | 真偽値 | `false` にすると [限定共有記事](https://help.qiita.com/ja/articles/qiita-private-article) になります |

ちなみに、上記の 3 つの項目は必須なのですが、これ以外にメモ的な感じで項目を追加することができます。

たとえば、ぼくは記事の投稿順序を GitHub 上でもわかるようにするために `order` という項目を追加するようにしています。

## 投稿
記事が書けたら `git add` して `git commit` して `git push` すると Qiita に自動的に投稿されるはずです。

もし投稿に失敗していた場合は、GitHub Webhook の設定ページの `Recent Deliveries` や、ツールを稼働させているサーバのログ (`/path/to/github-to-qiita/logs` ディレクトリ内) を確認してみてください。

当たり前なのですが、`git push` したタイミングで、GitHub API のサーバや Qiita API のサーバがダウンしていた場合は失敗します。その場合は API サーバ復帰後に `Redeliver` ボタンを押して再送要求を送ってみてください。

## 注意点
以下、記事を投稿する際の注意点です。

### Qiita の編集履歴のメッセージを記入することはできない
Qiita 上で、投稿した記事を編集する際に、どんな編集をしたのかを示すメッセージをつけることができます。いわゆる Git のコミットメッセージと同じものです。

`https://qiita.com/<QIITA_USERNAME>/items/<QIITA_ITEM_ID>/revisions/<REVISION_NUMBER>` で確認できます。

例: https://qiita.com/noraworld/items/79100783ba95d8c48924/revisions/1

ところが、このツールを使用して Qiita API 経由で記事を編集した場合は編集履歴を記入することはできません。編集履歴のメッセージは常に「コメントなし」となります。

現在の Qiita API v2 の仕様では残念ながら記事を編集する際にメッセージを付けることができません。

### 一度投稿された記事は自動的には削除されない
このツールを使用して Qiita に記事が投稿されたとします。そしてその後、GitHub 上から該当するファイル (記事) を削除しても、Qiita 上では削除されない仕様になっています。

削除機能は、今後、実装するかもしれませんが、記事を削除する機会がほとんどないため可能性は薄いです。

もし Qiita からも記事を削除したい場合は、Qiita の削除したい記事のページにアクセスして直接削除してください。

### 記事の追加・編集をトラッキングするのはデフォルトブランチのみ
デフォルトブランチが `master` に設定されていた場合は、リモートリポジトリの `master` への push のみ適用されます。別のブランチに push した変更に関してはトラッキングされません。

### Qiita アカウントと Twitter アカウントを連携している場合は Twitter に自動投稿される
Qiita アカウントと Twitter アカウントを連携させている場合は、新しい記事を投稿した際に自動的に Twitter に共有されます。

投稿済みの記事を編集した場合や、Twitter とアカウント連携していない場合は共有されません。

これは今後、環境変数で変更可能にする予定です。

### 新しい記事を push 直後、マッピングファイルが自動的に追加・更新される
環境変数 `INCLUDED_DIR` で設定したディレクトリ以下に新規ファイル (記事) を追加して push すると、その後すぐ、同リポジトリに自動的にマッピングファイルが追加または更新されます。

このマッピングファイルは、リポジトリ上のファイル名と、Qiita の item id (URL の一部になっている記事の ID、この記事だと `79100783ba95d8c48924` がそれに該当する) とを対応付けるファイルです。

このファイルがないと、リポジトリ上にすでに存在する記事を更新した際に、どの Qiita 記事を更新すれば良いのかわからなくなってしまいます。

そのため、新しい記事を追加して `git push` したら、その後、数十秒ほど待ってから `git pull` することをおすすめします。すでにある記事を編集する場合は不要です。

なお、マッピングファイルのファイル名は環境変数 (`.env`) で変更可能です。

# 機能追加要求・バグ報告
https://github.com/noraworld/github-to-qiita/issues

とりあえず動くように作ったのであまりコードはきれいではありません……。

# さいごに
GitHub リポジトリに技術記事を push したら自動的に Qiita に投稿する方法について紹介しました。

この記事の説明では、あたかもツールが正常に動くこと前提で書いていますが、実は本番でこのツールを試すのは、この記事が最初です……！

~~もしかしたら正常に動かないかもしれません。そのときはバグ修正してからもう一度チャレンジします。~~ 何の問題もなく正常に投稿できました！🎉
