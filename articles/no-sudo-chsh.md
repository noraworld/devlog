---
title: "chsh で sudo してはいけない"
emoji: "🙅‍♂️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Shell"]
published: true
---

厳密には、してはいけないというより、意図した挙動にならない。

# `chsh` に `sudo` をつけるとどうなるか
たとえば、デフォルトシェルを (Bash から) Zsh に変更する際には、以下のコマンドを実行する。

```shell:Shell
chsh -s $(which zsh)
```

このとき、パスワードを求められるので、最初から `sudo` つけておけば良いんじゃないかと安易な考えに至った。

```shell:Shell
sudo chsh -s $(which zsh)
```

しかし、これだと意図した挙動にならない。

`sudo` をつけたことにより root で実行されるので、root のデフォルトシェルが変更されてしまったことになる。

一般ユーザだと、Zsh に変更されていない。

```shell:Shell
echo $SHELL
```
```
/usr/bin/bash
```

代わりに root で Zsh に変更されてしまっている。

```shell:Shell
su -
echo $SHELL
```
```
/usr/bin/zsh
```

まあ、考えてみれば当たり前なのだが、パスワードを求められる → `sudo` をつけておけば (`/etc/sudoers` の設定次第で) パスワードをスキップできる、という発想になっていた。

しかし、root のデフォルトシェルを変更してしまうのは意図していないので、`chsh` を実行するときは `sudo` をつけずにパスワードを入力しよう。

# `exec -l $SHELL` では反映されない
ちなみに、`chsh` を実行したあとは、シェルを再起動する必要があるが、以下のコマンドではうまくいかない。

```shell:Shell
exec -l $SHELL
```

これも考えてみれば当たり前だが、この時点ではまだデフォルトシェルが変更される前なので、`$SHELL` の中身は前のシェルのままだ。

なので、変更を反映させるには、以下のように明示的に変更後のシェルのパスを指定するか、`exit` してもう一度入り直す必要がある。

```shell:Shell
exec -l $(which zsh)
```
