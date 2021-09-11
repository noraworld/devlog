---
title: "ルータ設定を極力いじらずに IPv4 + IPv6 の DNS & DHCP サーバを構築する方法"
emoji: "🎃"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Dnsmasq", "DNS", "Network", "Ubuntu", "RaspberryPi"]
published: true
order: 107
layout: article
---

# はじめに
本記事では、ルータの設定を極力いじらずに、Raspberry Pi で DNS & DHCP サーバを構築する方法について紹介する。なお、IPv4 だけでなく IPv6 にも対応する方法も取り扱っている。

なぜ「ルータの設定を極力いじらずに」構築する必要があるのか。筆者の自宅では SoftBank 光を契約しているのだが、SoftBank 光から提供されるルータは、うんざりするほどルータの設定が制限されている。

* DHCPv4 をオフにできない
* IPv6 を有効にすると DHCPv6 をオフにできない
* IPv6 を有効にすると Router Advertisement をオフにできない

おまけに、IPv6 を有効にするためには、SoftBank 光から提供されたルータを使用することが必須となる。そのため、このルータを取り外し、市販のルータを代わりに使うと IPv6 が使えなくなってしまう。とにかくよそ者を許さない仕様なのだ。

それでも、今のところは他のプロバイダに切り替えるつもりはない。なぜなら、SoftBank 光は爆速だからだ。

今回は、ルータの設定が制限されている状況でも、別の DNS & DHCP サーバを運用できるように設定する方法について紹介する。DNS & DHCP サーバとして機能させる機器として Raspberry Pi を使用する。



# 環境
Ubuntu 20.04.3 LTS



# 使用するパッケージのインストール
[Dnsmasq](https://thekelleys.org.uk/dnsmasq/doc.html) と [radvd](https://radvd.litech.org) を使用する。なお、radvd は IPv6 の設定でのみ使用するため、IPv6 の設定が不要な場合はインストールしなくて良い。

```shell:Shell
sudo apt -y install dnsmasq radvd radvdump
```



# 既存の IP アドレスをチェック
## Raspberry Pi の IP アドレス
現時点で Raspberry Pi に割り当てられている IPv6 アドレスを調べる。

```shell:Shell
ip a
```

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether dc:a6:32:xx:xx:xx brd ff:ff:ff:ff:ff:ff
    inet 192.168.3.2/24 brd 192.168.3.255 scope global dynamic eth0
       valid_lft 82426sec preferred_lft 82426sec
    inet6 xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx/64 scope global dynamic mngtmpaddr noprefixroute
       valid_lft 82428sec preferred_lft 10428sec
    inet6 fe80::dea6:32ff:fec5:ed06/64 scope link
       valid_lft forever preferred_lft forever
3: wlan0: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether dc:a6:32:xx:xx:xx brd ff:ff:ff:ff:ff:ff
```

以下の 3 つの IP アドレスを控えておく。

* IPv4 プライベートアドレス
    * 上記の例でいう `192.168.3.2` の部分
* IPv6 リンクローカルユニキャストアドレス
    * 上記の例でいう `fe80::dea6:32ff:fec5:ed06` の部分
    * `fe80::` から始まるのが特徴
* IPv6 グローバルユニキャストアドレス
    * これはグローバルユニキャストアドレスのため、上記の例では `xxxx` のように伏せ字になっている
    * `2` または `3` から始まるのが特徴 (たいていは `2` から始まる)

## ルータの IPv4 プライベートアドレス
ルータの IPv4 プライベートアドレスを調べる。

```shell:Shell
ip route show
```

```
default via 192.168.3.1 dev eth0 proto static
default via 192.168.3.1 dev eth0 proto dhcp src 192.168.3.2 metric 100
192.168.3.0/24 dev eth0 proto kernel scope link src 192.168.3.2
192.168.3.1 dev eth0 proto dhcp scope link src 192.168.3.2 metric 100
```

`default via` に続く IPv4 プライベートアドレス (上記の例でいう `192.168.3.1`) を控えておく。

## ルータの IPv6 リンクローカルユニキャストアドレス
ルータの IPv6 リンクローカルユニキャストアドレスを調べる。

```shell:Shell
ip -6 route show
```

```
::1 dev lo proto kernel metric 256 pref medium
xxxx:xxxx:xxxx:xxxx::/64 dev eth0 proto kernel metric 256 pref medium
fe80::/64 dev eth0 proto kernel metric 256 pref medium
default via fe80::da0f:99ff:fedb:2bad dev eth0 proto static metric 1024 pref medium
```

`default via` に続く IPv6 リンクローカルユニキャストアドレス (上記の例でいう `fe80::da0f:99ff:fedb:2bad`) を控えておく。



# IP アドレスの固定
Raspberry Pi 自身の IP アドレスを固定する。`/etc/netplan/99_config.yaml` というファイルがなければ新規作成する。

```yaml:/etc/netplan/99_config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - 192.168.3.2/24
        - xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx/64
      gateway4: 192.168.3.1
      gateway6: fe80::da0f:99ff:fedb:2bad
      nameservers:
          addresses: [8.8.8.8, 8.8.4.4]
```

* `network.ethernets.eth0`
    * ネットワークインターフェースが `eth0` でない場合は変更すること
* `network.ethernets.eth0.addresses`
    * 以下の 2 つを設定する
        * Raspberry Pi の IPv4 プライベートアドレス
        * Raspberry Pi の IPv6 グローバルユニキャストアドレス
* `network.ethernets.eth0.gateway4`
    * ルータの IPv4 プライベートアドレス
* `network.ethernets.eth0.gateway6`
    * ルータの IPv6 リンクローカルユニキャストアドレス
* `network.ethernets.eth0.nameservers.addresses`
    * 上流の DNS を配列形式で指定 (複数可)
        * 特にこだわりがなければ上記と同じ IP アドレスで問題ない

設定ができたら、反映させる。

```shell:Shell
sudo netplan apply
```



# ルータの設定
ルータの設定は極力いじらずに構築する、と言ったので、本当はいじりたくないのだが、DHCPv4 の割当範囲だけ変更する。

自宅にあるルータは DHCPv4 をオフにできないが、幸い、DHCPv4 の割り当て IP アドレスの範囲を変更することはできる。

ルータの設定ページを開き、割り当てる IP アドレスの範囲を極限まで減らす。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/access-restriction-using-dnsmasq/dhcp_ip_range_setting.png)

上記の例では、`192.168.3.2` のみしか割り当てられないようにしている。そしてこのアドレスは Raspberry Pi に割り当てているプライベートアドレスのため、それ以外の一切のクライアントに、このルータが IPv4 アドレスを割り振ることはなくなる。

これで、後に設定する Raspberry Pi 側の DHCPv4 の設定が確実に適用されるようになる。

このルータの設定をしなくても大丈夫そうな気もするが、DHCPv4 サーバが 2 台になってしまうので、できるなら設定しておくことをおすすめする。



# DNSv4 & DHCPv4 の設定
まずは IPv4 用の DNS & DHCP サーバを構築する。`/etc/dnsmasq.conf` に以下の設定を追加する。

```conf:/etc/dnsmasq.conf
domain-needed
bogus-priv
no-hosts
no-resolv
no-poll
strict-order
expand-hosts
bind-interfaces
no-hosts
dhcp-authoritative
dhcp-rapid-commit
no-negcache

port=53
server=1.1.1.1
server=8.8.8.8

listen-address=127.0.0.1,192.168.3.2

dhcp-range=192.168.3.200,192.168.3.254,12h
dhcp-option=option:netmask,255.255.255.0
dhcp-option=option:router,192.168.3.1
dhcp-option=option:dns-server,192.168.3.2
```

* `port`
    * `53` を設定する
    * ファイアウォールで 53 番をブロックしている場合は許可を忘れずに
* `server`
    * 上流の DNSv4 サーバを指定する
        * 特にこだわりがなければ上記と同じで良い
* `listen-address`
    * 以下の 2 つをカンマ区切りで設定する
        * `127.0.0.1`
        * Raspberry Pi の IPv4 プライベートアドレス
* `dhcp-range`
    * 以下の 3 つをカンマ区切りで指定する
        * DHCP で割り当てる IP アドレスの範囲の開始アドレス
        * DHCP で割り当てる IP アドレスの範囲の終了アドレス
        * リース時間
            * 特にこだわりがなければ上記と同じで良い
* `dhcp-option=option:netmask`
    * サブネットマスクを指定する
        * 筆者の環境では `192.168.3.0/24` だったので `255.255.255.0` を指定している
* `dhcp-option=option:router`
    * ルータの IPv4 プライベートアドレスを指定する
* `dhcp-option=option:dns-server`
    * Raspberry Pi の IPv4 プライベートアドレスを指定する

設定が完了したら Dnsmasq を起動または再起動する。

```shell:Shell
sudo systemctl restart dnsmasq.service
```

PC やスマートフォンなどのクライアントの DHCP リース更新を行うか再起動すると、Raspberry Pi (Dnsmasq) 側で設定した内容が反映されるはずだ。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/custom-dns-and-dhcp-with-dnsmasq/ipv4.png)

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/custom-dns-and-dhcp-with-dnsmasq/ipv4_dns.png)



# DNSv6 & DHCPv6 の設定
次に IPv6 用の DNS & DHCP サーバを構築する。先ほどと同じく `/etc/dnsmasq.conf` に以下の設定を追加する。

```conf:/etc/dnsmasq.conf
server=2606:4700:4700::1001
server=2001:4860:4860::8844

ra-param=eth0,high,0,0
quiet-ra

dhcp-range=::fec5:0,::fec5:7fff,constructor:eth0,ra-names,slaac,12h
dhcp-option=option6:dns-server,[xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx]
dhcp-option=option6:information-refresh-time,6h
```

* `server`
    * 上流の DNSv6 サーバを指定する
        * 特にこだわりがなければ上記と同じで良い
* `ra-param`
    * `eth0,high,0,0` を指定する
        * ただし、ネットワークインターフェースが `eth0` でない場合は変更すること
* `dhcp-range`
    * `::fec5:0,::fec5:7fff` の `fec5` 部分は以下に置き換える
        * Raspberry Pi のリンクローカルユニキャストアドレスの 7 セクション目 (コロン区切りの左から 7 個目)
        * 先頭の `::` や `:0`, `:7fff` の部分はそのままで良い
    * `constructor:eth0,ra-names,slaac,12h` の部分はそのままで良い
        * ただし、ネットワークインターフェースが `eth0` でない場合は変更すること
* `dhcp-option=option6:dns-server`
    * Raspberry Pi の IPv6 グローバルユニキャストアドレスを指定する
* `dhcp-option=option6:information-refresh-time`
    * リフレッシュタイムを指定する
        * 特にこだわりがなければ上記と同じで良い

設定が完了したら Dnsmasq を再起動する。

```shell:Shell
sudo systemctl restart dnsmasq.service
```

これで各クライアントに IPv6 アドレスも設定されてほしい、のだが、筆者の環境では設定されなかった。

その場合は、radvd を利用する。

`/etc/radvd.conf` というファイルを新規作成し、以下の設定を追加する。

```conf:/etc/radvd.conf
interface eth0 {
    AdvSendAdvert on;
    AdvDefaultPreference high;

    prefix xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:8000/113 {
        AdvOnLink on;
        AdvRouterAddr on;
        AdvPreferredLifetime 120;
        AdvValidLifetime 300;
    };

    route fe80::da0f:99ff:fedb:2bad/128 {
        AdvRoutePreference high;
        AdvRouteLifetime 3600;
    };

    RDNSS xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx {
        AdvRDNSSLifetime 3600;
    };
};
```

* `interface eth0`
    * ネットワークインターフェースが `eth0` でない場合は変更すること
* `prefix`
    * Raspberry Pi の IPv6 グローバルユニキャストアドレスの最後の 8 セクション目を `8000` に置き換え、その後ろに `/113` を追加したものを指定する
* `route`
    * ルータの IPv6 リンクローカルユニキャストアドレスを指定する
    * 後ろに `/128` をつけることを忘れずに
* `RDNSS`
    * Raspberry Pi の IPv6 グローバルユニキャストアドレスを指定する

末尾に `Lifetime` とつく設定は文字通りその設定のライフタイムを表しているが、あまり短くしすぎると設定が反映されたり消えたりする。筆者の環境では `60` だとうまくいかなかったので `3600` にしておくことをおすすめする。

設定が完了したら radvd を起動または再起動する。

```shell:Shell
sudo systemctl restart radvd.service
```

これで各クライアントに IPv6 アドレスが設定されれば完了だ。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/custom-dns-and-dhcp-with-dnsmasq/ipv6.png)

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/custom-dns-and-dhcp-with-dnsmasq/ipv6_dns.png)

灰色の部分が、Raspberry Pi の IPv6 グローバルユニキャストアドレスになっていれば正しく DNSv6 アドレスが設定されている。



# IPv6 テスト
本当に IPv6 でのインターネット接続ができているのかをテストする。以下の 3 つのサイトにアクセスして、IPv6 が有効になっていることを確認する。

* [Test your IPv6.](https://test-ipv6.com)
* [IPv6 test - IPv6/4 connectivity and speed test](https://ipv6-test.com)
* [Google IPv6 test](https://ipv6test.google.com)



# 参考サイト
* [RPi4 - IPv4 and IPv6 network with custom DNS](https://gpailler.github.io/2019-10-07-pi4-part2/)
* [How to configure IPv6 with Netplan on Ubuntu 18.04](https://www.snel.com/support/how-to-configure-ipv6-with-netplan-on-ubuntu-18-04/)
* [1. Displaying existing IPv6 routes](https://tldp.org/HOWTO/Linux+IPv6-HOWTO/ch07s01.html)
* [インターネット10分講座：IPv6アドレス～技術解説～](https://www.nic.ad.jp/ja/newsletter/No32/090.html)
* [16.12.1　RAによるアドレス情報配布](https://www.alaxala.com/jp/techinfo/archive/manual/AX7800S/HTML/10_10_/APGUIDE/0383.HTM)
* [Router Advertisement　（RA)](https://www.furukawa.co.jp/fitelnet/f/man/common/command-config/yougo/a-z/ra.htm)
* [第5回　IPv6アドレスをDHCPで割り当てる](https://atmarkit.itmedia.co.jp/ait/articles/1303/14/news095.html)
* [Brief note on IPv6 flags and Dnsmasq modes](https://rakhesh.com/linux-bsd/brief-note-on-ipv6-flags-and-dnsmasq-modes/)
* [man pages section 8: System Administration Commands](https://docs.oracle.com/cd/E88353_01/html/E72487/dnsmasq-8.html)
* [Linux の Network Namespace と radvd / dnsmasq で IPv6 SLAAC (+RDNSS) を試す](https://blog.amedama.jp/entry/2020/02/08/184633)
* [[Dnsmasq-discuss] Unable to send custom RDNSS value in RA](https://lists.thekelleys.org.uk/pipermail/dnsmasq-discuss/2019q3/013124.html)
* [DNSMASQ](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)
* [Dnsmasq – A simple DHCPv6 server for Embedded devices](https://kasiviswanathanblog.wordpress.com/2017/06/04/dnsmasq-a-simple-dhcpv6-server-for-embedded-devices/)
* [IPv6 change radvd advertised Default Gateway](https://www.reddit.com/r/OPNsenseFirewall/comments/gkcqax/ipv6_change_radvd_advertised_default_gateway/)
