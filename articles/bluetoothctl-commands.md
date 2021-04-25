---
title: "bluetoothctl のコマンド一覧と使い方をまとめてみた"
emoji: "📘"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["RaspberryPi", "Bluetooth", "bluetoothctl", "Ubuntu", "Linux"]
published: false
order: 95
layout: article
---

# はじめに
最近 bluetoothctl を利用する機会が多いので、bluetoothctl のコマンドについて調べてまとめてみた。

内容としては `bluetoothctl --help` を日本語訳したような感じだが、ヘルプは具体的な使い方や例までは載っていないので、この記事ではそれらもなるべくわかりやすくまとめておく。



# bluetoothctl とは
GNU/Linux で利用可能なコマンドの一つ。Bluetooth のライブラリをインストールすると一緒についてくるコマンドの一つ。

Ubuntu Desktop の場合は Bluetooth のライブラリがプリインストールされているので bluetoothctl コマンドが最初から使えるはず。

Ubuntu Server の場合は以下のコマンドを実行すると利用可能になる。

```shell:Shell
sudo apt -y install bluetooth bluez
```

## 主な利用用途
Bluetooth に関する操作をコマンドラインで行うことができる。

たとえば、PC やスマートフォンで Bluetooth の設定に行くと、接続可能なデバイス一覧が表示され、そのデバイスを選択すると Bluetooth のペアリングができる。その後、対象の Bluetooth デバイスと接続したり切断したりすることができる。

その一連の Bluetooth 操作を、GNU/Linux ではコマンドラインで行うことができる。コマンドラインで Bluetooth の操作ができてしまうのも GNU/Linux の特徴の一つだろう。



# 使い方
使い方は至ってシンプルだ。

bluetoothctl コマンドはインタラクティブなインターフェースで実装されている。下記コマンドを実行すると、コントローラ[^1]の一覧とともに bluetoothctl のプロンプトが表示されるはずだ。

[^1]: そのデバイスで利用可能な Bluetooth 送信機のこと。通常はそのデバイスに標準で搭載されている送信機が表示されるが、Bluetooth レシーバー (USB) などを複数接続していれば複数表示されるだろう。

```shell:Shell
bluetoothctl
```

```
Agent registered
[CHG] Controller XX:XX:XX:XX:XX:XA Pairable: yes
[CHG] Controller XX:XX:XX:XX:XX:XB Pairable: yes
[CHG] Controller XX:XX:XX:XX:XX:XC Pairable: yes
[CHG] Controller XX:XX:XX:XX:XX:XD Pairable: yes
[CHG] Controller XX:XX:XX:XX:XX:XE Pairable: yes
[CHG] Controller XX:XX:XX:XX:XX:XF Pairable: yes
[Bluetooth]#
```

ここから bluetoothctl のコマンドを実行することによって、各種 Bluetooth の操作をコマンドラインで行うことができる。

終了する場合は `exit` または `quit` を実行する。

```shell:bluetoothctl
exit|quit
```

# コマンド一覧
コマンド一覧とどのような操作を行うものかを順番に説明していく。

## list
利用可能なコントローラ[^1]をすべて表示する。

```shell:bluetoothctl
list
```

```
Controller XX:XX:XX:XX:XX:XA BlueZ 5.53 [default]
Controller XX:XX:XX:XX:XX:XB BlueZ 5.53
Controller XX:XX:XX:XX:XX:XC BlueZ 5.53
Controller XX:XX:XX:XX:XX:XD BlueZ 5.53
Controller XX:XX:XX:XX:XX:XE BlueZ 5.53
Controller XX:XX:XX:XX:XX:XF BlueZ 5.53
```

末尾に `[default]` と表示されているのが、現在選択されているコントローラである。これはどういう意味か説明する。

たとえば、USB タイプの Bluetooth レシーバーを 3 つ接続していて、それぞれ A, B, C としよう。

A に Bluetooth キーボードを接続して、B に Bluetooth マウスを接続して、C に Bluetooth ヘッドフォンを接続したいとする。この用途だと、一つのレシーバーにキーボードとマウスとヘッドフォンを全部接続すれば良いのだが、あくまで説明用だ。

実際に各種デバイス (キーボード、マウス、ヘッドフォン) と接続する際は、`list` で `[default]` と表示された Bluetooth レシーバーに対してペアリングや接続が行われる。

なので、A が `[default]` となっていて、キーボードを接続したら、次は B を `[default]` にしてマウスを接続して、C を `[default]` にしてヘッドフォンを接続する、といった具合だ。

`[default]` の切り替え方は、後述する `select` コマンドを使用する。

## select
デフォルトのコントローラを変更する。

```shell:bluetoothctl
select XX:XX:XX:XX:XX:XX
```

`XX:XX:XX:XX:XX:XX` にはコントローラの BD アドレスを指定する。コントローラの BD アドレスは、先ほど `list` コマンドで表示されたものだ。

先の `list` の例では、`XX:XX:XX:XX:XX:XA` がデフォルトになっていた。`XX:XX:XX:XX:XX:XB` を選択して再度 `list` を実行すれば `[default]` が変更されていることがわかる。

```shell:bluetoothctl
select XX:XX:XX:XX:XX:XB
```

```
Controller XX:XX:XX:XX:XX:XA BlueZ 5.53
Controller XX:XX:XX:XX:XX:XB BlueZ 5.53 [default]
Controller XX:XX:XX:XX:XX:XC BlueZ 5.53
Controller XX:XX:XX:XX:XX:XD BlueZ 5.53
Controller XX:XX:XX:XX:XX:XE BlueZ 5.53
Controller XX:XX:XX:XX:XX:XF BlueZ 5.53
```

先ほども説明したが、ここで `[default]` がついている Bluetooth 送信機 (Bluetooth レシーバーなど) に対して各種 Bluetooth の設定を行うことになる。

## show
選択されているコントローラの情報を表示する。

```shell:bluetoothctl
show
```

```
Controller XX:XX:XX:XX:XX:XX (public)
	Name: BlueZ 5.53
	Alias: BlueZ 5.53
	Class: 0x00000000
	Powered: yes
	Discoverable: no
	DiscoverableTimeout: 0x00000000
	Pairable: yes
	UUID: Audio Source              (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Generic Attribute Profile (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Generic Access Profile    (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: PnP Information           (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Handsfree                 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Audio Sink                (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	Modalias: usb:xxxxxxxxxxxxxxx
	Discovering: no
Advertising Features:
	ActiveInstances: 0x00
	SupportedInstances: 0x00
	SupportedIncludes: tx-power
	SupportedIncludes: appearance
	SupportedIncludes: local-name
```

その Bluetooth 送信機が起動しているかどうか、別のデバイスから検索可能かどうかなどの情報が表示される。

ここで表示されるのは選択されている (デフォルトの) コントローラの情報なので、別のコントローラの情報を見たかったら `select` でコントローラを変更する必要がある。

## power
Bluetooth 送信機の電源のオン・オフを切り替える。

```shell:bluetoothctl
power on|off
```

引数には `on` または `off` を指定する。

```
Changing power on/off succeeded
```

`show` を実行すると電源のオン・オフが変更されたことがわかる。

```shell:bluetoothctl
show
```

```diff
  Controller XX:XX:XX:XX:XX:XX (public)
  	Name: BlueZ 5.53
  	Alias: BlueZ 5.53
  	Class: 0x00000000
- 	Powered: yes
+ 	Powered: no
  	Discoverable: no
  	DiscoverableTimeout: 0x00000000
  	Pairable: yes
  	UUID: Audio Source              (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Generic Attribute Profile (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Generic Access Profile    (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: PnP Information           (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Handsfree                 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Audio Sink                (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	Modalias: usb:xxxxxxxxxxxxxxx
  	Discovering: no
  Advertising Features:
  	ActiveInstances: 0x00
  	SupportedInstances: 0x00
  	SupportedIncludes: tx-power
  	SupportedIncludes: appearance
  	SupportedIncludes: local-name
```

電源がオン (`Powered` が `yes`) になっていないと、近くにある Bluetooth デバイスを検索したりペアリングしたり接続したりすることができない。

これ以降のコマンドの説明では、電源がオンになっていることを前提とする。

## pairable
Bluetooth 送信機をペアリング可能な状態にする。

```shell:bluetoothctl
pairable on|off
```

```
Changing pairable on/off succeeded
```

## discoverable
Bluetooth 送信機を、他のデバイスから検索可能な状態にする。

```shell:bluetoothctl
discoverable on|off
```

```
Changing discoverable on/off succeeded
```

オンにすると、他のデバイスの Bluetooth 設定画面で表示されるようになる。

| discoverable off | discoverable on |
|---|---|
| ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/bluetoothctl-commands/E9F3AFE5-3282-4ABC-A222-E7B988660259.png) | ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/bluetoothctl-commands/D69FDECE-8E04-418B-AC2A-D27D8D7696CB.png) |

## discoverable-timeout
`discoverable on` を実行したあとに、自動的に `discoverable off` にするまでの時間を設定する。

無引数で実行すると、現在のタイムアウトが何秒なのかを見ることができる。

```shell:bluetoothctl
discoverable-timeout
```

```
DiscoverableTimeout: 180 seconds
```

デフォルトは 180 秒 (3 分) になっている。この場合、`discoverable on` を実行してから 3 分間は他のデバイスから検索可能な状態となる、その後、自動的に `discoverable off` となり、他のデバイスから検索不可能な状態に戻る。

引数に時間 (単位: 秒) を指定するとタイムアウトの秒数を変更することができる。

```shell:bluetoothctl
discoverable-timeout 240
```

```
Changing discoverable-timeout 240 succeeded
[CHG] Controller XX:XX:XX:XX:XX:XX DiscoverableTimeout: 0x000000f0
```

なお、現在のタイムアウト時間は `show` でも確認できるが、16 進数表記になっていることに注意。

```
DiscoverableTimeout: 0x000000f0
```

`0x000000f0` は 10 進数では `240` なので 240 秒 (4 分) になっていることがわかる。

ちなみに、他のデバイスからずっと検索可能な状態になっているのは好ましくないので、不便にならない範囲で可能な限りタイムアウトの時間は短くしたほうが良い。筆者はデフォルト (3 分) なら問題ないと思っているが、これ以上に長くしたい場合は注意すること。

## scan
ペアリング・接続可能なデバイス一覧を検索する。

```shell:bluetoothctl
scan on|off
```

```
[NEW] Device XX:XX:XX:XX:XX:XX MacBook Pro 15
[NEW] Device XX:XX:XX:XX:XX:XX iPhone 7
...
...
...
```

いわゆる PC やスマートフォンの Bluetooth 設定画面の、ペアリング・接続可能なデバイス一覧を表示するのと同じ機能だが、余計なものも大量に表示されるので、接続したいデバイスをここで見つけるのは大変だ。

その場合は、いったん `scan off` して検索を終了したあと、後述する `devices` を実行すると、ペアリング・接続が可能なデバイス一覧がノイズなしで表示される。

逆に言うと、まず最初に `scan on` をしてデバイスを検索しないと `devives` には何も表示されないので、`scan on` → `scan off` → `devices` とするのが良いだろう。

## devices
ペアリング・接続可能なデバイス一覧を表示する。

ただし事前に `scan on` で検索しておく必要がある。

```shell:bluetoothctl
devices
```

```
Device XX:XX:XX:XX:XX:XX iPhone 7
Device XX:XX:XX:XX:XX:XX MacBook Pro 15
```

利用可能な状態、つまり電源がオンになっていて、Bluetooth 機能もオンになっていて、かつ Bluetooth の電波の圏内にあるデバイス一覧が表示される。

## pair
デバイスとペアリングする。

ただし事前に `scan on` して検索し、`devices` に表示されるようになったデバイス (利用可能な状態であるデバイス) しかペアリングできない。

```shell:bluetoothctl
pair <DEVICE_BD_ADDRESS>
```

`<DEVICE_BD_ADDRESS>` はペアリングしたいデバイスの Bluetooth アドレスを指定する。これはデバイス側の Bluetooth 設定画面に記載されていることもあるが、調べ方がわからない場合は `scan on` で検索したときや `devices` で確認することができる。

その後、ペアリング可能な場合は、ペアリングしようとしているデバイス側で接続するかどうかのダイアログが表示されるはずなので、「接続」を選択する。

一方、bluetoothctl 側では `yes` とタイプするか、ペアリングしようとしているデバイス側で表示されている 6 桁の認証コードをタイプすることでペアリングを行う。後述する `agent` の設定を変更している場合は何も入力しなくても良いようにすることもできる。

## agent
ペアリングする際にどのように認証するかを指定する。

```shell:bluetoothctl
agent on|off|DisplayOnly|DisplayYesNo|KeyboardDisplay|KeyboardOnly|NoInputNoOutput
```

ペアリングする際に、このデバイスと接続するかどうかを、デバイス同士でそれぞれ確認 (認証) するのだが、その際にどのように認証を行うのかを指定することができる。

まず、bluetoothctl 側でどのように確認を行うかは、以下の 3 種類ある。

| 種類 | 説明 | デフォルト |
|---|---|:---:|
| No input | ペアリング時に `yes` または `no` を要求しない | |
| Yes / No | ペアリング時に `yes` または `no` を要求する | ✔ |
| Keyboard | ペアリング時に、相手側のデバイスで表示された 6 桁の認証コードの入力を要求する | |

そして、ペアリングしたいデバイス側 (相手側) でどのように確認を行うかは、以下の 2 種類ある。

| 種類 | 説明 | デフォルト |
|---|---|:---:|
| No output | 6 桁の認証コードを表示しない | |
| Numeric output | 6 桁の認証コードを表示する | ✔ |

そして、上記の 3 + 2 種類の組み合わせによって、どれを指定するかが決定する。

|                     |              | **相手側**       | **相手側**          |
|---------------------|--------------|-----------------|--------------------|
|                     |              | **No output**   | **Numeric output** |
| **bluetoothctl 側** | **No input** | NoInputNoOutput | DisplayOnly        |
| **bluetoothctl 側** | **Yes / No** | NoInputNoOutput | DisplayYesNo       |
| **bluetoothctl 側** | **Keyboard** | KeyboardOnly    | KeyboardDisplay    |

https://raspberrypi.stackexchange.com/questions/107400/what-bluetoothctl-agents-are-there

ちなみに初期設定 (`agent` を一度もいじっていない状態) だと `yes` が指定されているようで、`yes` はデフォルトの組み合わせ (bluetoothctl 側が `Yes / No` で、相手側が `Numeric output`) なので、`DisplayYesNo` と同じ設定になっている。

逆に `no` を指定すると `No input` と `No output` の組み合わせなので、`NoInputNoOutput` と同じ設定になる。

...... と、ここまで説明したが、実際に試してみると挙動が異なっているものもあって、ちょっとよくわからない。まあ必要がなければいじらなくて良いと思う。確認がめんどくさい場合はとりあえず `no` を指定しておけば `yes` や `no` や 6 桁の認証コードを入力しなくて済む。

## paired-devices
ペアリングされているデバイス一覧を表示する。

```shell:bluetoothctl
paired-devices
```

```
Device XX:XX:XX:XX:XX:XX MacBook Pro 15
```

`pair` でペアリングして、ペアリングが成功したものをここで確認することができる。

ここで表示されるのは選択されている (デフォルトの) コントローラにペアリングされているデバイス一覧なので、別のコントローラにペアリングされているデバイス一覧を見たかったら `select` でコントローラを変更する必要がある。

## connect
デバイスと接続する。

```shell:bluetoothctl
connect <DEVICE_BD_ADDRESS>
```

事前に `pair` でペアリングを行っておかないと接続できないのだが、もしペアリングをしていなかった場合は自動的にペアリングも行ってくれる。

なお、ペアリングが完了しているなら、ペアリングしているデバイス側で接続しようとすれば接続することができる。`connect` は bluetoothctl 側から接続を行いたいときに使う。

## disconnect
デバイスを切断する。

```shell:bluetoothctl
disconnect <DEVICE_BD_ADDRESS>
```

ペアリング情報が削除されるわけではないので、ペアリングしているデバイス側から接続することもできる。bluetoothctl 側から接続したい場合は `connect` を実行すれば良い。

## trust
デバイスを信頼する。

```shell:bluetoothctl
trust <DEVICE_BD_ADDRESS>
```

信頼することによって、再起動した場合でもペアリング情報を保持することができる。

https://mumeiyamibito.0am.jp/bluetoothctl

## untrust
信頼したデバイスを信頼しない状態に戻す。

```shell:bluetoothctl
untrust <DEVICE_BD_ADDRESS>
```

## block
デバイスをブロックする。

```shell:bluetoothctl
block <DEVICE_BD_ADDRESS>
```

## unblock
ブロックされているデバイスのブロックを解除する。

```shell:bluetoothctl
unblock <DEVICE_BD_ADDRESS>
```

## remove
デバイスと切断し、ペアリング情報を削除する。

```shell:bluetoothctl
remove <DEVICE_BD_ADDRESS>
```

再度、ペアリング・接続を行いたい場合は `pair` をし直す必要がある。

## info
ペアリング・接続したデバイスの情報を表示する。

```shell:bluetoothctl
info <DEVICE_BD_ADDRESS>
```

```
Device XX:XX:XX:XX:XX:XX (public)
	Name: MacBook Pro 15
	Alias: MacBook Pro 15
	Class: 0x00000000
	Icon: computer
	Paired: yes
	Trusted: yes
	Blocked: no
	Connected: yes
	LegacyPairing: no
	UUID: Serial Port               (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Audio Source              (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: A/V Remote Control Target (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: A/V Remote Control        (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Headset AG                (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: GN                        (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Handsfree Audio Gateway   (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: PnP Information           (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	UUID: Vendor specific           (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
	Modalias: bluetooth:xxxxxxxxxxxxxxx
	ManufacturerData Key: 0x0000
	ManufacturerData Value:
  XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX     .MacBookPro15,1
```

現在選択されている (デフォルトの) コントローラにペアリング・接続されているデバイスの情報しか表示されないので、別のコントローラでデバイスをペアリング・接続させている場合は `select` で切り替える必要がある。

## set-alias
デバイスにエイリアスを設定する。

```shell:bluetoothctl
set-alias Mac
```

```
[CHG] Device XX:XX:XX:XX:XX:XX Alias: Mac
Changing Mac succeeded
```

`paired-devices` を実行するとエイリアスが変更されたことがわかる。

```shell:bluetoothctl
paired-devices
```

```diff
- Device XX:XX:XX:XX:XX:XX MacBook Pro 15
+ Device XX:XX:XX:XX:XX:XX Mac
```

もともとデバイスにはわかりやすい識別名が最初からついている (`MacBook Pro 15` や `iPhone 7` など) ことが多いので、あまり使う機会がなさそう。

それと、これはバグなのかわからないが、`select` でコントローラを変更しても、このエイリアスが適用されるのは、bluetoothctl コマンドを起動したときに指定されているデフォルトのコントローラに対してのみだ。なのであまり役には立たなさそうだ。

## system-alias
コントローラにエイリアスを設定する。

```shell:bluetoothctl
system-alias Ubuntu
```

```
Changing Ubuntu succeeded
[CHG] Controller XX:XX:XX:XX:XX:XX Alias: Ubuntu
```

`show` を実行するとエイリアスが変更されたことがわかる。

```shell:bluetoothctl
show
```

```diff
  Controller XX:XX:XX:XX:XX:XX (public)
  	Name: BlueZ 5.53
- 	Alias: BlueZ 5.53
+ 	Alias: Ubuntu
  	Class: 0x00000000
  	Powered: yes
  	Discoverable: no
  	DiscoverableTimeout: 0x00000000
  	Pairable: yes
  	UUID: Audio Source              (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Generic Attribute Profile (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Generic Access Profile    (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: PnP Information           (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Handsfree                 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	UUID: Audio Sink                (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
  	Modalias: usb:xxxxxxxxxxxxxxx
  	Discovering: no
  Advertising Features:
  	ActiveInstances: 0x00
  	SupportedInstances: 0x00
  	SupportedIncludes: tx-power
  	SupportedIncludes: appearance
  	SupportedIncludes: local-name
```

エイリアスが変更されたことで、`list` を実行したときにコントローラが識別しやすくなる。

```shell:bluetoothctl
list
```

```
Controller XX:XX:XX:XX:XX:XA Ubuntu [default]
Controller XX:XX:XX:XX:XX:XB BlueZ 5.53
Controller XX:XX:XX:XX:XX:XC BlueZ 5.53
Controller XX:XX:XX:XX:XX:XD BlueZ 5.53
Controller XX:XX:XX:XX:XX:XE BlueZ 5.53
Controller XX:XX:XX:XX:XX:XF BlueZ 5.53
```

## reset-alias
`system-alias` で設定したエイリアスを削除する。

```shell:bluetoothctl
reset-alias
```

```
Changing  succeeded
[CHG] Controller XX:XX:XX:XX:XX:XX Alias: BlueZ 5.53
```

エイリアスが 2 つあってややこしい (`set-alias` と `system-alias`) が、`reset-alias` は `system-alias` で設定したコントローラのエイリアスを削除するものであり、`set-alias` で設定したデバイスのエイリアスは削除しない。

デバイスのエイリアス (`set-alias`) はコマンドで削除することができないようなので、いったん `remove` でペアリング情報を削除してから、`pair` で再ペアリングしないともとに戻らない。

## default-agent
ペアリングなどをしたいデバイス側からリクエストがあったときに、どのコントローラでそのリクエストを受けるのかを指定する。

```shell:bluetoothctl
default-agent
```

このコマンドは、デバイスとのペアリングなどをすべて bluetoothctl 側で操作する際には不要だ。

しかし、逆にペアリングなどをしたいデバイス側から bluetoothctl に対してペアリング等の操作を行う場合には、`select` などは使えない (bluetoothctl を操作するわけではないため) ので、その場合にどのコントローラでそのリクエスト (ペアリング等) を受けるのかを予め指定しておくことができる、というものらしい。

https://qiita.com/propella/items/6daf3c56e26f709b4141#bluetoothctl

## advertise *[^2]
これに関しては調べてもよくわからなかった。

[^2]: 見出しの名前を `advertise` にすると消える現象が発生したので、適当に `*` をつけた。マークダウンパーサのバグ？
