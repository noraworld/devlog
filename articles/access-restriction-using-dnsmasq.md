---
title: "Dnsmasq を使って特定の時間帯・サイトへのアクセス制限をする"
emoji: "🖐"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Network", "DNS", "Dnsmasq", "RaspberryPi", "Ubuntu"]
published: true
order: 100
layout: article
---

https://ja.developers.noraworld.blog/access-restriction-using-dnsmasq

# はじめに
特定のサイトへのアクセス制限をかける方法については、以前に 2 つ記事を書いている。

* [Dnsmasq を使って特定のウェブサイトに OpenVPN 経由でアクセスできないようにする方法](https://ja.developers.noraworld.blog/access-restriction-using-dnsmasq-via-openvpn)
* [Web プロキシサーバ Squid を利用して、特定のサイト・時間帯・曜日にアクセスできないようにする](https://ja.developers.noraworld.blog/access-restriction-using-squid)

このようなことをするモチベーションは、以前も記事に書いている。

[モチベーション](https://ja.developers.noraworld.blog/access-restriction-using-dnsmasq-via-openvpn#%E3%83%A2%E3%83%81%E3%83%99%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3)

簡潔にまとめれば、筆者の場合は YouTube の見過ぎで他の有意義なことをする時間を確保できないからだ。

そこで、特定の時間帯・特定のサイト (YouTube など) にアクセスできないようにする方法を思いついたのだが、正直に言うと、現在は上記の 2 つのうち、どちらも利用していない。つまり、YouTube のアクセス制限はかけていない。

かける必要がなくなったからではなく、上記のいずれも筆者の現在の環境にはそぐわなくなったからだ。

具体的なことを話し始めると文章が長くなり退屈するだろうから、それは本記事の後半に回すことにして、さっそくやり方について説明する。

なお、本記事は、基本的に「[夜になったらYouTubeやTwitterに繋がらなくして睡眠時間を確保する](https://zenn.dev/youxkei/articles/raspberrypi-dnsmasq)」の二番煎じとなるが、後述する「ルータの条件」がどちらも満たせない場合にどうしたら良いかが記載されていないため、本記事ではその点も踏まえなるべく詳しく解説する。



# 仕組み
ざっくりとした仕組みは以下の通り。

1. LAN 内の DHCP 機能 & DNS 機能を Raspberry Pi に任せる
2. 各端末には Raspberry Pi が指定した DNS サーバ (Raspberry Pi 自身) が DHCP により設定される
3. Raspberry Pi 内の DNS サーバ (Dnsmasq) で特定のサイト (例: YouTube) のドメイン (例: `youtube.com`) を名前解決できないようにする
4. 名前解決できないようにするドメイン設定を別ファイルに記述しておき、そのファイルのシンボリックリンクを貼ったり剥がしたりすることで設定を自動的に有効にしたり無効にしたりする
5. 結果として、各端末は、特定の時間帯に、特定のサイトにアクセスできないようになる



# メリット
* DHCP 機能を利用するので、各端末で個別に設定する必要がない
  * 見方を変えると、ネットワークの設定が細かくできない端末でもこの方法が利用できる
  * さらにいうと、各端末のネットワーク設定を意識しなくて良い
* ネットワークレベルなので、ブラウザの拡張機能のように簡単にオン・オフできない
* ネットワークレベルなので、特定の端末にしか対応できないということがない



# 必要なもの
* Raspberry Pi

Linux PC でも同様のことができるが、24 時間 365 日稼働し続ける必要があるため、電気代的におすすめしない。



# 環境
Ubuntu 20.04.2 LTS



# ルータの条件
本記事の手順では、ルータの条件が重要になってくる。

具体的には、使用しているルータで、以下の 2 つが両方とも設定できるかどうかである。

* DHCP 機能を無効にできること
* [Router Advertisement](https://www.nic.ad.jp/ja/basics/terms/ra.html) による DNS 通知機能をオフにできること

筆者の利用しているルータでは、残念ながらどちらも設定できなかった。

しかし、諦めるのはまだ早い。上記 2 つには、代替手段が残されている。

その代替手段について、フローチャートを作成したので、これを参考に設定を行ってほしい。

## DHCP 機能に関するフローチャート
![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/access-restriction-using-dnsmasq/dhcp_off_flowchart.svg)

### IP アドレスの割当範囲の補足説明
使用しているルータによって設定画面は全く異なるため、具体的な設定方法についてここで案内することはできないが、IP アドレスの割当範囲を極限まで狭くする件について補足する。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/access-restriction-using-dnsmasq/dhcp_ip_range_setting.png)

これは筆者が使用しているルータの設定画面だが、「割当 IP アドレスの範囲」という部分が、いわゆる DHCP 機能で割り当てる IP アドレスの範囲のことである。

このルータは DHCP 機能をオフにすることはできないが、上記の画像のように、IP アドレスの割当範囲を `192.168.3.2` 〜 `192.168.3.2` と設定すれば、端末 1 台分にしか IP アドレスを割り振れない。

さらにこの `192.168.3.2` を、今回使用する Raspberry Pi に割り振ってしまえば、実質的にこのルータの DHCP 機能を無効にしたも同然になる。

Raspberry Pi 側で固定 IP アドレスに設定すれば、ルータ側では「固定割当」を利用する必要はないかもしれないが、念のためルータ側でも設定しておくと安心。

DHCP 機能による IP アドレスの割当範囲を変更できず、しかも DHCP 機能もオフにできないルータの場合は、面倒だが DHCP を使わず、各端末ごとで手動で設定するしかない。

## Router Advertisement による DNS 通知機能に関するフローチャート
![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/access-restriction-using-dnsmasq/ra_off_flowchart.svg)

筆者の環境では残念ながら「IPv6 を無効にする」に該当してしまったのだが、これの何が問題なのかについては、ここで説明すると長くなるので本記事の後半に回すことにする。



# ルータの設定と反映
上記のフローチャートに従って、ルータの設定を行う。ルータごとに設定方法は異なるため、やり方がわからない場合は取扱説明書や公式ヘルプページ等を参照すること。

設定完了後は、**再起動する必要** がある。



# Raspberry Pi に Ubuntu をインストール
https://ja.developers.noraworld.blog/setup-ubuntu-on-raspberry-pi-without-keyboard



# Raspberry Pi の IP アドレスを固定
https://ja.developers.noraworld.blog/ubuntu-fixed-ip-address-via-cli



# 必要なパッケージのインストール
```shell:Shell
sudo apt -y install dnsmasq
```

インストールの段階で Dnsmasq のデーモンを起動しようとして失敗するエラーメッセージが表示されるかもしれないが、この段階ではこれは無視して問題ない。



# Dnsmasq の設定
Dnsmasq をインストールすると `/etc/dnsmasq.conf` が生成されると思うので、以下のように変更を加えていく。

以下は例なので、以降の説明を参考に、IP アドレス等は適宜変更すること。

```diff:/etc/dnsmasq.conf
- #listen-address=
+ listen-address=127.0.0.1,192.168.3.2

- #bind-interfaces
+ bind-interfaces

- #no-hosts
+ no-hosts

- #dhcp-range=192.168.0.50,192.168.0.150,12h
+ dhcp-range=192.168.3.200,192.168.3.254,12h

+ dhcp-option=option:netmask,255.255.255.0
+ dhcp-option=option:router,192.168.3.1
+ dhcp-option=option:dns-server,192.168.3.2

- #conf-dir=/etc/dnsmasq.d
+ conf-dir=/etc/dnsmasq.d
```

## listen-address
`127.0.0.1` と、Raspberry Pi のプライベート IP アドレスを指定する。筆者の環境では、Raspberry Pi に `192.168.3.2` を割り振っている。

## dhcp-range
これは DHCP 機能で割り当てる IP アドレスの範囲を指定する設定である。

筆者の環境では、IP アドレス & サブネットマスクが `192.168.3.0/24` に設定されているので、この範囲内で IP アドレスを設定する。

普段あまり使われない範囲を指定しておいたほうが、Raspberry Pi から IP アドレスが割り振られた、ということがわかりやすいため、上記の例では `192.168.3.200` 〜 `192.168.3.254` で設定してみた。

ちなみに最後の `12h` は DHCP のリース時間である。特に変更しなくても問題はない。

## dhcp-option=option:netmask
サブネットマスクを指定する。

## dhcp-option=option:router
ルータの IP アドレスを指定する。

## dhcp-option=option:dns-server
DHCP 機能で各端末に通知する DNS サーバの IP アドレスを指定する設定である。

ここでは Raspberry Pi の IP アドレスを指定する。



# アクセス制限するドメインリストを作成
適当なディレクトリに適当なファイル名でファイルを作り、そのファイルの中にアクセス制限したいドメインを追加していく。

以下はその例である。便宜上、ファイル名を `distractor.conf` としておく。

```conf:distractor.conf
address=/youtube.com/googlevideo.com/youtube-nocookie.com/
server=/studio.youtube.com/rtmp.youtube.com/c.youtube.com/#
```

`address=/<domain>[/<domain>...]/<ipaddr>` とすることで、`<domain>` を `<ipaddr>` で名前解決するように設定できる。

`<ipaddr>` を省略するか、`127.0.0.1` を指定することでそのドメインの Web サイトにアクセスできないようになる。

上記の例では `<ipaddr>` を省略することで、`youtube.com`、`googlevideo.com`、`youtube-nocookie.com` の名前解決ができなくなり、結果、アクセスできなくなるようにしている。

```
address=/youtube.com/googlevideo.com/youtube-nocookie.com/
```

のようにひとまとめに書くこともできるし、

```
address=/youtube.com/
address=/googlevideo.com/
address=/youtube-nocookie.com/
```

のように分けることもできる。関連のあるドメインはまとめたほうが管理しやすい。

`address` の設定はサブドメインにも影響を及ぼす。`youtube.com` を指定することで、`music.youtube.com` や `studio.youtube.com` にもアクセスできなくなってしまう。

これを防ぐために、`address` でブロックしたあとの行に `server=/<subdomain>[/<subdomain>...]/#` を追加することで、指定したサブドメインに関しては通常通り名前解決するようにできる。

上記の例では `studio.youtube.com`、`rtmp.youtube.com`、`c.youtube.com` の名前解決ができるようにしている。

ちなみにこの 3 つのサブドメインを許可することで、YouTube にはアクセスできないが、YouTube Studio (YouTube 動画 & アーカイブの管理ページ) へのアクセスやライブ配信はできるようになる。



# アクセス制限の開始・終了を設定
Dnsmasq の設定が反映されるディレクトリ `/etc/dnsmasq.d` の中に、先ほど作成したドメインリストファイル (`distractor.conf`) のシンボリックリンクを貼ったり剥がしたりすることで、特定の時間帯はアクセス制限をし、それ以外の時間帯は通常通りアクセスできるようにする。

シンボリックリンクを貼ったり剥がしたりするのは cron で自動で行う。

以下は、21 〜 23 時のみアクセス可能にする例である。便宜上、ファイル名を `dnsmasq_cron.conf` としておく。

```cron:dnsmasq_cron.conf
0 21 * * * unlink                          /etc/dnsmasq.d/distractor.conf && systemctl restart dnsmasq
0 23 * * * ln -s  /path/to/distractor.conf /etc/dnsmasq.d/distractor.conf && systemctl restart dnsmasq
```

設定を反映させるために Dnsmasq のデーモンを再起動する必要がある。そのため、上記の cron は root で実行させる。

```shell:Shell
sudo crontab < dnsmasq_cron.conf
```



# ファイアウォールで DNS と DHCP を許可
ファイアウォールが有効になっている場合は、DNS と DHCP の well-known port を開放する必要がある。

```shell:Shell
sudo ufw allow 53
sudo ufw allow 67:68/udp
sudo ufw reload
```

http://harukarium.sblo.jp/article/184882055.html



# Dnsmasq の起動
```shell:Shell
sudo systemctl start dnsmasq
```



# DHCP リースを更新
各端末側で、新しい DHCP サーバ (Raspberry Pi) から新しい IP アドレスを割り振ってもらうために、DHCP リースの更新を行う。

DHCP リースの更新は、各端末ごとで行うのだが、大抵の場合はその端末でシステムの再起動することで更新される。

ただし、Mac では再起動しなくても、DHCP リースを更新することができる。

* 画面左上のリンゴマークをクリック
* 「システム環境設定」をクリック
* 「ネットワーク」をクリック
* 「詳細設定」をクリック
* 「TCP/IP」のタブ欄に DHCP リースを更新するボタンがあるのでそれをクリック

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/access-restriction-using-dnsmasq/renew_dhcp_lease.png)

ただし、ボタンを押してもすぐに反映されない場合がある。その場合は、いったん詳細設定ページを閉じて、しばらくしてからもう一度、詳細設定を開きリースを更新するボタンを押す、という作業を数回繰り返すと更新される。

更新されたかどうかは、以下の項目を確認して判断する。

* IP アドレス: 先ほど Dnsmasq で設定した `dhcp-range` の範囲内に入っている
* サブネットマスク: 先ほど Dnsmasq で設定した `dhcp-option=option:netmask` と同じ値になっている
* ルータ (デフォルトゲートウェイ): 先ほど Dnsmasq で設定した `dhcp-option=option:router` と同じ値になっている
* DNS サーバ: 先ほど Dnsmasq で設定した `dhcp-option=option:dns-server` と同じ値になっている

また、ルータの設定で IPv6 を無効にした場合は、IPv6 のアドレスが端末に割り振られていないことも併せて確認すること。



# 動作確認
制限対象のドメインに、制限対象の時間帯にアクセスしようとした際に、アクセスできなくなっていれば設定は完了。



# TIPS: ブロックすべきドメインを調べる方法
YouTube をブロックしたい場合に `youtube.com` を指定するのは誰でもわかると思うが、すでに YouTube を開いてしまっている場合はこれだけでは防げない。

たとえば Fire TV などで YouTube アプリをすでに開いてしまっている場合は、`youtube.com` をブロックしていてもふつうにコンテンツ一覧や動画を読み込めてしまう。つまり、YouTube アプリを終了するまでは使えてしまう。

これを解決するためには追加で `googlevideo.com` も対象に入れなければいけないのだが、この `googlevideo.com` をブロックすべきであるということをどうやって知るのかについて説明する。

## PC 以外の場合
Raspberry Pi 上で、以下のコマンドを実行しておく。

```shell:Shell
sudo tcpdump -n -i any dst port 53
```

すると、Raspberry Pi 上の DNS (Dnsmasq) に名前解決をしにいっているすべての端末の、名前解決に対するパケットを監視することができる。

このコマンドの内容を見つつ、YouTube で動画を再生してみると、頻繁に `googlevideo.com` というドメインに対してリクエストを投げていることがわかる。

つまり、YouTube の動画コンテンツの配信元ドメインが `googlevideo.com` であることが特定できる。

PC の場合は、こんなことをしなくても、ブラウザのディベロッパーツールを使えば良いのかもしれないが、iPhone や Fire TV のようにパケットを監視することができない端末からの何かしらのアクセスを遮断したい場合には重宝するだろう。

[tcpdumpでパケットの確認](https://qiita.com/icebird009/items/b90df257fb1f7c8c9bdf#tcpdump%E3%81%A7%E3%83%91%E3%82%B1%E3%83%83%E3%83%88%E3%81%AE%E7%A2%BA%E8%AA%8D)

ただし、上記のコマンドは、Raspberry Pi の DNS にアクセスしてきたすべての端末のパケットを拾ってしまう。

特定の端末のみのパケットを拾いたい場合は、以下のようにその端末に割り振られた IP アドレスを指定する。

```shell:Shell
sudo tcpdump -n -i any dst port 53 and host <IP_ADDR>
```

[超絶初心者むけtcpdumpの使い方](https://qiita.com/tossh/items/4cd33693965ef231bd2a)

## PC の場合
上記の方法で PC からのパケットも捕捉できるのだが、一応 PC 単体でパケットを調べる方法についても紹介しておく。

PC の場合は、ブラウザのディベロッパーツールからパケットを監視することができる。

Google Chrome & Windows の場合は `F12` キー、Google Chrome & macOS の場合は `command` + `option` + `i` を押すことでディベロッパーツールを開くことができる。

その後、ネットワークタブをクリックすれば、そのページでアクセスするすべてのパケットを監視することができる。

## Application Lookup
もっと簡単な方法として、以下の便利なサイトを見つけたので紹介する。

[Application Lookup - Netify](https://www.netify.ai/resources/applications)

このページにアクセスすると、いろいろなサービス一覧が表示されるはずだ。

その中に、自分がブロックしたいサービスがあれば、詳細ページに飛ぶことでそのサービスの主要なドメインを知ることができる。

たとえば YouTube の場合は、以下のページの `PRIMARY DOMAINS` を見ればブロックすべきドメインがわかる。

[YouTube - Domains and App Information](https://www.netify.ai/resources/applications/youtube)



# 技術的な話
上記までですでに設定は完了しているため、設定方法だけ知りたい場合はここから先は読まなくても問題ない。

## Router Advertisement について
筆者自身もこの設定を行う際に初めて知り調べたものなので詳しくはわかっていないが、すごくざっくり説明すると DHCP サーバを使わずに (ステートレスに) IPv6 アドレスの自動設定を行うものらしい。

[RA (Router Advertisement; ルータ広告)とは](https://www.nic.ad.jp/ja/basics/terms/ra.html)

### 本記事における Router Advertisement の問題点
本記事の冒頭で Router Advertisement による DNS 通知機能をオフにする必要がある、と述べたが、それは DHCP による IPv4 アドレスの割当を Raspberry Pi 側に任せたとしても、Router Advertisement の機能で IPv6 アドレスをルータが各端末に割り当ててしまうからだ。

これは各端末に割り振られる IPv6 アドレスだけでなく、各端末が参照する DNS サーバの IPv6 アドレスも対象となる。

本記事の設定で問題となるのは、DNS サーバの IPv6 アドレスが各端末に設定されてしまう点である。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/access-restriction-using-dnsmasq/dns_servers_list.png)

上の画像は、ルータの設定で Router Advertisement による DNS 通知機能をオフにしない状態で、Raspberry Pi の DHCP 機能により IP アドレスを割り振られた MacBook Pro の DNS サーバの設定画面である。

上画像において、`192.168.3.2` というのは Raspberry Pi (Dnsmasq) の DHCP 機能によって設定された DNS サーバで、その下の赤枠で囲まれた IPv6 アドレスが、Router Advertisement の機能で設定された DNS サーバである。

Raspberry Pi 側の DHCP サーバで DNS を指定したのにも関わらず、それとは別で Router Advertisement による DNS 通知機能が IPv6 の DNS を各端末に設定してしまうのである。

Router Advertisement で IPv6 の DNS サーバが設定されてしまうと、せっかく Raspberry Pi 側 (`192.168.3.2`) で YouTube などを名前解決できなくしても、IPv6 側 (`2400:...`) で名前解決を行ってしまう。なぜなら、基本的にどの機器も **IPv6 が優先されるようになっている** からだ。

もちろんこれは PC や Mac であれば個別に設定変更可能だが、設定できない端末もあるし、すべての端末で設定を変えるのは単純にめんどくさい。DHCP 機能を使わずに手動設定するのと同義だからだ。

以上の理由により、Router Advertisement による DNS 通知機能はオフにする必要がある。

### IPv6 非対応なら設定不要だが……
この機能は IPv6 アドレスの割当にのみ利用可能な仕組みらしく、もともと IPv6 に対応していないネットワーク環境なのであれば気にする必要はまったくない。だからフローチャート内で IPv6 に対応していない場合は対応不要としている。

また、IPv6 に対応していたとしても、IPv6 をオフにすることができるのなら、この問題は発生しない。しかし、それは手放しに喜べるものではない。

なぜなら、IPv6 に対応することによって、通信速度が大幅に改善されるからだ。

### SoftBank 光の問題点
筆者はインターネットプロバイダとして SoftBank 光と契約しているのだが、SoftBank 光には [IPv6 高速ハイブリッド IPv6 IPoE + IPv4](https://www.softbank.jp/ybb/hikari/ipv6/) というオプションがある。

このオプションに加入することによって、IPv6 が利用できるようになるのだが、これにより通信速度が大幅に向上する。

しかし、このオプションを利用するためには、SoftBank が提供する光 BB ユニットと呼ばれるルータを使う必要がある。

光 BB ユニットを接続しない限り、SoftBank 光では IPv6 を利用することができない。IPv6 に対応した市販ルータではダメである。

[ソフトバンク光でIPv6を使うにはBBユニット必須！市販ルーターではダメです](https://wifinomori.com/softbankhikari-ipv6-router/)

誤解のないように補足すると、これはあくまで SoftBank 光に限った話である。SoftBank 光の回線で、IPv6 を利用するためには、光 BB ユニットの接続が必須になる。

そして問題は、この光 BB ユニットは、Router Advertisement による DNS 通知機能をオフにすることができない点だ。

1. 通信速度を向上させるためには、IPv6 対応が必要である
2. SoftBank 光で IPv6 を利用するためには、光 BB ユニットの利用が必須である
3. 光 BB ユニットは Router Advertisement による DNS 通知機能をオフにすることができない
4. 各端末に光 BB ユニットの DNS サーバの IPv6 アドレスを設定させないためには、IPv6 を無効にする必要がある
5. IPv6 を無効にすると、通信速度が大幅に低下する
6. `1.` に戻る

ちなみに光 BB ユニットはレンタルで自宅に送られてくるのだが、光 BB ユニットを利用しないと IPv6 が使えないので、IPv6 が利用可能になる「IPv6 高速ハイブリッド IPv6 IPoE + IPv4」オプションに加入しておいて、レンタルで届いた光 BB ユニットは使わずに、市販の IPv6 対応ルータを使用する、などは意味がない。

「IPv6 高速ハイブリッド IPv6 IPoE + IPv4」オプションを契約することに加え、光 BB ユニットを接続しないと IPv6 が使えないので、光 BB ユニットは絶対に必要なのである。だからこそ、光 BB ユニットの設定で Router Advertisement による DNS 通知機能をオフにできないのが非常に厄介なのである。

SoftBank 光は IPv6 を有効にすることによって通信速度が超高速になるので筆者はとても満足しているのだが、本記事の設定をするときはじめて SoftBank 光 (光 BB ユニットの設定の欠乏) に不満を感じることとなった。

ちなみに筆者が使用しているのは、光 BB ユニット 2.3 (E-WMTA2.3, 型番: J18V150.00) というもので、その上に光 BB ユニット 2.4 というものがあるらしいのだが、SoftBank が提供しているルータはすべて DHCP 機能の無効化や Router Advertisement による DNS 通知機能のオフができない、ということを SoftBank のサポートセンターで確認している。

つまり、回線が SoftBank 光である限り、IPv6 を利用しつつ Router Advertisement による DNS 通知機能をオフにすることはできない、というのが結論だ。

他のインターネットプロバイダについてはわからないが、似たような問題点を持つインターネットプロバイダは存在するかもしれない。もしこれからプロバイダ契約をする、または変更する場合に本記事の内容を実践したい場合は、事前に以下を確認しておくべきだろう。

* IPv6 は利用できるか？
  * 利用できる場合、その会社が提供するルータを使わなければならないなどの制限はあるか？
  * 制限がある場合、DHCP 機能を無効にできるか？
    * 無効にできない場合、DHCP による IP アドレスの割当範囲を設定で変更できるか？
  * 制限がある場合、Router Advertisement による DNS 通知機能をオフにできるか？

DHCP 機能を無効にできない点に関しては、IP アドレスの割当範囲の変更で事実上無効にできるのだが、Router Advertisement による DNS 通知機能をオフにできない場合は犠牲を払わなければならなくなってしまう (IPv6 を無効にせざるを得ない → 通信速度が低下する) ので重要なポイントだろう。

### 唯一の救い
と、ここまで Router Advertisement による DNS 通知機能をオフにできないのは致命的ということについて話したのだが、一点だけ救いがあるとすれば、それは端末側が IPv6 に対応していない場合は気にしなくて良いということだ。

たとえば筆者が使っている Fire TV は、どうやら IPv6 に対応していないらしく、IPv6 アドレスが割り振られないので、上記の問題が発生しない。

とはいっても、これは端末に依存する話であって、アクセス制限をしたいのが Mac や iPhone だったらやはり困るのだ。なぜなら Mac や iPhone は IPv6 に対応しているからである。



## プロキシがダメな理由
冒頭で説明した Squid を使ったアクセス制御は、複数の理由により不採用となった。

[Web プロキシサーバ Squid を利用して、特定のサイト・時間帯・曜日にアクセスできないようにする](https://ja.developers.noraworld.blog/access-restriction-using-squid)

Squid とは HTTP プロキシサーバである。こちらも Dnsmasq と同じ要領で特定のサイトにアクセス制限をかけることができる。

ただし、プロキシなので、通常は各端末のネットワークの設定で明示的にプロキシを設定してやらないと利用することができない。

これの問題点としては、端末がプロキシに対応していなければならない点と、各端末すべてに設定する必要があることだ。筆者が使用している Fire TV はプロキシの設定ができない。

実は、透過プロキシと呼ばれる、LAN 内における任意の端末 (すべての端末) に対し、自動的にプロキシをかませる仕組みが存在する。

しかしそれは、各端末から見れば、いわばパケットを暗黙的に横取りされていることにほかならないので、HTTPS のサイトでセキュリティ警告が出てしまう。

近年ではほとんどのサイトが HTTPS で通信されるため、ほとんどのサイトでセキュリティエラーが発生してしまう。これでは使い物にならない。

各端末に、プロキシサーバで発行する証明書を手動でインストールすればセキュリティ警告に関しては解消できるが、結局これも Fire TV などでは証明書の手動インストールができないし、各端末すべてで行う必要が出てきてしまう。

さらにいうと、プロキシを設定したからといって、すべての通信がプロキシ経由でされるとは限らない。

以前に iPhone でプロキシを設定して、プロキシ先で YouTube を遮断してみたところ、たしかにブラウザで YouTube にはアクセスできなくなったが、YouTube アプリからはふつうに YouTube にアクセスできてしまった。

つまり、まとめると以下のようになる。

* すべての端末にプロキシ設定をするのはめんどくさい
* プロキシが設定できない端末 (Fire TV など) では使えない
  * かといって透過プロキシを使うと HTTPS サイトすべてでセキュリティエラーが発生するので現実的ではない
    * 証明書を手動でインストールする方法も、結局、設定できない端末があることやすべての端末に設定しなければならないめんどくささを解消できない
* すべての通信をプロキシ経由で行うとは限らない
  * 例として、iPhone の YouTube アプリは、プロキシを設定していてもプロキシを使わない

というわけで、Squid (プロキシ) は現実的ではない。



## VPN がダメな理由
VPN を構築し、その中で今回設定した Dnsmasq の設定を導入すれば、Router Advertisement による DNS 通知機能をオフにできない問題をカバーできるはずだ。なぜなら、VPN に接続した場合、ネットワーク設定が丸ごと VPN サーバ上の環境に移るので、LAN 内のルータの設定など知ったこっちゃない状態になるからである。

しかしこれも、先ほどのプロキシと同様に、各端末が VPN 接続に対応していなければならない。当然 Fire TV は非対応である。



## まとめ
というわけで、本記事のアクセス制限方法が、今まで試してきた中で一番スマートで汎用的な手法なのだが、やはり完璧というレベルには至らなかった。

もちろん IPv6 対応 & DHCP 機能無効可能 & RA 無効可能なプロバイダに乗り換えれば解決なのだが、SoftBank 光の通信速度はめちゃくちゃ速いから気に入っているし、ルータの設定可能性に依存するのは、やはり腑に落ちない。是が非でも Raspberry Pi (Linux) の叡智で解決してみせたいのである。

残る希望としては、Dnsmasq の設定で DHCPv6 を使い、IPv6 アドレスも Raspberry Pi で割り振ってやることができれば、あるいは Router Advertisement による DNS 通知機能の優先順位を上回ることができるかもしれない。

つまり、Router Advertisement による DNS 通知機能により、各端末にルータの DNS の IPv6 アドレスが通知されてしまうことは許容しつつも、それより優先度の高い DNS サーバとして Raspberry Pi の IPv6 アドレスを DHCP で割り振ってやることができれば、この問題は解決できるかもしれない。

とはいえまだ試していないので、できるかどうかはわからないが、次のステップとして試す価値はあるだろう。
