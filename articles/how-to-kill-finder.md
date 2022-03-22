---
title: "Finder の殺し方"
emoji: "🔪"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Mac", "macOS", "Finder"]
published: true
order: 137
layout: article
---

# 殺り方
macOS の Finder.app は、デフォルトだと終了させることはできないが、以下のコマンドをターミナル[^1]で実行すると終了させることができる。

[^1]: ターミナルの開き方がわからない場合は、[ターミナルの開き方](#ターミナルの開き方) を参照すること。

```shell:Shell
defaults write com.apple.Finder QuitMenuItem -boolean true
killall Finder
```

すると、Finder のメニューバーにアプリを終了する項目が表示されるようになる。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/how-to-kill-finder/Screen%20Shot%202022-03-22%20at%2014.05.05.png)

# メリット
筆者は頻繁に command + tab でアプリケーションを切り替えるのだが、そのときにいちいち Finder が一覧に出てくると、一回分多く tab を入力しなければいけなくて煩わしい。

しかし、この方法で Finder を終了させておくと command + tab を押したときに Finder が出てこないので便利である。

# ターミナルの開き方
command + space を押して Spotlight を開き、`terminal.app` と入力してエンターキーを押すとターミナルが開く。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/how-to-kill-finder/Screen%20Shot%202022-03-22%20at%2014.13.20.png)
