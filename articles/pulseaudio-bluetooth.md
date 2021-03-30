---
title: "Raspberry Pi に複数の Bluetooth デバイスをペアリングしてオーディオミキサーを作る"
emoji: "💬"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PulseAudio", "Bluetooth", "RaspberryPi"]
published: false
---

# Ubuntu のインストール
https://zenn.dev/noraworld/articles/setup-ubuntu-on-raspberry-pi-without-keyboard

# 必要なパッケージのインストール
```shell
$ sudo apt -y install pulseaudio pulseaudio-utils alsa-base alsa-utils bluetooth bluez pulseaudio-module-bluetooth
```

# 設定の変更
クライアント側 (各デバイス側) で音量調整ができるように設定を変更する。

```diff:/lib/systemd/system/bluetooth.service
- ExecStart=/usr/lib/bluetooth/bluetoothd
+ ExecStart=/usr/lib/bluetooth/bluetoothd --plugin=a2dp --compat --noplugin=sap
```

```diff:/etc/bluetooth/main.conf
  [General]
+ Disable=headset

- #Class = 0x000100
+ Class 0x20041c
```

```diff:/etc/bluetooth/audio.conf
+ [General]
+ Enable=Source,Sink,Headset,Gateway,Control,Socket,Media
```

```diff:/etc/pulse/daemon.conf
- ; resample-method = speex-float-1
+ resample-method = trivial

- ; default-fragments = 4
+ default-fragments = 8
- ; default-fragment-size-msec = 25
+ default-fragment-size-msec = 125
```

Raspberry Pi でループバック & ミキシングした音声の出力先を設定する。

```diff:/etc/pulse/default.pa
- #set-default-sink output
+ set-default-sink alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40
```

⚠️ `alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40` の部分は各々の環境に合わせて変更すること。

## グループ追加
`pactl` コマンドを `ubuntu` ユーザでも使えるようにする。
```shell:Shell
sudo gpasswd -a ubuntu pulse
sudo gpasswd -a ubuntu pulse-access
```

## システムワイド
https://qiita.com/nattof/items/3db73a95e63100d7580a

## asoundrc
```shell:~/.asoundrc
pcm.!default {
  type plug
  slave {
    pcm "hw:2,0"
  }
}

ctl.!default {
    type hw
    card 2
}
```

```shell
$ sudo /etc/init.d/alsa-utils restart
```

# 設定変更後の再起動
```shell
$ sudo systemctl daemon-reload
$ sudo systemctl restart bluetooth
$ systemctl --user restart pulseaudio
```

# 各デバイスとの Bluetooth ペアリング登録 & 接続
ふつうに `bluetoothctl` コマンドを使えば良いのだが、めんどくさいのでもっと簡単にペアリング登録ができるツールを紹介する。

## セットアップ
```shell
$ git clone https://github.com/noraworld/bluetoothctl-autoconnector.git
```

このリポジトリ内に `bin/marlin` というスクリプトがあるので、これを使う。

以降の説明では `/path/to/bluetoothctl-autoconnector/bin` にパスを通したものとする。

## エイリアスの設定
毎回、各デバイスの BD アドレスを指定するのはめんどうなので、エイリアスを貼る。

`~/.marlin_aliases` というファイルを新規作成し、以下のように追加し保存する。

```markdown:~/.marlin_aliases
XX:XX:XX:XX:XX:XX MacBook Pro 15
XX:XX:XX:XX:XX:XX iPhone 7
XX:XX:XX:XX:XX:XX iPad Air 2
XX:XX:XX:XX:XX:XX Oculus Quest
XX:XX:XX:XX:XX:XX KJ-43X8500F
```

`XX:XX:XX:XX:XX:XX` には各デバイスの BD アドレスを指定する。

これで、たとえば `MacBook Pro 15` をペアリング登録したりしたい場合は、BD アドレス (`XX:XX:XX:XX:XX:XX`) を指定する代わりに `MacBook Pro 15` を使うことができる。

## Bluetooth ペアリング登録 & 接続
```shell
$ marlin macbook register
```

エイリアスは正確に入力する必要はない。`MacBook Pro 15` を指定したかったら `macbook` でも良い。大文字小文字は無視される。前方一致で一意に定まれば問題ない。

コマンド実行中に、接続しようとしているデバイスで Raspberry Pi と Bluetooth 接続するかどうかの確認ダイアログが出てくるので、ダイアログを確認して接続する。

## デバイスの接続状況確認
```shell
$ marlin macbook info
```
```
Name: MacBook Pro 15
Paired: yes
Trusted: yes
Blocked: no
Connected: yes
```

ペアリングされているかどうか、接続されているかどうかなどがわかる。ペアリングされていない場合はそもそも `No such device` となってしまうのだが。

## Bluetooth ペアリング削除
```shell
$ marlin macbook remove
```

これで Raspberry Pi 側からは該当デバイスの Bluetooth ペアリング情報が削除され、接続されなくなる。ただし、クライアント側 (デバイス側) はペアリング情報が削除されるわけではないので、そちらは手動で削除する。

## 有用性
Bluetooth や PulseAudio の設定を一部し忘れていたり間違えていたりした場合は、その内容によっては各デバイスとのペアリングの再登録をする必要がある。そうしないと設定が反映されないからだ。その場合、毎回、ペアリングの削除・登録をやり直す必要があるが、少しでもその作業を楽にするために、スクリプト `marlin` を使用することをおすすめする。

## 他の機能
以下のコマンドでこのツールの他の機能を確認できる。

```shell
$ marlin --help
```

# それ以外の設定
PulseAudio のデーモンは、システム起動後に初回ログインした際に起動される。そのため、Raspberry Pi 再起動時に自動的にログインするように設定を追加する。

https://zenn.dev/noraworld/articles/ubuntu-reboot-auto-login

# 参考サイト
* [Raspberry Piを使って無線ヘッドホンを複数入力から同時に出力出来るようにする](https://dev.classmethod.jp/articles/linux_as_bluetooth_a2dp_mixer/)
* [RaspberryPiをBluetoothオーディオレシーバにしてみた](https://blog.bnikka.com/raspberrypi/raspberrypibluetooth.html)
* [Raspberry Pi をA2DPのsinkにして携帯やタブレットから音楽を再生する](https://penkoba.hatenadiary.org/entry/20130909/1378744109)
* [Raspberry PI 3 で Bluetooth(A2DP)](https://qiita.com/nattof/items/3db73a95e63100d7580a)
