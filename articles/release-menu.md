---
title: "リリース時にリリース内容をコメントする GitHub Actions のご紹介"
emoji: "🚀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["git", "github", "release", "git-pr-release", "github-pr-release"]
published: true
order: 145
layout: article
---

# はじめに
リリース時にリリース内容をコメントする GitHub Actions を作ったので紹介します。



# リポジトリ
[Release Menu](https://github.com/noraworld/release-menu)



# 動作
具体的な動作としては、リリースブランチ (名前が `release` で始まるブランチなど) からプロダクションブランチ (`main` ブランチなど) にマージする PR を作成した際に、その中に含まれる変更内容の PR 一覧をリリース PR のコメントに残します。

![](https://raw.githubusercontent.com/noraworld/release-menu/7985bbb0c86b9f789975deaa462aab6090fd7fe2/screenshots/github_comment.png)

また、オプションとして Slack に投稿する機能も実装しています。

![](https://raw.githubusercontent.com/noraworld/release-menu/7985bbb0c86b9f789975deaa462aab6090fd7fe2/screenshots/slack_message.png)



# 使い方
YAML ファイルをリポジトリに置くだけで動作するので導入はとても簡単です。

```yaml
# .github/workflows/release-menu.yml

name: "Release Menu"

on:
  pull_request:
    types: [opened]

jobs:
  release-menu:
    if: startsWith(github.event.pull_request.head.ref, 'release')
    runs-on: ubuntu-latest
    steps:
      - name: "Menu"
        uses: noraworld/release-menu@v0.1.0
        with:
          # ここにオプションを追加
          # base: master
          # mode: optimized
```

オプションなどの詳細は [README](https://github.com/noraworld/release-menu/blob/main/README/ja.md) を参照してください。

あとは名前が `release` で始まるブランチをマージ元として PR を作ると自動的に動作してコメントを残してくれます。

Slack にも投稿する場合は Slack 側でボットを作成したりトークンや投稿先チャンネル情報を GitHub のシークレットに埋め込む必要があります。



# 苦労したポイント
開発ブランチ (`develop` ブランチなど) と プロダクションブランチ (`main` ブランチなど) のコミットの差分からマージコミットだけを抽出して、そのマージコミットに紐づくそれぞれの PR を GitHub API で調べれば簡単に実装できそうと思っていました。

実際、その実装はオプションという形で採用しました[^1]し、PR をマージする際にマージコミットを必ず作るのであればこれで全く問題ありません。

[^1]: これがモード `merged` です。

しかし、GitHub では PR をマージする際に [3 つのオプション](https://zenn.dev/noraworld/articles/github-merge-options) があります。

そのうちの `Create a merge commit` を選べばマージコミットが生成されますが、`Squash and merge` や `Rebase and merge` を選ぶとマージコミットが生成されません。マージコミットが生成されないということは、開発ブランチとプロダクションブランチの全コミットの差分から PR を探さなければなりません。

どのコミットがどの PR に紐付いているか、あるいは紐付いていないかは GitHub API を叩かないとわかりません。しかもマージコミットだけ、のように Git の操作で範囲を絞り込むこともできないため、全コミットに対して GitHub API を叩くことになります[^2]。そうなると、プロジェクトによっては前回のリリースから時期が長く空いている場合は叩く API の回数が多くなってリクエスト制限がかかってしまうのではないか、と思いました。

[^2]: これがモード `all` です。

マージ時に `Rebase and merge` を選択したり、開発ブランチに直接コミットをプッシュしたりする場合はこの方法でしかすべての PR を検出できなさそうですが、`Create a merge commit` や `Squash and merge` しかしないのであれば、もう少しスマートな方法があるのではないかと考えました。

開発ブランチとプロダクションブランチの全コミットの差分のうち、マージコミットは最初の方法で取得できるので OK です。問題はマージコミットじゃないコミットの中に PR に紐づくコミットがあるということです。それが `Squash and merge` したときのコミットです。

このコミットに紐づく PR を調べるためだけに全コミットに対して API を叩くのは非効率です。なのでこうします。

まず、マージコミットに紐づく PR を API を叩いてすべて取得します。その後、それぞれの PR に紐づく全コミットを API を叩いて取得します。これは PR 1 つにつき 1 回の API リクエストで済みます。

開発ブランチとプロダクションブランチの全コミットの差分から、マージコミットと、先ほど調べた PR に紐づくコミットを引けば、残るのは `Squash and merge` したときのコミットになるはずです。あとはこのコミットそれぞれに対して API を叩いて PR を取得し、マージコミットに紐づく PR と組み合わせれば全 PR を取得できます[^3]。

[^3]: これがモード `optimized` です。

もちろんこの方法は `Create a merge commit` または `Squash and merge` のみ使用している場合に限ります。`Rebase and merge` を使っている場合や直接コミットをプッシュしている場合は、PR に紐づく全コミットを取得する分、無駄に API を叩いてしまうので返って回数が増えてしまいます。その場合は全コミットに対して API を叩くしかないです[^2]。

一番最後の方法を思いつくのと実装するのに少し苦労しました。



# N 番煎じ
実はこのようなツールはすでに存在しています。

* [git-pr-release](https://github.com/x-motemen/git-pr-release)
* [github-pr-release](https://github.com/uiur/github-pr-release)

そして Release Menu の実装を始める前からこれらが存在することはすでに知っていました。知っていてあえて新しく自分で作った理由は以下のとおりです。

* シェルスクリプトで実装してみたかった
* Slack に投稿する機能が欲しかった

## シェルスクリプトで実装してみたかった
[git-pr-release](https://github.com/x-motemen/git-pr-release) は Ruby、[github-pr-release](https://github.com/uiur/github-pr-release) は JavaScript で実装されています。

別にどんな言語で実装しようが問題ないのですが、主に Git の操作を行うものなので、シェルスクリプトを使うのが一番シンプルに実装できるのではないかなと思いました。

GitHub Actions では `git` コマンドや `gh` コマンド (GitHub CLI) が最初から使えます。特別なライブラリをインストールすることなく、しかも `git` コマンドが使えるので各ライブラリでの書き方を覚えることなく実装できるのはメリットだと感じました。

あと GitHub API を叩くのも `gh` コマンドが使えて、必要なトークンの設定などもほぼいらない (YAML にちょっと書くだけで済む) のでとても簡単でした。

## Slack に投稿する機能が欲しかった
現在、筆者が所属しているチームでは、リリースする際にリリース時期とリリース内容を事業部側に事前に伝えるという体制になっています。ただ事業部側は GitHub を見ないので、Slack にも投稿される機能があれば便利だなと思いました。



# さいごに
まあぶっちゃけ既存のものを使わせてもらったほうが楽ではあったのですが、自分で作ってみたかったというのが正直な感想です。Slack 投稿機能も一緒になっているものがあれば他の人にとっても便利かなと思ったので。
