---
title: "最新版の Git をインストールする"
emoji: "📑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Git", "GitHub", "CentOS", "Ubuntu"]
published: true
order: 42
layout: article
---

# TL;DR
### Ubuntu

```bash:Ubuntu
$ sudo apt -y remove git
$ sudo apt -y install libcurl4-gnutls-dev libexpat1-dev gettext libz-dev libssl-dev autoconf asciidoc xmlto docbook2x make gcc
$ wget https://github.com/git/git/archive/v2.15.1.tar.gz
$ tar -zxf v2.15.1.tar.gz
$ cd git-2.15.1
$ make configure
$ ./configure --prefix=/usr
$ make all doc info
$ sudo make install install-doc install-html install-info
$ git --version
```

### CentOS

```bash:CentOS
$ sudo yum -y remove git
$ sudo yum -y install curl-devel expat-devel gettext-devel openssl-devel perl-devel zlib-devel autoconf asciidoc xmlto docbook2X make gcc
$ sudo ln -s /usr/bin/db2x_docbook2texi /usr/bin/docbook2x-texi
$ wget https://github.com/git/git/archive/v2.15.1.tar.gz
$ tar -zxf v2.15.1.tar.gz
$ cd git-2.15.1
$ make configure
$ ./configure --prefix=/usr
$ make all doc info
$ sudo make install install-doc install-html install-info
$ git --version
```

※ 最新の Git のバージョンは、[Releases · git/git](https://github.com/git/git/releases) を参照のこと

# パッケージマネージャーの Git は古いことが多い
`apt` や `yum` などの Linux のパッケージマネージャーでインストールした Git は、バージョンが古いことが多いです。

```bash:Ubuntu16.04
$ date
Tue Dec  5 21:40:00 JST 2017  # 2017 年 12 月 5 日現在
$ sudo apt -y update
$ sudo apt -y upgrade
$ sudo apt -y install git
$ git --version
git version 2.7.4
```

```bash:CentOS7
$ date
Tue Dec  5 21:40:00 JST 2017  # 2017 年 12 月 5 日現在
$ sudo yum -y update
$ sudo yum -y install git
$ git --version
git version 1.8.3.1
```

特に `yum` でインストールした Git は古いです。

Git のバージョンが古くても最低限のことは問題ないのですが、新しいバージョンで追加された機能を使いたいときには、やはり最新版をインストールしておきたいです。

たとえば、Git 2.8 以降では、`user.useConfigOnly` という設定が追加され、これを有効にすることで、ユーザ名やメールアドレスを設定していないときに、環境変数を使用して勝手にユーザ情報を参照してしまうことを防ぐことができます。

参考: [リポジトリごとに user.name や user.email の設定を強制する](https://qiita.com/uasi/items/a340bb487ec07caac799)

このような便利機能があるのですが、パッケージマネージャーからインストールした Git だと、古くて対応していません。`user.useConfigOnly` を設定しているから、うっかりユーザ名とメールアドレスを設定し忘れても大丈夫、と思っていたけど、実は、Git のバージョンが古くて環境変数のユーザ情報を参照してしまっていた…なんてことにもなりかねないです。

以降では、最新版を Git を、パッケージマネージャーからではなく、ソースからビルドしてインストールする方法について説明します。

# 既存の Git をアンインストール
既にパッケージマネージャーで Git をインストールしていた場合は、アンインストールします。

### Ubuntu の場合

```bash:Ubuntu
$ sudo apt -y remove git
```

### CentOS の場合

```bash:CentOS
$ sudo yum -y remove git
```

# 必要なライブラリをインストール
まずは必要なライブラリをインストールします。

### Ubuntu の場合

```bash:Ubuntu
$ sudo apt -y install libcurl4-gnutls-dev libexpat1-dev gettext libz-dev libssl-dev autoconf asciidoc xmlto docbook2x make gcc
```

### CentOS の場合

```bash:CentOS
$ sudo yum -y install curl-devel expat-devel gettext-devel openssl-devel perl-devel zlib-devel autoconf asciidoc xmlto docbook2X make gcc
$ sudo ln -s /usr/bin/db2x_docbook2texi /usr/bin/docbook2x-texi
```

# ソースコードをダウンロード
Git のソースコードをダウンロードします。以下の GitHub のページにアクセスします。

[Releases · git/git](https://github.com/git/git/releases)

![git_releases.png](https://qiita-image-store.s3.amazonaws.com/0/113895/8c941712-7121-6c79-0c82-0af1147979cc.png)

最新版の Tarball のダウンロードリンクをコピーします。上記の画像の例では、v2.15.1 が最新版なので、v2.15.1 の `tar.gz` のリンクをコピーします。以降の説明では、v2.15.1 が最新版だと仮定します。

Tarball をダウンロードします。

```bash
$ wget https://github.com/git/git/archive/v2.15.1.tar.gz
```

カレントディレクトリに `v2.15.1.tar.gz` がダウンロードされます。

# ビルドしてインストール
先ほどダウンロードした Tarball を展開します。

```bash
$ tar -zxf v2.15.1.tar.gz
```

展開されたディレクトリに移動します。

```bash
$ cd git-2.15.1
```

あとは、ビルドしてインストールすれば完了です。

```bash
$ make configure
$ ./configure --prefix=/usr
$ make all doc info
$ sudo make install install-doc install-html install-info
```

バージョンを確認して、最新の Git のバージョンが表示されたら成功です。

```bash
$ git --version
git version 2.15.1
```

# 参考
* [Gitのインストール](https://git-scm.com/book/ja/v2/%E4%BD%BF%E3%81%84%E5%A7%8B%E3%82%81%E3%82%8B-Git%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
