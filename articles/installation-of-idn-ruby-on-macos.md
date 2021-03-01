---
title: "macOS で idn-ruby がインストールできないときの解決法"
emoji: "✨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["idn", "idn-ruby", "Gem", "rubygems", "Mac"]
published: false
---

# TL;DR

```bash
$ brew install libidn
$ gem install idn-ruby -- --with-idn-dir=/usr/local/Cellar/libidn/x.xx  # x.xx は LibIDN のバージョン
```

# はじめに
Rails 等で開発を行う際に、idn-ruby というライブラリが必要になることがあるかと思います。

idn-ruby はネイティブライブラリなので、インストールする前に LibIDN というライブラリをシステムにインストールしておく必要があります。

Ubuntu 等では

```bash
$ sudo apt -y install libidn11-dev
$ gem install idn-ruby  # Rails で使用する場合はプロジェクトディレクトリ内で bundle install
```

を実行すれば問題なくインストールすることができます。

そのため、macOS でも同様に、brew を使用して LibIDN をインストールしてから、idn-ruby をインストールしようとしました。

```bash
$ brew install libidn
$ gem install idn-ruby
```

ところが、上記のコマンドを実行しても idn-ruby のインストール時にエラーとなりインストールすることができませんでした。

# 原因
その原因は、brew でインストールした LibIDN のライブラリファイルやヘッダファイルを、gem が参照できなかったためです。

brew でインストールされるライブラリは、Linux 系のパッケージマネージャでインストールされるものとはパスが異なるため、このような現象が起こります。

# ライブラリファイルの場所を検索
idn-ruby インストール時のエラーログに「`idna.h` が見つからない」という記述があったので、この `idna.h` がどこにあるかをまず検索してみました。

```bash
$ sudo find / -name "idna.h" -ls
```

すると、以下の結果が出力されました。

```
 14109608     16 -rw-r--r--   1  user   admin       12856 11 27  2015 /usr/local/Cellar/icu4c/56.1/include/unicode/idna.h
 19232974     16 -rw-r--r--   1  user   admin       12856  3 24  2016 /usr/local/Cellar/icu4c/57.1/include/unicode/idna.h
 27315941     16 -rw-r--r--   1  user   admin       12952 12  9  2016 /usr/local/Cellar/icu4c/58.2/include/unicode/idna.h
 33091577      4 -rw-r--r--   1  user   admin        3564  7 21  2016 /usr/local/Cellar/libidn/1.33/include/idna.h
 33091592      4 lrwxr-xr-x   1  user   admin          36 11  4 07:25 /usr/local/include/idna.h -> ../Cellar/libidn/1.33/include/idna.h
```

この結果から、どうやらヘッダファイルは `/usr/local/Cellar/libidn/1.33/include` にあるということがわかりました。

idn-ruby インストール時のエラーには、

```
Please install the GNU IDN library or alternatively specify at least one
  of the following options if the library can only be found in a non-standard
  location:
    --with-idn-dir=/path/to/non/standard/location
        or
    --with-idn-lib=/path/to/non/standard/location/lib
    --with-idn-include=/path/to/non/standard/location/include
```

と記述されており、パスが異なる場合は、`--with-idn-dir` もしくは、`--with-idn-lib` と `--with-idn-include` を指定することで、そちらのパスを参照してくれると書かれていました。

先ほど調べたパスは、`/usr/local/Cellar/libidn/1.33/include` とあることから、`include` のほうだということがわかります。そこで、一段階層を上がってディレクトリの中身を確認してみると、

```bash
$ ls /usr/local/Cellar/libidn/1.33
AUTHORS  COPYING  ChangeLog  INSTALL_RECEIPT.json  NEWS  README  TODO  bin  include  lib  share
```

となっており、`include` と `lib` が入っていることがわかりました。

# ライブラリファイルを指定してインストール
つまり、`--with-idn-dir` に `/usr/local/Cellar/libidn/1.33` を指定してあげれば良いということがわかります。

なので、以下のコマンドを実行してみました。

```bash
$ gem install idn-ruby -- --with-idn-dir=/usr/local/Cellar/libidn/1.33
```

すると、

```
Building native extensions with: '--with-idn-dir=/usr/local/Cellar/libidn/1.33'
This could take a while...
Successfully installed idn-ruby-0.1.0
Parsing documentation for idn-ruby-0.1.0
Done installing documentation for idn-ruby after 0 seconds
1 gem installed
```

と表示され、無事、インストールすることができました。

ちなみに、`1.33` というのは LibIDN のバージョンなので、brew でインストールされたバージョンに適宜置き換えてください。

LibIDN のバージョンは以下のコマンドで確認できます。

```bash
$ idn --version
idn (GNU Libidn) 1.33
Copyright (C) 2016 Simon Josefsson.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by Simon Josefsson.
```

まとめると、

```bash
$ brew install libidn
$ gem install idn-ruby -- --with-idn-dir=/usr/local/Cellar/libidn/x.xx
```

を実行すれば良いということになります。ただし、`x.xx` はインストールされた LibIDN のバージョンを指定してください。

# 余談
`gem install` のオプションをつける際に `--` をつけなければいけないのですが、なぜ `--` が必要なのかはよくわかりません。

```bash
gem install idn-ruby -- --with-idn-dir=/usr/local/Cellar/libidn/1.33
```

ではなく、

```bash
gem install idn-ruby --with-idn-dir=/usr/local/Cellar/libidn/1.33
```

とすると、

```
ERROR:  While executing gem ... (OptionParser::InvalidOption)
    invalid option: --with-idn-dir=/usr/local/Cellar/libidn/1.33
```

というエラーが表示されて、インストールできません。
