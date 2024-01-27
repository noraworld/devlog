---
title: "特定のファイル・ディレクトリのコミット履歴を保持したまま別のリポジトリに移動させる方法"
emoji: "🐙"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["git"]
published: true
---

# 読むのがめんどくさい人向け
```shell:shell
# コピー元リポジトリから対象ファイル・ディレクトリの全履歴を取得
cd <コピー元リポジトリ>
git format-patch --root -o <パッチファイルの出力先> <対象ファイル・ディレクトリ>

# パスの修正 (必要に応じて)
cd <パッチファイルの出力先>
find . -type f -exec sed -i 's/<変換前のパス>/<変換後のパス>/g' {} +

# コピー先リポジトリに対象ファイル・ディレクトリをコピー
cd <コピー先リポジトリ>
git am <パッチファイルの出力先>/*

# お片付け
rm -rf <パッチファイルの出力先>
```

# はじめに
今までこのファイルやこのディレクトリはリポジトリ A で管理していたけど、やっぱりリポジトリ B で管理したい！ っていうこと、ありませんか？

単にファイルやディレクトリを移動・コピーするだけなら `mv` コマンドや `cp` コマンドで簡単にできますが、せっかく Git で管理しているのにこれだと履歴が途絶えてしまいます。

今回はファイルやディレクトリに基づくコミット履歴を保持しつつコピーする方法について紹介します。また、コピー先でパスを改変する方法についても併せて解説します。

# 想定ケース
説明を分かりやすくするため、ホームディレクトリを作業スペースとします。

```mermaid
flowchart TB
    subgraph home[home directory]
        subgraph proj_a[proj_a]
            subgraph dir_a[dir_a]
                file_a[want_to_move.txt]
            end

            git_a[.git/]
        end

        subgraph proj_b[proj_b]
            file_b[want_to_move.txt]
            git_b[.git/]
        end

        subgraph tmp[tmp]
            patch_a[0001-foo.patch]
            patch_b[0002-bar.patch]
            patch_c[0003-baz.patch]
        end
    end

    file_a -- history --> patch_a
    file_a -- history --> patch_b
    file_a -- history --> patch_c

    patch_a -- history --> file_b
    patch_b -- history --> file_b
    patch_c -- history --> file_b
```

* Git の履歴を保持したまま `~/proj_a/dir_a/want_to_move.txt` を別リポジトリ `~/proj_b/` にコピーする
* コピー後は `~/proj_b/dir_a/want_to_move.txt` ではなく `~/proj_b/want_to_move.txt` として保存する (Git の履歴からパスを改ざんする)
* パッチファイル (Git の履歴情報が含まれるファイル) は一時的に `~/tmp` に保存する

# 事前準備
「想定ケース」に挙げたディレクトリ構造を用意します。ディレクトリ構造が理解できている方は読み飛ばしても構いません。

ディレクトリ `~/proj_a` (と `~/proj_a/dir_a`), `~/proj_b`, `~/tmp` を作ります。

```shell:shell
mkdir -p ~/proj_a/dir_a
mkdir ~/proj_b
mkdir ~/tmp
```

`~/proj_a`, `~/proj_b` は Git ディレクトリなので Git の準備を行います。

```shell:shell
cd ~/proj_a
git init

cd ~/proj_b
git init
```

`~/proj_a/dir_a/want_to_move.txt` を作り、適当にファイルの中身を編集してコミットします。

```shell:shell
cd ~/proj_a
touch dir_a/want_to_move.txt

git add dir_a/want_to_move.txt
git commit -m "foo"

echo hello > dir_a/want_to_move.txt
git add dir_a/want_to_move.txt
git commit -m "bar"

echo world >> dir_a/want_to_move.txt
git add dir_a/want_to_move.txt
git commit -m "baz"
```

`~/proj_a` には、`~/proj_a/dir_a/want_to_move.txt` に何かしらの変更を加えたコミットが 3 つ生成されているはずです。

```shell:shell
cd ~/proj_a
git log
```

```
commit c1a2f935cdae186c877858e0f618daa864061db2
Author: user <user@example.com>
Date:   Sat Jan 27 02:45:00 2024 +0900

    baz

commit ea2783d901c4f8539579507d3a0a7010f9abf35e
Author: user <user@example.com>
Date:   Sun Jan 21 01:20:59 2024 +0900

    bar

commit d3367c44334d7a3d39f455bd04b2d363c59ab282
Author: user <user@example.com>
Date:   Wed Jan 17 07:40:42 2024 +0900

    foo
```

これで「想定ケース」に挙げたディレクトリ構造が完成しました。

# 実現方法
`~/proj_a/dir_a/want_to_move.txt` を `~/proj_b/` にコピーしたいとします。ただ、`cp` コマンドでコピーすると Git の履歴まではコピーできません。

Git の履歴を保持したまま別のリポジトリにファイルをコピーするには、以下の操作を行います。

1. コピーしたいファイルに関わる全コミットをパッチファイルとしてダンプする
2. コピー先のディレクトリ (リポジトリ) でパッチファイルを適用する

作成されるパッチファイルはどこに置いても良いのですが、`~/proj_a` や `~/proj_b` に置くとややこしいので `~/tmp` に置くことにします。

# 操作手順
具体的な操作手順は以下のとおりです。

まず、パッチファイルを作成します。

```shell:shell
cd ~/proj_a
git format-patch --root -o ~/tmp dir_a/want_to_move.txt
```

`~/tmp` にパッチファイルが作成されます。`want_to_move.txt` を編集するコミットを 3 つ作ったので 3 つのファイルが生成されているはずです。

```shell:shell
ls ~/tmp
0001-foo.patch
0002-bar.patch
0003-baz.patch
```

`foo`, `bar`, `baz` の部分はコミットメッセージになります。

`~/proj_a` 内では `dir_a/want_to_move.txt` というパスになっているので、このままパッチファイルを適用すると `~/proj_b/dir_a/want_to_move.txt` となります。

そうではなく `~/proj_b/want_to_move.txt` としたい場合は以下のようにパッチファイルの中身を改ざんする必要があります。

```shell:shell
cd ~/tmp
find . -type f -exec sed -i 's/dir_a\/want_to_move.txt/want_to_move.txt/g' {} +
```

同じパスで良い場合は上記のコマンドはスキップしてください。

最後に `~/proj_b` でパッチファイルを適用します。

```shell:shell
cd ~/proj_b
git am ~/tmp/*
```

これで `want_to_move.txt` の履歴を保持したまま `~/proj_b/want_to_move.txt` としてファイルをコピーすることができました。

```shell:shell
cd ~/proj_b
git log
```

```
commit c1a2f935cdae186c877858e0f618daa864061db2
Author: user <user@example.com>
Date:   Sat Jan 27 02:45:00 2024 +0900

    baz

commit ea2783d901c4f8539579507d3a0a7010f9abf35e
Author: user <user@example.com>
Date:   Sun Jan 21 01:20:59 2024 +0900

    bar

commit d3367c44334d7a3d39f455bd04b2d363c59ab282
Author: user <user@example.com>
Date:   Wed Jan 17 07:40:42 2024 +0900

    foo
```

# お片付け
作業が完了したら `~/tmp` は削除しても大丈夫です。

```shell:shell
rm -rf ~/tmp
```

# 一般的な説明
上記ではファイルをコピーすることを例に挙げましたが、実際にはディレクトリを丸ごとコピーすることもできます。その場合はもちろんそのディレクトリ内にあるファイル・ディレクトリに関わるすべてのコミット履歴を保持するパッチファイルが作成されます。

特定のファイル・ディレクトリに関わるすべてのコミット履歴をパッチファイルとして特定のディレクトリ内に出力するには以下のコマンドを実行します。

```shell:shell
cd <コピー元リポジトリ>
git format-patch --root -o <パッチファイルの出力先> <対象ファイル・ディレクトリ>
```

コピー先リポジトリでパスを改変したい場合は以下のコマンドを実行します。

```shell:shell
cd <パッチファイルの出力先>
find . -type f -exec sed -i 's/<変換前のパス>/<変換後のパス>/g' {} +
```

ディレクトリ構造を表す `/` は `\/` に変換する必要があります。たとえば `dir_a/want_to_move.txt` は `dir_a\/want_to_move.txt` とする必要があります。

パッチファイルを適用するには以下のコマンドを実行します。

```shell:shell
cd <コピー先リポジトリ>
git am <パッチファイルの出力先>/*
```

# 参考
* [Gitで特定のディレクトリをコミット履歴を保持したまま別のリポジトリに移動させたい](https://zenn.dev/oyasumi731/articles/5c6cf1573def63)
* [Git Patch Path Change](https://chat.openai.com/share/49c78161-2a7c-4903-a5fc-3a1dc02ebfac)
