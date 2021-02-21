---
title: "Nginxでレスポンスヘッダの一部を隠蔽する方法"
emoji: "🔥"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nginx", "nginx-build"]
published: false
order: 21
---

# はじめに
拡張モジュールが導入されていないNginxでは、バージョンを隠すことはできますが、Nginxを使っていること自体は隠すことができません。

レスポンスヘッダには使用しているサーバ（Apache/Nginxなど）の他にも色々な情報が載っています。中にはセキュリティ上問題となる情報が含まれていることもあります（例えばApacheではデフォルトの設定だとOpenSSLのバージョンが表示されていたりします）

Nginxはデフォルトの設定のままでもセキュリティ的に大きな問題はないですが、レスポンスヘッダは攻撃者の良い材料ともなり得るので、できるだけ不要な情報は隠すことが望ましいです。

ここでは、Nginxでレスポンスヘッダの情報をできるかぎり隠蔽する方法を説明します。以下の説明では状況に応じて`sudo`をつけてください。

# ソースからビルド
大前提として、Nginxでレスポンスヘッダを編集するには拡張モジュールが必要となります。そしてこの拡張モジュールは、Nginxをソースからビルドして追加する必要があります。

[公式サイト](https://nginx.org)からダウンロードします。
`$ wget 'http://nginx.org/download/nginx-X.XX.X.tar.gz'`

:warning: `X.XX.X`の箇所はNginxのバージョンを指定してください。バージョンは[公式サイトのダウンロードページ](https://nginx.org/en/download.html)から確認できます。Stable version (安定版) か Mainline version (最新版) のどちらかのバージョンを選んでください。

ダウンロードした圧縮ファイルを展開します。
`$ tar -xzvf nginx-X.XX.X.tar.gz`

次に、レスポンスヘッダを編集するための拡張モジュールをダウンロードします。[headers-more-nginx-module](https://github.com/openresty/headers-more-nginx-module) を使用します。
`$ wget 'https://github.com/openresty/headers-more-nginx-module/archive/vX.XX.tar.gz'`

:warning: `vX.XX.tar.gz`には拡張モジュールの最新版をバージョンを入れてください。最新版のバージョンは[GitHubのページ](https://github.com/openresty/headers-more-nginx-module/tags)から確認できます。たとえば、`v0.31.tar.gz`のような形式です。

ダウンロードした圧縮ファイルを展開します。
`$ tar -xzvf vX.XX.tar.gz`

展開したNginxのディレクトリに移動します。
`$ cd nginx-X.XX.X`

移動したら以下のコマンドを実行します。こちらはSSL/TLS通信（HTTPS通信）を使わない人向けです。
`$ ./configure --add-dynamic-module=拡張モジュールをインストールしたディレクトリのパス/headers-more-nginx-module-X.XX`

こちらはSSL/TLS通信を使う人向けです。
`$ ./configure --add-dynamic-module=拡張モジュールをインストールしたディレクトリのパス/headers-more-nginx-module-X.XX --with-http_ssl_module --with-http_v2_module`

HTTP/2を使わない人は`--with-http_v2_module`を外しても良いですが、せっかくSSL/TLS対応しているのであればHTTP/2にも対応したほうがオトクです。

ちなみに上記コマンドでは`/usr/local`以下にNginxがインストールされます。場所は変更しなくて良いですが、変えたい場合は`--prefix=インストールしたいパス`を追加してください。ただし別の場所にインストールした場合は、モジュールをあとから追加する際に**毎回`--prefix`オプションを付けなければいけない**ことに注意してください。なお、以下の説明では`/usr/local`にインストールされたものとして説明します。

上記コマンドを実行したら続けて以下のコマンドを実行します。

```
$ make
$ make install
```

これで`/usr/local`に、拡張モジュール付きでNginxがインストールされます。ちなみに拡張モジュールは`/usr/local/nginx/modules`以下に置かれます。

参考: [headers-more-nginx-module - GitHub](https://github.com/openresty/headers-more-nginx-module#installation)

# レスポンスヘッダを隠蔽
Nginxの設定ファイルにレスポンスヘッダを隠す設定を追加していきます。まずは拡張モジュールを読み込まないといけないので、ディレクティブの外(`{}`で囲まれていない外の部分)に以下の一行を追加します。ディレクティブの外ならどこでも良いですが、わかりやすいようにファイルの最初の辺りに書いておくと良いです。

```nginx:/usr/local/nginx/conf/nginx.conf
load_module  /usr/local/nginx/modules/ngx_http_headers_more_filter_module.so;
```
:warning: `/usr/local`以外にインストールした場合は適宜パスを変更してください

次にレスポンスヘッダを隠す設定を追加します。レスポンスヘッダにはサイトによって色々な情報が含まれますので、実際には他にもたくさん設定があります。以下はその一例です。詳しくは[リポジトリ](https://github.com/openresty/headers-more-nginx-module)を参照してください。また、レスポンスヘッダ情報によっては**隠してしまうとアプリケーションが正しく機能しなくなる可能性がある**ので注意してください。Railsでは`more_clear_headers Content-Type;`を追加するとうまく動きませんでした。適宜、環境に合わせて編集してください。

`http`ディレクティブ（`http { }`内のどこか）に以下を追加します。

```nginx:/usr/local/nginx/conf/nginx.conf
http {
    server_tokens      off;
    more_clear_headers Server;
    more_clear_headers ETag;
    more_clear_headers Transfer-Encoding;
    more_clear_headers Date;
    more_clear_headers Status;
    more_clear_headers X-Request-Id;
    more_clear_headers X-Runtime;
    more_clear_headers X-UA-Compatible;
    more_clear_headers Cache-Control;
    more_clear_headers Connection;
    more_clear_headers X-Powered-By;
    # more_clear_headers Content-Type;

    # ... 省略 ...
}
```
参考: [[Nginx] レスポンスヘッダを限りなく消す](http://yume-build.com/blog/archives/257)

`more_clear_headers`で各レスポンスヘッダ情報を隠します。`server_tokens`はNginxのバージョンを表示するかどうかです。なお、`server_tokens`に関してはソースからビルドしなくても（拡張モジュールを使用しなくても）使用できます。

# パスを通す
すでにNginxを`yum`や`apt`でインストール済みの場合は、`nginx`コマンドがそちらのパスを参照するようになっていることが多いです。

```bash
$ which nginx
/usr/sbin/nginx  # パッケージからインストールしたNginxを参照してしまっている
```

なので、`nginx`コマンドを、今回インストールしたほうを使うようにします。既存のNginxを削除すれば、誤って元のNginxを操作してしまう可能性が減ります。

```bash:CentOS
# 実行しない！！
$ sudo yum -y remove nginx
```

```bash:Ubuntu
# 実行しない！！
$ sudo apt -y purge nginx
```

ただし、削除してしまうと一緒に設定ファイル等も削除されてしまうので、設定ファイル等をあらかじめバックアップしておく必要があります。

また、万一ソースからビルドしたNginxでうまくいかない場合、先に既存のNginxを削除してしまうと色々と厄介です。

さらに、既存のNginxを削除したとしてもそのままではパスが通っていないので、結局はパスを通すことになります。

```bash
$ which nginx
# パスが見つからない！
```

なので既存のNginxを削除するのはすべての作業が終わってからでも十分です。

Nginxをすでにインストールしていてもいなくても、パスを通す必要があります。以下のように、`$PATH`よりも前に`/usr/local/nginx/sbin`が来るようにパスを設定してください。これは、既存のNginxが参照されてしまうことを避けるためです。

```bash:~/.bashrc
export PATH="/usr/local/nginx/sbin:$PATH"
```

追加したら設定を反映させます。
`$ source ~/.bashrc`

`nginx`のパスを確認して、`/usr/local/nginx/sbin/nginx`となっていればOKです。

```bash
$ which nginx
/usr/local/nginx/sbin/nginx  # OK!
```

また、`nginx`コマンドはroot権限で実行することが多いので、`sudo`をつけたときにも同じようにパスが通るようにする必要があります。以下のコマンドでroot権限での設定を変更します。
`$ sudo visudo`

`vim`などのエディタが立ち上がるので、以下の一行を探してください。
`Defaults secure_path = /sbin:/bin:/usr/sbin:/usr/bin`

:warning: パスはOSによって異なる場合があります。

すでにあるパスに対して元々のNginxがあるパス（`/usr/sbin`）より前に`/usr/local/nginx/sbin`を追加します。元々のNginxがなければ（インストールしてなければ）末尾に追加しても問題ないです。
`Defaults secure_path = /sbin:/bin:/usr/local/nginx/sbin:/usr/sbin:/usr/bin`

:warning: このファイルはかなり特別なファイルなので、くれぐれもタイプミスをしないように注意してください。特に`:`を忘れないように！

これで`sudo`を使ったときでも`/usr/local/nginx/sbin`にパスが通るようになります。
参考: [【Linux】「sudo: service: command not found」というエラーが出た場合の対処法](http://kzy52.com/entry/2014/07/10/064412)

# Nginxを起動
それではいよいよ起動します。よく使うコマンド一覧です。

```bash
$ sudo nginx            # 起動
$ sudo nginx -s reload  # リロード
$ sudo nginx -s stop    # 終了
```

何もメッセージが表示されなければ起動成功です。

# 確認
ただサーバが起動しただけではレスポンスヘッダが隠せているかどうかがわからないので、実際に確認してみましょう。ここでは2種類の確認方法を紹介します。

## ディベロッパーツールを使用する
Google Chrome を例に紹介します。他のブラウザの場合は各自で調べてみてください。ディベロッパーツールを開くには、Windowsでは`F12`, Macでは `command + option + i` です。もしくは右クリックの「検証」でも開けます。

ディベロッパーツールを開いたら`Network`タブを開きます。開いたら一度ページをリロードする必要があります。リロードしたら、左側にたくさんのファイル名が出てくると思いますが、一番上（`example.com`や`index.html`やURLのパス名などになっている）のものをクリックします。

![network_information.png](https://qiita-image-store.s3.amazonaws.com/0/113895/6244dd89-7796-fc43-ec10-1e1e9c0db554.png)

すると以下のように表示されます。

![response_headers.png](https://qiita-image-store.s3.amazonaws.com/0/113895/b89147e7-a161-7ae5-fa6c-1bf461f82100.png)

ここの `Response Headers` となっている部分がレスポンスヘッダになります。これがサーバからクライアント側に送られるサーバ情報ですね。ここに、Nginxで設定したレスポンスヘッダが表示されていなければ成功です！

## cURLを使用する
`curl`コマンドを使用するとサーバからのレスポンス情報が確認できます。
`$ curl -I ドメイン名`

:warning: `http://`でリクエストがあった際に`https://`にリダイレクトするような設定にしている場合は明示的に`https://`と入力する必要があります。

```bash
$ curl -I https://noraworld.jp
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 2915
Connection: keep-alive
Cache-Control:
Strict-Transport-Security: max-age=31536000; includeSubDomains;
```

ブラウザで確認したのと似たような結果が返ってきます。ここにNginxで設定したレスポンスヘッダが表示されていなければOKです！

### 拡張機能を使用する
これはレスポンスヘッダを確認するわけではないのであくまで参考程度ですが、個人的に好きな拡張機能なのでおまけとして載せておきます。

[Wappalyzer](https://wappalyzer.com)を使用すると、そのサイトでどのようなサーバ、アプリケーション等が使われているかが簡単に確認できます。

Google Chrome では [Chrome Web Store](https://chrome.google.com/webstore/detail/wappalyzer/gppongmhjkpfnbhagpmjfkannfbllamg?utm_source=chrome-ntp-icon) からインストールできます。

インストールすると拡張機能の欄にアイコンが追加されます。調べたいサイトにアクセスしたときに表示された内容が、そのサイトで使われているサーバやアプリケーションになります。

たとえばQiitaではこんな感じ。

![qiita_wappalyzer.png](https://qiita-image-store.s3.amazonaws.com/0/113895/a4268f7d-97c3-d572-740f-9b363d9cdf3f.png)

レスポンスヘッダを確認するというよりは使われているアプリケーションを調べるツールですが、ここにNginxという表記がなければ`Server`は隠せていることになります。また、Expressなどを使用しているサイトでは`X-Powered-By`を隠すことにより解析できない（表示されない）ようになります。

余談ですが、ここにバージョン等が表示されていたら少し気をつける必要があります。

# その他
既存のNginxから設定ファイルをコピーしてきた場合は、パスなどに注意する必要があります。たとえば自分の場合は、SSL/TLS通信で使用するDH鍵（`ssl_dhparam`）のパスが変わったのに気が付かずにエラーになりました。他にも404エラーページのHTMLのパスなどが変わることがありますので、既存のNginxの設定を引き継ぐ際はご注意ください。

# 参考サイト
* [headers-more-nginx-module - GitHub](https://github.com/openresty/headers-more-nginx-module#installation)

* [[Nginx] レスポンスヘッダを限りなく消す](http://yume-build.com/blog/archives/257)

* [【Linux】「sudo: service: command not found」というエラーが出た場合の対処法](http://kzy52.com/entry/2014/07/10/064412)
