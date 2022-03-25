---
title: "macOS の script コマンドにはウィンドウリサイズを認識しないバグがある"
emoji: "😕"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["script", "macOS", "BSD", "tput", "stty"]
published: true
order: 138
layout: article
---

# はじめに
このバグがあるのは macOS (BSD) の場合のみ。GNU/Linux (Ubuntu など) ではこのバグは発生しなかった。



# `script` コマンドについて
UNIX には `script` というコマンドがインストールされている。これはターミナルの出力をファイルに出力して記録するものだ。

```shell:Shell
script
```

とするとサブシェルが起動する。ここから先は、ターミナルの出力が記録される。

```shell:Shell
exit
```

として `script` コマンドのサブシェルを抜けると、`script` コマンドを実行する前のカレントディレクトリに `typescript` というファイルが生成される。

このファイルの中に、`script` コマンド実行から終了までの間のターミナルの出力が記録されている[^1]。

[^1]: オプションなしだと `exit` してからファイルが生成される。また、すでに `typescript` というファイルが存在していた場合は、上書きされる。出力があったらすぐにファイルに出力するオプションや、上書きではなく追加するオプションもあるのだが、ここでは割愛する。詳しくは `man script` を参照のこと。

## メリット
ターミナルの出力をファイルに記録しておくメリットとしては以下が挙げられる。

* ターミナルの最大出力行数を超えて、ターミナル上からは消えてしまったログを見たいとき
* タブを閉じたあとのログを見たいとき
* 大量の出力の中に埋もれた特定のログをテキストエディタなどで検索したいとき

これらのメリットがあるため、個人的にはターミナルの出力は常に記録しておきたいのだが、macOS の `script` コマンドには **ウィンドウリサイズを認識しないというバグ** がある。



# 検証
## 正常系
まずは `script` コマンドを実行する前のウィンドウリサイズの挙動を確認する。

`tput` コマンド、または `stty` コマンドを使うとターミナルのウィンドウサイズを取得することができる。

| コマンド | 取得できる情報 |
| --- | --- |
| `tput cols` | 横幅 |
| `tput lines` | 縦幅 |
| `stty size` | 縦幅 横幅 |

```shell:Shell
stty size
41 178
```

そして、ターミナルのウィンドウサイズを変更して、もう一度同じコマンドを実行してみる。

```shell:Shell
stty size
32 134
```

ウィンドウサイズを少し小さくしてみたのだが、ちゃんと反映されている。



## `script` コマンド実行時
続いて、`script` コマンドを実行する。

```shell:Shell
script
```

そして、ウィンドウサイズを取得する。

```shell:Shell
stty size
32 134
```

この状態でウィンドウサイズを変更して、もう一度同じコマンドを実行してみる。

```shell:Shell
stty size
32 134
```

ウィンドウサイズを大きくしてみたのだが、数値が反映されていない。



# 問題点
`tput` コマンドや `stty` コマンドの数値が反映されないだけなら何の問題もないのだが、残念ながらいくつかの副作用がある。

たとえば `less` や `vim` や `man` などの、ページャーを起動するコマンドを実行すると、表示がバグる。

横幅と縦幅を正しく認識できていないので、折り返しを無効にしていても折り返しが発生したり (横幅)、縦にスクロールすると直前の表示が張り付いて表示がぐちゃぐちゃになったり (縦幅) する。

## GNU 実装はインストール不可
BSD 実装の `script` コマンドにバグがあるなら、GNU 実装のものを macOS にインストールすれば良いじゃないかと思うかもしれない。実際、筆者は GNU 実装の `ls` コマンドや `grep` コマンドを macOS にインストールして使っている。

しかし、残念ながら `script` コマンドに関しては GNU 実装のものを macOS にインストールすることができない。



# 解決策
## ターミナルのウィンドウリサイズに合わせてコマンドを実行する
`stty` コマンドで正しい横幅と縦幅を教えることで正常な挙動に戻すことができる。

```shell:Shell
stty rows <縦幅> cols <横幅>
```

しかし、ウィンドウリサイズをするたびに横幅と縦幅を調べて上記のコマンドを実行するのは面倒……。

## ウィンドウリサイズしない
昔はこれで対応していたときもあるが、やはりウィンドウサイズを途中で変更できないのは不便だった。

## iTerm2 の機能を使う
[iTerm2](https://iterm2.com) には `script` コマンドを使わずとも設定でターミナルの出力をファイルに記録する機能が実装されている。

`Profiles` -> `Session` -> `Miscellaneous` -> `Automatically log session input to files in` から保存先のパスを指定すると、そのディレクトリに出力ファイルを保存してくれる。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/script-command-bug/Screen%20Shot%202022-03-22%20at%2023.05.05.png)

`Log plain text` にチェックを入れると、エスケープシーケンスなどを除外してくれる。エスケープシーケンスが入っていると見づらくなるので、チェックをつけておくことをおすすめする。

ただ、これはあくまで iTerm2 の話なので、別のターミナルアプリ (Terminal.app や VS Code のターミナル機能など) には適用されない。

筆者は最近、起動するアプリを減らすために VS Code のターミナルを使おうかなと思っているのだが、出力を記録できないので二の足を踏んでいる。

---

何か良い解決策はないものか。



# 参考
* [BSD script command prevents a terminal from recognizing its size. How can I fix this?](https://stackoverflow.com/questions/68554149/bsd-script-command-prevents-a-terminal-from-recognizing-its-size-how-can-i-fix)
* [Delete code related to recording](https://github.com/noraworld/dotfiles/commit/f2976bf95b57a3293385f9c194487deafb16ee53)
