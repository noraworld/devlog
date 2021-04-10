---
title: "Zsh: 自作コマンドで補完できるようにする"
emoji: "🦁"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ShellScript", "Zsh"]
published: true
order: 90
layout: article
---

# はじめに
自作コマンドに補完機能をつける機会があったので、そのときに得た知見をまとめる。

なお、他にもいろいろ便利な補完機能があったので、使う機会があったらその都度、記事を更新していこうと思う。

# セットアップ
補完機能を使うためのセットアップを行う。

## 補完を有効にする
まずは Zsh で補完を有効にする。

```shell:~/.zshrc
autoload -Uz compinit && compinit
```

## パスを通す
`$fpath` に補完スクリプトを追加する。

```shell:~/.zshrc
fpath=( /path/to/Your-self-made-completion "${fpath[@]}" )
autoload -Uz your-self-made-completion
```

`/path/to/Your-self-made-completion` には補完スクリプトを設置するパスを指定し、`your-self-made-completion` には補完スクリプトのファイル名を指定する。

なお、慣習として、`$fpath` に追加するパス (`/path/to/Your-self-made-completion`) のディレクトリ名は先頭を大文字にし、補完スクリプトのファイル名は、補完対象のコマンドの先頭に `_` をつけた名前にするらしい。

| 項目 | 例 | 備考 |
|---|---|---|
| `$fpath` に追加するパス | `~/zsh/functions/Foo` | このパスに `_foo` を設置する |
| 補完スクリプト名 | `_foo` | `foo` というコマンドに対する補完スクリプト |

でも、デフォルトで入っているパスの中でも、ディレクトリ名の先頭が大文字になっていないものもそれなりにあるので、特に気にする必要はないのかも。

## 補完スクリプトを作成する
補完スクリプトファイルを新規作成する。

```shell:Shell
mkdir -p /path/to/Your-self-made-completion
touch /path/to/Your-self-made-completion/_foo
```

## 再起動
シェルを再起動する。

```shell:Shell
exec -l $SHELL
```

# 補完スクリプトの書き方
先ほど作った `_foo` に補完スクリプトを書いていく。

## 全体像
```shell:_foo
#compdef foo

_foo() {
  local -a val
  val=(foo bar baz)

  local -a fruits
  fruits=(apple banana orange)

  _arguments '1: :->arg1' '2: :->arg2'

  case "$state" in
    arg1)
      _values $state $val
      ;;
    arg2)
      _values $state $fruits
      ;;
  esac
}

compdef _foo foo
```

## 記述ルール
* 1 行目に `#compdef <コマンド名>` を書く
* 最終行に `compdef <補完スクリプトファイル名> <コマンド名>` を書く
* ファイル名と同じ関数を定義し、その中に補完スクリプトを書いていく

1 行目のマジックコメントがあれば、最終行は不要なはず、、、なのだが、マジックコメントだけではうまく機能していなかった。

## ファイルの変更を反映させる場合 (開発時)
ファイルを変更しても、すぐには反映されない。

反映させるには、シェルを再起動する。

```shell:Shell
exec -l $SHELL
```

## 変数定義について
このスクリプト内でふつうに変数を定義してしまうと、カレントシェル (インタラクティブシェル) でも有効になってしまう。

それでも動くには動くが、あまり良い書き方ではない。

それを防ぐために、以下のような書き方で変数を定義する。

```shell
local -a <変数名>
```

これでこの変数のスコープはこのスクリプト内に閉じられる。

## _values
`_values` を使って、補完する文字列を複数指定できる。

たとえば、以下のように書いたとする。

```shell
_values 'subcmd' 'foo' 'bar' 'baz'
```

コマンド名が `foo` だったとすると、以下のような挙動となる。`[TAB]` の位置でタブキーを押したことを意味する。

```shell:Shell
foo [TAB]
# bar, baz, foo が候補に表示され、さらにタブキーを押すたびに bar, baz, foo が順番に補完される

foo b[TAB]
# bar, baz が候補に表示され、さらにタブキーを押すたびに bar, baz が順番に補完される

foo f[TAB]
# foo が補完される
```

補完候補の順序は、アルファベット順に自動的に並び替わるようだ。

`_values` の最初の引数 `subcmd` は、この補完の名前のようなもの。

以下の 1 行を `~/.zshrc` に追加すると、ここで設定した `subcmd` が表示される。

```shell:~/.zshrc
zstyle ':completion:*' format '%B%d%b'
```

```shell:Shell
foo [TAB]
subcmd # <= このように表示される
bar baz foo
```

わかりやすい文字列を設定すると良い。めんどくさかったら適当で良い。

ちなみに、補完候補は配列の変数を指定することもできる。

```shell
local -a comps
comps=(foo bar baz)

_values 'subcmd' $comps
```

挙動は先ほどと同じだ。

### 補完候補に説明を入れる
ただ補完候補を列挙するだけでなく、それらの補完候補に説明を入れることができる。

```shell
_values 'subcmd' 'foo[this is foo]' 'bar[this is bar]' 'baz[this is baz]'
```

`'補完文字列[説明]'` という形式で書く。

すると、以下のように表示される。

```shell:Shell
foo [TAB]
bar -- this is bar
baz -- this is baz
foo -- this is foo
```

もちろん、タブキーを押すたびに bar, baz, foo が順番に補完される。

## _arguments
1 つめの引数と 2 つめの引数でそれぞれ別々の補完候補を表示させたい場合などに使う。

たとえば、以下のように書いたとする。

```shell
_arguments '1: :->arg1' '2: :->arg2'
```

すると、1 つめの引数を補完しようとしているときには `$state` に `arg1` が入り、2 つめの引数を補完しようとしているときには `$state` に `arg2` が入る。

この `$state` という変数は勝手に定義されて勝手に値が入る。

これを利用し、1 つめの引数を補完しようとしているときは `foo bar baz` を補完するようにし、2 つめの引数を補完しようとしているときは `apple banana orange` を補完するようにしたい場合は、以下のように書く。

```shell
_arguments '1: :->arg1' '2: :->arg2'

case "$state" in
  arg1)
    _values $state 'foo' 'bar' 'baz'
    ;;
  arg2)
    _values $state 'apple' 'banana' 'orange'
    ;;
esac
```

```shell:Shell
foo [TAB]
# bar, baz, foo が補完候補に出てくる

foo bar [TAB]
# apple, banana, orange が補完候補に出てくる
```

他の用途として、`-k value` や `--key=value` のように、値を伴うオプションを補完したい場合などにも使える。

詳しくは下記を参照。
https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org#writing-completion-functions-using-_arguments

## ファイルの中身を補完候補の文字列にしたい場合
たとえば、`completion_list` というファイルがあり、中身が以下のようなものだったとする。

```text:completion_list
foo
bar
baz
```

このファイルに書かれている文字列をそのまま補完候補の文字列としたい場合、こんな風に書くとうまくいく。

```shell
cmds=( ${(uf)"$(< completion_list)"} )

_values 'subcmd' $cmds
```

```shell:Shell
foo [TAB]
# bar, baz, foo が補完候補に出てくる
```

https://stackoverflow.com/questions/17318913/make-zsh-complete-arguments-from-a-file#answer-17320342

## 他のコマンドの実行結果を補完候補の文字列にしたい場合
他のコマンドの実行結果の文字列を補完候補の文字列とすることもできる。

たとえば以下のように書くと、起動中のプロセス一覧を補完候補とすることができる。

```shell
cmds=( ${(uf)"$(ps -e -o comm)"} )

_values 'subcmd' $cmds
```

```shell:Shell
foo [TAB]
# systemd, cron, sshd, zsh など、起動中のプロセスが補完に出てくる
# ※ Ubuntu Server で実行した結果
```

# まとめ
他にも様々なことができる。使う機会があったらその都度、記事を更新していく。

すべての使い方を知りたければ、以下のドキュメントを参照すると良い。

http://zsh.sourceforge.net/Doc/Release/Completion-System.html

# 参考サイト
* [zsh の補完関数の自作導入編](https://gist.github.com/mitukiii/4954559) (日本語)
  * はじめて書くときに役立つ基本的なことが書かれている
* [zshの補完関数を作ってみた](https://blog.freedom-man.com/zsh-completions) (日本語)
  * これもはじめて書くときに役立つ基本的なことが書かれている
* [zsh で source して使うプラグインを作るのは止めにしよう](https://qiita.com/mollifier/items/6fdeff2750fe80f830c8) (日本語)
  * `$fpath` と `autoload` についてわかりやすく書かれている
* [zsh-completions-howto.org](https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org) (英語)
  * わかりやすくまとめられている
* [Writing Zsh Completion for Padrino](https://wikimatze.de/writing-zsh-completion-for-padrino/) (英語)
  * 例がたくさん載っててわかりやすい
* [How to define and load your own shell function in zsh](https://unix.stackexchange.com/questions/33255/how-to-define-and-load-your-own-shell-function-in-zsh#answer-33898) (英語)
  * `$fpath` を追加する方法について書かれている
* [Make zsh complete arguments from a file](https://stackoverflow.com/questions/17318913/make-zsh-complete-arguments-from-a-file#answer-17320342) (英語)
  * ファイルから補完候補を読み取る方法について書かれている
* [20 Completion System - zsh](http://zsh.sourceforge.net/Doc/Release/Completion-System.html) (英語)
  * ここを見ればすべてがわかるはず
