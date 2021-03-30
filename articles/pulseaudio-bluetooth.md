---
title: "Raspberry Pi に複数の Bluetooth デバイスをペアリングしてオーディオミキサーを作る"
emoji: "💬"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PulseAudio", "Bluetooth", "RaspberryPi"]
published: false
---

# はじめに
Raspberry Pi に PC やスマートフォンなどの Bluetooth 対応デバイスを接続し、複数のデバイスの音声を Bluetooth ヘッドフォンで同時に流す方法についてまとめる。

## メリット
* PC、スマートフォンなど複数のデバイスの音声を Bluetooth ヘッドフォンで同時に聞くことができる
* **複数のデバイス間でいちいち Bluetooth 接続をし直す必要がない**

音楽を同時に聞くことができることのメリットはあまりないかもしれないが、Bluetooth ヘッドフォンとの接続をし直さなくても良いというメリットは大きい。

スマートフォンで音楽を聴いていて、途中から PC で別の音声を聴きたくなったとき、Bluetooth の接続をし直さなければいけないのが面倒。

マルチポイント接続に対応している Bluetooth ヘッドフォンなら、2 台までなら同時に接続 (同時に音声を流せるというわけではないらしい) することができるらしいが、3 台以上同時接続できるヘッドフォンは見たことがない。

しかも、すべてのヘッドフォンがマルチポイント接続に対応しているわけではないので、自分の愛用しているヘッドフォンが非対応なら 2 台間でも接続のし直しが必要になる。

そこで、すべての音声を流すデバイスを Raspberry Pi に Bluetooth 接続しておき、Raspberry Pi にやってきた音声をループバック & ミキシングさせて、音声の出力先を Bluetooth ヘッドフォンないしは Bluetooth トランスミッターなどにすれば、複数のデバイスの音声を同時に聴けるようになる。


# 必要なもの
* Raspberry Pi
  * Bluetooth 機能がついていない古いモデルでも問題ないはず
* Bluetooth レシーバー
  * 接続するデバイスの数だけ必要
  * 接続するデバイスの数が多い場合は USB ハブも必要
* USB-DAC
  * なくても良いが、あったほうが良い
  * ドライバのインストールが不要なもの (挿せばすぐ使えるタイプ)
  * USB-DAC を使うなら Bluetooth トランスミッターも必要
* [諦めないド根性](https://ch.ani.tv/episodes/21323)
  * ないと挫折するかもしれない

## Raspberry Pi
ちなみに自宅では Raspberry Pi 4 を使用している。古いモデルでもおそらく可能だが、未検証。

https://amzn.to/2PcNm4A

Raspberry Pi ではなく、Ubuntu がインストールされた PC でも実現可能ではあるが、常時起動させておく必要があるため、電気代的に微妙。

## Bluetooth レシーバー
接続するデバイスの数だけ必要と書いたが、これは USB-DAC を使用する場合で、もし Raspberry Pi と Bluetooth ヘッドフォンを直接接続する場合は追加でもう 1 個必要になる。

え、Bluetooth って、1 台に複数のデバイスを接続させることができるんじゃないの？ と思ったかもしれないが、今回の用途だと、それはできない。

なぜなら、使用する Bluetooth のプロファイルが同じだからだ。

Bluetooth プロファイルについて説明すると長くなるので詳細は割愛するが、1 台のデバイスに同じプロファイルで複数のデバイスを登録することは基本的にできない。

たとえば、PC に Bluetooth キーボードと、Bluetooth マウスと、Bluetooth ヘッドフォンを同時接続することはできるが、Bluetooth ヘッドフォンを 3 台以上同時に接続することはできない。

2 台ではなく 3 台と書いたのは、マルチポイント接続に対応している場合は話が別だからだ。

最近の Raspberry Pi は Bluetooth に対応しているが、上記の理由で、複数のデバイスを音声プロファイル (A2DP) として登録することはできないため、接続するデバイスの数だけ Bluetooth レシーバーが必要になる、というわけだ。

ちなみに、Raspberry Pi 4 の USB-A ポートの数は 4 個なので、それ以上接続する必要がある場合は USB ハブなどが追加で必要になってくる。

# USB-DAC
なくても良いが、あったほうが良いかも。

Raspberry Pi はノイズの影響を受けやすく、Bluetooth 経由で送られてきた音声をそのまま Bluetooth ヘッドフォンに送ろうとするとノイズが混じりやすい。

快適に音楽を楽しみたいなら Raspberry Pi に USB-DAC を接続してそちら側に音声を流したほうが良い。

ただし、Raspberry Pi (というか Ubuntu、というか Linux) に対応したオーディオインターフェースじゃないとダメなので注意。Windows のみ対応の製品によくある、ドライバをインストールしないと使えない系のものはおそらく使えない。

ちなみにぼくは Zoom U-44 というオーディオインターフェースを使用している。オーディオインターフェースだが、USB-DAC としても使える上に、光デジタル入出力端子 (S/PDIF) がついている。

https://amzn.to/3u8rXs0

ぼくの環境では、音声の流れ方としては、このようになっている。

```
* 各種デバイス (PC、スマートフォンなど)
    ↓↓↓ Bluetooth ↓↓↓
* Raspberry Pi
    ↓↓↓ USB 端子 ↓↓↓
* Zoom U-44 (USB-DAC)
    ↓↓↓ 光デジタル端子 ↓↓↓
* Bluetooth トランスミッター
    ↓↓↓ Bluetooth ↓↓↓
* Bluetooth ヘッドフォン
```


# 環境
* Ubuntu 20.04.2
* BlueZ 5.53

Ubuntu 20.10 でも動いていた。そのあといろいろいじっていたら動かなくなってしまいクリーンインストールしたのだが……。


# Ubuntu のインストール
下記の記事を参考に、Raspberry Pi に Ubuntu をインストールする。
https://zenn.dev/noraworld/articles/setup-ubuntu-on-raspberry-pi-without-keyboard


# 必要なパッケージのインストール
```shell
$ sudo apt -y install pulseaudio pulseaudio-utils alsa-base alsa-utils bluetooth bluez pulseaudio-module-bluetooth
```


# 設定の変更
もろもろの設定を行う。

## ユニットファイルの設定
下記を追加して、クライアント側 (各デバイス側) で音量調整ができるように設定を変更する。

```diff:/lib/systemd/system/bluetooth.service
- ExecStart=/usr/lib/bluetooth/bluetoothd
+ ExecStart=/usr/lib/bluetooth/bluetoothd --plugin=a2dp --compat --noplugin=sap
```

## Bluetooth の設定
Bluetooth の設定を行う。

### プロファイルの設定
下記を追加して、音楽を聴くのには適切ではない Bluetooth プロファイルを無効化する。

```diff:/etc/bluetooth/main.conf
  [General]
+ Disable=headset
```
https://dev.classmethod.jp/articles/linux_as_bluetooth_a2dp_mixer/

### デバイスの種類の設定
下記を追加して、一部のデバイスがペアリングできない問題に対応する。

```diff:/etc/bluetooth/main.conf
- #Class = 0x000100
+ Class 0x20041c
```

これはたぶん要らない。

```diff:/etc/bluetooth/audio.conf
+ [General]
+ Enable=Source,Sink,Headset,Gateway,Control,Socket,Media
```

## PulseAudio の設定
PulseAudio の設定を行う。ちなみに PulseAudio とは音声を流すための Linux のライブラリである。

### リサンプリングの設定
```diff:/etc/pulse/daemon.conf
- ; resample-method = speex-float-1
+ resample-method = trivial
```

### 音飛び解消の設定
下記を追加すると、音がたまに飛ぶ問題が解消されるらしい。ぼくの環境では違いがよくわからなかったが、一応追加しておく。

```diff:/etc/pulse/daemon.conf
- ; default-fragments = 4
- ; default-fragment-size-msec = 25
+ default-fragments = 8
+ default-fragment-size-msec = 125
```

### 音声の出力先の設定
Raspberry Pi でループバック & ミキシングした音声の出力先を設定する。

```shell:Shell
pactl list sinks short | awk '{ print $2 }'
```

上記コマンドを実行すると、以下のように音声の出力先一覧が表示される。

```
alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40
alsa_output.platform-bcm2835_audio.stereo-fallback
```

ぼくの環境だと、Raspberry Pi に Zoom U-44 というオーディオインターフェース (USB-DAC) を接続しているので、Zoom U-44 とイヤフォンジャック (3.5mm ステレオミニプラグを挿すところ) の 2 種類が表示される。

今回は、オーディオインターフェースに音を流したいので、`alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40` を選択する。

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


## PulseAudio をシステムワイドで起動する件について
興味なければ読み飛ばしても問題ない。

ネットの記事を見ていると、PulseAudio をシステムワイドで起動する方法 (`/etc/systemd/system/pulseaudio.service` と `/etc/dbus-1/system.d/pulseaudio-bluetooth.conf` を作る方法) が散見されるが、これはおすすめしない。これを設定すると、音が出なくなったり、音が飛び飛びになったり、ノイズだらけになったりする。

https://qiita.com/nattof/items/3db73a95e63100d7580a

しかも、一度システムワイドで PulseAudio を起動してしまうと、そのあとはシステムワイドで起動する用のユニットファイルをロードしないようにしても、削除しても、もとに戻らなくなってしまう。設定を全く同じ状態に戻して、再起動して、Bluetooth のペアリングをし直しても直らなかった。PulseAudio のキャッシュを消したりもしたがダメだった。結局 OS をクリーンインストールしたら直った。

とにかく PulseAudio をシステムワイドで起動するのは本当におすすめしない。

ちなみに、上記のサイトでは `/etc/pulse/system.pa` に追記しているが、追記している内容はすでに `/etc/pulse/default.pa` に最初から記載されているはずなので不要。

## asoundrc
これは設定しなくても良いかも。

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
sudo /etc/init.d/alsa-utils restart
```

## 設定変更後の再起動
```shell:Shell
sudo systemctl daemon-reload
sudo systemctl restart bluetooth
systemctl --user restart pulseaudio
```

`pulseaudio` はシステムワイドではなくユーザレベルでの起動であることに注意。

うまくいかない場合はシステムの再起動も試してみる。

```shell:Shell
sudo reboot
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
