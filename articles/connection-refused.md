---
title: "Linux で SSH 接続などのネットワークの調子が悪いときの確認リスト"
emoji: "🐷"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Network", "Ubuntu", "Linux", "SSH"]
published: true
order: 122
layout: article
---

# はじめに
我が家では Raspberry Pi を稼働させているが、様々な理由でネットワークの調子が悪くなったりする。

いろいろなネットワークの問題に対処しているうちにある程度の知見が溜まったのでまとめておく。

中には Linux ではなくネットワークの根本的な内容も含まれているが、Linux ということだけに気を取られていると見逃しがちなので併せて紹介していく。





# 環境
* Ubuntu 20.04.3 LTS (Raspberry Pi 4 Model B)





# 確認リスト

* IP アドレスが重複していないか？
* ファイアウォールが通信をブロックしていないか？
* IPv6 が悪さをしていないか？
* IP アドレスやデフォルトゲートウェイが設定されているか？

一つずつ見ていこう。





# IP アドレスが重複していないか？
これはもうネットワークの基本中の基本なのだが、つい最近、IP アドレスが重複していることに気づかずに 1 ヶ月ほど悩んでいたことがあったので、これも要チェックする必要がある。

我が家の Raspberry Pi は IP アドレスを固定しているが、この設定は **Raspberry Pi 側とルータ側の両方で行う** 必要がある。

ところが、この問題に気づくまで、Raspberry Pi 側だけで IP アドレスを固定していた。

これにより、ルータの DHCP 機能で、Raspberry Pi と同じ IP アドレスを別の機器に割り振っていた。結果として IP アドレスが重複した。

ルータからすれば、Raspberry Pi が IP アドレスを固定していることは知らないので、そのアドレスも DHCP で割り振ろうとする。そのため、ルータ側でも Raspberry Pi で使用する IP アドレスを固定する必要がある。

## 症状
IP アドレスが重複していると以下のような症状が起こる。

* 数時間、ネットワーク接続がないほうのデバイスの IP アドレスが非アクティブになる
* 直近でネットワーク接続があったほうのデバイスの IP アドレスがアクティブになる

つまり、IP アドレスが重複しているデバイス同士で IP アドレス (ネットワーク接続) の奪い合いが発生する。ネットワークの接続があるとそちらの IP アドレスがアクティブになりネットワークにつながるようになるが、しばらくネットワーク接続がないと IP アドレスが非アクティブになる。

そのため、ネットワークにつながったりつながらなかったりと不安定な状態になる。

ちなみにこの状態で SSH 接続するとこのような挙動になる。

```shell
# 数時間 SSH していない状態からスタート

$ ssh raspberrypi
kex_exchange_identification: write: Broken pipe

$ ssh raspberrypi
ssh: connect to host 192.168.3.2 port 60313: Connection refused

$ ssh raspberrypi
ssh: connect to host 192.168.3.2 port 60313: Connection refused

$ ssh raspberrypi
ssh: connect to host 192.168.3.2 port 60313: Connection refused

$ ssh raspberrypi
# SSH 成功

> exit

$ ssh raspberrypi
# SSH 成功
# 直近でネットワーク接続があるため

# 数時間経過

$ ssh raspberrypi
kex_exchange_identification: write: Broken pipe

$ ssh raspberrypi
ssh: connect to host 192.168.3.2 port 60313: Connection refused

$ ssh raspberrypi
ssh: connect to host 192.168.3.2 port 60313: Connection refused

$ ssh raspberrypi
ssh: connect to host 192.168.3.2 port 60313: Connection refused

$ ssh raspberrypi
# SSH 成功
```

`kex_exchange_identification: write: Broken pipe` や `ssh connection refused` で調べても全然答えは出てこない。

## 確認方法
IP アドレスが重複しているかどうかは、**ネットワーク接続が問題ないデバイスで** 以下のコマンドを実行して確認する。

```shell
sudo arp-scan -l --interface <INTERFACE>
```

```
Interface: en7, type: EN10MB, MAC: xx:xx:xx:xx:xx:xx, IPv4: 192.168.3.233
Starting arp-scan 1.9.7 with 256 hosts (https://github.com/royhills/arp-scan)
192.168.3.1     xx:xx:xx:xx:xx:xx       Hon Hai Precision Ind. Co.,Ltd.
192.168.3.2     dc:a6:32:xx:xx:xx       Raspberry Pi Trading Ltd
192.168.3.2     xx:xx:xx:xx:xx:xx       ELECOM CO.,LTD. (DUP: 2)
192.168.3.203   xx:xx:xx:xx:xx:xx       ASIX ELECTRONICS CORP.
192.168.3.235   xx:xx:xx:xx:xx:xx       Luxshare Precision Industry Company Limited
192.168.3.213   xx:xx:xx:xx:xx:xx       (Unknown)
192.168.3.222   xx:xx:xx:xx:xx:xx       Apple, Inc.

522 packets received by filter, 0 packets dropped by kernel
Ending arp-scan 1.9.7: 256 hosts scanned in 1.854 seconds (138.08 hosts/sec). 7 responded
```

上記の出力結果だと `192.168.3.2` が重複していることがわかる。この状態だと互いのデバイスのネットワークが不安定になる。

ちなみに `arp-scan` コマンドは以下のコマンドでインストールできる。

```shell
# macOS
brew install arp-scan

# Ubuntu
sudo apt -y install arp-scan
```

たいていの UNIX にプリインストールされている `arp` コマンドは [キャッシュを持つので正しい結果が取得できない可能性がある](https://zenn.dev/noraworld/articles/setup-ubuntu-on-raspberry-pi-without-keyboard#tips%3A-arp-%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%81%A7%E3%81%AF%E3%81%86%E3%81%BE%E3%81%8F%E3%81%84%E3%81%8B%E3%81%AA%E3%81%84%E7%90%86%E7%94%B1) 点に注意。

## 余談
ちなみに、我が家でこの問題が発生していたとき、運の悪いことに IP アドレスが重複した「別の機器」が Wi-Fi ルータだった。このせいで Wi-Fi 接続しているすべてのデバイスがネットワークにつながりづらくなり[^2]、Wi-Fi ルータの故障など、別のところに問題があると思いこんでしまった。

[^2]: 全くつながらないわけではないのがたちが悪い

さらに、有線接続している (Wi-Fi を使用していない) デバイスでも、DNS サーバは Raspberry Pi になっているもんだから、DNS の問い合わせをするときはうまくいかないがそうでないときは全く問題ない、という完全に複雑化した状況になっていて気づくのが遅れた。





# ファイアウォールが通信をブロックしていないか？
Linux でネットワークの問題を疑う際の王道なのであえて書く必要もないかもしれないが、一応書いておく。

我が家の Raspberry Pi を DNS & DHCP サーバとして稼働させはじめたとき、最初、DHCP 機能がうまく動作しなかった。その理由は、DHCP で使用する 67 番ポートがファイアウォールで閉じていたからだ。

ファイアウォールの問題かどうかを疑う際、一時的にでもファイアウォールを無効にすることが可能なのであれば無効にして問題が解決するか試してみる。

```shell
sudo ufw disable
sudo ufw reload
sudo systemctl stop ufw
sudo systemctl disable ufw # 恒久的に無効にしたい場合のみ
```

もとに戻したいときは上記の逆の操作を行う。

```shell
sudo ufw enable
sudo ufw reload
sudo systemctl start ufw
sudo systemctl enable ufw # disable した場合のみ
```

ファイアウォールが問題だった場合で、ファイアウォールを無効にしたくない場合は、該当のポートのみを解放する。たとえば 67 番ポートを開放したい場合は以下のコマンドを実行する。

```shell
sudo ufw allow 67
sudo ufw reload
```





# IPv6 が悪さをしていないか？
別に IPv6 が悪いわけではないのだが、IPv4 の知識しかない状態で IPv6 を利用していると、ネットワークが想定していない状態になっていることがまれにある。

たとえば、我が家では Raspberry Pi を DNS & DHCP サーバにしているが、IPv6 を有効にしている場合、ルータの設定の制約で DHCPv6 や Router Advertisement を無効にすることができない。しかもたちの悪いのことに、Router Advertisement のプライオリティは `High` に設定されているので、Raspberry Pi 側で上書きすることも難しい。

これのせいで、自宅の各デバイスに割り当てられる DNSv6 アドレスが、Raspberry Pi の DNS サーバではなくルータの DNS サーバになってしまうことがある。

DHCPv6 や Router Advertisement が無効にできないのはどうしようもない[^1]ので、結局、我が家では IPv6 は無効にすることにした。

[^1]: ここは語弊がありそうなのでもう少し厳密に書く。我が家では SoftBank 光を契約している。SoftBank 光で IPv6 を利用するためには BB ユニットという機器を使用する必要がある。この BB ユニットの設定で DHCPv6 や Router Advertisement を無効にすることができない。つまり、Raspberry Pi 側の DHCPv6 や Router Advertisement を使うことができないというわけだ。つまり何を言いたいのかというと、DHCPv6 や Router Advertisement を無効にできる市販のルータを買えば良いという手段は利用できないということだ。

IPv6 が疑わしい場合は、一度、無効にしてみることをおすすめする。

## IPv6 の固定化
ちなみに、これは筆者が IPv6 に乏しいだけなのかもしれないが、`/etc/netplan/99_config.yaml` などに IPv6 アドレスを記述しても、なぜか IPv6 アドレスを固定することができない。

```yaml:/etc/netplan/99_config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: no
      dhcp6: no
      addresses:
        - 192.168.3.2/24
        - 2001:db8::dead:beef/64
      gateway4: 192.168.3.1
      gateway6: fe80:db8::dead:beef
      nameservers:
          addresses: [8.8.8.8, 8.8.4.4]
```

上記の設定をすると、IPv4 は固定されるが、IPv6 は固定されない。

今となっては IPv6 を無効にしているのでもう使っていないが、有効にしていたときは OS 起動時に以下のようなスクリプトを cron に実行させていた。

```shell
/usr/sbin/ip addr change 2001:db8::dead:beef dev eth0 valid_lft forever preferred_lft forever
```

一応これで IPv6 アドレスも固定できるようになったのだが、何か釈然としない……。





# IP アドレスやデフォルトゲートウェイが設定されているか？
何を今さら…… と思うかもしれないが、正しく設定されていたとしても、ある日突然、IP アドレスを失うことがある。

我が家の Raspberry Pi は数週間または 1 ヶ月程度に一度、突然 IP アドレスやデフォルトゲートウェイを失う。

はじめはルータの DHCP サーバに勝手に別の IP アドレスを割り振られてしまったり、IP アドレスが固定されていなくて DHCP リースの期限切れで IP アドレスを失ってしまったりなどが原因なのではないかと思ったのだが、それらは問題なかった。

こうなると SSH もできなくなるので、直接 Raspberry Pi を操作してコマンドを実行してみると、やはり IP アドレスやデフォルトゲートウェイを失っている。

```shell
ip route show
# 何も出力されない
```

直し方は簡単だ。

```shell
sudo netplan apply
```

しかし、定期的にこれを実行しなければいけないのはやはりおかしい。

これに関しては未だに謎で、[Stack Overflow でも質問してみた](https://askubuntu.com/questions/1368944/why-does-my-ubuntu-server-computer-lose-a-static-ip-address-suddenly) が回答がつかなかった。

暫定対応として、以下のスクリプトを 10 分おきに cron で実行している。

```shell:ip-observer
#!/bin/sh

if [ "$(ip route show)" = "" ]; then
  netplan apply
fi
```

なぜこのようなことをしないと IP アドレスやデフォルトゲートウェイを維持できないのかは不明だ。
