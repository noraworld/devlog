---
title: "macOS で \"failed to open for writing: Resource busy\" と表示される場合の対処法"
emoji: "😵"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["macOS", "df", "diskutil", "shred"]
published: true
order: 143
layout: article
---

# TL;DR
先にアンマウントする。

# 症状
USB 内にあるデータを完全削除しようと思い、shred コマンドを実行したら "Resource busy" と言われてしまった。shred コマンド以外でも、このエラーが出ることはある。

# 解決法
## ファイルシステム名の検索
以下のコマンドを実行する。

```shell:Shell
df
```

対象のファイルシステム名 (例: `/dev/disk2s1`) をクリップボードにコピーしておく。macOS では、USB は `/Volumes` 以下にマウントされるので、"Mounted on" の欄が `/Volumes/<USB_NAME>` となっているディスクの "Filesystem" の欄をコピーすれば良い。

## アンマウント
そして、対象のファイルシステムをアンマウントする。

```shell:Shell
diskutil unmount <FILESYSTEM_NAME>
```

## 所望のコマンドを実行
その後、実行したいコマンドを実行する。たとえば、USB の中身を完全消去したければ以下のコマンドを実行する。

```shell:Shell
sudo shred -uvz <FILESYSTEM_NAME>
```

参考: [ハードディスク内のデータを本当の意味で完全消去する方法](https://zenn.dev/noraworld/articles/delete-data-in-hdd-completely)

# 参考サイト
* [Using dd I'm getting a Resource Busy error](https://forums.macrumors.com/threads/using-dd-im-getting-a-resource-busy-error.384730/?post=4475931#post-4475931)
* [Mount & Unmount Drives from the Command Line in Mac OS X](https://osxdaily.com/2013/05/13/mount-unmount-drives-from-the-command-line-in-mac-os-x/)
