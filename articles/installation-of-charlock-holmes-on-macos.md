---
title: "macOS で charlock_holmes がインストールできないときの解決法"
emoji: "👻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Rails", "Ruby", "Rails4", "Rails5"]
published: true
order: 53
layout: article
---

macOS で Rails アプリケーションの環境構築をするために `bundle install` をしたら、charlock_holmes のインストールでエラーが出ました。

```
An error occurred while installing charlock_holmes (0.7.5), and Bundler cannot continue.
Make sure that `gem install charlock_holmes -v '0.7.5' --source 'https://rubygems.org/'` succeeds before bundling.
```

そんなときは以下のコマンドを実行します。

```bash
$ brew install icu4c cmake
# 'x.x.x' をインストールしたいバージョンに置き換える
$ gem install charlock_holmes -v 'x.x.x' -- --with-cppflags=-DU_USING_ICU_NAMESPACE=1 --with-cxxflags=-std=c++11
```

`x.x.x` の箇所は、インストールしたい charlock_holmes のバージョンを指定します。たとえば上記のエラーでは `0.7.5` をインストールしようとしているので、その場合は `x.x.x` の箇所を `0.7.5` に置き換えます。

これで charlock_holmes がインストールできるようになりました。

# 参考
- [Unable to install version 0.7.3 on Mac OS Sierra - issuecomment-393214583](https://github.com/brianmario/charlock_holmes/issues/117#issuecomment-393214583)
