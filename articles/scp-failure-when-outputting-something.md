---
title: "ログイン時に何かを出力するようにしていると scp が失敗する問題の対処法"
emoji: "🐈"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["scp", "SSH", "Bash", "bashrc", "Zsh"]
published: true
order: 80
---

# TL;DR
[Fix scp command failure · noraworld/dotfiles@4d7cf4f](https://github.com/noraworld/dotfiles/commit/4d7cf4ff1e8dbdeb09b0e5973a2edf96e7f86c4b)

# はじめに
たとえば `~/.bashrc` などで、`echo` コマンドなどを使って何かを出力するようにしていると `scp` コマンドが失敗します。

```bash:~/.bashrc
# リモートホスト側
echo "something"
```

```shell
# クライアント側
$ scp username@example.com:~/test .
something
```

ファイルがカレントディレクトリにダウンロードされるはずがダウンロードされず、"something" と表示されただけで終わってしまいます。

ログイン時に標準出力に何かを表示するようにしていると `scp` コマンドが失敗するらしいので、`scp` コマンド実行時のみ `~/.bashrc` などで何も出力しないようにします。

# やり方
`scp` でのログインかどうかを判定する `is_not_scp()` 関数を作ります。`is_not_scp()` 関数は `scp` からのログインでなければ `true` を返し、`scp` からのログインだったら `false` を返します。

そして、`scp` だったら、ログイン時に何かを出力するようにしている部分を出力しないようにします。

```bash:~/.bashrc
is_not_scp() {
  if [ ! -f /proc/$PPID/cmdline ]; then
    echo true
  elif [ -f /proc/$PPID/cmdline ] && [[ "$(cat /proc/$PPID/cmdline | sed 's/\x0//g')" =~ sshd:([[:blank:]]+.*)@notty ]]; then
    echo false
  else
    echo true
  fi
}

if "$(is_not_scp)"; then
  echo "something"
fi
```

## 解説
macOS では `/proc/$PPID/cmdline` は存在しないのでスキップします。

Linux では `/proc/$PPID/cmdline` に現在ログイン中の端末の情報が表示されます。たとえば SSH ログイン中に実行すると以下のように表示されます。

```shell
$ cat /proc/$PPID/cmdline
sshd: ubuntu@pts/0
```

これが `scp` コマンドだと以下のようになります。

```shell
sshd: ubuntu@notty
```

`notty` は端末が割り当てられていないということなのですが、`scp` コマンドだと `notty` と表示されるので、そうなっていれば `scp` コマンドからだと判断します[^1]。

[^1]: それ以外で `sshd: ubuntu@notty` のように表示されるケースもありますが実用上はおそらく問題ないと思いますので割愛します。

`sed` コマンドを使っているのは、`cat /proc/$PPID/cmdline` の出力にヌルバイトが混ざっているからです。`sed` でヌルバイトを除去しています。

ログイン時に何かを出力している箇所を `if "$(is_not_scp)"; then` と `fi` で囲めば `scp` 時にはその部分は出力されなくなるので、`scp` がうまく機能するようになります。

`~/.bashrc` じゃなくて `~/.bash_profile` に何かを出力していたり、Zsh を使っていて `~/.zshrc` とかに何かを出力していた場合も同様です。適宜、ファイル名は読み替えてください。

# 参考サイト
- [scpできなくて私もハマった](https://engineer-log.net/index.php/2017/05/26/post-2490/)
- [「root@notty」って何者？](https://meteoricstream.com/tips_detail/88.html)
