---
title: "Heroku のパイプラインでアプリ名を確認する方法"
emoji: "💭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Heroku"]
published: true
order: 126
layout: article
---

# はじめに
Heroku コマンドを使用する際に、アプリ名を求められることがある。

```shell
heroku config
```

```
 ›   Error: Missing required flag:
 ›     -a, --app APP  app to run command against
 ›   See more help with --help
```

この記事では、パイプラインのアプリ名を確認する方法について解説する。

# アプリとパイプライン
[Heroku のダッシュボード](https://dashboard.heroku.com/apps) にアクセスした際に、アプリの作成とパイプラインの作成がある。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/heroku-pipeline-app-name/Screen%20Shot%202022-03-07%20at%2019.57.04.png)

両者の違いをざっくり説明すると以下の通りである。

| 種類 | 使用用途 | 詳細リンク |
| --- | --- | --- |
| アプリ | Heroku をインフラとして本番環境などのアプリケーションを稼働させたい場合に利用 | |
| パイプライン | 開発環境を簡単に構築しデプロイしたい場合に利用 | [Heroku Pipelineを使ってみる](https://qiita.com/yo-iida/items/f99566fe4617f848fa39) |

# アプリのアプリ名の調べ方
このうち、『アプリ』のアプリ名は自明だ。アプリを作成した際に自分でつけたアプリ名のことである。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/heroku-pipeline-app-name/Screen%20Shot%202022-03-07%20at%2021.15.59.png)

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/heroku-pipeline-app-name/Screen%20Shot%202022-03-07%20at%2021.14.21.png)

上記のスクリーンショットでいう赤枠で囲まれた部分 (`d841ad5efac51db4`) が『アプリ』のアプリ名である。

# パイプラインのアプリ名？
では、パイプラインの場合のアプリ名とは、いったい何を指しているのだろうか。ちなみにパイプラインを作成する際の名称はパイプライン名で、アプリ名ではない。

以下のコマンドはアプリ一覧を表示するものなので、パイプラインに関するものは出てこない。

```shell
heroku list # heroku apps と同じ
```

以下のようにパイプライン一覧を表示するコマンドもあるが、`-a` や `--app` オプションで要求されるのはあくまでアプリ名なので、パイプライン一覧を表示させても意味がない。

```shell
heroku pipelines
```

# パイプラインのアプリ名の調べ方
[アプリ・パイプライン一覧のページ](https://dashboard.heroku.com/apps) から、該当するパイプラインを選択する。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/heroku-pipeline-app-name/Screen%20Shot%202022-03-07%20at%2021.24.50.png)

下のスクリーンショットの赤枠で囲まれた部分 (`test-heroku-app-lhk6nz`) が、パイプラインにおけるアプリ名である。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/heroku-pipeline-app-name/Screen%20Shot%202022-03-07%20at%2021.31.40.png)

`Open app` というリンクをクリックするとデプロイされたアプリケーションの URL に飛ぶことができるが、その際のサブドメイン部分から調べることもできる。

たとえば上記のスクリーンショットの例だと `https://test-heroku-app-lhk6nz.herokuapp.com` となるが、その際の `test-heroku-app-lhk6nz` の部分である。

# アプリ名の指定
アプリ名はわかればあとは簡単だ。`-a` または `--app` オプションでアプリ名を指定することで、該当するパイプラインに対する操作を行うことができる。

たとえば該当するパイプラインの環境変数一覧を取得したければ以下のコマンドを実行する。

```shell
heroku config --app <APP_NAME>
```

`<APP_NAME>` は前の項目の例でいう `test-heroku-app-lhk6nz` である。
