---
title: "bluetoothctl で自動接続 (常時接続) をする方法"
emoji: "⛳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["bluetooth", "bluetoothctl", "cron", "crontab", "pulseaudio"]
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
$ ./setup.sh
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

function paired_devices() {
 {
 printf "select $adapter\n\n"
 printf "paired-devices

 "
 } | bluetoothctl | grep "Device " | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'
}

function is_connected() {
 {
 printf "select $adapter\n\n"
 printf "info $device

 "
 } | bluetoothctl | grep "Connected: " | sed -e 's/Connected: //' | sed -e 's/^[[:blank:]]*//'
}

bluetoothctl -- list | while read line
do
 adapter=`echo $line | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'`

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
bluetoothctl -- list | while read line
do
 adapter=`echo $line | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'`

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
```bash
function paired_devices() {
 {
 printf "select $adapter\n\n"
 printf "paired-devices\n\n"
 } | bluetoothctl | grep "Device " | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'
}
```

一つの Bluetooth コントローラにペアリングされている複数のデバイスの BD アドレスを返します。

`bluetoothctl` コマンド内で、`select <BD_ADDR>` (`<BD_ADDR>` は Bluetooth コントローラの BD アドレス) とすると、Bluetooth コントローラを指定できます。

Bluetooth コントローラが一つしかない場合はわざわざ `select <BD_ADDR>` とする必要はないのですが、複数の Bluetooth コントローラがある場合 (たとえば複数の Bluetooth アダプタを接続している場合) は、どのコントローラに対して Bluetooth の操作を行うのかを示す必要があります。

そして `bluetoothctl` コマンド内で `paired-devices` とすると、選択した Bluetooth コントローラにペアリングされているデバイス一覧が表示されます。複数ペアリングされている場合は複数表示されます。

今回ほしいのは BD アドレスだけなので grep や sed で BD アドレスのみを抽出しています。

### is_connected()
```bash
function is_connected() {
 {
 printf "select $adapter\n\n"
 printf "info $device\n\n"
 } | bluetoothctl | grep "Connected: " | sed -e 's/Connected: //' | sed -e 's/^[[:blank:]]*//'
}
```

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

# 動作確認
実際に MacBook で試してみると、スリープから復帰したあと、ちゃんと 1 分以内に Raspberry Pi に自動接続されるようになりました。

# (optional) 音声の再生中は自動接続しないようにする (音切れ問題対策)
:information_source: 「[モチベーション](#%E3%83%A2%E3%83%81%E3%83%99%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3)」の項で説明したように、Raspberry Pi に複数デバイスを接続して音声をミキシングして使う用途の場合は、次に紹介するスクリプトが役に立つかもしれません。

さて、自動接続はできるようになったのですが、少し問題が発生しました。Raspberry Pi にすでに接続されたデバイスで音声が再生されている間に、他のデバイスを接続しようとすると、再生中の音声が一時的に乱れてしまいます。プツプツする感じです。

たとえば、iPhone を Raspberry Pi に Bluetooth 接続している状態で、iPhone から音楽を流しているとします。その状態で、接続されていない MacBook に接続しようとすると、その間、iPhone から流れる音声が乱れます。

その接続要求で MacBook が接続されれば、それ以降は接続要求を行わないので音声が途切れることはありません。しかし、たとえば MacBook がスリープ状態で、Bluetooth 接続に応じない場合は、1 分ごとに接続要求をして失敗、を繰り返します。そうなると、iPhone から流れる音声が 1 分おきに乱れることになります。

なので、Raspberry Pi に Bluetooth 接続されているデバイスのうち、少なくとも一つが音声を再生している場合は自動接続を行わないようにすることでこの問題を解決します。接続されていないデバイスがあっても、すでに接続されているデバイスで音声が再生されていると、その間は自動接続されなくなってしまいますが、そこは妥協することにします。再生中の音楽がプツプツするほうが気になるので……。

これを実現するには先ほどのスクリプトに数行追加します。

```diff
 #!/bin/bash

 function paired_devices() {
 {
 printf "select $adapter\n\n"
 printf "paired-devices\n\n"
 } | bluetoothctl | grep "Device " | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'
 }

 function is_connected() {
 {
 printf "select $adapter

 "
 printf "info $device

 "
 } | bluetoothctl | grep "Connected: " | sed -e 's/Connected: //' | sed -e 's/^[[:blank:]]*//'
 }
+
+ function is_playing() {
+ export PULSE_RUNTIME_PATH="/run/user/$(id -u)/pulse/"
+ pacmd list-sink-inputs | grep -c "state: RUNNING"
+ }
+
+ if [[ $(is_playing) -gt 0 ]]; then
+ echo -e "Error: Some devices now playing sounds" >&2
+ exit 2
+ fi

 bluetoothctl -- list | while read line
 do
 adapter=`echo $line | sed -r 's/^.*(([0-9A-F]{2}:){5}[0-9A-F]{2}).*$/\1/'`

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

## 解説
`is_playing()` 関数と、`is_playing()` 関数の結果が 0 以上だったら `exit` する処理を追加しました。

`is_playing()` 関数は 0 以上の整数を返します。そしてこの数値は音声を再生中の入力装置の数を表しています。`0` であれば音声を再生中の入力装置がないということになるのでそのまま処理を続行します (自動接続します) が、そうでなければ音声を再生しているデバイスが少なくとも一つは存在することになるので `exit` して処理を中断します。

`pacmd` コマンドの代わりに `pactl` コマンドを使用しても良いです。つまり、`pacmd list-sink-inputs | grep -c "state: RUNNING"` の部分は、以下に置き換えても問題ありません。

```bash
pactl list sink-inputs | grep -c -E "Sink Input #[0-9]{1,}"
```

いずれも音声を再生中の入力装置の情報を取得し、特徴的な文字列を grep してヒットした数を出力します。

`export PULSE_RUNTIME_PATH="/run/user/$(id -u)/pulse/"` という行がないと、crontab で実行した際に `pacmd` コマンド (`pactl` コマンド) が PulseAudio の情報を取得できず失敗します。crontab ではなくカレントシェルで実行する際はこの行がなくても動作してしまうので注意が必要です。

[pacmd - Why doesn't it work from cron?](https://superuser.com/questions/1207581/pacmd-why-doesnt-it-work-from-cron#answer-1243363)

# 参考サイト
- [Bash inline version of piping file to bluetoothctl](https://stackoverflow.com/questions/54443399/bash-inline-version-of-piping-file-to-bluetoothctl#54443626)
- [Script does not run commands in bluetoothctl](https://unix.stackexchange.com/questions/564013/script-does-not-run-commands-in-bluetoothctl/564014#564014)
