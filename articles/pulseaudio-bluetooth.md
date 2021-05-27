---
title: "Raspberry Pi に複数の Bluetooth デバイスを接続して同時に音を流す"
emoji: "🎶"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PulseAudio", "Bluetooth", "RaspberryPi"]
published: true
order: 88
layout: article
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


## 音声フロー
筆者の環境では、音声の流れ方としては、このようになっている。

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


# 必要なもの
* Raspberry Pi
  * Bluetooth 機能がついていない古いモデルでも問題ないはず
* Bluetooth レシーバー
  * 接続するデバイスの数だけ必要
  * ドライバのインストールが不要なもの (挿せばすぐ使えるタイプ)
* USB ハブ
  * 接続するデバイスの数が多い場合
* USB-DAC
  * なくても良いが、あったほうが良い
  * ドライバのインストールが不要なもの (挿せばすぐ使えるタイプ)
* Bluetooth トランスミッター
  * USB-DAC を使う場合
* [諦めないド根性](https://ch.ani.tv/episodes/21323)
  * ないと挫折するかもしれない

## Raspberry Pi
ちなみに自宅では Raspberry Pi 4 を使用している。古いモデルでもおそらく可能だが、未検証。

https://amzn.to/2PcNm4A

Raspberry Pi ではなく、Ubuntu がインストールされた PC でも実現可能ではあるが、常時起動させておく必要があるため、電気代的に微妙。

## Bluetooth レシーバー
### 必要なレシーバーの数について補足
接続するデバイスの数だけ必要と書いたが、これは USB-DAC を使用する場合で、もし Raspberry Pi と Bluetooth ヘッドフォンを直接接続する場合は追加でもう 1 個必要になる。

つまり、同時接続したいデバイスの数が 3 つで、Raspberry Pi と Bluetooth ヘッドフォンを直接接続する場合は 3 + 1 = 4 個の Bluetooth レシーバーが必要となる。

USB-DAC を使用する場合は、音声の出力先を USB-DAC にするので、必要な Bluetooth レシーバーの数は同時接続したいデバイスの数 (上記の例だと 3 個) となる。

### デバイスの数だけレシーバーが必要な理由
え、Bluetooth って、1 台に複数のデバイスを接続させることができるんじゃないの？ と思ったかもしれないが、今回の用途だと、それはできない。

なぜなら、使用する Bluetooth のプロファイルが同じだからだ。

Bluetooth プロファイルについて説明すると長くなるので詳細は割愛するが、1 台のデバイスに同じプロファイルで複数のデバイスを登録することは基本的にできない。

たとえば、PC に Bluetooth キーボードと、Bluetooth マウスと、Bluetooth ヘッドフォンを同時接続することはできるが、Bluetooth ヘッドフォンを 3 台以上同時に接続することはできない。

2 台ではなく 3 台と書いたのは、マルチポイント接続に対応している場合は話が別だからだ。

最近の Raspberry Pi は Bluetooth に対応しているが、マルチポイント接続に対応していないし、仮に対応していたとしてもおそらく 2 台までが限度だろう。それに、マルチポイント接続に対応している製品はそんなに多いわけではない。

上記の理由で、複数のデバイスを音声プロファイル (A2DP) として登録することはできないため、接続するデバイスの数だけ Bluetooth レシーバーが必要になる、というわけだ。

ちなみに、Raspberry Pi 4 の USB-A ポートの数は 4 個なので、それ以上接続する必要がある場合は USB ハブなどが追加で必要になってくる。

USB-DAC に出力する場合も、Bluetooth で直接ヘッドフォンに出力する場合も、それぞれ USB 端子を 1 個消費する。

つまり USB ハブなしの場合は最大 3 個までのデバイスの音声を同時に流すことができる。

### 製品を選ぶ際の注意点
ドライバのインストールが必要な Bluetooth レシーバーは使えないので注意。たとえば、以下のような製品はドライバのインストールが必要なので、**Raspberry Pi では使えない**。

https://amzn.to/39DITyw

ドライバのインストールが不要で、挿せばすぐ使えるものでないといけない。自宅では以下の製品を Raspberry Pi 用に使用している。

https://amzn.to/3sKAMI6

## USB ハブ
Bluetooth レシーバーの項でも説明したが、Raspberry Pi に Bluetooth レシーバーを直接挿す場合は、最大 3 台までのデバイスと同時接続することができる。

4 台以上のデバイスと同時接続したい場合は、USB ハブを使ってポート数を拡張する必要がある。

自宅では以下の USB ハブを使用して、6 個の Bluetooth レシーバーと USB-DAC を Raspberry Pi に接続している。

https://amzn.to/3rQup4N

最大何台まで同時接続できるのかはわからないが、5 台同時接続したことはある。まあ 5 台も同時接続できれば一般的には十分なんじゃないかな。

## USB-DAC
### USB-DAC があったほうが良い理由
なくても良いが、あったほうが良いかも。

Raspberry Pi はノイズの影響を受けやすく、Bluetooth 経由で送られてきた音声をそのまま Bluetooth ヘッドフォンに送ろうとするとノイズが混じりやすい。

快適に音楽を楽しみたいなら Raspberry Pi に USB-DAC を接続してそちら側に音声を流したほうが良い。

### 製品を選ぶ際の注意点
Bluetooth レシーバーと同じだが、Raspberry Pi (というか Ubuntu、というか Linux) に対応したオーディオインターフェースじゃないとダメなので注意。

Windows のみ対応の製品によくある、ドライバをインストールしないと使えない系のものは Raspberry Pi には使えない。

ちなみに筆者は Zoom U-44 というオーディオインターフェースを使用している。オーディオインターフェースだが、USB-DAC としても使える上に、光デジタル入出力端子 (S/PDIF) がついている。

https://amzn.to/3u8rXs0

## Bluetooth トランスミッター
USB-DAC を使うなら、Bluetooth トランスミッターも必要だ。

自宅では以下の Bluetooth トランスミッターを使用している。

https://amzn.to/3sSBiUo

Bluetooth ヘッドフォンに直接音声を出力することができる USB-DAC があれば Bluetooth トランスミッターは不要だろう。

しかし、一般的な USB-DAC で、Bluetooth に対応した USB-DAC なんて見たことがないし、あるとしたらたぶんかなり高額なやつだろう。

なので、出力された音声を Bluetooth で飛ばすために、USB-DAC からさらに Bluetooth トランスミッターに音声を出力する必要がある。


# 環境
* Ubuntu (Server) 20.04.2
* BlueZ 5.53

Ubuntu Server 20.10 でも動いていた。そのあといろいろいじっていたら動かなくなってしまいクリーンインストールしたのだが……。


# Ubuntu のインストール
下記の記事を参考に、Raspberry Pi に Ubuntu をインストールする。

https://ja.developers.noraworld.blog/setup-ubuntu-on-raspberry-pi-without-keyboard


# 必要なパッケージのインストール
```shell:Shell
sudo apt -y install pulseaudio pulseaudio-utils alsa-base alsa-utils bluetooth bluez pulseaudio-module-bluetooth
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

## PulseAudio の設定
PulseAudio の設定を行う。ちなみに PulseAudio とは音声を流すための Linux のライブラリである。

### リサンプリングの設定
```diff:/etc/pulse/daemon.conf
- ; resample-method = speex-float-1
+ resample-method = trivial
```

### 音飛び解消の設定
下記を追加すると、音がたまに飛ぶ問題が解消されるらしい。筆者の環境では違いがよくわからなかったが、一応追加しておく。

```diff:/etc/pulse/daemon.conf
- ; default-fragments = 4
- ; default-fragment-size-msec = 25
+ default-fragments = 8
+ default-fragment-size-msec = 125
```

### グループ追加
`pactl` コマンドをログインユーザでも使えるようにする。

```shell:Shell
sudo gpasswd -a $(whoami) pulse
sudo gpasswd -a $(whoami) pulse-access
```

### 音声出力先の設定
Raspberry Pi でループバック & ミキシングした音声の出力先を設定する。

```shell:Shell
pactl list sinks short | awk '{ print $2 }'
```

上記コマンドを実行すると、以下のように音声の出力先一覧が表示される。

```
alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40
alsa_output.platform-bcm2835_audio.stereo-fallback
```

筆者の環境だと、Raspberry Pi に Zoom U-44 というオーディオインターフェース (USB-DAC) を接続しているので、Zoom U-44 とイヤフォンジャック (3.5 mm ステレオミニプラグを挿すところ) の 2 種類が表示される。

今回は、オーディオインターフェースに音を流したいので、`alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40` を選択する。

```diff:/etc/pulse/default.pa
- #set-default-sink output
+ set-default-sink alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40
```

⚠️ `alsa_output.usb-ZOOM_Corporation_U-44-00.analog-surround-40` の部分は各々の環境に合わせて変更すること。

この設定は PulseAudio を再起動するまで反映されないが、再起動後に音声出力先 (が正しく変更されているか) を確認するには以下のコマンドを実行する。

```shell:Shell
pactl info | sed -En 's/Default Sink: (.*)/\1/p'
```

https://gitlab.freedesktop.org/pulseaudio/pulseaudio/-/issues/445#note_389766

### 音声出力先の固定
稼働して最初のうちはこの設定がなくてもうまく機能していたのだが、しばらく経つと、前項で設定した音声出力先が変わってしまっていることに気づいた。

最初は設定が反映されていないのかと思ったが、どうやら途中で別の出力先に勝手に切り替わってしまっているようだ。

これを防ぐために、`module-switch-on-port-available` と `module-switch-on-connect` を読み込まないようにして音声出力先を固定する。

```diff:/etc/pulse/default.pa
- load-module module-switch-on-port-available

- .ifexists module-switch-on-connect.so
- load-module module-switch-on-connect
- .endif
```

https://rohhie.net/ubuntu20-04-fix-the-audio-output-destination/

### [optional] スマートフォンの通話や、音楽ではないアプリの音声 (英語の発音など) にも対応する
通話の音声や、音楽ではないアプリの音声は、HFP という Bluetooth プロファイルでないと再生できない。通話の音声等も聴けるようにするには HFP にも対応する必要がある。

まずは PulseAudio と Bluetooth を HFP に対応させるためのライブラリ oFono をインストールする。

```shell:Shell
sudo apt -y install ofono
```

そして PulseAudio の設定を変更し、oFono を使用するようにする。

```diff:/etc/pulse/default.pa
- load-module module-bluetooth-discover
+ load-module module-bluetooth-discover headset=ofono
```

https://askubuntu.com/questions/845195/how-to-set-up-ubuntu-pc-as-bluetooth-headset-to-attend-calls#answer-852687

#### Bluetooth プロファイルについての補足
音楽を流すための Bluetooth プロファイルは A2DP というもので、これは特別なライブラリや設定を追加しなくても最初から対応している。

また、A2DP と HFP は別プロファイルで、別のプロファイルを使用する場合は切り替える必要があるが、その切り替えは PulseAudio が自動でやってくれる。設定で自動切り替えをオフにすることもできる。

つまり、音楽を聴いたあとに通話をする場合でも、特に意識することなく自動でプロファイルが切り替わるので、音楽の音声と通話の音声をシームレスに聴くことができる。

ただし注意点として、音楽の音声 (A2DP) と通話の音声 (HFP) を同時に聴くことはできない。

これは、スマートフォンで音楽を聴きながら電話の音声を聴くことはできないことと同じなのだが、iPhone で通話の音声を流しつつ、同時に MacBook で音楽を聴くということもできない。

同じデバイスで A2DP と HFP を同時に使用することができないのはもちろんだが、異なるデバイスであっても、Raspberry Pi (PulseAudio) 側から見たら A2DP と HFP を同時に扱うことになってしまうので、そのような使い方はできない。

言い換えれば、スマートフォンで誰かと電話をしている最中に、PC から BGM 的な感じで音楽を同時に流すことができないということなのだが、まあそんな用途で使うことはめったにないだろうから特に問題ないだろう。

### 余談: PulseAudio をシステムワイドで起動する件について
興味なければ読み飛ばしても問題ない。

ネットの記事を見ていると、PulseAudio をシステムワイドで起動する方法 (`/etc/systemd/system/pulseaudio.service` と `/etc/dbus-1/system.d/pulseaudio-bluetooth.conf` を作る方法) が散見されるが、これはおすすめしない。

これを設定すると、音が出なくなったり、音が飛び飛びになったり、ノイズだらけになったりする。

https://qiita.com/nattof/items/3db73a95e63100d7580a

しかも、一度システムワイドで PulseAudio を起動してしまうと、そのあとはシステムワイドで起動する用のユニットファイルをロードしないようにしても、削除しても、もとに戻らなくなってしまう。

設定を全く同じ状態に戻して、再起動して、Bluetooth のペアリングをし直しても直らなかった。PulseAudio のキャッシュを消したりもしたがダメだった。

結局 OS をクリーンインストールしたら直った。

とにかく PulseAudio をシステムワイドで起動するのは本当におすすめしない。

そもそも PulseAudio はユーザレベルで動作させることを前提にしているため、システムワイドで動作させようとするとおかしくなる。

ちなみに、上記のサイトでは `/etc/pulse/system.pa` に追記しているが、追記している内容はすでに `/etc/pulse/default.pa` に最初から記載されているはずなので不要。

## asoundrc
これは設定しなくても良かった。もしうまく機能しなかったら試してみても良いかもしれない。

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

```shell:Shell
sudo /etc/init.d/alsa-utils restart
```

## 設定変更後の再起動
```shell:Shell
sudo systemctl daemon-reload
sudo systemctl restart bluetooth
systemctl --user restart pulseaudio
```

`pulseaudio` はシステムワイドではなくユーザレベルでの起動であることに注意。

うまくいかない場合は下記コマンドでシステムの再起動も試してみる。

```shell:Shell
sudo reboot
```


# 各デバイスとの Bluetooth ペアリング登録 & 接続
ふつうに `bluetoothctl` コマンドを使えば良いのだが、めんどくさいのでもっと簡単にペアリング登録ができるツールを紹介する。

https://github.com/noraworld/bluetoothctl-autoconnector

## セットアップ
```shell:Shell
git clone https://github.com/noraworld/bluetoothctl-autoconnector.git
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
```shell:Shell
marlin register macbook
```

コマンド実行中に、接続しようとしているデバイスで Raspberry Pi と Bluetooth 接続するかどうかの確認ダイアログが出てくるので、ダイアログを確認して接続する。

### デバイス名の指定方法と補完について
エイリアス (デバイス名) は正確に入力する必要はない。

`MacBook Pro 15` を指定したかったら `macbook` でも良い。大文字小文字は無視される。前方一致で一意に定まれば問題ない。

さらに、Zsh を使っている場合は `bin/_marlin` を読み込めば、オペレーション (第一引数) やデバイス名 (第二引数) を補完することもできる。

デバイス名は、先ほど設定した `~/.marlin_aliases` に記載されたデバイス名から補完候補が表示されるようになっている。

補完スクリプトの使い方については以下を参照してほしい。

https://ja.developers.noraworld.blog/self-made-command-zsh-completion#%E3%82%BB%E3%83%83%E3%83%88%E3%82%A2%E3%83%83%E3%83%97

## デバイスの接続状況確認
```shell:Shell
marlin info macbook
```
```
Name: MacBook Pro 15
Paired: yes
Trusted: yes
Blocked: no
Connected: yes
```

ペアリングされているかどうか、接続されているかどうかなどがわかる。ペアリングされていない場合はそもそも `No such device` となってしまうのだが。

## Bluetooth 接続
`register` を実行した際に自動的に接続まで行ってくれるが、もし接続されなかった場合は、接続のみを行うことももちろんできる。

```shell:Shell
marlin connect macbook
```

## Bluetooth ペアリング削除
```shell:Shell
marlin remove macbook
```

これで Raspberry Pi 側からは該当デバイスの Bluetooth ペアリング情報が削除され、接続されなくなる。

ただし、クライアント側 (デバイス側) はペアリング情報が削除されるわけではないので、そちらは手動で削除する。

## 有用性
Bluetooth や PulseAudio の設定を一部し忘れていたり間違えていたりした場合は、その内容によっては各デバイスとのペアリングの再登録をする必要がある。そうしないと設定が反映されないからだ。

その場合、毎回、ペアリングの削除・登録をやり直す必要があるが、少しでもその作業を楽にするために、スクリプト `marlin` を使用することをおすすめする。

## 他の機能
以下のコマンドでこのツールの他の機能を確認できる。

```shell:Shell
marlin --help
```

# 自動接続
さらに、一度ペアリングしたデバイスとは、自動的に再接続したい。

たとえば PC をスリープしたりシャットダウンしたりすると当然 Bluetooth 接続は切れるが、PC 起動後、自動的に Raspberry Pi と再接続してほしい。

そして、先ほど clone したリポジトリは、実は自動接続のためのツールである。`marlin` はオマケだ。

このツールのセットアップスクリプト (`setup.sh`) を実行すると、cron にジョブが追加される。

```shell:Shell
./setup.sh
```

これで、ペアリング済みの複数デバイスに 1 分置きに自動的に接続するよう試みる。すでに接続済みだった場合はスキップされる。

ただし、**すでに接続されているいずれかのデバイスで音声が再生されている間は、接続されていないデバイスとの再接続をしない**。

なぜこういう仕様になっているかというと、すでに接続されているデバイスで音楽を流している間に、別のデバイスと Bluetooth 接続しようとすると、一時的に音楽がぶつぶつと途切れてしまう。

Bluetooth 接続が 1 回で成功すれば音声が途切れるのも 1 回だけで済むが、なんらかの理由で (ペアリング済みのデバイスの電源が切れていたり Bluetooth がオフになっていたりなど) 再接続できない状況が続くと、接続済みのデバイスで再生されている音楽が 1 分置きにぶつぶつと途切れ途切れになってしまう。

自動接続については別記事でも紹介しているので、興味があればそちらも見てほしい。

https://ja.developers.noraworld.blog/bluetoothctl-autoconnect


# ダミー音声の出力
iPhone や iPad など、iOS デバイスではなぜか音楽が再生されない問題が発生する。正確には、再生されているのだが、音が聞こえない[^1]。

[^1]: 最近 (この方法を試す前) では Oculus Quest でも音が聞こえなくなってしまった。以前は Oculus Quest は正常に音が聞こえていたのだが。もちろん設定は変えていない。どうも Linux の音声関係のライブラリは挙動が不安定である。

これの原因はいろいろ調べてもよくわからなかった。

しかし、例外として、MacBook など、正常に音を流せるデバイスで音を流している最中に iPhone や iPad などで音楽を再生すると、ちゃんと聞こえる。MacBook ではなく、Raspberry Pi で直接 WAVE ファイルを再生している最中でも同じだった。

ならば、Raspberry Pi で「無音」を永遠に流し続ければ、iPhone や iPad で音が聞こえない問題は解消されるのではないかと推測した。再生する音声ファイルに `/dev/zero` を指定して、無音をずっと流し続けてみた。

https://unix.stackexchange.com/questions/466429/always-a-pop-sound-whenever-alsa-pulseaudio-is-idle-for-exactly-5-seconds

これが大成功で、見事に iPhone や iPad でも音楽が流せるようになった。

そこで、無音を流すスクリプトファイルを作り、それを systemd でデーモン化して、システム起動後に勝手に起動しずっと無音を流し続けるようにする。

## セットアップ
先ほど clone したリポジトリに `dummysound` というスクリプトがあるので、これを systemd に追加し、デーモン化する。

このスクリプトはユーザレベルで起動したいので、以下のユニットファイルは `/lib/systemd/user` 以下に置く。

```config:/lib/systemd/user/dummy-sound.service
[Unit]
Description=dummy sound service
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/bluetoothctl-autoconnector
ExecStart=/usr/bin/env bash dummysound
TimeoutSec=15
Restart=always

[Install]
WantedBy=default.target
```

`/path/to/bluetoothctl-autoconnector` には clone したリポジトリの絶対パスを指定する。

デーモンをリロードし、自動起動を有効にし、起動する。

```shell:Shell
systemctl --user daemon-reload
systemctl --user enable dummy-sound
systemctl --user start dummy-sound
```

## 注意点
**他のデバイスで音声を再生中は無音を流さない仕様になっている**。

iPhone や iPad など、なぜか音が流れないデバイスで音声を再生している最中にこのダミー音声を流しても、音が聞こえない問題が解消しないからだ。

これも理屈はよくわからないが、正常に音が聞こえるデバイスで音を流している間に、正常に音が聞こえないデバイスで音を流すと正常に音が聞こえるようになるが、その逆も成り立つ。

つまり、正常に音が聞こえないデバイスで音を流している間に、正常に音が聞こえるデバイスで音を流すと正常に音が聞こえなくなってしまう。

なので、Raspberry Pi と接続しているどのデバイスも音声を再生していない状態じゃないと、このダミー音声を流す意味がなくなってしまう。

ただし、このダミー音声を流すスクリプトは、他のデバイスで音声が流れているかどうかを検知し、すべてのデバイスで音声を停止するまで何度も確認し続けるので、音声が流れているときにデーモンを起動するのは問題ない。

すべてのデバイスで音声が流れなくなったことを確認すると、勝手にダミー音声が流れるようになる。

また、一度ダミー音声が流れ始めれば、その後はずっと無音が流れ続けるので、あとは何も気にする必要はない。

なので、気にするべきこととしては、このデーモンを正しく機能させるためには、いったんすべてのデバイスで音声を停止し、1 分くらい待つか、Raspberry Pi を再起動する必要があるということだ。

ちなみにダミー音声が流れているかどうかは、以下のコマンドを実行して `1` が出てくれば良い。

```shell:Shell
pacmd list-sink-inputs | grep -c "media\.name = \"ALSA Playback\""
```

`0` が出てきたら、すべてのデバイスで音声が停止していないか、デーモンが正しく機能していない可能性があるので、それらを確認する。

それでもダメだったらいったん再起動してみる。


# それ以外の設定
PulseAudio のデーモンは、システム起動後に初回ログインした際に起動される。そのため、Raspberry Pi 再起動時に自動的にログインするように設定を追加する。

https://ja.developers.noraworld.blog/ubuntu-reboot-auto-login


# その他
## 遅延について
下記のツイートで、音声の遅延をリアルタイムで計測した結果を動画として載せている。

https://twitter.com/i/web/status/1377115502439325696

若干ばらつきはあるが、安定すると 100 ms 以内に収まる。

ただしこれは各デバイスと Raspberry Pi 間の遅延で、ここから Bluetooth ヘッドフォンに音声を飛ばす際にも遅延が生じる。

単純計算すると、実際には上記の遅延の約 2 倍の遅延が発生していることになる。

しかし、2 倍にしても最大遅延が 150 ms 程度なので、正直、音楽を聴く程度だとこの遅延はよくわからない。

ただし、音ゲーや動画編集の音合わせなど、コンマ 1 秒の遅延も許されない用途では、はっきりと遅延がわかるため、あまりおすすめはしない。

というかそういう用途の場合は、デバイスとヘッドフォンを直接 Bluetooth 接続しても遅延が気になるけど (コーデックが aptX LL の場合は別)。

結論としては、音楽聴いたり、YouTube 見たり、音声がそこまで重要ではないゲームをしたりする程度なら全く問題はない。

ちなみに、上記 Twitter のように、音声の遅延をリアルタイムで確認するには以下のコマンドを実行する。

```shell:Shell
watch -n 1 -d pacmd list-sink-inputs
```

上記コマンド実行中に、Raspberry Pi と接続しているデバイスで適当に音楽を流す。

`current latency` という項目が現在の音声の遅延である。

終了する場合は `Ctrl + C` を押す。

## 課題点
現在、以下の 2 つの課題がある。

* iPhone の音声が流れなくなることがある
* iPhone のマイクが使えなくなってしまう

### iPhone の音声が流れなくなることがある
おそらく A2DP と HFP の自動切り替え (oFono) がうまく機能しないことがあるのが原因と思われる。

Bluetooth には接続されているが、iPhone で音楽や通話の音声を再生しても音が聞こえないことがある。

しばらく放置していると勝手に直る。

### iPhone のマイクが使えなくなってしまう
iPhone が Raspberry Pi に Bluetooth 接続されると、iPhone は Raspberry Pi を、音声出力装置であると同時に、音声入力装置でもあると認識してしまっているようだ。

iPhone で再生した音楽を Raspberry Pi に流したいので、音声出力装置として認識されるのは問題ないが、音声入力装置としても認識しているので、iPhone のマイクではなく、Raspberry Pi のマイクから音を拾おうとしてしまう。

といっても Raspberry Pi にはマイクはなかったはずなので、実質 iPhone でマイクが使えない状態になってしまう。

しかしなぜか Siri は例外で、iPhone のマイクで音を拾って Raspberry Pi に Siri の声を流してくれる。通話などはダメだった。

設定でマイクに関しては認識させないということができるはずなのだが、今のところその方法がわかっていない。

ちなみにこれは他のデバイスでも同様のことが言えるのだが、たとえば MacBook では音声入力と音声出力を別々に設定することができるので実害はない。ただ iPhone などは音声出力と音声入力を個別に設定するとかはできなかったはず。


# 参考サイト
* [Raspberry Piを使って無線ヘッドホンを複数入力から同時に出力出来るようにする](https://dev.classmethod.jp/articles/linux_as_bluetooth_a2dp_mixer/)
* [RaspberryPiをBluetoothオーディオレシーバにしてみた](https://blog.bnikka.com/raspberrypi/raspberrypibluetooth.html)
* [Raspberry Pi をA2DPのsinkにして携帯やタブレットから音楽を再生する](https://penkoba.hatenadiary.org/entry/20130909/1378744109)
* [Raspberry PI 3 で Bluetooth(A2DP)](https://qiita.com/nattof/items/3db73a95e63100d7580a)
* [Ubuntu20.04 音声出力先を固定](https://rohhie.net/ubuntu20-04-fix-the-audio-output-destination/)
* [Always a pop sound whenever alsa/pulseaudio is idle for exactly 5 seconds? [closed]](https://unix.stackexchange.com/questions/466429/always-a-pop-sound-whenever-alsa-pulseaudio-is-idle-for-exactly-5-seconds)
* [pactl get-default-sink](https://gitlab.freedesktop.org/pulseaudio/pulseaudio/-/issues/445#note_389766)
