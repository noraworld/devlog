---
title: "コマンドラインで Ubuntu を固定 IP アドレスにする方法 (なるべく丁寧に解説)"
emoji: "🗂"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ubuntu", "固定IP", "RaspberryPi", "ubuntu20.04"]
published: false
order: 76
---

# はじめに
Raspberry Pi で遊んでいると IP アドレスを固定したい場面が多々発生します。今回はコマンドラインのみで Ubuntu の IP アドレスを固定する方法について紹介します。

# 環境
Ubuntu 20.10

# 設定ファイルを追加
`/etc/netplan/99_config.yaml` というファイルを新規作成し、その中に以下の内容を書き込みます。

```yaml:/etc/netplan/99_config.yaml
network:
 version: 2
 renderer: networkd
 ethernets:
 <NETWORK_INTERFACE_NAME>:
 addresses:
 - <STATIC_IP_ADDR_WITH_NETMASK>
 gateway4: <DEFAULT_GATEWAY>
 nameservers:
 addresses: [<DNS, DNS, ...>]
```

`<>` で囲まれている部分はそれぞれ以下の環境に置き換えます。

| 変数 | 説明 | 例 |
|---|---|---|
| `<NETWORK_INTERFACE_NAME>` | ネットワークインターフェース名 | `eth0` |
| `<STATIC_IP_ADDR_WITH_NETMASK>` | 固定 IP アドレスとネットマスク | `192.168.3.2/24` |
| `<DEFAULT_GATEWAY>` | デフォルトゲートウェイ | `192.168.3.1` |
| `<DNS, DNS, ...>` | DNS サーバ (複数ある場合はカンマ区切り) | `8.8.8.8, 8.8.4.4` |

## ネットワークインターフェース名
ネットワークインターフェース名は以下のコマンドで調べられます。

```shell
$ ip a | grep -E '192\.168\.[0-9]*\.[0-9]*|172\.[0-9]*\.[0-9]*\.[0-9]|10\.[0-9]*\.[0-9]*\.[0-9]' -B 10
```

長い grep は IPv4 のプライベートアドレスとなりうる値を正規表現で全部指定しています[^1]。

[^1]: `172\.[0-9]*\.[0-9]*\.[0-9]` の部分は実は正しくはないのですが、正しく指定しようとすると正規表現がめんどくさいのでこれでご勘弁ください。

すると、以下のように表示されます。

```
... (無視して OK)
...
...
...
...
...
...
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
 link/ether xx:xx:xx:xx:xx:xx brd ff:ff:ff:ff:ff:ff
 inet 192.168.3.14/24 brd 192.168.3.255 scope global dynamic eth0
```

grep が引っかかった部分 (上記の例だと `192.168.3.14` と `192.168.3.255`) に該当するインターフェース名 (上記の例だと `eth0` の部分) を `<NETWORK_INTERFACE_NAME>` に書きます。

## 固定 IP アドレスとネットマスク
これは Ubuntu デバイスに指定したい固定 IP アドレスとネットマスクをそのまま指定します。ただし、すでに存在している LAN 内の IP アドレスと被ると厄介なので、事前に被っていないことを調べる必要があります。

Mac だと `arp-scan` コマンドで確認できます。

```shell
$ brew install arp-scan
```

```shell
$ sudo arp-scan -l --interface <NETWORK_INTERFACE_NAME>
```

`<NETWORK_INTERFACE_NAME>` は Ubuntu のときと同じように調べます。ただし Mac には `ip` コマンドは存在しないので代わりに `ifconfig` を使います。

```shell
$ ifconfig | grep -E '192\.168\.[0-9]*\.[0-9]*|172\.[0-9]*\.[0-9]*\.[0-9]|10\.[0-9]*\.[0-9]*\.[0-9]' -B 10
```

複数出てきた場合はどちらを使っても大丈夫です。

`arp-scan` コマンドの結果に出てこなかった IP アドレスを Ubuntu に指定します。

次にネットマスクですが、まず LAN 内のネットマスクを調べます。Mac なら「システム環境設定」>「ネットワーク」の「サブネットマスク」と書かれている部分がそれに該当します。

![スクリーンショット 2020-12-24 17.33.46のコピー3.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/26a3bf88-a98a-35f2-2009-cfb0f364d824.png)

上記のスクリーンショットでは `255.255.255.0` と書かれています。これを 2 進数表記にすると以下のようになります。

```
11111111 11111111 11111111 00000000
```

上位 24 ビットが `1` なので、`/24` と指定します。つまり IP アドレスと合わせると `192.168.3.2/24` のような表記になります。(`192.168.3.2` は例です。他と被らない IP アドレスを指定します)

他の例として、たとえば `255.255.0.0` だった場合は、2 進数表記すると

```
11111111 11111111 00000000 00000000
```

となるので、`/16` を指定すれば OK です。

## デフォルトゲートウェイ
その名の通りデフォルトゲートウェイを指定します。

Mac だと「システム環境設定」>「ネットワーク」の「ルーター」と書かれている部分がデフォルトゲートウェイです。これを同じ値を Ubuntu でも設定すれば OK です。

![スクリーンショット 2020-12-24 17.33.46のコピー.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/c2832948-4948-6b47-b494-ef8259744721.png)

## DNS サーバ
DNS サーバの IP アドレスをカンマ区切りで複数指定できます。

よくわからない場合はとりあえず `8.8.8.8, 8.8.4.4` を指定しておけば OK です。これは Google Public DNS で、誰でも利用可能です。

## 完成例
完成例はこんな感じです。

```yaml:/etc/netplan/99_config.yaml
network:
 version: 2
 renderer: networkd
 ethernets:
 eth0:
 addresses:
 - 192.168.3.2/24
 gateway4: 192.168.3.1
 nameservers:
 addresses: [8.8.8.8, 8.8.4.4]
```

上記の例では `192.168.3.2` で固定しています。

# 適用
上記のファイルを保存したら、以下のコマンドを実行します。

```shell
$ sudo netplan apply
```

これで固定 IP アドレスになったはずです。確認してみましょう。

```shell
$ ip a
```

```
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
 link/ether xx:xx:xx:xx:xx:xx brd ff:ff:ff:ff:ff:ff
 inet 192.168.3.2/24 brd 192.168.3.255 scope global eth0
 valid_lft forever preferred_lft forever
 inet 192.168.3.14/24 brd 192.168.3.255 scope global secondary dynamic eth0
 valid_lft 83119sec preferred_lft 83119sec
```

ちゃんと `192.168.3.2` が設定されていることが確認できました。

固定 IP アドレス (上記の例では `192.168.3.2`) のすぐ下の行に `valid_lft forever preferred_lft forever` と書かれているので固定になっていることがわかります。固定ではない場合、`192.168.3.14` のすぐ下の行のように `valid_lft 83119sec preferred_lft 83119sec` と有効期限が表示されています。こちらは有効期限が切れたり DHCP サーバがリセットされたりすると変わるため、固定ではありません。

なお、固定 IP アドレスを指定しても上記の例のように `192.168.3.14` (固定じゃないほうの IP アドレス) が残っています。ただちに古い IP アドレスが削除されるわけではないようです。

# 参考サイト
- [Ubuntuで固定IPアドレスにコマンド経由で設定する](https://thr3a.hatenablog.com/entry/20200517/1589721539)
