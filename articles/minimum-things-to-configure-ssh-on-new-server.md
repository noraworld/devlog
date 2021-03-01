---
title: "新しいサーバ起動後に最低限行うべき SSH 設定"
emoji: "😊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["SSH", "OpenSSH", "ufw", "ファイアウォール", "セキュリティ"]
published: false
order: 47
---

# はじめに
自宅サーバを新しく設置したり、VPS などを契約したあとに真っ先にやるべき SSH 設定について紹介します。すでにこの手の参考サイトは山のようにありますが、毎回ググるのも面倒なので、自分の記事としてメモ程度にまとめようと思います。

# セキュリティ事項
この記事で紹介する最低限のセキュリティ事項は以下の 3 つです。

* ポート番号の変更
* Root ユーザへのログインを禁止
* パスワードによるログインを禁止

## ポート番号の変更
SSH のウェルノウンポートは 22 番です。22 番ポートのまま使用すると無差別攻撃の的になりますので、変更しておくことを推奨します。番号は 1024 〜 65535 までの任意の数値を設定します。この記事では例として 2222 番を使用しますが、この番号も使用されることが多いので、他のランダムな数値を使用することが望ましいと考えられます。

## Root ユーザへのログインを禁止
SSH で直接 Root ユーザとしてログインできる状態になっているのはセキュリティ上、安全ではありません。SSH 接続では Root ユーザとしてログインすることができないように設定します。Root ユーザとして作業したい場合は、一旦、一般ユーザとしてログインし、その後、`su` コマンドで Root ユーザのパスワードを入力してログインします。

## パスワードによるログインを禁止
パスワードによるログインを許可していると、総当たり攻撃の的になります。SSH でログインする方法を鍵のみに絞り、パスワードによるログインを無効化することで総当たり攻撃の被害を抑えることができます。

# 公開鍵・秘密鍵の生成
まずは SSH に使用する鍵を生成します。鍵の生成はサーバではなくクライアント（PC）側で行います。

```bash
$ ssh-keygen -t rsa -b 4096
```

4096 は鍵長です。省略すると 1024 ビットになります。1024 ビットでも十分な長さですが、より長いほうが安全です。

生成する際に鍵の保存場所とパスフレーズを訊かれるのでそれぞれ入力します。パスフレーズは設定せずにエンターキーを押すことで省略することができます。

# 公開鍵のアップロード
生成された 2 つの鍵のうち、`id_rsa` が秘密鍵で、`id_rsa.pub` が公開鍵です。`id_rsa.pub` をサーバ側にアップロードします。

場所は `~/.ssh` 直下で、ファイル名は `authorized_keys` とします。このファイルの場所と名前は設定で変更することができますが、特に支障がなければデフォルトのものにしておくことをおすすめします。

公開鍵をアップロードするのがめんどうな場合は公開鍵をクリップボードにコピーして、サーバ側に `authorized_keys` を生成してペーストするという原始的な方法でも可です。

# SSH 設定ファイルの変更
SSH 設定ファイルを開いて設定を変更します。設定ファイルは `/etc/ssh/sshd_config` です。変更を加える前にバックアップをとっておくと良いかもしれません。

```diff:/etc/ssh/sshd_config
# Package generated configuration file
# See the sshd_config(5) manpage for details

# What ports, IPs and protocols we listen for
- Port 22
+ Port 2222
# Use these options to restrict which interfaces/protocols sshd will bind to
#ListenAddress ::
#ListenAddress 0.0.0.0
Protocol 2
# HostKeys for protocol version 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
#Privilege Separation is turned on for security
UsePrivilegeSeparation yes

# Lifetime and size of ephemeral version 1 server key
KeyRegenerationInterval 3600
- ServerKeyBits 1024
+ ServerKeyBits 4096

# Logging
SyslogFacility AUTH
LogLevel INFO

# Authentication:
LoginGraceTime 120
- PermitRootLogin prohibit-password
+ PermitRootLogin no
StrictModes yes

RSAAuthentication yes
PubkeyAuthentication yes
#AuthorizedKeysFile	%h/.ssh/authorized_keys

# Don't read the user's ~/.rhosts and ~/.shosts files
IgnoreRhosts yes
# For this to work you will also need host keys in /etc/ssh_known_hosts
RhostsRSAAuthentication no
# similar for protocol version 2
HostbasedAuthentication no
# Uncomment if you don't trust ~/.ssh/known_hosts for RhostsRSAAuthentication
#IgnoreUserKnownHosts yes

# To enable empty passwords, change to yes (NOT RECOMMENDED)
PermitEmptyPasswords no

# Change to yes to enable challenge-response passwords (beware issues with
# some PAM modules and threads)
ChallengeResponseAuthentication no

# Change to no to disable tunnelled clear text passwords
- #PasswordAuthentication yes
+ PasswordAuthentication no

# Kerberos options
#KerberosAuthentication no
#KerberosGetAFSToken no
#KerberosOrLocalPasswd yes
#KerberosTicketCleanup yes

# GSSAPI options
#GSSAPIAuthentication no
#GSSAPICleanupCredentials yes

X11Forwarding yes
X11DisplayOffset 10
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
#UseLogin no

#MaxStartups 10:30:60
#Banner /etc/issue.net

# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

Subsystem sftp /usr/lib/openssh/sftp-server

# Set this to 'yes' to enable PAM authentication, account processing,
# and session processing. If this is enabled, PAM authentication will
# be allowed through the ChallengeResponseAuthentication and
# PasswordAuthentication.  Depending on your PAM configuration,
# PAM authentication via ChallengeResponseAuthentication may bypass
# the setting of "PermitRootLogin without-password".
# If you just want the PAM account and session checks to run without
# PAM authentication, then enable this but set PasswordAuthentication
# and ChallengeResponseAuthentication to 'no'.
UsePAM yes
```

変更点は 4 つです。

`Port` をデフォルトの 22 番から別の番号に変更します。番号は 1024 〜 65535 までの任意の数値を指定します。

`ServerKeyBits` を 1024 から 4096 に変更します。

`PermitRootLogin` を `prohibit-password` から `no` に変更します。

`PasswordAuthentication` が `yes` になっている場合は `no` に変更します。

# ファイアウォールの設定の変更
SSH のポート番号を変更したので、ファイアウォールの設定を変更する必要があります。デフォルトの 22 番を遮断して、設定した番号（本記事では 2222 番）を通過させます。

Linux には、ファイアウォールの設定を行うコマンドがいくつかありますが、ここでは `ufw` を使用します。CentOS などでは `firewall-cmd` がよく使用されますが、こちらの設定方法に関しては他の記事を参照してください。

```bash
$ sudo ufw deny ssh
$ sudo ufw allow 2222
$ sudo ufw enable
```

UFW を有効にしたら指定したポートが遮断／通過していることを確認します。

```bash
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     DENY        Anywhere
2222/udp                   ALLOW       Anywhere
22/tcp (v6)                DENY        Anywhere (v6)
2222/udp (v6)              ALLOW       Anywhere (v6)
```

# デーモンの再起動
SSH と UFW のデーモンを再起動します。

ただし、いきなり再起動してしまうと、もし設定が間違っていてログインできなくなったときにサーバから締め出されてしまいます。そこで、まずは SSH デーモンだけを再起動して、別のシェルでログインしてみます。問題なくログインできれば、次は UFW デーモンを再起動して、また別のシェルでログインして問題がないことを確認します。

## SSH の再起動
SSH デーモンを再起動します。

```bash
$ sudo systemctl restart ssh
```

別のシェルでログインしてみます。

```bash
$ ssh username@100.110.120.130 -p 2222 -i ~/.ssh/id_rsa
```

`username` はログインするサーバのユーザ名、`100.110.120.130` はサーバのグローバル IP アドレスを指定します。

上記で問題なくログインできたら、念のため、設定が合っているかを確かめてみましょう。

```bash
$ ssh username@100.110.120.130 -p 2222               # パスワードでログインできないことを確認
$ ssh username@100.110.120.130 -i ~/.ssh/id_rsa      # 22 番ポートが遮断されていることを確認
$ ssh root@100.110.120.130 -p 2222 -i ~/.ssh/id_rsa  # root でログインできないことを確認
```

上記 3 つでログイン失敗すれば正しく設定されています。

## UFW の再起動
UFW デーモンを再起動します。

```bash
$ sudo ufw reload
```

別のシェルでログインします。

```bash
$ ssh username@100.110.120.130 -p 2222 -i ~/.ssh/id_rsa
```

問題なくログインできれば成功です。

# config の設定
このままでも SSH でログインすることはできますが、毎回、以下のコマンドを実行するのはめんどうです。

```bash
$ ssh username@100.110.120.130 -p 2222 -i ~/.ssh/id_rsa
```

そこで、これをクライアント側の PC の設定ファイルに書いておき、簡単にログインできるようにします。設定ファイルは `~/.ssh/config` にあります。

```conf:~/.ssh/config
Host myserver
  HostName     100.110.120.130
  Port         2222
  User         username
  IdentityFile ~/.ssh/id_rsa
```

上記を設定すると、次回以降は以下のコマンドでログインできるようになります。

```bash
$ ssh myserver
```

# 参考サイト
* [SSHのセキュリティを高めるためのハウツー](https://mag.osdn.jp/07/04/03/0148224)
* [sshでパスワード認証を禁止するには](http://www.atmarkit.co.jp/flinux/rensai/linuxtips/430dnypsswdacces.html)
* [sshd の設定（sshd_config）](http://www.nina.jp/server/slackware/openssh/sshd_config.html)
