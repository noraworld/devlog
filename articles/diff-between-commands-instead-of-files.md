---
title: "diff や colordiff でコマンドの実行結果と比較する方法"
emoji: "🐱"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["diff", "colordiff", "Shell"]
published: true
order: 96
layout: article
---

`diff` や `colordiff` は、通常、2 つのファイルの差分を表示するコマンドだが、他のコマンドの実行結果と比較することもできる。

**2 つのファイルの差分比較**
```shell:Shell
colordiff -u file1 file2
```

**ファイルとコマンドの実行結果の差分比較**
```shell:Shell
colordiff -u file <(command)
```

**2 つのコマンドの実行結果の差分比較**
```shell:Shell
colordiff -u <(command1) <(command2)
```
