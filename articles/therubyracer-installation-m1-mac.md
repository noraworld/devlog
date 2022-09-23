---
title: "M1 Mac (macOS Monterey) で therubyracer を運用することはできるのだろうか？"
emoji: "🏎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ruby", "v8", "mac", "macos"]
published: true
order: 157
layout: article
---

# 結論
`therubyracer` はもう捨てたほうが良い！

いろいろ試しましたが、M1 Mac で `therubyracer` と共存しながら正しくアプリケーションを動作させる方法は、少なくとも筆者の調べでは見つけることができませんでした……。



# 削除して大丈夫？
プロジェクトごとに環境はまちまちでしょうから、絶対に大丈夫とは言い難いですが、以下の記事に記載されているとおり、Node.js を実行できる環境であれば、ほとんどのケースでは `therubyracer` を削除しても問題なく動作します。

* [How to Install (Or Get Rid Of) therubyracer on M1 or M2 Macs](https://www.rubyonmac.dev/how-to-install-therubyracer-on-m1-m2-apple-silicon-mac)

少なくとも筆者の関わっている Rails アプリケーションでは問題ありませんでした。

やることとしてはとてもシンプルで、`Gemfile` から `gem 'therubyracer'` の記述を削除して `bundle install` を実行するだけです。

`Gemfile` を使っていない場合は `gem uninstall therubyracer` を実行するだけです。



# 必要になるかもしれない手順
筆者はここ数日いろいろと試行錯誤している中で `therubyracer` を削除してもう一度ビルドし直したら動いてしまったので、もしかしたらその過程で必要だった手順があるのかもしれません。

そのため、それまでに行った作業を念のため共有しておきます。

## Intel 版 v8 を削除
いくつかの記事では Intel 版の Homebrew で v8@3.15 をインストールするように書かれています。

しかしこれは結果的には不要だったので削除しました。

```shell:Shell
arch -x86_64 /usr/local/bin/brew uninstall v8@3.15
```

もしそれらの手順に従ってインストールしてしまった場合は上記のコマンドで削除してください。

## ARM 版 v8 を追加
Intel 版 Homebrew の v8@3.15 を削除した代わりに、ARM 版 (M1 Mac 版) Homebrew で、バージョンを指定しない v8 をインストールしました。

```shell:Shell
brew install v8
```

ARM 版 Homebrew では v8@3.15 はインストールできませんが、v8 はインストールできます。

ただこれはあとから考えると必要だったのかどうかは不明です。いったん削除して最初から全部試すのも面倒なので検証はしていないです……。

## 不要な gem を削除
JS 周りの gem をいろいろ試したのですが、結局どれも M1 Mac では正しく動作しないどころか、これがインストールされているのが原因で勝手に使おうとして動いていなかった可能性もあります。

そのため、以下の gem が `Gemfile` に記述されている場合は、そのプロジェクトで使っていない限り削除したほうが良いかもしれません。

```diff:Gemfile
-gem 'libv8'
-gem 'libv8-node'
-gem 'therubyracer'
-gem 'mini_racer'
```

その後、`bundle install` も忘れずに実行してください。

```shell:Shell
bundle install
```

どこかで勝手に使われている可能性もあるので、単に `Gemfile` から削除するだけでなく、システムからも削除することをおすすめします。

```shell:Shell
gem uninstall libv8 libv8-node therubyracer mini_racer
```



# おつかれさまでした
ここから先は単に `therubyracer` を M1 Mac で使うのが現実的ではないということを示すためだけの筆者のただの奮闘記ですので、時間に余裕のある方のみで大丈夫です。



# インストール手順について
`therubyracer` のインストールには `libv8` のインストールが必要で、`libv8` のインストールには `v8` が必要です。

つまり、`v8` ← `libv8` ← `therubyracer` という依存関係になっています。

このうち `v8` は Homebrew でインストール、`libv8` と `therubyracer` は gem でインストールします。



# v8
なのでまずは Homebrew で v8 をインストールしようとしてみます。`therubyracer` で必要なのは v8@3.15 なのでこれをインストールします。

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

すると互換性がないというエラーが表示されてしまいます。理由は単純に ARM プロセッサで x86_64 用のプログラムを実行しようとしているから、だと思いますが、`arch -x86_64 bundle exec rake routes` としても同じエラーになってしまいます。

`rake` だけでなく `rails` などでも同じ原因を示すエラーが表示されます。

これを解決する方法が調べてもわからず、詰みました……。

# mini_racer ならどうか？
`therubyracer` の代替として `mini_racer` という gem があります。

これは M1 Mac とも互換性があると言われているのでこちらも試してみてみました。

```shell:Shell
gem install mini_racer
```

しかし、こちらもインストール自体はできるのですが、`symbol not found in flat namespace` というエラーで使うことができませんでした。

* [dyld: Symbol not found: __ZN2v82V813InitializeICUEPKc](https://github.com/rubyjs/mini_racer/issues/185)

余談ですが、このとき [@scruff311 さんのコメント](https://github.com/rubyjs/mini_racer/issues/185#issuecomment-1023694735) を見て `mini_racer` や `libv8-node` などを削除して、`therubyracer` や `mini_racer` などに依存せずにもう一度ビルドし直したらうまくいきました。



# さいごに
M1 Mac で `therubyracer` が使われている Rails アプリケーションを正しく動作させる方法としてはこんなところでしょうか。

* `therubyracer` をプロジェクトから削除する
* フル Docker で環境構築する

個人的にはもう廃れている `therubyracer` を削除するという方針のほうがすっきりするかなあと思います。



# 謝辞
今回の件でいろいろと調べている間に伊藤淳一さんのツイートを見つけ、Twitter で質問させていただきました。`therubyracer` をどうにかするより使わずに済む方向で環境構築したほうが良いというアドバイスのもと、なんとか問題を解決することができました。ありがとうございます！ 🙏

https://twitter.com/i/web/status/1373956412120965122



# 参考サイト
* [How to Install (Or Get Rid Of) therubyracer on M1 or M2 Macs](https://www.rubyonmac.dev/how-to-install-therubyracer-on-m1-m2-apple-silicon-mac)
* [Unable To Install libv8/therubyracer on M1 Macbook Pro (Apple Silicon)](https://github.com/rubyjs/libv8/issues/312)
* [Homebrew on Apple Silicon](https://soffes.blog/homebrew-on-apple-silicon)
* [[Rails]therubyracerのインストールができない！(M1Mac)](https://asapoon.com/ruby/rails/2900/therubyracer-m1-mac/)
* [dyld: Symbol not found: __ZN2v82V813InitializeICUEPKc](https://github.com/rubyjs/mini_racer/issues/185)
