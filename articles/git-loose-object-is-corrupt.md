---
title: "Git のエラー \"object file is empty\" や \"loose object is corrupt\" の直し方"
emoji: "👻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["git"]
published: true
order: 163
layout: article
---

# エラー内容
Git 操作をしている間に Raspberry Pi がフリーズしてしまい、再起動後にリポジトリの状態を確認しようとしたら以下のようなエラーが発生しました。

```shell:shell
git status
```

```
error: object file .git/objects/fb/38f089a711a4dfcd7843114d25158dded221ff is empty
error: object file .git/objects/fb/38f089a711a4dfcd7843114d25158dded221ff is empty
fatal: loose object fb38f089a711a4dfcd7843114d25158dded221ff (stored in .git/objects/fb/38f089a711a4dfcd7843114d25158dded221ff) is corrupt
```

エラーが発生したリポジトリのリモートリポジトリを別の場所で clone して、`.git` ディレクトリの中身を丸ごと差し替えるという方法もありますが、今回はリモートリポジトリを作成していない場合も想定してリモートリポジトリを使わずに上記のエラーを修正する方法について紹介しようと思います。



# リポジトリのルートディレクトリに移動
ここから先の作業ではリポジトリのルートディレクトリにいると仮定します。そうでない場合はまず最初に移動してください。

```shell:Shell
cd /path/to/repo
```



# 空のファイルを削除
エラーメッセージを見ると Git の情報を管理する一部のファイルが空になっており、データが破損していると書かれています。そのため、まずは該当するファイルを見つけます。

```shell:Shell
find .git -type f -empty
```

```
.git/FETCH_HEAD
.git/objects/dc/3f1dc308cf66273606e6ff0f3f308676eb0caa
.git/objects/d3/8b76bbf4b80f372e2d19cd738bec8ccafbfc32
.git/objects/fb/38f089a711a4dfcd7843114d25158dded221ff
.git/objects/d4/720586ff6baf19a14ae8ccc883d54d8a3d6e4c
```

`git status` では `.git/objects/fb/38f089a711a4dfcd7843114d25158dded221ff` しか表示されませんでしたが、実際にはそれ以外にもいくつか空もしくは破損しているファイルが存在します。

これらのファイルの中にあった情報は何らかの原因で消えてしまったためファイルごと削除します。

```shell:Shell
find .git -type f -empty -delete
```



# `HEAD` の向き先を変更
破損したファイルを削除したところでもう一度 Git の状態を見てみます。

```shell:Shell
git status
```

```
fatal: bad object HEAD
error: option `merged' must point to a commit
```

エラーメッセージが変わりました。今度は `HEAD` の向き先がおかしいと書かれています。先ほど削除した `.git/FETCH_HEAD` が今まで `HEAD` になっていたようですが、これを削除したために向き先がおかしくなってしまったということです。

そこで、現存する最新の履歴を見てみます。

```shell:Shell
tail -n 2 .git/logs/refs/heads/main
```

メインブランチ名が `master` の場合は `.git/logs/refs/heads/master` に変えて実行してください。

```
4f04774918baa04669a12bec9d8a64b3c65a95b4 b51206040e9446f1acc8b6da1ecd1101f013e6e1 noraworld <mail@noraworld.com> 1686930840 +0900	commit: Add new conf: Netflix Allow
```

これが現存する最新の履歴のようなので、`HEAD` がここを指すように変更します。

```shell:Shell
git update-ref HEAD b51206040e9446f1acc8b6da1ecd1101f013e6e1
```

`b51206040e9446f1acc8b6da1ecd1101f013e6e1` の部分は `tail -n 2 .git/logs/refs/heads/main` で表示された 2 つのコミットハッシュのうちの 2 つめのものを指定します。



# 最終確認
最後にもう一度ステータスを確認してみます。

```shell:Shell
git status
```

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

エラーが解消されもとに戻ったことが確認できました。



# 参考サイト
[Gitのfatal: loose object *** is corruptを解決する](https://higelog.brassworks.jp/3910)
