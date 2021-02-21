---
title: "OpenSSLをソースからビルドしてNginxで使用する"
emoji: "👌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["openssl", "nginx", "CentOS", "centos7"]
published: false
order: 27
---

# はじめに
今まではパッケージマネージャのアップデートでOpenSSLのバージョンをアップデートしていましたが、先日はじめてソースからビルドして使用してみたので、そのやり方をまとめます。

# TL;DR
:warning: 読むのがめんどくさい、急いでいる人向けです。記事を最後まで読む人はTL;DRは読み飛ばしてください

```bash
$ wget https://www.openssl.org/source/openssl-x.x.x.tar.gz
$ tar xzvf openssl-x.x.x.tar.gz
$ cd openssl-x.x.x
$ ./config shared zlib
$ make
$ sudo make install
$ /usr/local/ssl/bin/openssl version
```

```diff:~/.bashrc
+ PATH="/usr/local/ssl/bin:$PATH"
```

```bash
$ source ~/.bashrc
$ openssl version
$ wget http://nginx.org/download/nginx-x.xx.x.tar.gz
$ tar xzvf nginx-x.xx.x.tar.gz
$ cd nginx-x.xx.x
$ ./configure --with-http_ssl_module --with-http_v2_module --with-openssl=展開したOpenSSLのディレクトリのパス
$ make
$ sudo make install
$ nginx -V
```

**サーバを再起動する**

```bash
$ sudo nginx
```

うまくいかない場合は以下に続く記事をお読みください。

# ソースからビルドする理由
個人的には以下の3つが挙げられます

* どのバージョンを使用しているか確認しづらい
* Nginxで最新バージョンのOpenSSLを使用しているか不安
* 使用するバージョンを選べない

CentOSではOpenSSLの本当のバージョンを簡単に調べることができません。
以下のコマンドを実行すればバージョンを確認できますが、これは本当のバージョンではない可能性があります。yumでインストールされたパッケージは、アップデートを行っても、バージョンの表示が更新されないものがあります。OpenSSLがその例です。

```bash
$ openssl version
OpenSSL 1.0.1e-fips 11 Feb 2013  # <= これは本当のバージョンではない
```

また、本当のバージョンを確認する方法として、rpmを使用するという記事が紹介されていましたが、ぼくが確認した限りでは、上記と同じく更新されていないバージョンが表示されてしまいました。

```bash
$ rpm -q openssl
OpenSSL 1.0.1e-fips 11 Feb 2013  # <= これも本当のバージョンではない
```

また、これだと、最新バージョンのOpenSSLをインストールしていても、Nginxがその最新バージョンのOpenSSLを使用しているかどうか不安という点も挙げられます。

```bash
$ nginx -V
nginx version: nginx/x.xx.x
built by gcc x.x.x xxxxxxxx (Red Hat x.x.x) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013  # <= バージョンが違う
TLS SNI support enabled
configure arguments: ...
```

さらに、OpenSSLのバージョンは、1.0.2系、1.1.0系など複数ありますが、どのバージョンにアップデートされるかわからないので、自分のインストールしたいバージョンを選べません。

常に最新版をインストールしておきたいのですが、一昨日（2017年2月16日）に更新された1.1.0eを、ぼくが昨日インストールしてみたら、ライブラリがインストールされなかったり、コンパイルエラーになったりしたので、そういう状況のときに柔軟に対応したいという思いがあります。

前置きが長くなってしまいましたが、つまりはソースからビルドしたほうが何かと融通が効くのでソースからビルドすることにしました。

# 環境
* CentOS 7

# OpenSSLのインストール
## ダウンロード
まずは[公式のダウンロードページ](https://www.openssl.org/source/)からOpenSSLをインストールします。インストール可能な最新版（安定版）のダウンロードリンクが表でまとまっているので、そこからインストールしたいバージョンを選んでダウンロードします。リンクをクリックして直接ダウンロードしてもいいのですが、今回はリモートからダウンロードすることを想定して、`wget`を使用します。`.tar.gz`のリンク先をコピーして以下のコマンドを実行します。

```bash
$ wget https://www.openssl.org/source/openssl-x.x.x.tar.gz
```

`x.x.x`にはバージョンが入ります。必ずこの形式とは限らないので、公式サイトのリンクをコピペしてください。なお、実行するとカレントディレクトリにファイルがダウンロードされますが、カレントディレクトリはどこでも良いです。邪魔にならないところでダウンロードしてください。

## 圧縮ファイルを展開
ダウンロードされたファイルは圧縮ファイルなので、以下のコマンドで展開します。

```bash
$ tar xzvf openssl-x.x.x.tar.gz
```

ファイルは先ほどダウンロードしたファイル名を指定してください。

展開されたら、そのディレクトリに移動します。ちなみに圧縮ファイルのほうはもう必要ないので削除してOKです。

```bash
$ cd openssl-x.x.x
```

## ビルド
展開したディレクトリに移動したら設定を行い、ビルドします。

```bash
$ ./config shared zlib
$ make
$ sudo make install
```

`config`を実行するときのオプションについては、このディレクトリ内にある`INSTALL`ファイルを参照してください。通常は`shared`と`zlib`で問題ないかと思います。

ビルドには時間がかかりますが、エラーが出なければ成功です。

## 確認
インストールされていることを確認するには以下のコマンドを実行します。

```bash
$ /usr/local/ssl/bin/openssl version
OpenSSL x.x.x  xx xxx xxxx
```

自分がインストールしたバージョンが表示されていればOKです。

## パスを通す
しかし、元々プリインストールされているOpenSSLがある場合は、`openssl`コマンドがそちらを参照してしまうので、今回ソースからビルドしたほうのOpenSSLを使用するためには、パスを通す必要があります。`.bashrc`に以下の一行を追加します。

```diff:~/.bashrc
+ PATH="/usr/local/ssl/bin:$PATH"
```

:warning: `+ `は入力しません。

追加したら、`.bashrc`を再読込します。

```bash
$ source ~/.bashrc
```

再読込したら、`openssl`コマンドでバージョンを確認します。

```bash
$ openssl version
OpenSSL x.x.x  xx xxx xxxx
```

このときに表示されたバージョンがソースからビルドしたバージョンになっていればOKです。

# Nginxでの使用
おそらくこのままでは、NginxはプリインストールされたOpenSSLを参照してしまいます。NginxでもソースからビルドしたOpenSSLを使用したい場合は、Nginxをソースからビルドする必要があります。インストールする際に、使用するOpenSSLを、ソースからビルドしたほうのパスに指定しておけばOKです。

ここでは最低限のインストールコマンドだけを載せておきます。Nginxをソースからビルドする方法の詳細は以下の記事を参照してください。
[Nginxでレスポンスヘッダの一部を隠蔽する方法](http://qiita.com/noraworld/items/50781bcaa5bf28802cd0)

```bash
$ wget http://nginx.org/download/nginx-x.xx.x.tar.gz
$ tar xzvf nginx-x.xx.x.tar.gz
$ cd nginx-x.xx.x
$ ./configure --with-http_ssl_module --with-http_v2_module --with-openssl=展開したOpenSSLのディレクトリのパス
$ make
$ sudo make install
```

`x.xx.x`にはNginxのバージョンを指定します。バージョンは[公式サイト](https://nginx.org)で確認してください。ダウンロードリンクをコピペするのが確実です。

`展開したOpenSSLのディレクトリのパス`には、OpenSSLのインストール手順で展開した後のOpenSSLのディレクトリのあるパスを指定してください。

ビルドに成功したら、以下のコマンドを実行して、NginxがソースからビルドしたOpenSSLを使用しているか確認します。

```bash
$ nginx -V
nginx version: nginx/x.xx.x
built by gcc x.x.x xxxxxxxx (Red Hat x.x.x) (GCC)
built with OpenSSL x.x.x xx xxx xxxx
TLS SNI support enabled
configure arguments: ...
```

`built with OpenSSL` の箇所のバージョンがソースからビルドしたOpenSSLのバージョンになっていれば成功です！

# 再起動
せっかくアップデートしても、再起動しなければ意味がありません。`nginx`コマンドには再起動するコマンドがあるので問題ないですが、`openssl`コマンドで再起動する方法はわからないので、ぼくはサーバ自体を再起動しました。

サーバを再起動したら、Nginxを起動します。

```bash
$ sudo nginx
```

これで、Nginxでも最新バージョンのOpenSSLを使用することができるようになりました！

# 参考
* [opensslのversion確認はCentOS系ではコツが必要](http://qiita.com/yoshi-taka/items/512cdc64d6a4b03b8c1b)
* [OpenSSL(1.0.x)をインストールする（ソースからコンパイル）for CentOS 7.2](http://qiita.com/shadowhat/items/68fd55b532c04b13acf5)
* [Nginxでレスポンスヘッダの一部を隠蔽する方法](http://qiita.com/noraworld/items/50781bcaa5bf28802cd0)
* [EC2+nginxでhttp2対応できたとおもったらできてなかった話。（解決します）](http://qiita.com/pyonk/items/45626c712e4a9938c980)
* [OpenSSL 1.0.2 以降をインストールしてもALPNに対応できないときの対処法](http://noraworld.hatenablog.com/entry/enable-alpn-with-openssl)
