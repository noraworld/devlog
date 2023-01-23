---
title: "Nginx でリクエストごとに任意のコマンドを実行する"
emoji: "♻️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nginx", "openresty", "lua", "lua-module", "ngx_http_lua_module"]
published: true
---

# はじめに
自宅の Raspberry Pi で個人用の Web サーバを立てる機会がありました。リクエストの直前に任意のコマンドが実行できたら便利だなと思い調べてみたところ、[ngx_http_lua_module](https://github.com/openresty/lua-nginx-module) が使えそうだということがわかりました。

今回は例として、Nginx へのリクエストの直前に `git pull` を実行する方法について紹介します[^1]。もちろん任意のコマンドが実行可能なので、`git pull` 以外のコマンドを実行することもできます。

[^1]: これは、ローカルに立てた個人用の静的サイトにおいて、アクセスがあったらリポジトリを最新の状態にアップデートしてビルドする、というのを自動で行うことを想定しています。インターネット上に公開しているサーバでこれを行うと誰かがアクセスするたびに `git pull` してしまい GitHub などのサーバに負荷をかけてしまうのでご注意ください。あくまで非公開サーバでの用途を想定しています。



# OpenResty のインストール
使用する Web サーバは [Nginx](https://nginx.org) なのですが、Nginx ではなく [OpenResty](https://openresty.org/en/) をインストールします。OpenResty は Nginx に ngx_lua や LuaJIT などのモジュールを組み込んだ改良版のようなものです。そのため使い勝手は通常の Nginx とほぼ同じです。

今回は ngx_http_lua_module というモジュールを使用したいので OpenResty をインストールします。[公式の Nginx にこのモジュールを組み込むこともできますが、環境構築が大変なので非推奨とされています](https://github.com/openresty/lua-nginx-module/tree/1a485992435771f354c09330c2706d53c8d9cbf4#installation:~:text=It%20is%20discouraged%20to%20build%20this%20module%20with%20Nginx%20yourself%20since%20it%20is%20tricky%20to%20set%20up%20exactly%20right.)。

インストール手順については [OpenResty 公式のダウンロードページ](https://openresty.org/en/download.html) に、それぞれの OS やディストリビューション、アーキテクチャごとにわかりやすく掲載されているので、こちらを参照してください。参考までに、[Raspberry Pi (aarch64) + Ubuntu 22 での環境構築の例](https://openresty.org/en/linux-packages.html) を以下の示します。

```shell:Shell
# Ubuntu 22 (aarch64)

# すでに公式の Nginx がインストールされている場合は先に無効化する (アンインストールはしなくても良い)
sudo systemctl disable nginx
sudo systemctl stop nginx

# --no-install-recommends はつけなくても良い
sudo apt -y install wget gnupg ca-certificates

wget -O - https://openresty.org/package/pubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/openresty.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/openresty.gpg] http://openresty.org/package/arm64/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/openresty.list > /dev/null
sudo apt update
sudo apt -y install openresty
```

インストールが完了するとすでに Web サーバが起動した状態になっていると思います。アクセスして確かめてみましょう。

```shell:Shell
curl -I http://localhost
```

```
HTTP/1.1 200 OK
Server: openresty/1.21.4.1
Date: Sun, 22 Jan 2023 04:07:15 GMT
Content-Type: text/html
Content-Length: 1097
Last-Modified: Tue, 17 May 2022 03:51:45 GMT
Connection: keep-alive
ETag: "62831bd1-449"
Accept-Ranges: bytes
```

HTTP ステータスが 200 OK で、サーバが OpenResty のものになっていればインストールは成功しています。

もし起動していなければデーモンを起動してもう一度試してみてください。

```shell:Shell
sudo systemctl start openresty
```



# 環境設定
ここから先は環境設定をしていきます。

## 既存ファイルの編集
デフォルトの設定ファイルは `/usr/local/openresty/nginx/conf/` 内にあります。公式 Nginx とは場所が異なるのでご注意ください。

このディレクトリ内に `/usr/local/openresty/nginx/conf/nginx.conf` があると思います。これを以下のように変更します。

* `user` を `nobody` から一般ユーザ名に変更
* `conf.d` 内をファイルをロードするように変更

具体的には以下のようにします。

```diff:/usr/local/openresty/nginx/conf/nginx.conf
-#user nobody;
+user ubuntu;

http {
+    include /usr/local/openresty/nginx/conf/conf.d/*.conf;
}
```

* `ubuntu` はユーザ名の例です
* `include` は `http` ディレクティブの中に書いてください。

ちなみに `/usr/local/openresty/nginx/conf/nginx.conf.default` というファイルが初期状態では `/usr/local/openresty/nginx/conf/nginx.conf` と全く同じなので自分で事前にバックアップを取っておく必要はありません。

## 設定ファイルの作成
次に、`/usr/local/openresty/nginx/conf/conf.d/` ディレクトリを作成し、その中に `.conf` という拡張子でファイルを作成します。ファイル名は任意です。

```shell:Shell
sudo mkdir /usr/local/openresty/nginx/conf/conf.d
```

新しく作成したファイルの中に Web サーバの設定を書きます。この設定は通常の Nginx とほぼ同じです。以下は、あらかじめ 4000 番ポートで立てておいた静的サイトジェネレータ (Jekyll や Hugo など) のサーバを Nginx でリバースプロキシするための設定の例です。

```nginx:/usr/local/openresty/nginx/conf/conf.d/example.conf
server {
    listen 80;
    server_name localhost;

    location / {
        try_files $uri @proxy;
    }

    location @proxy {
        access_by_lua_block {
            -- access_by_lua_block (Lua) 内でのコメントは "#" ではなく "--" を使うことに注意！
            os.execute('/usr/local/openresty/nginx/conf/bin/git-pull /path/to/your-git-directory')
        }

        proxy_set_header  Host $http_host;
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass        http://localhost:4000;
    }
}
```

### `access_by_lua_block` について
さて、ここで通常の Nginx の設定とは異なる部分があります。それは [`access_by_lua_block`](https://openresty-reference.readthedocs.io/en/latest/Directives/#access_by_lua_block) ディレクティブです。このディレクティブは Nginx のシンタックスではなく ngx_http_lua_module 専用のディレクティブです。そのため、通常の Nginx でこの設定ファイルをロードしようとするとエラーになりますが、ngx_http_lua_module が組み込まれている OpenResty ならロードできます。

そしてこのモジュールの挙動は、`location` ブロックで指定されたページにリクエストが来たときに、`access_by_lua_block` ディレクティブの中に書かれている Lua のコードを実行します。Lua はプログラミング言語の一つです。つまり、このモジュールを使うことによって、リクエストが来るたびに任意の Lua のコードを実行することができます[^2][^3]。

[^2]: `access_by_lua_block` に似たものとして [`content_by_lua_block`](https://openresty-reference.readthedocs.io/en/latest/Directives/#content_by_lua_block) がありますが、こちらは [`proxy_pass` などのコンテンツハンドラディレクティブと併用することができないことにご注意ください](https://openresty-reference.readthedocs.io/en/latest/Directives/#:~:text=Do%20not%20use%20this%20directive%20and%20other%20content%20handler%20directives%20in%20the%20same%20location.%20For%20example%2C%20this%20directive%20and%20the%20proxy_pass%20directive%20should%20not%20be%20used%20in%20the%20same%20location.)。

[^3]: Lua ではコメントは `#` ではなく `--` を使うことに注意してください。

そして今回はシェルスクリプトを実行したいので `os.execute` を使用します。引数の中にコマンドやシェルスクリプトを書くことでそれを実行することができます[^4]。

[^4]: ちなみに、先ほど `/usr/local/openresty/nginx/conf/nginx.conf` の `user` を一般ユーザに変更しましたが、これをやっておこないとコマンド実行時に `nobody` で実行されてしまい権限の問題でうまく実行できなくなります。

## 実行スクリプトの作成
`os.execute` 内に直接 `git pull` のように書くこともできますが、これにはいくつかの問題点があります。

* コマンドを変更するたびに OpenResty (Nginx) のサーバを再起動しなければならない
* CSS や JavaScript、ファビコンなどのリクエストに対しても反応するので一回のアクセスで何回もコマンドが実行されてしまう

そこで、この設定ファイルの外にシェルスクリプト実行用のファイルを作っておき、複数回の実行を制御するような処理を入れておくことにおき上記の問題を回避します。

シェルスクリプトを置く場所はどこでも良いのですがここでは例として `/usr/local/openresty/nginx/conf/bin/` とします。ファイル名は例として `git-pull` とします。

以下のようなシェルスクリプトを設置します。

```shell:/usr/local/openresty/nginx/conf/bin/git-pull
#!/bin/sh

# Usage:
#   git-pull <GIT_DIRECTORY>

set -eu

THRESHOLD="60"
LAST_UPDATE=".git-fetch-last-update"

main() {
  parse_args "$@"

  if [ ! -f "$dir"/$LAST_UPDATE ]; then
    pull
  fi

  duration=$(echo "scale=10; $(awk 'BEGIN{ print srand(srand()) }') - $(cat "$dir"/$LAST_UPDATE)" | bc | sed 's/^\./0./' | sed 's/\.[0-9,]*$//g')

  if [ "$duration" -ge $THRESHOLD ]; then
    pull
  else
    echo "info: skip pulling because it has not been $THRESHOLD seconds yet since the last update"
  fi
}

pull() {
  awk 'BEGIN{ print srand(srand()) }' > "$dir"/$LAST_UPDATE
  git -C "$dir" pull > /dev/null 2>&1 &
}

parse_args() {
  if [ "$1" != "" ]; then
    dir="$1"
  else
    echo "error: missing git directory" >&2
    exit 1
  fi
}

main "$@"
```

挙動は以下のとおりです。

* バックグラウンドで `git pull` を実行する
    * フォアグラウンドで実行するとリモートサーバ (GitHub など) との通信で OpenResty (Nginx) へのアクセスが妨げられてしまうため
* ただし直近 60 秒以内に `git pull` をすでに実行していた場合は何もしない

細かいパスや定数などは適宜変更してください。

## シンタックスチェック
設定が完了したらシンタックスチェックを行います。コマンドは `nginx` ではなく `openresty` であることに注意してください。

```shell:Shell
sudo openresty -t
```

```
nginx: the configuration file /usr/local/openresty/nginx/conf/nginx.conf syntax is ok
nginx: configuration file /usr/local/openresty/nginx/conf/nginx.conf test is successful
```

`syntax is ok` と出たらサーバを再起動して設定の変更を反映します。もしエラーが表示されたらどこかに誤植やパスの指定間違いなどがないかチェックしてください。



# 再起動
設定の変更を反映させるためにサーバを再起動します。ここも同じくコマンド名は `openresty` であることに注意してください。

```shell:Shell
sudo systemctl restart openresty
```



# 動作確認
まずは該当のリポジトリ (`/path/to/your-git-directory`) において、リモートリポジトリに追加コミットがある状態 (リモートリポジトリが ahead な状態) にしておきます。

その後、静的サイトジェネレータで立てたサーバのサイトにアクセスしてみてください。5 〜 10 秒ほど経ったあと、該当リポジトリで新しいコミットが追加されていれば成功です。なお、説明が重複しますが、シェルスクリプト内で直近 60 秒以内に `git pull` していた場合は何もしないという制御を入れているので、連続で何度もアクセスしても `git pull` は実行されません。



# デバッグ方法
うまくいかないときは、エラーログを使うと良いでしょう。エラーログを出力するようにするには以下のように変更します。

```diff:/usr/local/openresty/nginx/conf/nginx.conf
-#error_log  logs/error.log;
-#error_log  logs/error.log  notice;
-#error_log  logs/error.log  info;
+error_log  logs/error.log;
+error_log  logs/error.log  notice;
+error_log  logs/error.log  info;
```

`os.execute` で実行するコマンドやシェルスクリプトでエラー出力があった場合は OpenResty (Nginx) のエラーログに記録されます。ログファイルはデフォルトでは `/usr/local/openresty/nginx/logs/error.log` です。

`less` コマンドの `+F` オプションを使用するとログがリアルタイムで確認できるので便利です。

```shell:Shell
less +F /usr/local/openresty/nginx/logs/error.log
```



# さいごに
さて、今回は OpenResty の導入方法と ngx_http_lua_module の使い方について紹介しました。使い勝手は Nginx とほぼ同じで便利なモジュールが使えるので、ローカルでのみ使用する Web サイトやテスト運用する場合は OpenResty でも良いんじゃないかなと思いました。



# 参考サイト
* [openresty/lua-nginx-module](https://github.com/openresty/lua-nginx-module)
* [OpenResty® Linux Packages](https://openresty.org/en/linux-packages.html#ubuntu)
* [Directives - OpenResty Reference](https://openresty-reference.readthedocs.io/en/latest/Directives/)
* [How to run a shell script on every request?](https://stackoverflow.com/questions/22891148/how-to-run-a-shell-script-on-every-request#answer-22891362)
* [How to use content_by_lua and proxy_pass together ?](https://groups.google.com/g/openresty-en/c/DRocQpM4mVY/m/Ax5nB3xKelYJ)
* [Programming in Lua : 1.3](https://www.lua.org/pil/1.3.html)
* [failed to load external Lua file](https://github.com/openresty/openresty.org/issues/18#issuecomment-1025187721)
