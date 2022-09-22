---
title: "M1 Mac (macOS Monterey) で therubyracer のインストールすることはできるのだろうか？"
emoji: "🏎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ruby", "v8", "mac", "macos"]
published: true
order: 157
layout: article
---

# 結論
いろいろ試したけど今のところ問題なく使えるようにする方法が見つかりません……。



# インストール手順について
`therubyracer` のインストールには `libv8` のインストールが必要で、`libv8` のインストールには `v8` が必要です。

つまり、`v8` ← `libv8` ← `therubyracer` という依存関係になっています。



# v8
なのでまずは Homebrew で v8 をインストールしようとしてみます。

```shell:Shell
brew install v8@3.15
```

すると以下のエラーが発生します。

```
Error: Cannot install under Rosetta 2 in ARM default prefix (/opt/homebrew)!
```

M1 Mac では v8 はインストールできないようです。

幸い、M1 Mac にはこうした互換性の問題を解消するため、Rosetta 2 という仕組みがあります。これを利用することで Intel でしか動作しないアプリケーションやプログラムを動作させることができるようになります。

* [Homebrew on Apple Silicon](https://soffes.blog/homebrew-on-apple-silicon)

ということで、Intel 版の Homebrew をインストールし、そちら側から v8 をインストールしてみます。

まずは Intel 版の Homebrew をインストールします。

```shell:Shell
arch -x86_64 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

次に Intel 版の Homebrew で v8 をインストールします。

```shell:Shell
arch -x86_64 /usr/local/bin/brew install v8@3.15
```

無事インストールできました。


# libv8
これで libv8 がインストールできるようになっているはずです。以下のコマンドを実行してインストールしてみます。

```shell:Shell
gem install libv8 -v '3.16.14.19' -- --with-system-v8
```

インストールできました。

`bundle install` からインストールする場合は `bundle config` で `--with-system-v8` を設定しておく必要があります。

```shell:Shell
bundle config --local build.libv8 --with-system-v8
bundle install
```



# therubyracer
これで therubyracer もインストールできるようになったはずです。

インストールする際には先ほどインストールした v8 のインストール先のパスを指定する必要があるのですが、ここで注意しなければいけないのは、Intel 版 Homebrew からインストールしたパスを指定する必要があるということです。

```shell:Shell
arch -x86_64 /usr/local/bin/brew --prefix v8@3.15
```

```
/usr/local/opt/v8@3.15
```

単に `brew --prefix v8@3.15` とすると `/opt/homebrew/opt/v8@3.15` という別のパスを指してしまうので注意してください。

Intel 版 Homebrew でインストールした v8 のパスを指定して therubyracer をインストールします。

```shell:Shell
gem install therubyracer -v '0.12.3' -- --with-v8-dir=$(arch -x86_64 /usr/local/bin/brew --prefix v8@3.15)
```

libv8 のときと同様、`bundle install` からインストールする場合は `bundle config` でオプションをあらかじめ設定しておく必要があります。

```shell:Shell
bundle config --local build.therubyracer --with-v8-dir=$(arch -x86_64 /usr/local/bin/brew --prefix v8@3.15)
bundle install
```



# 互換性問題
さて、これで問題なく therubyracer がインストールされたように思えます。厳密に言えば『インストール』自体はできているのですが、想定通りに動作しません。

とりあえず `rake` コマンドを実行してみます。

```shell:Shell
bundle exec rake routes
```

すると互換性がないというエラーが表示されてしまいます。理由は単純に ARM で x86_64 を実行しようとしているから、だと思いますが、`arch -x86_64 bundle exec rake routes` としても同じエラーになってしまいます。

`rake` だけでなく `rails` などでも同じ原因を示すエラーが表示されます。

これを解決する方法が調べてもわからず、詰みました……。



# さいごに
やはり M1 Mac では現状は Docker で環境を作るしかないのでしょうか。あるいは mini_racer に乗り換えるか。

いずれにしても個人ではないプロジェクトの環境を整えるときに不都合が生じそうです。

なにかやり方を知っている方がいれば教えていただけるとありがたいです。



# 参考サイト
* [Unable To Install libv8/therubyracer on M1 Macbook Pro (Apple Silicon)](https://github.com/rubyjs/libv8/issues/312)
* [Homebrew on Apple Silicon](https://soffes.blog/homebrew-on-apple-silicon)
* [[Rails]therubyracerのインストールができない！(M1Mac)](https://asapoon.com/ruby/rails/2900/therubyracer-m1-mac/)
