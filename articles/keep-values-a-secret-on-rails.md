---
title: "【Ruby on Rails】GitHubに公開したくない変数や値を隠してpushする方法"
emoji: "😸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Rails", "Rails4", "Ruby", "環境変数"]
published: false
order: 9
---

GitHubで公開したくないデータ(パスワードなど)を別ファイルに書いておいて、viewやcontrollerでそのデータを使う方法を紹介します。今回は環境変数を使用してデータを参照できるようにします。

# 環境
Ruby on Rails 4.2.6
Ruby 2.0.0p353

# dotenvのインストール
環境変数を使うためにdotenvを導入します。`Gemfile`に下記を追加します。追加する場所はループの中以外ならどこでもOKです。

```ruby:Gemfile
gem 'dotenv-rails'
```

上記を追加したら`bundle install`を実行します。

`$ bundle install`

# 環境変数を定義
dotenvでは`.env`というファイルの中に書いてあるデータを参照します。`.env`をアプリケーションディレクトリのルートディレクトリ(appやdbやGemfileがあるディレクトリ)に作成し、公開したくないデータを定義します。

```ruby:.env
LOGIN_NAME='noraworld'
LOGIN_PASSWORD='fh328sd9fshkq342bsfhsfuew'
```

# 環境変数の使い方
viewやcontrollerで以下のように書けば使えるようになります。

```ruby:viewやcontroller内のファイル
ENV['LOGIN_NAME']
ENV['LOGIN_PASSWORD']
```

# gitignoreに追加
隠しておきたいデータを定義した`.env`ファイルをGitHubに公開してしまっては意味が無いのでこのファイルは公開しないようにします。`.gitignore`に下記を追加します。

```lang:.gitignore
/.env
```

これで`.env`内のデータを隠してGitHubでコードを公開できるようになります。

# 参考サイト
[Railsで環境変数をライトに使う](http://mikazuki-ttp.hatenablog.com/entry/2015/07/24/170434)
