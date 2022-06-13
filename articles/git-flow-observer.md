---
title: "プロジェクトが git-flow に従っているかどうか監視する GitHub Actions を作った"
emoji: "👋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["git-flow", "GitHubActions", "CI", "cherry-pick"]
published: true
order: 144
layout: article
---

# はじめに
以前にこのような記事を投稿しました。

[cherry-pick 運用の地獄から這い上がった話をしよう](https://zenn.dev/noraworld/articles/cherry-pick-operation)

一言でまとめれば、会社のプロジェクトでは cherry-pick を使って運用していてとてもつらかったのでがんばって廃止した、という内容です。

そして、今後、二度とこの悪夢のような運用をしないようにするために、プロジェクトが git-flow に準拠しているかどうかを検証する [git-flow observer](https://zenn.dev/noraworld/articles/cherry-pick-operation) GitHub Actions を作ったので紹介します。



# 導入方法
以下のような YAML をプロジェクトに追加するだけです。廃止場所は `.github/workflows/git-flow-observer.yml` とします。

```yaml
# .github/workflows/git-flow-observer.yml

name: "git-flow observer"

on: pull_request

jobs:
  git-flow-observer:
    if: github.head_ref != 'main' || github.base_ref != 'develop'
    runs-on: ubuntu-latest
    steps:
      - name: "Observe"
        uses: noraworld/git-flow-observer@v0.1.0
        with:
          head: "develop"
          base: "main"
```

`"main"` と書かれている部分は必要に応じて `"master"` に置き換えてください。



# 仕組み

* 以下のような PR をマージしたあと、`main` ブランチに追加されたコミットを `develop` ブランチにマージバックせずに新しい PR を作成した場合に失敗します
    * `main` ブランチにのみ存在するコミットがマージコミットのみの状態で、`develop` ブランチにマージする PR
    * 追加コミットのあるリリースブランチを `main` ブランチにマージする PR
    * ホットフィックスブランチを `main` ブランチにマージする PR
    * cherry-pick されたコミットがある PR
* `main` ブランチから `develop` ブランチにマージする PR を作成した場合はスキップされます (マージバック PR)

失敗した場合は git-flow に準拠していないことがわかります。



# おわりに
もともと、しっかりと git-flow に基づき運用されているプロジェクトであればこれは必要ないかもしれませんが、ぼくが所属しているプロジェクトのように適当な運用になりがちなプロジェクトではこのような仕組みで厳密にチェックするとハッピーになれるかもしれません。
