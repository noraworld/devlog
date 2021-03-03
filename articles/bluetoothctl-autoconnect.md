---
title: "bluetoothctl で自動接続 (常時接続) をする方法"
emoji: "⛳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["bluetooth", "bluetoothctl", "cron", "crontab"]
published: false
order: 79
---

# はじめに
bluetoothctl を使って、Linux マシンにペアリングした Bluetooth デバイスを自動接続・常時接続する方法を紹介します。

なお、自動接続・常時接続の際に `bluetoothctl` コマンドを使用するという意味なので、Bluetooth デバイスのペアリング自体は GUI で行っても問題ありません。

# 忙しい人向け
```shell
$ git clone https://github.com/noraworld/bluetoothctl-autoconnector.git
$ cd bluetoothctl-autoconnector
$ vi cron.conf # パスを編集
$ crontab cron.conf
```

# モチベーション
我が家では、Raspberry Pi に Bluetooth アダプタをたくさん接続して、各々のアダプタに iPhone や MacBook などをペアリングして、iPhone や MacBook で再生した曲をミキシングして同時に聞けるようにしています。

iPhone や MacBook から流れる音を同時に聞けるようにするメリットはあまりないのですが、複数のデバイス間で Bluetooth ヘッドフォンのペアリングを切り替えるのがめんどくさいので、Raspberry Pi を Bluetooth 接続の中継機代わりに使っています。

ただ、Bluetooth が切断されてしまうと、自動で接続してくれません。たとえば外出する際に iPhone を外に持っていけば当然接続は切れますし、MacBook の場合はスリープモードに入ると接続が切れます。iPhone や MacBook 側から Raspberry Pi に Bluetooth 接続することはできますが、毎回手動で接続するのは面倒です。

そこで、一度登録した (ペアリングした) デバイスとの接続が切れていたら再接続する、というのを自動でやってくれたら良いなと思いました。

# やり方
「接続が切れたら自動的に再接続する」といった機能は bluetoothctl にはないので、ペアリングしたすべてのデバイスに接続するスクリプトを作って、そのスクリプトを crontab で 1 分ごとに実行することで実現します。

## スクリプト
以下は、ペアリングしたすべてのデバイスに接続するスクリプトです。

```bash:autoconnector.sh
#!/bin/bash

function is_connected() {
 {
 printf "select $adapter\n\n"
 printf "info $device\n\n"
 } | bluetoothctl | grep "Connected: " | sed -e 's/Connected: //' | sed -e 's/^[[:blank:]]*//'
}

function paired_devices() {
 {
 printf "select $adapter\n\n"
 printf "paired-devices\n\n"
 } | bluetoothctl | grep "Device " | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'
}

bluetoothctl -- list | while read adapter_line
do
 adapter=`echo $adapter_line | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'`

 paired_devices | while read device
 do
 if [[ $(is_connected) = "no" ]]; then
 {
 printf "select $adapter\n\n"
 printf "connect $device\n\n"
 } | bluetoothctl
 fi
 done
done
```

:warning: 上記スクリプトは、今後、改良する可能性があります。最新版をご覧になりたい方は [こちら](https://github.com/noraworld/bluetoothctl-autoconnector/blob/master/autoconnector.sh) をご確認ください。

上記スクリプトを 3 つに分けて説明します。

### (**main)
```bash
bluetoothctl -- list | while read adapter_line
do
 adapter=`echo $adapter_line | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'`

 paired_devices | while read device
 do
 if [[ $(is_connected) = "no" ]]; then
 {
 printf "select $adapter\n\n"
 printf "connect $device\n\n"
 } | bluetoothctl
 fi
 done
done
```

`bluetoothctl -- list` コマンドで Bluetooth コントローラ (アダプタ) 一覧が表示されます。`hciconfig` コマンドで表示される Bluetooth コントローラ一覧と同じ BD アドレスのものが表示されるはずです。

複数の Bluetooth コントローラを接続している場合は複数表示されるので、ループを回してそれぞれのコントローラに対して処理します。

変数 `adapter` には Bluetooth コントローラの BD アドレスが入ります。

後述する `paired_devices()` 関数で、その Bluetooth コントローラにペアリングされているデバイスの BD アドレス一覧が取得できます。一つの Bluetooth コントローラに複数のデバイスがペアリングされている場合は複数取得するので、Bluetooth コントローラ同様にループを回してそれぞれのデバイスに対して処理します。

後述する `is_connected()` 関数は `yes` または `no` を返します。そのデバイスが接続されている場合は `yes`、切断されている場合は `no` を返します。返り値が `no` だった場合は切断されているので、Bluetooth コントローラに対してデバイスを接続するよう試みます。

### paired_devices()
一つの Bluetooth コントローラにペアリングされている複数のデバイスの BD アドレスを返します。

`bluetoothctl` コマンド内で、`select <BD_ADDR>` (`<BD_ADDR>` は Bluetooth コントローラの BD アドレス) とすると、Bluetooth コントローラを指定できます。

Bluetooth コントローラが一つしかない場合はわざわざ `select <BD_ADDR>` とする必要はないのですが、複数の Bluetooth コントローラがある場合 (たとえば複数の Bluetooth アダプタを接続している場合) は、どのコントローラに対して Bluetooth の操作を行うのかを示す必要があります。

そして `bluetoothctl` コマンド内で `paired-devices` とすると、選択した Bluetooth コントローラにペアリングされているデバイス一覧が表示されます。複数ペアリングされている場合は複数表示されます。

今回ほしいのは BD アドレスだけなので grep や sed で BD アドレスのみを抽出しています。

### is_connected()
デバイスが接続されているかどうかを調べます。接続されていたら `yes` を返し、切断されていれば `no` を返します。

先ほどと同じように `select <BD_ADDR>` で Bluetooth コントローラを選択します。次に `info <BD_ADDR>` (この `BD_ADDR` は Bluetooth コントローラーではなくデバイスの BD アドレス) で、そのデバイスの接続情報などが表示されます。

`Connected: yes` という行があればそのデバイスは接続されており、`Connected: no` という行があればそのデバイスは切断されています。

`yes` または `no` の部分を grep や sed で抽出しています。

## crontab への登録
前項のスクリプトを実行すると、ペアリングしているすべてのデバイスへ接続します。このスクリプトを crontab で 1 分ごとに実行するようにします。

`cron.conf` というファイルを作ります。

```:cron.conf
*/1 * * * * /path/to/autoconnector.sh
```

`/path/to/autoconnector.sh` には前項のスクリプトの絶対パスを指定します。crontab は、通常、ホームディレクトリから実行されるのでホームディレクトリからの相対パスでも良いです。

ファイルを保存したら、以下のコマンドを実行します。

:warning: すでに他の crontab のジョブが登録されている場合は消えてしまうので注意してください。

```shell
$ crontab cron.conf
```

これで 1 分ごとに前項のスクリプトを実行するようになりました。

# さいごに
実際に MacBook で試してみると、スリープから復帰したあと、ちゃんと 1 分以内に Raspberry Pi に自動接続されるようになりました。

# 参考サイト
- [Bash inline version of piping file to bluetoothctl](https://stackoverflow.com/questions/54443399/bash-inline-version-of-piping-file-to-bluetoothctl#54443626)
- [Script does not run commands in bluetoothctl](https://unix.stackexchange.com/questions/564013/script-does-not-run-commands-in-bluetoothctl/564014#564014)
