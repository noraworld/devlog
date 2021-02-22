---
title: "ナウマンを Docker で立ち上げてデプロイするまで"
emoji: "🐘"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "マストドン", "naumanni", "ナウマン"]
published: true
order: 36
---

# はじめに
Web 版マストドンクライアントとして登場した[ナウマン](https://naumanni.com)は誰でも簡単にサーバにデプロイすることができます。実際に立ててみたところ非常に簡単に構築できましたが、ところどころつまづくポイントがあったのでメモとしてデプロイまでの作業をまとめたいと思います。

Docker で立ち上げた理由ですが、はじめは Docker なしでビルドして Nginx で配信してみましたが、不具合なのか、僕の設定に不備があったのかわかりませんが、はじめのウェルカム画面（`/welcome`）が表示されない（ルーティング的にエラーになってしまう）現象が発生したので、Docker で立ち上げることにしました。ウェルカム画面が表示されなくても支障はなさそうですがなんとなく嫌だなというのと、結局 Docker で立ち上げるのが一番お手軽なので Docker で紹介します。

# デモ
デプロイするとこんな感じのサイトが立ち上がります。

[naumanni.mastodon.noraworld.jp](https://naumanni.mastodon.noraworld.jp)

自分のサーバにデプロイする前にどんな感じになるのか確認したい方は参考にしてください。

ちなみにナウマンは、マストドンの API を叩いてタイムライン等を取得するので、**そのサーバで起動しているマストドンとは別のインスタンスのアカウントも利用できます**。そのサーバでマストドンを運営してなくても他のインスタンスにアカウントがあれば使えます。

# インストール
ソースコードを GitHub からクローンして Docker コンテナを立ち上げます。

```bash
$ git clone https://github.com/naumanni/naumanni
$ cd naumanni
$ docker pull naumanni/naumanni-standalone
$ docker run -dit -p 127.0.0.1:8080:80 naumanni/naumanni-standalone
```

公式の README を見ると Docker コンテナを立ち上げるときに `-d` オプションをつけていない（2017/06/05 現在）ので標準入力を Docker に持って行かれてしまうのと、`8080` ポートで外からアクセスされる可能性があるので、README の例とは少し違います。

これですでにナウマンが起動しています。ナウマンを起動したのと同じサーバで `curl 127.0.0.1:8080` を実行してナウマンのフロントの HTML が返ってくれば OK です。

ちなみにすでに `8080` ポートを別のアプリケーションで使用していた場合は `docker run` するときの Docker 側のポート番号（`8080`）を変更してください。

:warning: 2017/06/05 現在リリースされているタグは `0.1.1` と `alpha-0.1.2` の 2 つですが、どちらも `openpgp.worker.js` が生成されないバグが修正される前のリリースなので、デプロイするとしたら、バグが修正された直後の状態か、`master` の最新版を使用してください。上記の例では `master` の最新版を使用しています。

[openpgp.worker.js が生成されてない。](https://github.com/naumanni/naumanni/issues/19)

# デプロイ
Nginx を使ってデプロイします。以下の設定を Nginx の設定ファイルに追加します。

```nginx
server {
    listen       80;
    server_name  ナウマンで使用するドメイン;

    charset    utf-8;
    try_files  $uri/index.html $uri;

    location / {
        proxy_set_header  Host $http_host;
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  X-Forwarded-Proto $scheme;
        proxy_pass        http://127.0.0.1:8080;
    }

    client_max_body_size  100m;

    error_page  404          /static/error/notfound.html;
    error_page  503          /static/error/maintenance.html;
    error_page  504          /static/error/delay.html;
    error_page  403          /static/error/forbidden.html;
    error_page  500 501 502  /static/error/error.html;
}
```

必要最小限の部分だけを載せています。ログや SSL の設定等は、各々必要であれば追加してください。Docker を起動する際にポート番号を変更した場合は、`proxy_pass` のポート番号も変更するのを忘れずに。

設定ファイルにミスがないかチェックします。

```bash
$ sudo nginx -t
```

エラーがなければ Nginx を再起動します。

```bash
$ sudo nginx -s reload
```

`ナウマンで使用するドメイン` にアクセスしてナウマンのウェルカムページが表示されれば完了です。お疲れさまでした。
