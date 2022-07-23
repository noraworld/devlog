---
title: "家のネットワークを丸ごと VPN にする方法 (Raspberry Pi × NordVPN)"
emoji: "🎃"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vpn", "network", "raspberrypi", "ubuntu"]
published: true
order: 146
layout: article
---

# はじめに
VPN とは Virtual Private Network の略で、インターネット回線を利用して仮想的なプライベートネットワークを構築するための仕組みです。

VPN を利用すると以下のようなメリットがあります。

* 自宅の本当のグローバル IP アドレスを隠蔽してプライバシーを保護することができる
* 脆弱なフリー Wi-Fi を利用する際に情報の盗み見や改ざんを防ぐことができる
* 海外のコンテンツを視聴できる[^3]
    * Netflix でジブリ作品を観たりすることができる[^1]

[^1]: 現在、日本ではジブリ作品をインターネットで視聴することはできませんが、海外では観ることができます。VPN を使用することで、日本にいながらジブリ作品をインターネットで観ることができるようになります。

[^3]: 海外の VPN サーバに接続した場合のみ

このように VPN には様々なメリットがあるのですが、設定においては以下のようなデメリットがあります。

* 各デバイスすべてで専用アプリをダウンロードしたり設定したりするのが面倒
    * PC やスマートフォン、ストリーミングデバイスなどすべてで VPN を設定する必要がある
* VPN を設定できないデバイスもある
    * Nintendo Switch や IoT デバイスなど
* 自分で構築した自宅の DNS サーバを利用することができない
    * 個別に VPN に接続したデバイスのローカルネットワークが VPN 側に移動してしまうので

上記の問題を解決する方法として VPN ルータというものがありますが、これもいくつかのデメリットがあります。

* 対応しているルータを用意しなければいけない
* VPN のオン・オフを簡単に切り替えられない (予想)
* VPN を設定する以上の複雑なことはできない
    * カスタム DNS サーバの構築など

[How to install a VPN on your router](https://nordvpn.com/blog/setup-vpn-router/)

そこで今回は、Raspberry Pi を VPN に接続し自宅のルータとして動作させることで、上記の問題を解決する方法を紹介します。



# 必要なもの
* Raspberry Pi
    * Ubuntu Server をインストールしているものとして説明します
* NordVPN のサブスクリプション契約

今回は Raspberry Pi と NordVPN を使用しますが、Raspberry Pi の代わりに任意の Linux デバイスを利用する、NordVPN の代わりに Linux 対応の他の VPN サービスを利用する、または [自分で VPN サーバを構築する](https://zenn.dev/noraworld/articles/openvpn-installation-and-setup-guidebook) ことでも同様のことが実現できるはずです。NordVPN 以外の VPN を利用する場合は VPN への接続の手順に関しては適宜読み替えてください。

筆者は NordVPN の回し者ではないですしステマでもないですが、VPN サービスなら NordVPN をおすすめします。NordVPN は Linux 用のコマンドが用意されていてとても使いやすく、また VPN の中では比較的高速で安定して動作します。



# NordVPN の登録とセットアップ
まずは NordVPN の登録とセットアップを行い、Raspberry Pi を VPN に接続します。

## NordVPN のサブスクリプション契約
NordVPN を利用したことがない場合は、[公式サイト](https://nordvpn.com) にアクセスしプランを選択しアカウントを作成します。

## `nordvpn` コマンドのインストール
Raspberry Pi に `nordvpn` コマンドをインストールします。以下のコマンドを実行します。

```shell
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh)
```

参考: [Installing NordVPN on Linux distributions](https://support.nordvpn.com/Connectivity/Linux/1325531132/Installing-and-using-NordVPN-on-Debian-Ubuntu-Raspberry-Pi-Elementary-OS-and-Linux-Mint.htm)

これで `nordvpn` コマンドが使えるようになります。

## `nordvpn` ユーザグループに追加
今後のコマンドを実行する際に `nordvpn` ユーザの権限を求められることがあります。そのため、現在ログイン中のユーザを `nordvpn` ユーザのグループに追加しておきます。

```shell
sudo usermod -aG nordvpn $USER
```

上記の設定を適用するために Raspberry Pi を再起動します。

```shell
sudo reboot
```

## NordVPN にログイン
NordVPN にログインします。以下のコマンドを実行します。

```shell
nordvpn login
```

すると以下のようなメッセージが表示されます。

```
Continue in the browser: https://napps-1.com/v1/users/oauth/login-redirect?attempt=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

メッセージ内の URL に PC のブラウザでアクセスします。Raspberry Pi が GUI を持っているのなら Raspberry Pi のブラウザでアクセスしても良いです。

Raspberry Pi でログインするアカウントを選択します。PC でログインしていない場合は事前にログインします。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/whole-network-vpn/Screen%20Shot%202022-07-14%20at%2020.25.59.png)

ログインに成功すると以下のような画面が表示されます。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/whole-network-vpn/Screen%20Shot%202022-07-14%20at%2020.26.24.png)

この画面内の `Continue` と書かれているリンクを右クリックしてリンクのアドレスをコピーします。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/whole-network-vpn/Screen%20Shot%202022-07-14%20at%2020.27.18.png)

Raspberry Pi のターミナルに戻り、以下のようなコマンドを実行します。

```shell
nordvpn login --callback "nordvpn://login?action=login&exchange_token=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&status=done"
```

ダブルクオートの中は先ほどコピーしたリンクアドレスをペーストします。トークンの中にエスケープが必要な文字が含まれていることもあるので、リンクアドレスは必ずダブルクオートで囲ってください。

以下のメッセージが表示されたらログイン完了です。

```
Welcome to NordVPN! You can now connect to VPN by using 'nordvpn connect'.
```

## ポートの開放
これで Raspberry Pi 上で NordVPN のサーバに接続する準備は整いました。ただこのまま接続してしまうと Raspberry Pi のネットワークが VPN 先に移り SSH 接続が切れてしまうので、事前にポートを開放しておきます。ついでに今後必要になるポートも一緒に開放します。

以下のコマンドを実行します。必要に応じてポート番号を変えたり開放しないものを判断したりしてください。

```shell
nordvpn whitelist add port 22  # SSH: SSH のポート番号を変更している場合は適宜変更
nordvpn whitelist add port 53  # DNS: Raspberry Pi を DNS サーバとして利用しない場合は実行不要
nordvpn whitelist add port 67  # DHCP: Raspberry Pi を DHCP サーバとして利用しない場合は実行不要
nordvpn whitelist add port 68  # DHCP: Raspberry Pi を DHCP サーバとして利用しない場合は実行不要
nordvpn whitelist add port 80  # HTTP
nordvpn whitelist add port 443 # HTTPS
```

設定を確認するには以下のコマンドを実行します。

```shell
nordvpn settings
```

以下のような出力結果が表示されます。

```
Technology: NORDLYNX
Firewall: enabled
Kill Switch: disabled
Threat Protection Lite: disabled
Notify: disabled
Auto-connect: disabled
IPv6: disabled
Meshnet: enabled
DNS: disabled
Whitelisted ports:
             53 (UDP|TCP)
     67 -    68 (UDP|TCP)
             80 (UDP|TCP)
            443 (UDP|TCP)
          60313 (UDP|TCP)
```

`Whitelisted ports` の部分が設定した内容とマッチしていれば OK です。

## VPN サーバに接続
VPN サーバに接続します。接続するサーバの国を指定しない場合は住んでいる国と同じ国のサーバに接続されますが、今回は VPN に接続していることがよりわかりやすくなるように国を指定して接続します。

以下はアメリカのサーバに接続するコマンドです。

```shell
nordvpn connect United_States
```

なお、以降はアメリカのサーバに接続したものとして説明します。

### 他の国のサーバに接続したい場合
他の国のサーバに接続したい場合は、上記の `United_States` の個所を別の国に変更してください。サーバが利用可能な国の名前のリストは以下のコマンドで取得できます。

```shell
nordvpn countries
```

```
Albania                 Costa_Rica              Greece                  Lithuania               Portugal                Switzerland
Argentina               Croatia                 Hong_Kong               Luxembourg              Romania                 Taiwan
Australia               Cyprus                  Hungary                 Malaysia                Serbia                  Thailand
Austria                 Czech_Republic          Iceland                 Mexico                  Singapore               Turkey
Belgium                 Denmark                 Indonesia               Moldova                 Slovakia                Ukraine
Bosnia_And_Herzegovina  Estonia                 Ireland                 Netherlands             Slovenia                United_Kingdom
Brazil                  Finland                 Israel                  New_Zealand             South_Africa            United_States
Bulgaria                France                  Italy                   North_Macedonia         South_Korea             Vietnam
Canada                  Georgia                 Japan                   Norway                  Spain
Chile                   Germany                 Latvia                  Poland                  Sweden
```

### 接続確認
本当に VPN 接続されているかどうか確認します。以下のコマンドを実行します。

```shell
curl https://ipinfo.io
```

`"country"` の部分が `"US"` になっていれば OK です。

## Meshnet を有効にする
Meshnet を有効します。これにより、VPN に接続しながら LAN 内の他のデバイスと通信を行うことができます。

以下のコマンドを実行します。

```shell
nordvpn set meshnet on
```

### エラーが発生して有効にできない場合
まれに以下のようなエラーが発生することがあります。

```
Whoops! We're having trouble reaching our servers. Please try again later. If the issue persists, please contact our customer support.
```

これは NordVPN 側の問題です。こちらではどうしようもないので、いったん VPN から切断して、再接続します。

```shell
nordvpn disconnect
nordvpn connect United_States
```

それでも問題が解決しない場合は切断したあとしばらく時間をおいてから再接続して試すか、別の国のサーバに接続してみてください。

## WireGuard が有効になっているか確認
最後に、WireGuard が有効になっているか確認します。以下のコマンドを実行します。

```shell
nordvpn settings
```

以下のような出力結果が表示されます。

```
Technology: NORDLYNX
Firewall: enabled
Kill Switch: disabled
Threat Protection Lite: disabled
Notify: disabled
Auto-connect: disabled
IPv6: disabled
Meshnet: enabled
DNS: disabled
Whitelisted ports:
             53 (UDP|TCP)
     67 -    68 (UDP|TCP)
             80 (UDP|TCP)
            443 (UDP|TCP)
          60313 (UDP|TCP)
```

`Technology` の部分が `NORDLYNX` になっていれば OK です。なっていなければ以下のコマンドを実行して `NORDLYNX` にします。

```shell
nordvpn set technology nordlynx
```

続いて、インターフェース名が `nordlynx` になっているネットワークインターフェースがあるか念のため確認します。以下のコマンドを実行します。

```shell
ip a
```

ネットワークインターフェース名がいくつか表示される (`lo`、`eth0`、`wlan0` など) と思いますが、その中に `nordlynx` というものがあれば OK です。



# UFW の設定
UFW の設定を行います。この設定は不要かもしれませんが、VPN の接続が切断された際に家中の全デバイスがインターネットにつながらなくなる、ということがないように念のため設定しておきます。

## ポートの開放
必要なポートを開放します。以下のコマンドを実行します。必要に応じてポート番号の変更、開放しないポートの判断をしてください。

```shell
sudo ufw allow 22                 # SSH: SSH のポート番号を変更している場合は適宜変更
sudo ufw allow out to any port 53 # DNS: Raspberry Pi を DNS サーバとして利用しない場合は実行不要
sudo ufw allow 67/udp             # DHCP: Raspberry Pi を DHCP サーバとして利用しない場合は実行不要
sudo ufw allow 68/udp             # DHCP: Raspberry Pi を DHCP サーバとして利用しない場合は実行不要
```

参考: [UFW is blocking DNS](https://unix.stackexchange.com/questions/131332/ufw-is-blocking-dns#answer-145108)

設定が完了したら UFW を有効にします。

```shell
sudo ufw enable
sudo systemctl start ufw
sudo systemctl enable ufw
```

設定を確認するには以下のコマンドを実行します。

```shell
sudo ufw status
```

## IP フォワーディングと IP マスカレードの設定
UFW で IP フォワーディングと IP マスカレードの設定を行います。これにより、同一 LAN の他のデバイスから Raspberry Pi に来たパケットを拾ってインターネット通信を行うようにすることができます。

### IP フォワーディング
パケット転送を有効にします。`/etc/default/ufw` を開き、以下のように書き換えます。

```diff:/etc/default/ufw
-DEFAULT_FORWARD_POLICY="DROP"
+DEFAULT_FORWARD_POLICY="ACCEPT"
```

次に IP フォワーディングを有効にします。`/etc/ufw/sysctl.conf` を開き、以下のように書き換えます。

```diff:/etc/ufw/sysctl.conf
-# net.ipv4.ip_forward=1
+net.ipv4.ip_forward=1
```

### IP マスカレード
IP マスカレードを有効にします。`/etc/ufw/before.rules` を開くと、一番下の行に `COMMIT` と書かれているはずなので、その下に以下のような設定を追加します。

```diff:/etc/ufw/before.rules
COMMIT

+*nat
+:POSTROUTING ACCEPT [0:0]
+-A POSTROUTING -s 192.168.3.0/24 -o nordlynx -j MASQUERADE
+COMMIT
```

`192.168.3.0/24` の部分はご自身のネットワークの設定に併せて変更してください。

## 設定変更の反映
ここまでの設定を反映させるためには以下のコマンドを実行します。

```shell
sudo ufw reload
sudo systemctl restart ufw
```



# IP アドレスの固定
Raspberry Pi の IP アドレスが変動してしまうとルータとしては使いづらいです。そのため、IP アドレスを固定します。

IP アドレスの固定に関しては「[コマンドラインで Ubuntu を固定 IP アドレスにする方法 (なるべく丁寧に解説)](https://zenn.dev/noraworld/articles/ubuntu-fixed-ip-address-via-cli)」をご覧ください。



# DHCP サーバの設定
ここまでの設定で Raspberry Pi を VPN ルータとして動作させる手順はすでに完了しています。

あとは各デバイスのネットワーク設定でデフォルトゲートウェイ (ルータ) の IP アドレスを Raspberry Pi のプライベート IP アドレスに設定すれば OK なのですが…… すべてのデバイスでそれを設定するのはめんどうですよね。

ということで Raspberry Pi を DHCP サーバとして稼働させて、各デバイスに設定されるデフォルトゲートウェイを自動的に Raspberry Pi のものになるようにしてしまいます。

## 既存の DHCP サーバの無効化
家庭用のルータのほとんどは、DHCP サーバとしても機能します。そのためまずは家庭用ルータの DHCP 機能を無効にする必要があります。

この手順はお使いのルータによって設定方法が異なるためここでは割愛します。

また、DHCP 機能を無効にできないルータをお使いの場合は、代替手段として、DHCP 機能で割り当てられる IP アドレスが 1 つになるように調整して、その 1 つが Raspberry Pi に割り当てられるように設定することで、実質的にルータの DHCP 機能を無効化することができます。詳しくは「[ルータ設定を極力いじらずに IPv4 + IPv6 の DNS & DHCP サーバを構築する方法](https://zenn.dev/noraworld/articles/custom-dns-and-dhcp-with-dnsmasq)」をご覧ください。

## Dnsmasq のインストール
DHCP サーバとして動作させるために Dnsmasq をインストールします。以下のコマンドをインストールします。

```shell
sudo apt -y install dnsmasq
```

## DHCP の設定
DHCP の設定を行います。`/etc/dnsmasq.conf` を開き、以下のような設定を追加します。

```diff:/etc/dnsmasq.conf
+dhcp-range=192.168.3.200,192.168.3.254,12h
+dhcp-option=option:netmask,255.255.255.0
+dhcp-option=option:router,192.168.3.2
```

各々の値はご自身の環境に併せて変更してください。`192.168.3.2` の部分には Raspberry Pi に割り当てられているプライベート IP アドレスを設定します。

## Dnsmasq の起動
Dnsmasq を起動します。以下のコマンドを実行します。

```shell
sudo systemctl start dnsmasq
sudo systemctl enable dnsmasq
```



# 動作確認
最後に設定が期待通りになっているか確認します。

まず、DHCP の設定から確認します。割り当てられる IP アドレスやその他の設定が、Raspberry Pi の DHCP サーバのものになっているか確認します。

ご自宅の任意のデバイス (PC やスマートフォンなど) を再起動します。その後、そのデバイスのネットワーク設定を確認し、以下の 3 つが合っているか確認します。

* IP アドレスが `dhcp-range` の範囲内にあること
* サブネットマスクが `dhcp-option=option:netmask` で設定した値になっていること
* デフォルトゲートウェイ (ルータ) が `dhcp-option=option:router` で設定した値になっていること

1 つのデバイスでこれが確認できたら、ご使用のすべてのデバイスを再起動して同様の結果になるようにします。

これで、ご自宅の全デバイスが Raspberry Pi をルータとしてインターネット通信するようになりました。

そしてこれまでの手順で Raspberry Pi はすでに VPN に接続されている状態なので、家中のすべてのデバイスが VPN 経由でインターネット通信されるようになりました。

各デバイスで [ipinfo.io](https://ipinfo.io) にアクセスして、`country` が `"US"` になっていれば成功です。お疲れさまでした！



# VPN をオフにする
VPN をオフにするには、以下のコマンドを実行します。

```shell
nordvpn disconnect
```

この記事の手順通りに UFW の設定をしていれば、VPN をオフにしたとしても Raspberry Pi はルータとして動作してくれます。つまり、Raspberry Pi で VPN のオン・オフを切り替えるだけで、実質的に家のネットワーク全体の VPN のオン・オフも切り替えることができます。

VPN を利用するとどうしても通信速度が低下してしまうので、状況に併せてオン・オフを切り替えたい場合に便利です。

ちなみに、VPN のオン・オフそれぞれのコマンドを Siri や Google Assistant、Alexa などと連携させておくとさらに便利になります。海外でしか利用できないコンテンツを利用したいときに「Hey Siri, VPN をオンにして」と言えば VPN に接続され、通常のネットサーフィンを (今まで通り高速に) したい場合は「Hey Siri, VPN をオフにして」と言えば VPN から切断される、ということができます。



# さいごに
文章を読むと長い作業のように感じるかもしれませんが、Raspberry Pi を VPN 接続して、ルータとして動作するように設定して DHCP サーバを立ち上げるだけなので、技術的には比較的シンプルです。

VPN を利用したい理由は人によって様々だと思います[^2]が、家のネットワークを丸ごと VPN にする方法は汎用性があるため、需要はそこそこあるのでないかと思います。

[^2]: ちなみに筆者は海外でしか利用できないコンテンツを視聴するために VPN を利用しています。

ちなみに今回の手順で紹介した Dnsmasq は DNS サーバとしても使えます。たとえば特定の時間帯だけ Twitter や YouTube をアクセス制限したかったり、特定のサイトをブロックしたかったりする場合に活用できます。詳しくは「[Dnsmasq を使って特定の時間帯・サイトへのアクセス制限をする](https://zenn.dev/noraworld/articles/access-restriction-using-dnsmasq)」で紹介しているので良ければこちらもご覧ください。



# 参考サイト
* [Raspberry Pi VPN Gateway - NordVPN](https://www.instructables.com/Raspberry-Pi-VPN-Gateway-NordVPN/)
* [PiRouterVPN](https://starlightparabola.tumblr.com/post/668543565017858048/piroutervpn-objective-getting-raspberry-pi-as-vpn)
* [How to configure a Raspberry Pi](https://support.nordvpn.com/FAQ/NordVPN-setup-tutorials/1047409772/How-to-configure-a-Raspberry-Pi.htm)
* [Use Raspberry Pi behind router to connect all devices on router to NordVPN](https://www.reddit.com/r/nordvpn/comments/qzgutk/use_raspberry_pi_behind_router_to_connect_all/)
