---
title: "Homebrew Cask でインストールするアプリケーションが、自分の意図したアプリケーションであることを事前に確認する方法"
emoji: "👌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["homebrew", "homebrew-cask", "brew", "brew-cask"]
published: false
order: 67
---

# 結論
`brew search` コマンドを使って [formulae.brew.sh](https://formulae.brew.sh) で検索しましょう。

# はじめに
最近流行りのオンラインミーティングアプリケーションである [Zoom](https://zoom.us) を Homebrew Cask でインストールしようとして、以下のコマンドを実行したことのある人がいるのではないでしょうか。

```shell
# 注意！ このコマンドではオンラインミーティングアプリケーションの Zoom はインストールされません
$ brew cask install zoom
```

でも、このコマンドを実行すると、[オンラインミーティングアプリケーションとは全然関係ない Zoom](https://www.logicalshift.co.uk/unix/zoom/) がインストールされてしまいます。

本来インストールしたかった [オンラインミーティングアプリケーションの Zoom](https://zoom.us) をインストールしたい場合、正しくは以下のコマンドになります。

```shell
$ brew cask install zoomus
```

このように、本来インストールしたいアプリケーションが、自分の予想した Cask 名では登録されていないことがあります。そのため事前に確認する方法を紹介します。

# brew search を使って formulae.brew.sh で検索する
とは言っても手順は簡単で、まずは `brew search` コマンドを実行します。

```shell
$ brew search zoom
```

すると以下のように出力されます。

```
==> Casks
photozoom-pro                    rightzoom                        zoom                             zoom-for-it-admins               zoomin                           zoomus ✔                         zoomus-outlook-plugin
```

"Zoom" と名のつく Cask 一覧が表示されます。

ここで出てきた "zoom" というアプリケーションについて調べます。

"brew cask zoom" のような検索ワードで Google 検索しても良いですし、以下のように `https://formulae.brew.sh/cask/%s` (`%s` には Cask 名が入る。今回だと `zoom`) を事前にブラウザの検索エンジンに登録しておくと便利でしょう。

![スクリーンショット 2020-08-16 14.11.16.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/c768a6a3-5e23-5c10-0b7a-e09e0de60e64.png)

上記のスクリーンショットの例だと、Google Chrome のアドレスバーに "brewcask" と打ってタブキーを押すと "Homebrew Cask を検索" と出るので、続けて "zoom" と打って検索すると https://formulae.brew.sh/cask/zoom にダイレクトでアクセスできます。

すると、以下の Cask が出てきます。

![スクリーンショット 2020-08-16 14.23.00.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/edd80d9d-d368-6777-c183-24ca488759a3.png)

登録されているホームページの URL や GitHub のソースコードを見ると、どうやら今回インストールしたいアプリケーションではないことがわかります。

では次に、"zoomus" で検索してみましょう。すると、以下の Cask が出てきます。

![スクリーンショット 2020-08-16 14.25.49.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/3f232eab-8c76-3b34-6c41-4adffe9edd84.png)

ホームページの URL にアクセスすると、どうやらこれが今回インストールしたかったアプリケーションだということがわかります。あとは `brew cask install zoomus` でインストールすることができます。

# なんで Homebrew Cask を使うの？
Homebrew Cask を使わずに、直接 [Zoom のホームページ](https://zoom.us) からパッケージをダウンロードしてインストールすることもできます。Homebrew Cask を使ったことがない人は、なぜ Homebrew Cask を使うの？ と思われるかもしれません。

今回の例がトラップ ("zoom" だと思ったけど実は "zoomus" だった) だったので煩雑な手順のように感じられたかもしれませんが、名前空間が被っていないことが容易にわかるアプリケーション ("google-chrome" など) であれば、コマンド 1 つで簡単にインストールできるというメリットがあります。

でも、個人的には、それ以上に **Git で管理できる** というメリットのほうが大きいです。

Homebrew でインストールした Formulae や Casks は `Brewfile` というファイルにダンプすることができます。また `Brewfile` を使って Formulae や Casks をまとめてインストールすることもでき、その際に `Brewfile.lock.json` というファイルが生成されます (生成しないようにすることも可能です)。

これらのファイルを Git で管理し、GitHub 上の dotfiles リポジトリにプッシュしておけば、**新しい Mac に鞍替えした際に Formulae や Casks を簡単にリストアすることができます**。

- [Install zoomus - Brewfile](https://github.com/noraworld/dotfiles/blob/ed185663aac79bbc1f47c326c998cfa43bfb8a12/core/Brewfile#L44)
- [Install zoomus - Brewfile.lock.json](https://github.com/noraworld/dotfiles/blob/ed185663aac79bbc1f47c326c998cfa43bfb8a12/core/Brewfile.lock.json#L790-L795)

今まで GUI でインストールしてきたアプリケーションを Homebrew Cask で一からインストールし直すのはめんどくさいですが、今後のことを考えると Homebrew Cask でインストールできるものはこれでインストールしたほうが良いかなと思いました。
