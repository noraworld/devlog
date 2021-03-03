---
title: "6 年 8 ヶ月お世話になった Bash から Zsh に移行した (移行変更点まとめ)"
emoji: "👋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Bash", "Zsh", "shell", "ShellScript"]
published: false
order: 82
---

# はじめに
先日 Bash から Zsh に移行しました。

[noraworld/dotfiles](https://github.com/noraworld/dotfiles) で管理する前から使っているので、その期間も含めると 6 年 8 ヶ月の間、Bash にお世話になりました。

## 移行のきっかけ
そもそも前々から Zsh や Fish が使いやすいという話は聞いていたのでいずれ移行しようとは思っていました。しかし、4 〜 5 年近く bashrc や bash_profile を醸造していたので、他のシェルに移行するのが億劫になっていました。

そんな期間が長く続いたのですが、ついに Zsh に移行することにしました。きっかけとしては、

- Bash に Zsh や Fish のようなプラグインマネージャがないのがすごく不便に感じていた
 - Homebrew などで管理されていないスクリプトを dotfiles で管理しようとすると、そのスクリプトをそのまま置くしかない
 - Bash-Preexec など
- [Bash-Preexec](https://github.com/rcaloras/bash-preexec) が正常に機能しない
- [Starship](https://github.com/starship/starship) の一部の機能が正常に機能しない
 - おそらく Bash-Preexec が原因

あたりです。今後もシェルの環境は定期的に見直して便利にしていきたいと思っていて、Bash のままカスタマイズし続けるのにそろそろ限界を感じていました。

## Fish にしなかった理由
はじめは Fish を使おうと思っていました、実際インストールして軽く試してみました。デフォルトで良い感じにしてくれるというのに魅力を感じたからです。

しかし、Fish は POSIX 非互換なため、4 〜 5 年間、醸造した bashrc や bash_profile を Fish に移行するのは大変そうだという理由で Zsh を選びました。

## この記事について
「Bash から Zsh に移行する」系の記事を見ていると、単に bashrc や bash_profile を zshrc や zprofile にコピーするだけという説明が多かったのですが、自分の環境だと、ただコピーしただけでは動かない部分が多かったです (Bash 固有の記法や仕様を使っているので当然なのですが)。

そのため、この記事ではぼくの dotfiles ([noraworld/dotfiles](https://github.com/noraworld/dotfiles)) で Bash から Zsh に移行するに当たって変更が必要だった部分を紹介します。

記事を読む前にざっくりと変更点 (差分) を知りたい方は、以下のコミット履歴を参考にしてください。

[The default shell is now changed to Zsh from Bash · noraworld/dotfiles@a0a5281](https://github.com/noraworld/dotfiles/commit/a0a52815d9fcb0744ae2813d03c97a124138274e)

# 変更点
ざっと書いていきます。

## カレントシェルで動作するスクリプトから Bash 依存の記法を削除する
自分で作ったシェルスクリプト (Bash) にパスを通して使っている場合、そのすべてを Zsh に移行する必要はありません。shebang を Bash にしておけば、インタラクティブシェルは Zsh のままに、Bash としてそのシェルスクリプトを動かすことができるからです。たいていの場合はそれで問題ありません。

ところが、カレントシェルとして実行させるシェルスクリプトの場合は、Zsh で動作するように書き換える必要があります。たとえばぼくの場合、[mkcd](https://github.com/noraworld/dotfiles/blob/a0a52815d9fcb0744ae2813d03c97a124138274e/bin/src/currentshell/mkcd) という数行のシェルスクリプトをおいています。

```shell
mkdir $1
if [[ -d $1 ]]; then
 cd $1
fi
```

このシェルスクリプトは、引数に指定した名前でディレクトリを作り、同時にそのディレクトリに移動までしてくれます。カレントシェルで移動する必要があるので、このスクリプトはカレントシェルで動作するようにしています。

この場合は当然 Zsh で正常に動かなければ意味がないので、もし Bash 固有の記法 (Zsh では動作しない記法) を使っている場合は書き換える必要があります。

ちなみに上記で説明した `mkcd` コマンドは単純すぎてどこも修正する必要はありませんでした。

また、このようなカレントシェルで動作させるスクリプトでは、shebang は消しておいたほうが良いかもしれません。

## ビルトインコマンドの挙動による違いに注意する
ビルトインコマンドとは、シェルに組み込まれているコマンドのことです。どこかのパスに置かれているコマンドとは異なり、シェル内部で持つコマンドなので、シェルの種類によって挙動が異なる場合があります。

たとえば `history` や `dirs`、`pushd`、`popd` などが該当します。

ビルトインコマンドなのかどうかは `which` コマンドで調べられます。ビルトインコマンドだった場合、Bash の場合は何も出力されず、Zsh の場合は `shell built-in command` と表示されます。

```bash:Bash
$ which history

$ which dirs

$ which pushd

$ which popd
```

```zsh:Zsh
$ which history
history: shell built-in command

$ which dirs
dirs: shell built-in command

$ which pushd
pushd: shell built-in command

$ which popd
popd: shell built-in command
```

重要なのは Bash と Zsh でビルトインコマンドの挙動が異なる場合があることです。たとえば Bash の場合、`history` コマンドを実行すると全件表示されますが、Zsh の場合、デフォルトだと最新の 16 件のみが表示されます。

もし自分で作ったシェルスクリプトやエイリアスで `history` のような挙動の異なるコマンドを使用している場合は、これらの仕様の違いについても考慮する必要があります。

### dirs コマンドの引数について
ビルトインコマンドの挙動の違いに関して、ぼくが遭遇したのは `dirs` コマンドの引数です。

Bash だと `+N` (`N` は数値) を指定すると N 番目のディレクトリスタックを取得できるのですが、Zsh だとそれができませんでした。

```bash:Bash
$ dirs -l -v
 0 /Users/noraworld/Workspace
 1 /Users/noraworld/Workspace/dotfiles/bin/src
 2 /Users/noraworld/Workspace/dotfiles/bin/src/currentshell
 3 /Users/noraworld

$ dirs -l -v +0
 0 /Users/noraworld/Workspace
```

```zsh:Zsh
$ dirs -l -v
0 /Users/noraworld/Workspace
1 /Users/noraworld/Workspace/dotfiles/bin/src
2 /Users/noraworld/Workspace/dotfiles/bin/src/currentshell
3 /Users/noraworld

$ dirs -l -v +0
0 /Users/noraworld/Workspace
1 /Users/noraworld/Workspace/dotfiles/bin/src
2 /Users/noraworld/Workspace/dotfiles/bin/src/currentshell
3 /Users/noraworld
```

ぼくの環境では `dirs -l -v +0` を使っていたので `dirs -l -v | head -1` に置き換えました。[[差分](https://github.com/noraworld/dotfiles/commit/a0a52815d9fcb0744ae2813d03c97a124138274e#diff-0de4bbc9d94f96e68a1e18f016f8b8147a7e25b0e09aba11290288c46f66fb23L3-R1)]

## ビルトインコマンドに対して `command` コマンドを使用しない
詳しいことはわかりませんが、Zsh ではビルトインコマンドに対して `command` コマンドが使用できないようです。

```bash:Bash
$ command history
# history が表示される
```

```zsh:Zsh
$ command history
zsh: command not found: history
```

そのため、自分で作ったスクリプト内でビルトインコマンドに対して `command` コマンドを使用している場合は、使用しないように書き換えてください。[[差分](https://github.com/noraworld/dotfiles/commit/a0a52815d9fcb0744ae2813d03c97a124138274e#diff-4d162bc0e82f2098f24854b00dd6b8e0449f7ae9b6e86d9bb99dec719f106e4fL15-R13)]

## .bashrc ではなく .zshrc をロードする
ここは特に説明不要だと思います。ただし書き直し忘れがありそうなので一応記載します。

```diff:~/.zprofile
- if [ -f ~/.bashrc ]; then
- . ~/.bashrc
- fi
+ if [ -f ~/.zshrc ]; then
+ . ~/.zshrc
+ fi
```

## Bash 用のスクリプトをロードしない
これも自明なのですが念のため書いておきます。Bash completion や Bash-Preexec などを入れている場合は Zsh では削除してください。以下はぼくの環境の例です。

```diff:~/.zshrc
- if [ -e /usr/local/etc/bash_completion.d/git-prompt.sh ]; then
- . /usr/local/etc/bash_completion.d/git-prompt.sh
- fi
```

```diff:~/.zshrc
- if [ -e /usr/local/etc/bash_completion.d/git-completion.bash ]; then
- . /usr/local/etc/bash_completion.d/git-completion.bash
- fi
```

```diff:~/.zshrc
- if [ -e /usr/local/etc/bash_completion.d/git-prompt.sh ]; then
- GIT_PS1_SHOWDIRTYSTATE=true
- fi
```

```diff:~/.zshrc
- [[ -f ~/.bash-preexec.sh ]] && source ~/.bash-preexec.sh
```

```diff:~/.zshrc
- if [ -f `brew --prefix`/etc/bash_completion ]; then
- . `brew --prefix`/etc/bash_completion
- fi
```

ちなみに Bash だと Bash completion を入れないと SSH のホストの補完や Git のサブコマンドの補完を行ってくれませんが、Zsh だとデフォルトで補完してくれるようです。

## `$PROMPT_COMMAND` で実行するコマンドを `precmd()` に移行する
Bash では `$PROMPT_COMMAND` という環境変数にコマンドを入れておくと、コマンドの実行直後 (正確には、新しいプロンプトが表示される直前) に `$PROMPT_COMMAND` 内のコマンドを毎回実行してくれます。

Zsh では `$PROMPT_COMMAND` の代わりに `precmd()` という関数を作って、その中に実行したいコマンド (処理) を書きます。

```diff:~/.zshrc
- if ! [[ "$PROMPT_COMMAND" =~ "<YOUR_COMMAND>" ]]; then
- PROMPT_COMMAND="<YOUR_COMMAND>;$PROMPT_COMMAND"
- fi
+ precmd() {
+ <YOUR_COMMAMD>
+ }
```

あるいは、`$PROMPT_COMMAND` をそのまま残しつつ、`eval` コマンドを使って以下のように書くこともできます。

```diff:~/.zshrc
 if ! [[ "$PROMPT_COMMAND" =~ "<YOUR_COMMAND>" ]]; then
 PROMPT_COMMAND="<YOUR_COMMAND>;$PROMPT_COMMAND"
 fi
+
+ precmd() {
+ eval "$PROMPT_COMMAND"
+ }
```

参考: [What's the ZSH equivalent of BASH's $PROMPT_COMMAND?](https://superuser.com/questions/735660/whats-the-zsh-equivalent-of-bashs-prompt-command)

もっとも、`$PROMPT_COMMAND` の代わりに Bash-Preexec を使っていた場合は、単に Bash-Preexec をロードしないようにするだけで OK です。Bash-Preexec の `preexec()` と `precmd()` は、`trap DEBUG` や `$PROMPT_COMMAND` を使って Zsh のそれらを真似たものなので、関数名を変更する必要はありません。

```diff:~/.zshrc
- [[ -f ~/.bash-preexec.sh ]] && source ~/.bash-preexec.sh
-
 preexec() {
 <YOUR_PROCESSING>
 }

 precmd() {
 <YOUR_PROCESSING>
 }
```

## イニシャルスクリプトをロードしている部分を Bash から Zsh に変える
ツールによっては `~/.bashrc` や `~/.zshrc` にイニシャルスクリプトをロードするように指示されている場合があります。それが Bash 用のものであれば Zsh に置き換えてください。

たとえば Starship や direnv を使っている場合は以下のように置き換えます。

```diff:~/.zshrc
- eval "$(starship init bash)"
+ eval "$(starship init zsh)"
```

```diff:~/.zshrc
- eval "$(direnv hook bash)"
+ eval "$(direnv hook zsh)"
```

## `==` を `=` に置き換える
等価を表す記号に `==` が使えるのは Bash のみです。もし `==` が使われていたら `=` に置き換えてください。以下は例です。[[差分](https://github.com/noraworld/dotfiles/commit/a0a52815d9fcb0744ae2813d03c97a124138274e?branch=a0a52815d9fcb0744ae2813d03c97a124138274e&diff=split#diff-a05dfdac2892713df3b0126ff71e93522f218ba07cb895b6f959fb8536229f1dL208-R177)]

```diff:~/.zshrc
- if [ "$TERM_PROGRAM" == "iTerm.app" ]; then
+ if [ "$TERM_PROGRAM" = "iTerm.app" ]; then
```

参考: [シェルスクリプトでの == を認めているのはbashだけ？](https://qiita.com/yu81/items/b1bde03c06b45f7d267f)

## `$EPOCHREALTIME` を使っている場合は `zsh/datetime` モジュールをロードする
`$EPOCHREALTIME` は UNIX 時間を浮動小数点数で取得するための環境変数です。

Bash ではそのまま使えますが、Zsh では `zsh/datetime` をロードする必要があります。もし `~/.zshrc` 内で `$EPOCHREALTIME` を使用している場合は、`$EPOCHREALTIME` 使用箇所より前に以下を追加します。

```diff:~/.zshrc
+ zmodload zsh/datetime
```

参考: [Zsh で $EPOCHREALTIME を使いたい](https://qiita.com/noraworld/items/fb9e1f7208b1f61187ce)

## `bindkey -e` を追加する (`Ctrl` キーを Bash と同じキーバインドで使用したい場合)
`Ctrl` + `A` でコマンドの行頭に移動、`Ctrl` + `E` で行末に移動、`Ctrl` + `P` で一つ前のコマンド履歴を表示、`Ctrl` + `N` で一つ先の履歴を表示、などのキーバインドが、Bash ではデフォルトで有効でしたが、Zsh だと `^A`、`^E`、`^P`、`^N` のように表示されてしまいます。

上記のキーバインドを有効にするには以下を追加します。

```diff:~/.zshrc
+ bindkey -e
```

ちなみに `bindkey -e` の代わりに `bindkey -v` とすると Vim 風のキーバインドにできます。`-e` は Emacs 風、`-v` は Vim 風ということですね。

つまり Bash は (おそらく Fish も) デフォルトでは Emacs 風のキーバインドになっているということです。

## .inputrc に `set completion-ignore-case on` を入れている場合は以下に置き換える
Bash では `~/.inputrc` に以下を追加することで大文字小文字を無視することができます。

```diff:~/.inputrc
+ set completion-ignore-case on
```

Zsh ではこれでは大文字小文字が無視されないので、代わりに以下を `~/.zshrc` に追加します。

```diff:~/.zshrc
+ autoload -Uz compinit && compinit
+ zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
```

ちなみにこれは、たとえばカレントディレクトリに `Workspace` (`W` は大文字) というディレクトリがあったときに `cd work` (`w` は小文字) とタイプしてタブキーで補完すると `cd Workspace` のように `W` が自動的に大文字に変換される機能です。

そもそも大文字小文字はファイル名やディレクトリ名では区別されない (大文字小文字のみが異なる同名のファイルやディレクトリは作れない) ので大文字小文字は無視して補完してくれたほうが便利です。

## 正規表現をクォーテーションで囲む
Bash では OK で、Zsh では NG の理由がよくわからないのですが、Zsh だと正規表現をクォーテーションで囲まないとエラーになります。[[差分](https://github.com/noraworld/dotfiles/commit/a0a52815d9fcb0744ae2813d03c97a124138274e?branch=a0a52815d9fcb0744ae2813d03c97a124138274e&diff=split#diff-a05dfdac2892713df3b0126ff71e93522f218ba07cb895b6f959fb8536229f1dL258-R230)]

```bash:Bash
$ echo 550.5154612064 | sed s/\.[0-9,]*$//g
550

$ echo 550.5154612064 | sed 's/\.[0-9,]*$//g'
550
```

```zsh:Zsh
$ echo 550.5154612064 | sed s/\.[0-9,]*$//g
zsh: no matches found: s/.[0-9,]*$//g

$ echo 550.5154612064 | sed 's/\.[0-9,]*$//g'
550
```

正規表現をクォーテーションで囲っていない部分があれば囲みましょう。

# まとめ
ぼくの環境では以上のような変更点がありました。まだ他にも、Bash から Zsh に移行する際に必要な変更点があるかもしれませんが、この記事が Bash から Zsh への移行の助けになれば幸いです。

# 参考サイト
- [zsh でいつの間にか Ctrl+R とか Ctrl+A とかきかなくなっていた](https://sotarok.hatenablog.com/entry/20080926/1222368908)
- [zshで大文字小文字を区別しないで補完](https://qiita.com/kenta4327/items/8faaa83f6a5bf595a4bc)
