---
title: "PulseAudio の自動起動を完全に無効化する方法"
emoji: "🔇"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["pulseaudio", "systemctl"]
published: true
---

# 忙しい人向け
以下のコマンドを実行するだけで OK です。

```shell:Shell
systemctl --user mask pulseaudio.socket
systemctl --user mask pulseaudio.service
sudo reboot
```



# はじめに
Raspberry Pi で長らく PulseAudio を使っていたのですが、自宅の機材を整理したところ、必要なくなりました。

そのため PulseAudio デーモンの自動起動を無効化しようとしたのですが、そのやり方に少し躓いたので、今回は PulseAudio の自動起動を完全に無効化する方法について紹介したいと思います。

なお、ここでいう「自動起動の無効化」とは、システムを起動・再起動したときなどに勝手に PulseAudio デーモンが起動しないようにすることを指します。



# よくある (うまくいかない) 例
PulseAudio のデーモンが自動的に起動しないようにする方法についてインターネットで調べると、以下の 2 つの方法がよく見つかります。しかし、いずれも自動起動を無効化することはできません。

## `systemctl disable`
systemctl を使って自動起動を無効にする方法といえば `systemctl disable` です。しかし、これではうまくいきません。

```shell:Shell
systemctl --user disable pulseaudio.socket
systemctl --user disable pulseaudio.service
```

特にエラーは出ないのでうまくいっているように見えるのですが、確かめてみると自動起動が有効になったままです。

```shell:Shell
systemctl --user is-enabled pulseaudio.socket
systemctl --user is-enabled pulseaudio.service
```

```
enabled
```

もちろんシステムを再起動すると勝手に起動してしまいます。

## `autospawn = no`
もう一つよく見かけるのは、設定ファイルに `autospawn = no` を追加する方法です。しかしこちらも残念ながらうまくいきません。

```conf:/etc/pulse/client.conf
autospawn = no
```

システムを再起動すると勝手に起動してしまいます。



# 完全に無効化する (うまくいく) 方法
`systemctl disable` の代わりに `systemctl mask` を使います。

```shell:Shell
systemctl --user mask pulseaudio.socket
systemctl --user mask pulseaudio.service
```

状態を確認して `masked` になっていれば OK です。

```shell:Shell
systemctl --user is-enabled pulseaudio.socket
systemctl --user is-enabled pulseaudio.service
```

```
masked
```

本当に自動起動が無効化されたかを確認するため、一度、システムを再起動してみます。

```shell:Shell
sudo reboot
```

以下のコマンドを実行して、PulseAudio のプロセスが何も表示されなければ成功です。

```shell:Shell
ps aux | grep pulse | grep -v grep
```

## `disable` vs. `mask`
`disable` と `mask` の違いについて説明します。

`systemctl [--user] disable <service_name>` を実行すると、自動起動のみが無効化されます。たとえばシステムの起動・再起動時にデーモンが自動的に起動するようにしていた場合はそれが無効化されます。

一方で `systemctl [--user] mask <service_name>` はデーモンの起動そのものを無効化します。つまり、一度デーモンが停止すると、`systemctl [--user] unmask <service_name>` で解除しない限りは二度と起動しません。`systemctl [--user] start <service_name>` で手動で起動しようとしても起動しません。

| 起動方法 | 起動タイミング | `disable` | `mask` |
| --- | --- | :---: | :---: |
| 手動起動 | `systemctl [--user] start <service_name>` コマンド実行時 | ◯ | × |
| 自動起動 | システムの起動・再起動時 | × | × |

たいていのデーモンの場合、`disable` することで明示的にデーモンを起動しない限りは勝手に起動することはありません。しかし、PulseAudio の場合は特殊で、systemctl 側で自動起動を無効化していても、`pulseaudio.socket` が自動で PulseAudio のプロセスを起動してしまうようです。そして、`autospawn = no` という設定は systemctl 側とは連動していないようなので、systemctl で `disable` しても `autospawn = no` の設定を追加しても自動起動が無効化されない、という現象が発生してしまいます。

## `systemctl --user mask pulseaudio.service` は任意
`pulseaudio.service` は `pulseaudio.socket` がトリガーになっているので、`pulseaudio.socket` のみを `mask` してしまえば PulseAudio の機能自体は無効化されます。

しかし `ps` コマンドでプロセスを確認したときに、以下のような意味のないプロセスが動いてしまっているのがなんとなく気持ち悪かったので `pulseaudio.service` も `mask` するようにしています。

```
ubuntu 1414 0.0 0.2 288196 16968 ? S<sl 15:54 0:00 /usr/bin/pulseaudio --daemonize=no --log-target=journal
```



# もとに戻す方法
`systemctl unmask` を使うと設定をもとに戻すことができます。

```shell:Shell
systemctl --user unmask pulseaudio.socket
systemctl --user unmask pulseaudio.service
sudo reboot
```



# さいごに
今回は PulseAudio の自動起動を完全に無効化する方法について消化しました。

もちろん PulseAudio をアンインストールしてしまうという方法もありますが、将来的にまた使うことを考えて設定などはそのまま残しておきたいというときもあるかと思います。

たいていの他のサービスは `systemctl disable` などでうまくいくのですが、PulseAudio はちょっと特殊だったので、今回記事として残しておくことにしました。

なお、使っていなくても PulseAudio デーモンを起動したまま放っておくこともできますが、筆者の Raspberry Pi 上では、特に Raspberry Pi から音声を流していなくても常に 2 〜 3 % ほどの CPU 使用率となっていました。Raspberry Pi はそこまで性能が良いわけではないので不要なプロセスはできる限り停止させておいたほうが得策です。



# 参考サイト
* [systemd keeps respawning pulseaudio, and doesn't allow me to stop it](https://superuser.com/questions/1170433/systemd-keeps-respawning-pulseaudio-and-doesnt-allow-me-to-stop-it#answer-1583899)
* [Disable PulseAudio Per User in Linux](https://winaero.com/disable-pulseaudio-per-user-in-linux/)
* [`autospawn = no` ignored](https://gitlab.freedesktop.org/pulseaudio/pulseaudio/-/issues/979#note_623380)
* [systemctl mask 解除する方法](https://ex1.m-yabe.com/archives/6569)
