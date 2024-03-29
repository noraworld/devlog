---
title: "以前に実行したコマンドをもう一度すばやく実行する方法"
emoji: "😸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["コマンドライン", "シェル", "エイリアス", "コマンド", "ターミナル"]
published: true
order: 2
layout: article
---

コマンドラインで作業していると、以前に実行したコマンドをもう一度実行したい状況がよくあります。`ls`などの短いコマンドであればそのまま入力すれば良いですが、長いコマンドを毎回入力するのは大変です。Unix ではコマンドライン上で `ctrl+r` で以前のコマンドを検索することができますが、関連するコマンド履歴を一覧でざざっと表示したいときやコマンド名称の一部しか覚えていないときなどは少々不便です。

# 以前に実行したコマンドを一覧で表示
以前に入力したコマンドの文字列の一部にでも該当するコマンドを一覧で一気に表示するには以下のコマンドが便利です。

`$ history | grep コマンド名の一部`

たとえば、以前に `sudo apachectl restart` を実行したとします。このときに `history | grep apache` と入力すればこのコマンドが表示されます。ここで便利な点として、コマンド名をすべて入力する必要がないということです。つまり、`apachectl`コマンドを仮に忘れてしまっても "apache に関連する何か" ということだけ覚えておけばコマンド履歴から見つけることができます。また、入力したコマンドの一部にその文字列が入っていれば良いので、`history | grep ファイル名` と入力すればそのファイルに対して操作したコマンド一覧を引っ張ってくることもできます。

# ヒットしたコマンドを実行
実行したいコマンドがヒットしたら、`!`のあとにヒストリー番号を入力すればいちいち同じコマンドを入力しなくても良いので便利です。たとえば、`history | grep apache` と入力して、`337 sudo apachectl restart` と出てきたら、`!337` と入力することでそのコマンドが実行できます。

# エイリアスの設定
しかしコマンド履歴を調べるたびに `history | grep` を入力するのはめんどうですよね？そんなときにはこれをエイリアスに設定してしまいましょう。ホームディレクトリの下にある `.bashrc`(zsh の場合は `.zshrc`)に以下のエイリアスを設定して読みこめば OK！

```shell:.bashrc
alias hg='history | grep'
```

入力したら保存して、`.bashrc`(`.zshrc`)再読み込みをします。

`$ source .bashrc` (zsh の場合は `.zshrc`)

これで、`history | grep コマンド名の一部` の代わりに `hg コマンド名の一部` と入力するだけで検索できるようになりました！

# まとめ
- `history | grep コマンド名の一部` でコマンド履歴からコマンド検索
- `!(ヒストリー番号)` でそのコマンドを実行
- `.bashrc`(`zshrc`)にエイリアスとして `hg` を設定しておくと便利
