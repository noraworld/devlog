---
title: "シェルでコマンドを実行中は Mac をスリープさせないようにする方法"
emoji: "☕️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ShellScript", "shell", "Zsh", "macos", "Mac"]
published: true
order: 83
---

:warning: この記事は macOS 専用です。

:information_source: Linux でも、macOS の `caffeinate` コマンドと同等のコマンドがあれば使えるかもしれません。もしご存じの方がいたらコメントで教えていただけるとありがたいです。

# はじめに
シェルを操作しているときに、たまに時間がかかるコマンドを実行することがあると思います。

その際にコマンド終了まで放置していると Mac がスリープしてしまうことがあります。

もしかしたらシステムはスリープしていなくて、ディスプレイだけがスリープしているのかもしれませんが、ディスプレイがスリープしていると、コマンドが中断されてしまっているのではないかと不安になりますし、ときおりコマンドの進捗状況を確認したくてもスリープしていてわからないことがあります。

そこで、コマンド実行中は Mac がスリープしない (ディスプレイのスリープも含む) ようにする方法を紹介します。

# 環境
- macOS Big Sur 11.1
- Zsh 5.8

# 設定方法
以下を `~/.zshrc` に貼り付けます。

:warning: `~/.zshrc` の該当部分だけを抜き出して貼り付けているので、下記の `~/.zshrc` 単体での動作は確認していません。もし正常に動作していなければコメントで教えてください。

```~/.zshrc
_tn_cmd=''
need_caffeine=true
_tn_caffeinate_pid=''

preexec() {
  _tn_cmd=$1
  need_caffeine=true

  while read line
  do
    if [[ $_tn_cmd =~ ^([[:blank:]]+.*)*$line([[:blank:]]+.*)*$ ]]; then
      need_caffeine=false
    fi
  done < ~/.decaffeinated_command_list

  if type caffeinate 1>/dev/null 2>/dev/null && "${need_caffeine}"; then
    (caffeinate -d & echo $!) | read _tn_caffeinate_pid
  fi
}

precmd() {
  if "${need_caffeine}" && [[ "$_tn_caffeinate_pid" =~ ^[0-9]+$ ]]; then
    kill "$_tn_caffeinate_pid"
  fi
  _tn_caffeinate_pid=''
}
```

次に、`~/.decaffeinated_command_list` というファイルを作ります。

```shell
$ touch ~/.decaffeinated_command_list
```

そして、`~/.decaffeinated_command_list` に以下を書き込みます。

```~/.decaffeinated_command_list
exit
exec
source
script
```

とりあえず設定方法だけ知りたい方はこれで終わりです。

## 解説
ここから先は具体的な解説をします。

### `caffeinate` コマンド
Mac には `caffeinate` というコマンドが用意されています。このコマンドを実行すると Mac をスリープさせないようにすることができます。

#### `caffeinate` コマンドのオプション
| オプション | 効果 | 備考 |
|---|---|---|
| `-d` | ディスプレイをスリープさせないようにします ||
| `-i` | システムをアイドル状態にさせないようにします ||
| `-m` | ディスクをスリープさせないようにします ||
| `-s` | システムをスリープさせないようにします | MacBook の場合、電源に接続されているときのみ有効 |

今回はディスプレイをスリープさせたくないので、`-d` を指定します。

### `preexec()` と `precmd()`
`~.zshrc` に `preexec()` という関数を用意すると、何かしらのコマンドの実行前に `preexec()` の中身が実行されます。

また、`precmd()` という関数を用意すると、コマンドの終了後 (厳密には新しいプロンプトが表示される直前) に `precmd()` の中身が実行されます。

これを利用して、インタラクティブシェルでコマンド実行前に `caffeinate` コマンドをバックグラウンドで実行しディスプレイのスリープを抑制し、コマンド終了後に `caffeinate` コマンドのプロセスを kill します。

### `~/.decaffeinated_command_list` について
`~/.decaffeinated_command_list` というファイルを作りましたが、これは `caffeinate` コマンドを実行しないコマンドのリストです。

`~/.decaffeinated_command_list` を再掲します。

```~/.decaffeinated_command_list
exit
exec
source
script
```

たとえば、`exit` コマンドがこのリストの中に入っているので、インタラクティブシェルで `exit` コマンドを実行したときは `caffeinate` コマンドは実行されないというわけです。

こうしておかないと `caffeinate` コマンドのプロセスが残り続ける (ずっとスリープしなくなる) ことになります。

`exit` コマンドでシェルを終了したり、`exec` コマンドや `source` コマンドでシェルや `~/.zshrc` を再読み込みしたりした場合、コマンド実行前に `preexec()` の中身は実行されますが、`precmd()` の中身は実行されません。

ということは、`preexec()` が実行されて `caffeinate` コマンドが実行されるのは良いものの、`precmd()` が実行されないので `caffeinate` コマンドのプロセスが残り続けてしまいます。こうすると不眠不休の Mac になってしまいます。

それを避けるために、`preexec()` は実行されるが `precmd()` が実行されないようなコマンドは `~/.decaffeinated_command_list` に入れておくことをおすすめします。

なお、上記の理屈により、`ssh` で別のマシンにログイン中も Mac はスリープしません。SSH 先では `caffeinate` コマンドが使えないので、SSH 接続中はずっとスリープしないようにしても良いと個人的には思っていますが、これが気に入らない場合は `ssh` も `~/.decaffeinated_command_list` に追加してください。

他にも、`man` や `less` や `vim` を開きっぱなしにして放置している間にスリープしてほしい場合は、それらを `~/.decaffeinated_command_list` に追加してください。

### `$!` について
```zsh
(caffeinate -d & echo $!) | read _tn_caffeinate_pid
```

`$!` にはバックグラウンドプロセスのうち、直前に実行されたプロセスのプロセス番号が入っています。

上記のスクリプトでは、`caffeinate -d &` で `caffeinate` コマンドがバックグラウンドで起動したので、`$!` には `caffeinate` コマンドのバックグラウンドプロセスのプロセス番号が入っています。

そのプロセス番号を `_tn_caffeinate_pid` に代入しています。コマンド終了時に `precmd()` でこのプロセス番号を指定して kill しています。

#### `pkill caffeinate` ではダメな理由
プロセス番号を保持しなくても `pkill caffeinate` を使えば `caffeinate` コマンドのプロセスを kill することはできます。

しかしそれだと、別のシェルセッションで実行中の `caffeinate` コマンドのプロセスも一緒に kill されてしまいます。

たとえばシェルセッションを 2 つ起動していて、片方で時間がかかるコマンドを実行させていて、もう片方で別の作業をしていたとします。

もし `pkill caffeinate` を使っていた場合、作業している側のシェルで `caffeinate` コマンドのプロセスをすべて kill してしまっているので、もう片方の、時間がかかるコマンドがまだ終了していなくてもスリープしてしまいます。

作業の合間に休憩しようとしてスリープしてしまうことになります。

それを防ぐために、ちゃんとプロセス番号を保持して、そのコマンドを実行したときの `caffeinate` コマンドのプロセスだけを kill するようにします。

# おまけ: `caffeinate` コマンドの起動と終了のチェック
コマンド実行前に、本当に `caffeinate` コマンドが実行されるのかどうか、そして終了後にちゃんとプロセスが kill されているのかが気になるかもしれません。

その場合は以下を `~/.zshrc` に追記します。

```diff:~/.zshrc
+ export PROMPT_STATE=""
+
+ caffeine_count() {
+   echo -e "\033[38;05;172m$(ps aux | grep caffeinate | grep -cv grep)\033[00m"
+ }
+
+ get_prompt_state() {
+   PROMPT_STATE="☕️ $(caffeine_count)"
+ }
+ get_prompt_state

  _tn_cmd=''
  need_caffeine=true
  _tn_caffeinate_pid=''

  preexec() {
    _tn_cmd=$1
    need_caffeine=true

    while read line
    do
      if [[ $_tn_cmd =~ ^([[:blank:]]+.*)*$line([[:blank:]]+.*)*$ ]]; then
        need_caffeine=false
      fi
    done < ~/.decaffeinated_command_list

    if type caffeinate 1>/dev/null 2>/dev/null && "${need_caffeine}"; then
      (caffeinate -d & echo $!) | read _tn_caffeinate_pid
    fi
+
+   if "${need_caffeine}"; then
+     if ! { [ "$(ps aux | grep caffeinate | grep "$_tn_caffeinate_pid" | grep -cv grep)" -eq 1 ] && [[ "$_tn_caffeinate_pid" =~ ^[0-9]+$ ]]; } then
+       echo -e "\033[1;93mWARNING:\033[00m Running out of caffeine! Computer may sleep while executing \`\033[1m$_tn_cmd\033[00m' if it takes long time\033[00m"
+       echo
+     fi
+   fi
  }

  precmd() {
    if "${need_caffeine}" && [[ "$_tn_caffeinate_pid" =~ ^[0-9]+$ ]]; then
      kill "$_tn_caffeinate_pid"
    fi
    _tn_caffeinate_pid=''
+
+   get_prompt_state
  }
```

`preexec()` では、以下のいずれかの条件がそろっているときに、コマンド実行前に `caffeinate` コマンドが実行されていないという警告を出します。

- 文字列 `"caffeinate"` と、直前のバックグラウンドプロセスの番号で grep したときに `caffeinate` コマンドのプロセスが 1 件ではない
- `caffeinate` コマンドのバックグラウンドプロセス番号を保持する `$_tn_caffeinate_pid` の中身が数値ではない (空文字列などになっている)

また、`precmd()` では `get_prompt_state()` を呼び出していて、この関数で環境変数 `PROMPT_STATE` をセットしています。

`PROMPT_STATE` には `caffeine_count()` の実行結果が入っていて、`caffeine_count()` は `caffeinate` コマンドのプロセスの数を返します。

あとはこれを環境変数 `PROMPT` の中に入れておけば、常にプロンプトに `caffeinate` コマンドのプロセスの数が表示されます。

ぼくは [Starship](https://starship.rs) を使っているので、環境変数 `PROMPT` に入れる代わりに Starship の `env_var` モジュールにセットしています。

```toml:~/.config/starship.toml
[env_var]
variable = "PROMPT_STATE"
default = "???"
style = "bold yellow"
```

これで以下のように表示されます。

![スクリーンショット 2021-01-13 18.44.02.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/f535bfda-316b-30b2-c638-02a3f205da36.png)

"☕️ 0" と表示されていますね。`caffeinate` コマンドのプロセスがないことがわかります。ここの数字が 1 以上だった場合は、別のシェルセッションで何かしらのコマンドが実行されているので今はスリープしないということを表しています。

# Bash や Linux では使えないのが弱点
Bash だと [Bash-Preexec](https://github.com/rcaloras/bash-preexec) を使えば Zsh の `preexec()` や `precmd()` 相当のことができるのですが、試してみたところ、残念ながら正しく機能しませんでした。

理由はわかりませんが、Bash-Preexec でバックグラウンドプロセスに回すような処理を書くと、インタラクティブシェルでパイプを使ったときにコマンドがストップしてしまいます。

```~/.bashrc
[[ -f ~/.bash-preexec.sh ]] && source ~/.bash-preexec.sh

preexec() {
  # バックグラウンドで実行する処理を書く
  caffeinate -d &
}
```
```shell
$ ps aux | grep caffeinate
# 処理がストップしてしまう
```

もしかしたらこれはバグかもしれないので、今後修正されるかもしれません。

Fish に関しては試していないのでわかりませんが、`--on-event fish_preexec` と `--on-event fish_postexec` が、それぞれ Zsh の `preexec()` と `precmd()` に似ているので代用できるかもしれません。

参考: [シェルでコマンドの実行前後をフックする](https://note.hibariya.org/articles/20170219/shell-postexec.html)

また、この `caffeinate` コマンドは macOS (Darwin) 専用なので Linux では使えません。Linux にも `caffeinate` コマンド相当のコマンドがあれば使えると思います。
