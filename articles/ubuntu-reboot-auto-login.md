---
title: "Ubuntu 再起動時に自動でログインする方法"
emoji: "🌊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ubuntu", "ubuntu20.04", "pulseaudio"]
published: false
order: 75
---

# はじめに
Ubuntu を起動・再起動する際、通常はログインユーザ名とパスワードを入力する必要がありますが、ユーザ名とパスワードを入力せずに自動でログインされた状態にする方法を紹介します。

# 環境
Ubuntu 20.10

# GUI (Ubuntu Desktop)
「設定」>「詳細」>「ユーザ」と進んでいくと「自動ログイン」という項目があるので、オフからオンにします。パスワードを要求されます。

[Ubuntu 18.04 LTSのデスクトップに「自動ログイン」する方法](https://linuxfan.info/ubuntu-1804-auto-login)

# CUI (Ubuntu Server)
以下のコマンドを実行します。

```shell
$ sudo systemctl edit getty@tty1.service
```

エディタ (nano) が開くので、以下をコピペします。

```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noissue --autologin <USERNAME> %I $TERM
Type=idle
```

`<USERNAME>` には自動ログインしたいユーザのユーザ名を入力します。現在のユーザ名は `whoami` コマンドでわかります。

ちなみに nano に慣れていない人もいるかと思います (自分もそうです) ので一応ファイルの保存の仕方を説明しておきます。

nano には Vim のように通常モードとかインサートモードとかありませんので、エディタが開いたらそのまま上記をコピペします。

次に `Ctrl + X` を押します。`Save modified buffer?` と訊かれるので `y` を押してファイルを保存します。`File Name to Write: ...` と表示されたらリターンキーを押せば終了します。

ちなみにこのファイルは nano でしか開けないようです。`EDITOR=vim` としてみましたが nano で開きました。

これで再起動したときに自動でログインされたはずです。Ubuntu Server の場合はちゃんと確認するためには Ubuntu Server を動かしている PC をモニターにつなげないとわかりませんが。

# 有用性
通常ユーザで起動するデーモンは、起動・再起動後に **一度そのユーザでログインしていないとデーモンが起動しない** ようです。たとえば PulseAudio のデーモンなどです。

通常ユーザで起動するデーモンは、システムワイドで起動するデーモンとは区別されます。たとえば PulseAudio をインストールする[^1]と、システムワイドにはデーモンファイルがありませんが、通常ユーザ用のデーモンファイルが用意されます。

```shell
# システムワイドには存在しない
$ systemctl status pulseaudio
Unit pulseaudio.service could not be found.
```

```shell
# 通常ユーザ用には存在する
$ systemctl --user status pulseaudio
● pulseaudio.service - Sound Service
     Loaded: loaded (/usr/lib/systemd/user/pulseaudio.service; enabled; vendor preset: enabled)
     Active: active (running) since Sun 2020-12-20 07:46:19 UTC; 3 days ago
TriggeredBy: ● pulseaudio.socket
   Main PID: 1911 (pulseaudio)
     CGroup: /user.slice/user-1000.slice/user@1000.service/pulseaudio.service
             └─1911 /usr/bin/pulseaudio --daemonize=no --log-target=journal
```

[^1]: Ubuntu Desktop の場合は最初からインストールされています

ユーザログイン時ではなく、システム起動時・再起動時にこういったデーモンを自動的に起動したい場合に、起動時の自動ログインが便利です。

今回紹介した方法以外で、このような通常ユーザ用のデーモンを自動起動したい場合のやり方として、以下の 2 つが考えられます。

- 通常ユーザ用のデーモンを無効化して、システムワイドに (root 権限としてそのデーモンを) 自動起動するように変更してしまう方法
- 本来 root 権限で実行するデーモンを、通常ユーザに代替して自動起動する方法

ちなみに 2 つめのほうは、要するにこういうふうに起動するということです。

```
ExecStart=/usr/bin/sudo -u <USERNAME> pulseaudio
```

PulseAudio で試してみましたが、どちらもうまくいきませんでした。そもそも PulseAudio はシステムワイドに起動することを想定していないため、うまく動作しませんでした[^2]。通常ユーザに代替する方法も、デーモンが起動せずうまくいきませんでした。

[^2]: 一応、システムワイドに起動する方法は公式で説明されているのですが……。[Running PulseAudio as System-Wide Daemon](https://www.freedesktop.org/wiki/Software/PulseAudio/Documentation/User/SystemWide/)

というわけで、通常ユーザ用のデーモンは、通常ユーザのまま起動する、そしてシステム起動時に自動的にそのデーモンを起動したい場合は自動ログインにする、というやり方が一番無難そうです。

# 参考サイト
[How can I get autologin at startup working on Ubuntu Server 16.04.1?](https://askubuntu.com/questions/819117/how-can-i-get-autologin-at-startup-working-on-ubuntu-server-16-04-1)
