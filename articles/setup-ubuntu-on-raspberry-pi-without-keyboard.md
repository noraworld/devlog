---
title: "モニター・キーボード不要！ Raspberry Pi に Ubuntu を超簡単にインストールして SSH する方法"
emoji: "⌨️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ubuntu", "RaspberryPi", "SSH"]
published: true
order: 74
layout: article
---

# クイックセットアップガイド
1. [Ubuntu の公式ページ](https://ubuntu.com/download/raspberry-pi) から Ubuntu Server のイメージファイルをダウンロードする
2. SD カードにイメージを焼く
3. (optional) Wi-Fi を設定する
4. Raspberry Pi の電源を入れる
5. Raspberry Pi の IP アドレスを調べる
6. SSH してみる
7. (optional) Ubuntu Desktop をインストールする

## 3. (optional) Wi-Fi を設定する
```yaml:/Volumes/system-boot/network-config
wifis:
  wlan0:
    dhcp4: true
    optional: true
    access-points:
      "<wifi network name>":
        password: "<wifi password>"
```

## 5. Raspberry Pi の IP アドレスを調べる
```shell:Shell
ifconfig | grep <IP_ADDR> -B 10
sudo arp-scan -l --interface <NETWORK_INTERFACE_NAME> | grep -i "Raspberry Pi"
```

## 6. SSH してみる
```shell:Shell
ssh ubuntu@<IP_ADDR>
```

## 7. (optional) Ubuntu Desktop をインストールする
```shell:Shell
sudo apt -y install ubuntu-desktop
```

# はじめに
Raspberry Pi で遊んだり、何かの作業のサンドボックスとして使用したりするとき、しょっちゅう OS を再インストールすることがあります。

そのたびに Raspberry Pi にキーボードをつないで、sshd をインストール[^1]して sshd_config を編集して SSH 公開鍵を設置して sshd を起動して、、、という作業を毎回 Raspberry Pi 側でやるのは非常にめんどうです。ふだん使い慣れている環境ではない分、キーボード操作も満足できずストレスがたまります。

[^1]: Ubuntu Desktop ではデフォルトでインストールされていません。

なので今回は Raspberry Pi にキーボードを接続せずに、Mac だけで作業を完結させる方法について紹介します。

なお、この作業は Raspberry Pi に限らず、Ubuntu をインストールするデバイスでもおそらく可能です。また、この記事では詳細なやり方については説明しませんが、Linux や Windows でも同様の手順でできます。

# 環境
|| Raspberry Pi 4 | Mac |
|---|---|---|
| OS | Ubuntu 20.10 | macOS Big Sur 11.1 |

# Ubuntu のイメージを SD カードに焼く
まずはふだんのインストール通り、SD カード (Raspberry Pi でない場合は USB メモリなど) に OS を焼きます。

**Ubuntu Desktop ではなく Ubuntu Server のイメージをダウンロード** してください。デスクトップ用を使いたくても、とりあえずまずはサーバ用をインストールします。デスクトップ用にする方法は最後に紹介します。

Raspberry Pi 用の Ubuntu イメージは [ここ](https://ubuntu.com/download/raspberry-pi) からダウンロードできます。

![screencapture-ubuntu-download-raspberry-pi-2020-12-20-13_12_36.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/fac6c5fc-74d7-4464-809c-8fff1413a5f3.png)

ダウンロードした Ubuntu Server のイメージを SD カードに焼きます。CUI で操作したい場合は `dd` コマンドを使います。GUI で操作したい場合は [balenaEtcher](https://www.balena.io/etcher/) が便利です。イメージを焼く方法はインターネット上にたくさん記事があがっているのでここでは手順は省略します。

# (optional) Wi-Fi を設定する
:information_source: **この作業は Raspberry Pi を Wi-Fi で接続する場合のみ行います。Wi-Fi を使わずにイーサネットで有線接続する、あるいは Wi-Fi 設定が SSH が可能になったあとでも構わないならこの手順はスキップします。**

OS を焼いたあとは SD カードのディスクがアンマウントされているかもしれないので、アンマウントされていたら一度 SD カードを抜いてもう一度挿します。

マウントされた SD カード内のディスクは `system-boot` となっていると思います。その中にある `network-config` というファイルを編集します。ちなみに Mac でマウントされたものは `/Volumes` 以下にあります。

ファイル内にコメントアウトされた以下のような記述がどこかにあると思いますのでアンコメントして有効化します。

```yaml:/Volumes/system-boot/network-config
wifis:
  wlan0:
    dhcp4: true
    optional: true
    access-points:
      "<wifi network name>":
        password: "<wifi password>"
```

`<wifi network name>` には使用している Wi-Fi の SSID、`<wifi password>` には Wi-Fi のパスワードを設定します。

:warning: **`<wifi network name>` もダブルクオーテーション `"` で囲ってください。**

# Raspberry Pi を起動する
Ubuntu を焼いた SD カードを抜いて Raspberry Pi に挿します。そして Raspberry Pi の電源をオンにします。起動するまで 1 〜 2 分ほど待ちます。

# Raspberry Pi の IP アドレスを調べる
Raspberry Pi の IP アドレスを固定していないので、このままでは Raspberry Pi に割り当てられた IP アドレスがわかりません。なので IP アドレスを調べます。

IP アドレスを調べるには `arp-scan` コマンドを使います。Mac で Homebrew を使っている場合は、以下のコマンドでインストールできます。

```shell
$ brew install arp-scan
```

次に以下のコマンドを実行します。

```shell
$ sudo arp-scan -l --interface <NETWORK_INTERFACE_NAME> | grep -i "Raspberry Pi"
```

`<NETWORK_INTERFACE_NAME>` にはネットワークインターフェース名を指定します。ネットワークインターフェース名がわからない場合は、後述の「[ネットワークインターフェース名の調べ方](#%E3%83%8D%E3%83%83%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%BC%E3%83%95%E3%82%A7%E3%83%BC%E3%82%B9%E5%90%8D%E3%81%AE%E8%AA%BF%E3%81%B9%E6%96%B9)」を参照してください。

すると、以下のような行が表示されるはずです。

```
192.168.3.14	xx:xx:xx:xx:xx:xx	Raspberry Pi Trading Ltd
```

ここで表示された `192.168.3.14` が Raspberry Pi の IP アドレスです。この数値はもちろん環境によって異なります。

:information_source: macOS や Linux に最初からインストールされている `arp` コマンドでも似たようなことができますが、こちらではうまくいかない可能性があります。なぜうまくいかない可能性があるかは「[TIPS: arp コマンドではうまくいかない理由](#tips-arp-%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%81%A7%E3%81%AF%E3%81%86%E3%81%BE%E3%81%8F%E3%81%84%E3%81%8B%E3%81%AA%E3%81%84%E7%90%86%E7%94%B1)」を参照してください。

## 上記でうまくいかない場合
もし上記の `arp-scan` コマンドで何も表示されない場合は以下の 2 つを試してみてください。

```shell
$ sudo arp-scan -l --interface <NETWORK_INTERFACE_NAME> | grep -i "dc:a6:32"
$ sudo arp-scan -l --interface <NETWORK_INTERFACE_NAME> | grep -i "b8:27:eb"
```

Raspberry Pi は MAC アドレスが `dc:a6:32` または `b8:27:eb` から始まるようです。Raspberry Pi 4 では `dc:a6:32` で始まり、それ以外の Raspberry Pi では `b8:27:eb` から始まるらしいです。

それでも見つからない場合はまだ Ubuntu が完全に起動していないかもしれないので追加で 5 分ほど待ってみてください。

また、Wi-Fi の設定で接続する場合は初回の起動時は失敗する可能性があるらしいので、5 分以上待ってもダメだった場合は一旦 Raspberry Pi の電源をオフにし、もう一度起動して数分待ってから試してみてください。

ちなみに Raspberry Pi 以外のデバイスでこの手順を試している場合は `"Raspberry Pi"` や `"dc:a6:32"` や `"b8:27:eb"` で grep しても出てこないと思いますので、以下のコマンドを実行してそれっぽいものを探してください。

```shell
$ sudo arp-scan -l --interface <NETWORK_INTERFACE_NAME>
```

## ネットワークインターフェース名の調べ方
「システム環境設定」の「ネットワーク」を開きます。

「接続済み」になっているネットワークを選択して、Mac に割り当てられている IP アドレスを調べます。

| 有線接続の場合 | Wi-Fi の場合 |
|:---:|:---:|
| ![スクリーンショット 2020-12-20 14.15.00.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/e6eb9810-ca7d-416f-d659-863bf9c66917.png) | ![スクリーンショット 2020-12-20 14.19.13.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/65662548-ada4-124d-1453-1afa2860b270.png) |

有線と Wi-Fi どちらにも接続されている場合はどちらでも良いです。とにかくネットワークに接続されているものならなんでも良いので、その接続の IP アドレスを調べてください。

次に以下のコマンドを実行します。

```shell
$ ifconfig | grep <IP_ADDR> -B 10
```

`<IP_ADDR>` には、直前で調べた IP アドレスを指定します。

すると以下のような結果が出ます。

```
        ... (無視して OK)
        ...
        ...
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
        ... (省略)
        ...
        ...
        ...
        ...
        inet 192.168.3.28 netmask 0xffffff00 broadcast 192.168.3.255
```

上記の例だとネットワークインターフェース名が `en0` であることがわかりました。上記の例は Wi-Fi なので、Wi-Fi で接続されているネットワークのインターフェイス名が `en0` だったというわけです。ちなみに有線接続だと `en7` でした。これらの結果は環境によって異なります。

# SSH してみる
ここまで来たらもう SSH できる状態になっています。実際に SSH してみましょう。ユーザ名は `ubuntu` です。

```shell
$ ssh ubuntu@<IP_ADDR>
```

`<IP_ADDR>` には先ほどの手順で調べた Raspberry Pi の IP アドレスを指定します。この記事の例では `192.168.3.14` だったものです。

はじめての接続の場合は以下のメッセージが表示されるので `yes` とタイプしてリターンキーを押します。

```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

その後、パスワードを求められるので `ubuntu` と入力してリターンキーを押します。次に新しいパスワードの設定を求められるので新しいパスワードを設定します。

ログインできたら成功です！ おつかれさまでした。あとは鍵を作成して公開鍵を Raspberry Pi に設置して公開鍵認証にしたりして各々の環境にセットアップしてください。

SSH の設定ファイルやファイアウォールの設定については以下の記事を参考にしてみてください。

[新しいサーバ起動後に最低限行うべき SSH 設定](https://ja.developers.noraworld.blog/minimum-things-to-configure-ssh-on-new-server)

固定 IP アドレスにする方法については以下の記事を参考にしてみてください。

[コマンドラインで Ubuntu を固定 IP アドレスにする方法 (なるべく丁寧に解説)](https://ja.developers.noraworld.blog/ubuntu-fixed-ip-address-via-cli)

## WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! と表示された場合
Raspberry Pi を何度も再インストールしている場合は、以下のようなメッセージが表示されるかもしれません。

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ECDSA key sent by the remote host is
SHA256:XXXX/XXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.
Please contact your system administrator.
Add correct host key in /Users/noraworld/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /Users/noraworld/.ssh/known_hosts:16
ECDSA host key for 192.168.3.14 has changed and you have requested strict checking.
Host key verification failed.
```

これは「中間者攻撃をされているかもしれません」という警告メッセージなのですが、何度も Raspberry Pi に OS を再インストールしていて、たまたま以前と IP アドレスが被ってしまった場合 (あるいは以前と同じ IP アドレスを固定で割り振ったりした場合) に表示されます。「同じ IP アドレスなのにフィンガープリントが違うということは、悪い人が、別のサーバにログインするようにあなたを仕向けているかもしれない」ということです。

ただ、この場合は単に OS を再インストールしたことでフィンガープリントが変わっただけなので、その場合は `~/.ssh/known_hosts` から該当する行 (行頭の IP アドレスが Raspberry Pi の IP アドレスであるもの) を削除してください。

# (optional) Ubuntu Desktop をインストールする
:information_source: **この作業は Ubuntu Desktop を使用したい場合のみ行います。Ubuntu Server を使う場合はこの手順はスキップします。**

Ubuntu Server から Ubuntu Desktop に変えたい場合は、以下のコマンドを実行します。

```shell
$ sudo apt -y install ubuntu-desktop
```

うまくいかない場合は [こちら](https://waldorf.waveform.org.uk/2020/ubuntu-desktops-on-the-pi.html) を参考にしてください。

# TIPS: arp コマンドではうまくいかない理由
結論からいうと、`arp` コマンドはキャッシュを見ているからです。

まず、ARP とは Address Resolution Protocol の略で、LAN 内のブロードキャストアドレスにパケットを送信することでブロードキャストを行い、その LAN 内に接続されているデバイスの IP アドレスと MAC アドレスを得るためのプロトコルです。それを行うのが `arp` コマンドです。

たとえば IP アドレスが `192.168.3.0` でサブネットマスクが `255.255.255.0` のネットワークで `arp` コマンドを実行した場合、ブロードキャストアドレスである `192.168.3.255` にパケットを送信します。すると `192.168.3.1` 〜 `192.168.3.254` の IP アドレスの範囲内で、使われている IP アドレスと、その IP アドレスが設定されたデバイスの MAC アドレスを得ることができます。

この記事の Raspberry Pi の IP アドレスを調べる項ではまさにこの ARP を使って IP アドレスを特定したのですが、`arp` コマンドではなく、`arp-scan` コマンドをわざわざインストールして使いました。

実は `arp` コマンドの実行結果は、そのコマンドを実行した時点での状態ではなく、過去に持っていた状態をキャッシュして表示しているだけなのです。つまり、Raspberry Pi を起動してネットワークにはじめて接続されてから、Raspberry Pi の IP アドレスと MAC アドレスが `arp` コマンドで確認できるようになるまでには時間がかかるということです。

キャッシュが更新されるのがいつなのかはわからないですが、Raspberry Pi が起動してから 10 分以上待っても更新されませんでした。

いつ更新されるのかわからない、わかったとしても数時間も待つわけにはいかないので `arp-scan` コマンドを使った、というわけです。

## 実験
`arp` コマンドがキャッシュの内容を表示していることを確認するために、`arp-scan` コマンドの実行前後で `arp` コマンドを実行してみました。

```shell
$ arp -na
? (192.168.3.1) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.1) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.11) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.18) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.18) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.19) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.19) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.24) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (224.0.0.251) at x:x:xx:x:x:xx on en0 ifscope permanent [ethernet]
? (224.0.0.251) at x:x:xx:x:x:xx on en7 ifscope permanent [ethernet]
? (239.255.255.250) at x:x:xx:xx:xx:xx on en0 ifscope permanent [ethernet]
? (239.255.255.250) at x:x:xx:xx:xx:xx on en7 ifscope permanent [ethernet]
```

重複している IP アドレスとマルチキャストアドレス (`224.0.0.0`  〜 `239.255.255.255` の範囲内にある IP アドレス、上記の例では下の 4 行) を除くと 5 つの IP アドレスが見つかりました。

```shell
$ sudo arp-scan -l --interface en0
Interface: en0, type: EN10MB, MAC: xx:xx:xx:xx:xx:xx, IPv4: 192.168.3.28
Starting arp-scan 1.9.7 with 256 hosts (https://github.com/royhills/arp-scan)
192.168.3.1		xx:xx:xx:xx:xx:xx	Hon Hai Precision Ind. Co.,Ltd.
192.168.3.11	xx:xx:xx:xx:xx:xx	Apple, Inc.
192.168.3.12	xx:xx:xx:xx:xx:xx	ELECOM CO.,LTD.
192.168.3.14	xx:xx:xx:xx:xx:xx	Raspberry Pi Trading Ltd
192.168.3.18	xx:xx:xx:xx:xx:xx	Luxshare Precision Industry Company Limited
192.168.3.20	xx:xx:xx:xx:xx:xx	ASIX ELECTRONICS CORP.
192.168.3.25	xx:xx:xx:xx:xx:xx	Sony Interactive Entertainment Inc.
192.168.3.19	xx:xx:xx:xx:xx:xx	(Unknown: locally administered)
192.168.3.26	xx:xx:xx:xx:xx:xx	Oculus VR, LLC
192.168.3.21	xx:xx:xx:xx:xx:xx	Texas Instruments
192.168.3.102	xx:xx:xx:xx:xx:xx	Belkin International Inc.
192.168.3.27	xx:xx:xx:xx:xx:xx	(Unknown)
192.168.3.23	xx:xx:xx:xx:xx:xx	Espressif Inc.

525 packets received by filter, 0 packets dropped by kernel
Ending arp-scan 1.9.7: 256 hosts scanned in 1.994 seconds (128.39 hosts/sec). 13 responded
```

`arp-scan` コマンドを実行すると合計 13 個の IP アドレスが見つかりました。これがキャッシュではない本当のブロードキャストの結果です。

```shell
$ arp -na
? (192.168.3.1) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.1) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.11) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.11) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.12) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.14) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.14) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.18) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.18) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.19) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.19) at xx:xx:xx:xx:xx:xx on en7 ifscope [ethernet]
? (192.168.3.20) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.21) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.23) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.25) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.26) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.27) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (192.168.3.102) at xx:xx:xx:xx:xx:xx on en0 ifscope [ethernet]
? (224.0.0.251) at x:x:xx:x:x:xx on en0 ifscope permanent [ethernet]
? (224.0.0.251) at x:x:xx:x:x:xx on en7 ifscope permanent [ethernet]
? (239.255.255.250) at x:x:xx:xx:xx:xx on en0 ifscope permanent [ethernet]
? (239.255.255.250) at x:x:xx:xx:xx:xx on en7 ifscope permanent [ethernet]
```

もう一度実行すると、たしかに 13 個 (重複 IP アドレスとマルチキャストアドレス除く) になりました。というわけで、`arp` コマンドはキャッシュを表示していたというわけです。

# まとめ
Raspberry Pi 本体で一切作業することなく Ubuntu をセットアップすることができました。

この方法を知るまでは、毎回 Raspberry Pi にキーボードとモニターをつないで、SSH できるまで作業していたのですが、めちゃくちゃめんどくさかったです。その作業がなくなったのでとても気軽に OS の再インストールができるようになりました。

ARP を使うというところが今回の方法のミソですね。Ubuntu のディスクをマウントして `/etc/netplan` 以下に設定ファイルをおいて固定 IP アドレスにする、という方法もありますが、macOS では Linux のファイルシステムである ext4 をマウントできない[^2]ので、IP アドレスの固定はインストール時点では諦めて、DHCP で割り当てられた IP アドレスを ARP で調べる、という方法をとりました。

参考になりましたら幸いです。

[^2]: 厳密にはパッケージやアプリをインストールすれば可能ですが、ext4fuse はリードオンリーなので編集不可、[extFS for Mac by Paragon Software](https://www.paragon-software.com/jp/home/extfs-mac/) は有料なのであまり良いソリューションにはならないです。

# 参考サイト
- [How to install Ubuntu Server on your Raspberry Pi](https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi)
- [同じLAN内に接続したRaspberry PiのIPアドレスを調べる](https://qiita.com/xshell/items/af4e2ef8d804cd29e38e)
