---
title: "sudo で command not found を回避し、環境変数も引き継ぐ方法"
emoji: "🌟"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["UNIX", "Ubuntu", "root", "sudo"]
published: true
order: 89
layout: article
---

# 要注意事項
**`/etc/sudoers` の設定を間違えると、最悪 `sudo` が使えなくなる。**

**`sudo` が使えなくなると、`/etc/sudoers` 自体を編集することもできなくなり、詰んでしまう。**

**GRUB が起動できるなら最悪復旧することもできるが、GRUB が使えない環境、たとえば Raspberry Pi などでは完全に詰んでしまうので、十二分に気をつけること。**

ちなみに完全に詰んでしまったら OS を再インストールするしかない。


# クイックセットアップガイド
```shell:Shell
sudo visudo
```
```diff:/etc/sudoers
- Defaults	secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
+ #Defaults	secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
+ Defaults	env_keep +="PATH"
```
```
sudo -E mycommand
```


# command not found の回避
`~/.bashrc` や `~/.zshrc` でパスを通しても、`sudo` をつけると `command not found` になることがある。

これを解決するには、`/etc/sudoers` という設定ファイルを編集する必要がある。

ただし、このファイルは設定を間違えると取り返しのつかないことになる非常にナイーブなファイルなので、通常の方法では編集することができない。

たとえば `sudo vi /etc/sudoers` を実行しても read only となり編集することができない。

このファイルを編集するには、以下のコマンドを実行する。

```shell:Shell
sudo visudo
```

```shell:/etc/sudoers
#
# This file MUST be edited with the 'visudo' command as root.
#
# Please consider adding local content in /etc/sudoers.d/ instead of
# directly modifying this file.
#
# See the man page for details on how to write a sudoers file.
#
Defaults	env_reset
Defaults	mail_badpass
Defaults	secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"

# Host alias specification

# User alias specification

# Cmnd alias specification

# User privilege specification
root	ALL=(ALL:ALL) ALL

# Members of the admin group may gain root privileges
%admin ALL=(ALL) ALL

# Allow members of group sudo to execute any command
%sudo	ALL=(ALL:ALL) ALL

# See sudoers(5) for more information on "#include" directives:

#includedir /etc/sudoers.d
```

このファイルを、以下のように変更する。

```diff:/etc/sudoers
- Defaults	secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
+ #Defaults	secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
+ Defaults	env_keep +="PATH"
```

`secure_path` をコメントアウトして、`env_keep` を追加する。`secure_path` は削除しても良いが、怖いのでとりあえずコメントアウトにしておく。

これで `command not found` は解消される。


# 環境変数がセットされない問題の回避
次に、環境変数についてだが、`sudo` でコマンドを実行すると、一般ユーザで使えていた環境変数の大半が使えなくなる。

その理由は、先の `/etc/sudoers` に `env_reset` が追加されているからだ。

`env_reset` を設定すると、`sudo` 実行時に必要最低限の環境変数しか読み込まれなくなる。

ただ、ときどき環境変数が `sudo` では使えなくて不便に感じることがある。

そのときは、以下の例のように、`sudo` のオプション `-E` を使うことでこの問題を回避できる。

```shell:Shell
sudo -E mycommand
```

`env_reset` によって環境変数がリセットされているので、この行を消せば毎回 `-E` を指定しなくて済むのだが、それはいろいろと問題があるので、環境変数が必要なときのみ `-E` をつけることをおすすめする。


# 参考サイト
* [sudoした時にcommand not found が出るときの対処法](https://cha-shu00.hatenablog.com/entry/2017/03/02/123659)
* [sudoers覚え書き](https://qiita.com/progrhyme/items/6f936033b9d23efb1741)
