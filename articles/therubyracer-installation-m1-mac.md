---
title: "M1 Mac (macOS Monterey) で therubyracer のインストールに失敗するときの対処法"
emoji: "🏎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ruby", "v8", "mac", "macos"]
published: true
order: 157
layout: article
---

M1 Mac で therubyracer のインストールに失敗する場合は以下のコマンドを実行します。

```shell:Shell
gem install libv8 -v '3.16.14.19' -- --with-system-v8
gem install therubyracer -v '0.12.3' -- --with-v8-dir=<V8_PATH>
```

`<V8_PATH>` のところには V8 のパスを指定します。Homebrew でインストールしている場合は

```shell:Shell
brew --prefix v8-315
```

で確認できるのですが、このとき

```
Warning: Use v8@3.15 instead of deprecated v8-315
Warning: Use v8@3.15 instead of deprecated v8-315
/opt/homebrew/opt/v8@3.15
```

のように表示されることがあります。この場合は `/opt/homebrew/opt/v8@3.15` を `<V8_PATH>` に指定してください。

なお、警告メッセージが表示されてしまう関係上、`--with-v8-dir=$(brew --prefix v8-315)` としてもうまく動かない場合があるのでご注意ください。



# 参考サイト
* [[Rails]therubyracerのインストールができない！(M1Mac)](https://asapoon.com/ruby/rails/2900/therubyracer-m1-mac/)
