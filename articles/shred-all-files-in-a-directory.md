---
title: "ディレクトリ内の全ファイルを shred する方法"
emoji: "💣"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["完全消去", "rm", "shred", "find", "sed"]
published: true
order: 70
---

# ディレクトリを shred することはできない
ファイルやディスクを完全消去するコマンドとして `shred` コマンドというものがありますが、ディレクトリに対しては使用できません。

```shell
$ shred dir
shred: dir: failed to open for writing: Is a directory
```

`rm` や `cp` では `-r` オプションを付ければディレクトリを操作することができますが、`shred` にはそのようなオプションは存在しません。

では、ディレクトリ内に存在するすべてのファイルを完全消去したい場合にはどうしたら良いでしょうか。その方法を紹介します。

## Tips: rm コマンドが「完全消去」ではない理由について
`rm` コマンドでは完全消去にはならない理由については [こちら](https://qiita.com/noraworld/items/72d6a6dc5014f44e789f#rm-%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%81%A7%E3%81%AF%E3%83%80%E3%83%A1%E3%81%AA%E3%81%AE%E3%81%8B) を参照してください。

# 解決法
`dir` というディレクトリを完全消去したい場合、以下のコマンドを実行するだけです。

```shell
$ find dir -type f -print0 | xargs -0 shred -uvz
$ rm -rf dir
```

## 解説
### find dir -type f -print0
`find` コマンドで `dir` ディレクトリ内のファイルのみを相対パスで一覧表示します。`-type f` は「ファイルのみ」を表示するオプションです。

### xargs -0 shred -uvz
`xargs` コマンドを使って `shred` にファイル一覧を渡します。

`shred` のオプション `-uvz` はそれぞれ、shred 後にファイルを削除、進捗表示、ランダム値書き込み後に `0` 埋めをするオプションです。

### -print0 と -0 について
`find` コマンドの `-print0` と `xargs` コマンドの `-0` については以下を参照してください。

[findとxargsコマンドで-print0オプションを使う理由(改)](https://qiita.com/maskedw/items/2dfdf6fa7eee991ddc45)

### rm -rf dir
最後に結局 `rm` 使ってるんですが、これは空のディレクトリとシンボリックリンクを削除するためです。`shred` コマンドではあくまでディレクトリ内のすべてのファイル (シンボリックリンクを除く) を完全消去しただけで、残った空のディレクトリとシンボリックリンクまでは削除してくれません。なので `rm` コマンドで空のディレクトリとシンボリックリンクを削除します。

`rm` コマンドではなく、本当にファイルが `shred` コマンドで消えたのか不安な場合は `rm` 実行前に `tree` コマンドなどを利用して空のディレクトリとシンボリックリンクのみのツリーになっていることを確認すると良いでしょう。

# 参考
- [ファイル・ディスクの中身を完全消去](http://yang.amp.i.kyoto-u.ac.jp/~yyama/Ubuntu/strage/shred.html)
- [xargs: unmatched single quote; by default quotes are special to xargs unless you use the -0 option](https://askubuntu.com/questions/1106805/xargs-unmatched-single-quote-by-default-quotes-are-special-to-xargs-unless-you)
