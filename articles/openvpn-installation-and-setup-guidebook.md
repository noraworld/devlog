---
title: "OpenVPNのインストールとセットアップからインターネット接続までのガイドブック"
emoji: "👋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["OpenVPN", "VPN", "Ubuntu", "ubuntu16.04", "ネットワーク"]
published: true
order: 28
layout: article
---

# はじめに
先日、新しくサーバを借りてVPN環境を構築しました。色んなサイトを参考にしましたがけっこうづまづいたので、つまづいたポイントに着目しながら構築方法を紹介したいと思います。

VPNを利用するメリットとしてよくあるのが、外出先にいながら自宅のネットワークにアクセスしてデータを見ることができることですが、この記事では直近のネットワークとVPNとの接続を暗号化し、フリーWi-Fi等でもセキュアにインターネットを利用できることを目的としています。なので、VPNへの接続だけではなく、そこからインターネットに接続する方法まで説明します。もちろん前者の理由でもこの記事は十分参考になるかと思います。

また、OpenVPNではルーティング方式とブリッジ方式の2通りが選べますが、この記事ではルーティング方式の構築方法を説明します。

OpenVPNの構築に関しては「[さくらのVPS512(月々税抜635円)で固定IPアドレスをゲットする(OpenVPNサーバを作る)](http://qiita.com/tool-taro/items/76cef0909c9b119d22b2)」が大変参考になりました。この記事ではCentOSをメインにしていますが、ここではUbuntuを例に紹介しています。また、この記事ではネットワーク（IPマスカレード等）の説明が省略されていたので、その設定もできるだけ詳しく説明していこうと思います。

# 環境
* Ubuntu 16.04 LTS
* OpenVPN 2.3.10

# インストール
必要なソフトをインストールします。まずは今回の主役であるOpenVPNをインストールします。

```bash
$ sudo apt -y install openvpn
```

次に Easy RSA をダウンロードします。`apt`でインストールすることもできますが、専用のコマンドが用意されておらず、各種鍵を生成するコマンドがサブコマンド方式になっていなくて少々使いづらいので、今回は公式のリポジトリから最新版をダウンロードすることにします。

```bash
$ git clone https://github.com/OpenVPN/easy-rsa.git
```

:warning: `git`コマンドがない場合は`apt`でインストールしてください。

カレントディレクトリに Easy RSA がダウンロードされます。どこにダウンロードしても良いです。

# 認証鍵の生成
Easy RSA のディレクトリに移動します。

```bash
$ cd easy-rsa/easyrsa3
```

ここから認証に必要な各種鍵を生成していきます。ここで注意するポイントは、**鍵を生成するコマンドを実行するときは、`easyrsa3`ディレクトリ以下**でなければいけません。たとえば、このディレクトリのパスを環境変数に登録して標準コマンドとして実行したりするとエラーが発生します。注意してください。以下の鍵の生成コマンドはすべて`easyrsa3`以下で実行するものとします。

## 初期設定
初期設定をします。以下のコマンドを実行します。

```bash
$ ./easyrsa init-pki
```

エラーが出ずに

```
init-pki complete; you may now create a CA or requests.
Your newly created PKI dir is: path/to/easy-rsa/easyrsa3/pki
```

のように表示されればOKです。

## CA証明書の生成
CA証明書を生成します。

```bash
$ ./easyrsa build-ca
```

途中でパスフレーズ（pass phrase）を訊かれるので、パスフレーズを入力してください。その後、もう一度パスフレーズを訊かれるので同じパスフレーズを入力してください。

また、CAの名称（Common Name）を訊かれるので、適当にわかりやすい名前を入力してください。ユーザ名、ホスト名、サーバ名、なんでも良いです。

生成された鍵を`/etc/openvpn`以下にコピーします。

```bash
$ sudo cp pki/ca.crt /etc/openvpn
```

## サーバ証明書の生成
サーバ証明書を生成します。

```bash
$ ./easyrsa build-server-full server nopass
```

途中でパスフレーズを訊かれたら、先ほどのCA証明書のパスフレーズを入力します。

生成された鍵をコピーします。

```bash
$ sudo cp pki/issued/server.crt /etc/openvpn
$ sudo cp pki/private/server.key /etc/openvpn
```

## DH鍵の生成
DH鍵を生成します。

```bash
$ ./easyrsa gen-dh
```

鍵の生成には時間がかかる場合があります。

生成された鍵をコピーします。

```bash
$ sudo cp pki/dh.pem /etc/openvpn
```

## クライアント証明書の生成
クライアント証明書を生成します。

```bash
$ ./easyrsa gen-crl
```

パスフレーズを訊かれたら、CA証明書のパスフレーズを入力します。

生成された鍵をコピーします。

```bash
$ sudo cp pki/crl.pem /etc/openvpn
$ sudo chmod o+r /etc/openvpn/crl.pem
```

他の参考サイトではダミーのクライアント証明書を作る手順が説明されていますが、これはただの確認なので、やらなくても問題ありません。

# OpenVPNサーバの設定
OpenVPNサーバを起動するための設定ファイルを作成します。`/etc/openvpn`以下に`server.conf`というファイルを作成し、以下の設定を入力します。

```:/etc/openvpn/server.conf
port   1194
proto  udp
dev    tun

ca          ca.crt
cert        server.crt
key         server.key
dh          dh.pem
crl-verify  crl.pem

ifconfig-pool-persist ipp.txt

server 10.8.0.0 255.255.255.0

push "redirect-gateway def1 bypass-dhcp"
push "route 10.8.0.0 255.255.255.0"
push "dhcp-option DNS 8.8.8.8"

client-to-client
keepalive 10 120
comp-lzo

user  nobody
group nogroup

persist-key
persist-tun

status      /var/log/openvpn-status.log
log         /var/log/openvpn.log
log-append  /var/log/openvpn.log

verb 3
```

基本的には上記の設定で問題ないかと思います。以下、細かく説明していきます。

## ポート(port)
OpenVPNに接続するポート番号です。このポートはクライアント、サーバともに開放されていないといけません（サーバでのポートの設定については後述します）。

OpenVPNのデフォルトのポート番号は`1194`です。ポートが制限されていない環境では変更する必要はありませんが、大学や社内ネットワークの場合、`1194`番ポートが遮断されているかもしれません。

その場合は`443`番ポートを使用することをおすすめします。`443`番ポートはHTTPSで使用するポート番号であるため、インターネットに接続できるネットワークであれば遮断されていることはほぼありません。

ただし、社内ネットワークでVPN接続を行う場合は**コンプライアンス違反**とならないように気をつけてください。社内ネットワークにてVPNが使用しても差し支えないかどうかはネットワーク管理者に相談してください。

## プロトコル(proto)
接続するプロトコルを設定します。`tcp`または`udp`を指定します。

デフォルトは`udp`です。`udp`のほうが速度が速いので`udp`をおすすめします。

ただし上記と同じく大学や社内ネットワークでは`udp`が遮断されている場合があるので、うまく接続できない場合は`tcp`を使用することができます。なお、`443`番ポートを使用する場合は`udp`ではなく`tcp`を使用することをおすすめします。

## 接続方式(dev)
ルーティング方式で接続するか、ブリッジ方式で接続するかを設定します。ルーティング方式の場合は`tun`, ブリッジ方式の場合は`tap`を指定します。

今回の説明はルーティング方式なので`tun`を指定してください。ブリッジ方式の場合は、これ以外にも設定が異なる箇所があるので、ブリッジの場合は各自調べてください。

## CA証明書(ca)
各種鍵の生成で生成されたCA証明書を指定します。ファイル名を変更していない場合（この記事の説明通りの場合）はそのままでOKです。

## サーバ証明書(cert, key)
CA証明書と同じく、生成されたサーバ証明書を指定します。そのままでOKです。

## DH鍵(dh)
DH鍵を指定します。上記と同じくそのままでOKです。

## クライアント証明書(crl)
クライアント証明書を指定します。そのままでOKです。

## IPアドレスのテーブルファイル(ifconfig-pool-persist)
VPNに接続してくるクライアントのプライベートIPを管理するためのテーブルファイルです。

複数の端末をVPNに接続したときに、端末同士でプライベートIPアドレスがかぶらないように制御するためのテーブルです。保存するファイル名を指定するだけなので、そのままでOKです。

## ネットワークの設定(server)
VPNで使用するプライベートIPアドレスとサブネットマスクを指定します。デフォルトは`10.8.0.0 255.255.255.0`です。変更する場合には適切なプライベートIPアドレスとサブネットマスクを指定します。通常はそのままでOKです。

## クライアントの設定(push)
クライアントの接続方法を指定します。

`"redirect-gateway def1 bypass-dhcp"` はVPN接続後にすべてのトラフィックをVPN経由で行います。この設定がないとVPNに接続してもWebトラフィックは直近のネットワークで行ってしまいます。

`"route 10.8.0.0 255.255.255.0"` はVPNで使用するプライベートIPアドレスとサブネットマスクをクライアント側に通知します。`server`と同じプライベートIPアドレス、サブネットマスクを指定します。

`"dhcp-option DNS 8.8.8.8"` は使用するDNSを指定します。今回はGoogleパブリックDNSを使用しているので`8.8.8.8`が設定されています。通常はこのままでOKですが、DNSを変更したい場合は変更してください。

## クライアント間の接続(client-to-client)
クライアント間の接続を許可するかどうかを指定します。許可する場合はこの設定を追加します。

## 生存確認(keepalive)
通信相手の生存確認のためのパケット送信の間隔と閾値を指定します。デフォルトは `10 120` です。

左の数値が何秒ごとにパケットを送信するかを表し、右の数値がその秒数まで経っても応答がない場合にコネクションを切断することを表します。たとえばデフォルトの `10 120` では、10秒ごとにパケットを送信し、相手が応答するかどうか（切断していないかどうか）を確認します。そして120秒経過しても（12回のパケット送信を行っても）相手から応答がない場合は、切断されます。

## comp-lzo
通信パケットを圧縮するかどうかを指定します。圧縮する場合はこの設定を追加します。

圧縮すると通信するパケット数が減るため通信速度は速くなりますが、圧縮処理がかかるため、性能の低いマシンだと圧縮することにより速度が低下する場合があります。圧縮するかどうかはマシンの性能によりますが、通常は圧縮する設定でOKです。

## ユーザとグループ(user, group)
OpenVPNのプロセスをどのユーザ、どのグループで実行するかを指定します。rootユーザで実行するのはセキュアではないため、この設定は入れておくべきです。デフォルトは、ユーザが`nobody`で、グループが`nogroup`です。

この設定がハマったポイントで、多くのサイトでは、グループを`nobody`と設定していますが、Ubuntuでは`nobody`というグループがないため、エラーになります。おそらくCentOSではグループも`nobody`とするとうまくいきますが、ここがUbuntuと違うので、Ubuntuで構築している人は注意です。

参考元: [UbuntuにOpenVPNを導入する](http://hirotyanteikoku.cocolog-nifty.com/cocolog/2011/09/ubuntuopenvpn-f.html)

## 設定の永続化(persist-key, persist-tun)
再起動時に特定のリソースにアクセスすることを避けるためのオプションらしいです。通常はつけておいてOKです。

## 状態(status)
OpenVPNに接続しているクライアントの状態（情報）を書き込むファイルを指定します。デフォルトは`openvpn-status.log`です。

このファイルはデフォルト設定の場合は`/etc/openvpn`以下に保存されます。ログは`/var/log`以下に置いたほうが管理しやすいので、`/var/log/openvpn-status.log`に変更しています。特に理由がなければ`/var/log`をおすすめします。

## ログ(log, log-append)
OpenVPNのログを書き込むファイルを指定します。デフォルトは`openvpn.log`です。

このファイルはデフォルトの設定の場合は`/etc/openvpn`以下に保存されます。`openvpn-status.log`と同様に`/var/log/openvpn.log`に保存されるように変更しています。

## ログの冗長性(verb)
ログファイルに書き込む内容の冗長性の度合いを指定します。デフォルトは`3`です。

数値が低い場合は必要最低限のログしか書き込まれませんが、数値が高くなるにつれて事細かにログを書き込むようになります。数値は0〜9までで、数値の目安は以下の通りです。

|レベル|説明|
|---|---|
|0|致命的なエラー以外はログを出力しない|
|4|適切な程度のログを出力する|
|5〜6|接続エラーのデバッグに役立つようにログを出力する|
|9|非常に冗長的にログを出力する|

# ファイアウォールの設定
ファイアウォールを設定します。`iptables`コマンドで設定するサイトの説明が多かったですが、ここではUbuntuにデフォルトでインストールされている`ufw`コマンドを使ってファイアウォールを設定していきます。

UFWでのファイアウォールの設定は「[ufwでファイアーウォールを設定](https://linuxsalad.blogspot.jp/2009/02/ufw.html)」がわかりやすかったです。

まずはすべてのポートを遮断します。

```bash
$ sudo ufw default deny
```

次に今回のOpenVPNで使う`1194`番ポート(UDP)を許可します。

```bash
$ sudo ufw allow 1194/udp
```

:warning: OpenVPNサーバの設定でポートを`1194`以外にした場合は適宜変更してください。UDPではなくTCPにした場合も同様です。

また、ここまでの設定をSSHでログインして行っている場合は、SSHのポートも開けておく必要があります。たとえば、SSHのポートを`2222`で設定している場合は

```bash
$ sudo ufw allow 2222
```

のように設定します。SSHは通常`22`番ポートですが、`22`番ポートでの使用はセキュリティ上おすすめしません。SSHで使用するポートの変更の手順に関してはここでは省略します。

:warning: SSHのポートを開けておくのを忘れると、SSHからログアウトしたあとにサーバに接続できなくなってしまうので十分注意してください。

ここまで設定できたら、ファイアウォールを有効化します。

```bash
$ sudo ufw enable
```

ファイアウォールが有効化されているか、また正しくポートが設定されているかを確認するには以下のコマンドを実行します。

```bash
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW       Anywhere
1194/udp                   ALLOW       Anywhere
2222/tcp (v6)              ALLOW       Anywhere (v6)
1194/udp (v6)              ALLOW       Anywhere (v6)
````

上記のようにOpenVPNのポートが開いていればOKです。SSHを利用している場合はSSHのポート（上記の例では`2222`番ポート）が開いていることも確認してください。念のため、別のシェルを起動してSSHでログインできるかどうか確認すると確実です。

# フォワーディングとマスカレードの設定
この状態の設定だと、VPNには接続できても、そこからインターネットに接続できません。インターネットに接続しようとしても、送信したパケットがクライアントに転送されるように設定しないとWebサイトにアクセスすることができなくなってしまいます。なのでインターネットに接続するための設定を行います。

フォワーディングとマスカレードの設定に関しては、「[ufw でルータをつくる](http://d.hatena.ne.jp/ubuntu-nikki/20100921/1285077768)」と「[UFW と NAPT を両立させる](http://www.usupi.org/sysad/269.html)」がとても参考になりました。

## IPフォワーディング
まずはパケット転送を有効にします。`/etc/default/ufw`を開き、`DEFAULT_FORWARD_POLICY`を`DROP`から`ACCEPT`に変更します。

```diff:/etc/default/ufw
- DEFAULT_FORWARD_POLICY="DROP"
+ DEFAULT_FORWARD_POLICY="ACCEPT"
```

IPフォワーディングを有効にします。`/etc/ufw/sysctl.conf`を開き、`net.ipv4.ip_forward=1`の一行をアンコメントします。

```diff:/etc/ufw/sysctl.conf
- # net.ipv4.ip_forward=1
+ net.ipv4.ip_forward=1
```

## IPマスカレード
IPマスカレードを有効にします。その前に、インターネットにつながっているネットワークインターフェースの名称を調べます。`ifconfig` を実行します。

```bash
$ ifconfig
ens3      Link encap:Ethernet  HWaddr ab:cd:ef:gh:ij:kl
          inet addr:216.58.197.228  Bcast:216.58.198.255  Mask:255.255.254.0
          inet6 addr: 0123:4567:890:1234:216:58:197:228/64 Scope:Global
          inet6 addr: abcd::efgh:ijkl:mnop:qrst/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:1892979 errors:0 dropped:0 overruns:0 frame:0
          TX packets:167294 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:241710378 (241.7 MB)  TX bytes:107644167 (107.6 MB)

lo        Link encap:Local Loopback
          inet addr:127.0.0.1  Mask:255.0.0.0
          inet6 addr: ::1/128 Scope:Host
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:160 errors:0 dropped:0 overruns:0 frame:0
          TX packets:160 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1
          RX bytes:11840 (11.8 KB)  TX bytes:11840 (11.8 KB)

tun0      Link encap:UNSPEC  HWaddr 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00
          inet addr:10.8.0.1  P-t-P:10.8.0.2  Mask:255.255.255.255
          UP POINTOPOINT RUNNING NOARP MULTICAST  MTU:1500  Metric:1
          RX packets:38514 errors:0 dropped:0 overruns:0 frame:0
          TX packets:60151 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:100
          RX bytes:8130438 (8.1 MB)  TX bytes:69942984 (69.9 MB)

```

複数のインターフェースが出てくると思いますが、その中で `inet addr` がグローバル IP アドレスになっているものを探してください。上記の例でいうと、`ens3` がそれに該当します。それを覚えておきます。

`/etc/ufw/before.rules`を開き、以下を追加します。一番下の行に`COMMIT`と書かれているはずなので、この下に追加していきます。

```diff:/etc/ufw/before.rules
COMMIT
+
+ *nat
+ :POSTROUTING ACCEPT [0:0]
+ -A POSTROUTING -s 10.8.0.0/24 -o ens3 -j MASQUERADE
+ COMMIT
```

:warning: `POSTROUTING` のIPアドレスはOpenVPNサーバの設定の`server`の箇所にあるものと同じIPアドレス、サブネットマスクを設定します。サブネットマスクが`255.255.255.0`の場合は`/24`となります。この記事の例と同じIPアドレスの設定にした場合は、ここでの設定も同じでOKです。

:warning: `ens3` という箇所は、先ほど `ifconfig` で調べた際の、インターネットにつながっているネットワークインターフェースの名称です。別の名称だった場合は変更してください。多くの場合は `ens3` や `eth0` などになっているかと思われます。

ここまで設定できたらファイアウォールを再起動して変更を反映させます。

```bash
$ sudo ufw reload
```

エラーが出なければOKです。

### **【注意】さくらの VPS における「ネットワークインターフェース」について**
実は、今までずっと問題なく接続できていた VPN が、数週間前に、設定も全くいじっていないのに突然接続できなくなってしまいました。その原因が数週間ずっとわからず、数週間調べ続けてようやくわかったのですが、どうやら**さくらの VPS で、ネットワークインターフェース名が変わった**ような気がします。

もちろん確証はないのですが、`ifconfig` を実行したときの、インターネットにつながっているインターフェースの名称が、今まで `eth0` だったのが突然 `ens3` に変わっていました。その影響で、VPN 接続でインターネットに接続できなくなってしまいました。

ここからが注意ポイントなのですが、インターフェース名が変わったにもかかわらず、さくらの VPS コントロールパネルでは、`eth0` と表記されています。

![sakura_network_interface.png](https://qiita-image-store.s3.amazonaws.com/0/113895/68c908d0-5a7c-d673-a359-13da5144c07d.png)

コントロールパネルで見る限りでは、インターネットにつながっているインターフェースは `eth0` となっていますが、実際には違います。なので、**必ず `ifconfig` の実行結果を確認**してください。これはさくらの VPS に限らず、他のサーバでも `ifconfig` の結果を信用するようにしてください。

# OpenVPNサーバの起動
いよいよここでOpenVPNを起動します。

```bash
$ sudo systemctl start openvpn
```

問題なく起動できているか確認するには以下のコマンドを実行します。

```bash
$ ps -ef | grep openvpn | grep -v grep
```

プロセスが起動していればOKです。

:warning: ここで注意すべき点は二つあります。一つはエラーが発生していても、標準出力には表示されないことです。エラーが発生している場合は`/var/log/openvpn.log`にエラーが出力されるので、そのファイルを確認してみてください。上記コマンドでプロセスが起動していなかった場合はエラーが発生していることを意味します。

:warning: もう一つはエラーが発生して起動されなかったとしても、systemdにおけるOpenVPNは`active`と表示されることです。なので

```bash
$ systemctl status openvpn
```

で`active`になっていたとしても、プロセスが起動していない場合はエラーなので、十分注意してください。ここはかなりの罠ポイントです。

### OpenVPN サーバが起動できない場合
設定は合っているはずなのに、`/var/log/openvpn.log` に謎のエラーが発生して OpenVPN のプロセスが表示されない場合は、代わりに `openvpn@server` が起動できるか確認してください。

```bash
$ sudo systemctl stop openvpn
$ sudo systemctl start openvpn@server
$ ps -ef | grep openvpn | grep -v grep
```

`ps` コマンドで、OpenVPN のプロセスが起動していた場合はこれで OK です。今後は、`openvpn` の代わりに `openvpn@server` を使用してください。これでも起動できなかった場合は `/etc/openvpn/server.conf` の設定が間違っていたり、UFW でポートが閉じていたりしている可能性があるので、そちらをもう一度確認してください。

また、サーバをリブートしたときに `openvpn` ではなく `openvpn@server` が自動起動されるように、設定を変更します。

```bash
$ sudo systemctl disable openvpn
$ sudo systemctl enable openvpn@server
$ systemctl is-enabled openvpn openvpn@server
disabled
enabled
```

`openvpn` が `disabled` で、`openvpn@server` が `enabled` となっていれば OK です。

# クライアント用秘密鍵の生成
ここまで来たらサーバ側の設定はあともう少しです。クライアント側で使用する鍵を生成します。各種鍵を生成したときと同様に、Easy RSA のディレクトリに移動します。

```bash
$ cd easy-rsa/easyrsa3
```

以下のコマンドを実行します。

```bash
$ ./easyrsa build-client-full username
```

`username`には任意のユーザ名を入力します。なんでも良いですが、複数の端末で利用する場合はわかりやすいユーザ名をつけてください。

パスフレーズを訊かれるので、設定します。確認のためにもう一度訊かれるので同じパスフレーズを入力します。最後にCA証明書のパスフレーズを訊かれるので、CA証明書を生成したときのパスフレーズを入力します。パスフレーズが多くなってくるとややこしいので、すべて同じパスフレーズにしても良いかと思います（このファイルが盗まれない限りはパスフレーズの役目はないので）。

クライアント側にダウンロードする鍵ファイルをわかりやすい場所にコピーして、所有者を変更します。今回はホームディレクトリにコピーします。

```bash
$ sudo cp /etc/openvpn/ca.crt ~
$ cp pki/issued/username.crt ~
$ cp pki/private/username.key ~
$ sudo chown sshuser:sshuser ~/ca.crt
$ sudo chown sshuser:sshuser ~/username.crt
$ sudo chown sshuser:sshuser ~/username.key
```

`username`は先ほどと同じユーザ名を入力してください。`sshuser`にはVPNサーバの現在ログインしているユーザのユーザ名を入力してください。

# 鍵ファイルのダウンロード
先ほどホームディレクトリにコピーした3つの鍵ファイルを、OpenVPNに接続するクライアントPCにダウンロードします。やり方は様々ありますが、`scp`コマンドを利用するのが一番簡単だと思います。`scp`コマンドの使い方に関しては「[scpコマンドでサーバー上のファイルorディレクトリをローカルに落としてくる](http://qiita.com/katsukii/items/225cd3de6d3d06a9abcb)」を参考にしてください。

これでサーバ側の設定は終了です。次はクライアント側の設定です。

# クライアントアプリのインストール
VPNの設定はOS標準の設定機能でも行えるので、はじめはその設定方法で調べていたのですが、どのサイトを見ても、専用のクライアントアプリを使用していたので、先人たちの教えに従い、アプリをインストールして設定しました。OpenVPNでは各種OSに対応したアプリが提供されているので、それを使って接続するのが一般的なようです。

ここでは、Macについて紹介します。Windowsの人は「[さくらのVPS512(月々税抜635円)で固定IPアドレスをゲットする(OpenVPNサーバを作る)](http://qiita.com/tool-taro/items/76cef0909c9b119d22b2#%E3%82%AF%E3%83%A9%E3%82%A4%E3%82%A2%E3%83%B3%E3%83%88%E3%81%AE%E6%8E%A5%E7%B6%9A%E8%A8%AD%E5%AE%9A)」を参考にしてください。

Tunnelblickというアプリを使用します。[公式サイト](https://tunnelblick.net/downloads.html)から`Stable`をダウンロードします。ダウンロードしたら、ファイルを開き、画面の指示に従ってインストールしてください。

インストール後の設定についても基本的に画面に指示に従っていれば簡単にできます。詳しくは「[OpenVPN プロトコルを用いた VPN Gate への接続方法](http://www.vpngate.net/ja/howto_openvpn.aspx#mac)」を参考にしてください。

# OpenVPNクライアントの設定
設定ファイルを用意していない場合、ダウンロードしますかと訊かれるのでダウンロードしましょう。

ダウンロードしたファイルは、コメントがたくさん書かれていますが、コメントを取り除いて必要な部分だけを抽出したクライアントの設定ファイルが以下の通りです。ダウンロードするか訊かれなかったり間違ってダウンロードしないを選択してしまった場合でも、空のファイルを生成して、以下の設定を書き込めばOKです。

ファイル名はなんでも良いですが、ファイル名がクライアントアプリ上では接続先の名称になるのでわかりやすい名前をつけてください。ここでは`VPN.ovpn`というファイル名にしています。拡張子は`.ovpn`でないといけないので注意してください。

```VPN.ovpn
client

dev    tun
proto  udp

remote 192.168.0.0 1194

resolv-retry  infinite
nobind

persist-key
persist-tun

ca    ca.crt
cert  username.crt
key   username.key

comp-lzo
verb 3
```

`dev`と`proto`に関しては、サーバ側で設定したものを使用してください。この記事と同じ設定にした場合はこちらもそのままでOKです。

`remote`に書かれているIPアドレスは、接続するVPNサーバの**グローバルIPアドレス**を指定してください。上記の設定では例としてプライベートIPアドレスが書かれていますが、ここをサーバのグローバルIPアドレスに変更します。IPアドレスの後ろのポート番号はサーバで設定したポート番号を設定してください。

`ca`, `cert`, `key` にはダウンロードした3つの鍵ファイルのファイル名を指定します。`username`は設定したユーザ名を入力してください。

`persist-key`, `persist-tun`, `comp-lzo`, `verb` に関してもサーバ側と同様で、サーバ側に設定してあればこちらにも入力し、設定していない場合は外します。`resolv-retry`と`nobind`に関してはクライアントのみの設定となりますが、特に問題がないかぎりこのままでOKです。

# 設定の読み込み
先ほど作成したクライアント側の設定ファイル（`VPN.ovpn`）と、ダウンロードした3つの鍵を一つのフォルダにまとめます。そのフォルダは、一度VPNの環境が整ってしまえばほとんど開くことはないので、邪魔にならないところに保存します。自分はホームディレクトリ以下に`.vpn`という隠しフォルダで保存しています。

Tunnelblickの指示に従ってやった場合はデスクトップに設定ファイルのサンプルが含まれたフォルダが生成されますが、そのフォルダの中に3つの鍵ファイルを入れて邪魔にならない場所に移動させればOKです。

メニューバーにあるTunnelblickのアイコンをクリックし、VPNの詳細を開きます。「接続先」と書かれている欄に、クライアントの設定ファイル（鍵と設定ファイルが入ったフォルダではなく、設定ファイル`VPN.ovpn`）をドラッグアンドドロップして、接続ボタンを押します。

:warning: 「[OpenVPN プロトコルを用いた VPN Gate への接続方法](http://www.vpngate.net/ja/howto_openvpn.aspx#mac)」の記事では、フォルダの拡張子を`.tblk`に変更して、そのフォルダ(tblk)を選択していますが、その必要はありません。通常のフォルダのままで、その中にある設定ファイルをドラッグアンドドロップしてください。

接続が開始するとウィンドウが出てきます。接続が完了したらVPNに接続できたことを意味します。そして、その後、適当にサイトにアクセスしてページをリロードしてもちゃんとアクセスできればインターネット接続も成功です、お疲れさまでした！

VPN経由でインターネットに接続されているかを確認するには、[このサイト](https://noraworld.net)にアクセスして、`Public IP address`の欄を見てください。IPアドレスがVPNサーバ側のグローバルIPアドレスであればVPN経由で接続できていることがわかります。

# iPhoneからの接続（おまけ）
ここまでができてしまえば、iPhoneからの接続は思ったより簡単だったのでおまけとして紹介します。まずは、iPhone用のOpenVPNクライアントである [OpenVPN Connect](https://itunes.apple.com/jp/app/openvpn-connect/id590379981) をインストールします。

次にiPhoneに鍵ファイルをインポートします。ここでの鍵ファイルは、**WindowsやMacですでに使用しているものではなく新しいもの**を使ってください。つまり「クライアント用秘密鍵の生成」の際に行った手順をもう一度繰り返して新しいクライアント用秘密鍵を生成してください。それをクライアントPCにダウンロードしてから、iPhoneにインポートします。

インポートはiTunes経由で行うのが一番簡単です。iTunesでのインポートの手順については「[iPhoneやiPad (iOS) でOpenVPNを使ってみよう！](https://www.openvpn.jp/document/ios-openvpn/)」がわかりやすいのでこちらを参考にしてください。このサイトの例ではクライアント秘密鍵を設定ファイルに埋め込んでファイルを一つにまとめる方法が説明されていますが、必須ではありません。PCのときと同様に3つの鍵ファイルと設定ファイルを一つのフォルダにまとめて、そのフォルダを OpenVPN Connect アプリにドラッグアンドドロップすればOKです。

フォルダのインポートが完了したら、OpenVPN Connect アプリを起動し、参考サイトの通り「+」マークを押して、スイッチをオンにすればVPNに接続できます。iPhoneの画面上部に「VPN」と表示されれば接続成功です！

# 注意ポイント
## Ubuntuにはnobodyというグループは存在しない
多くのサイトで、groupを`nobody`としていたので、解決するまでに時間がかかりました。これに関してはOpenVPNのログを見ればすぐに解決できたはずなんですが…（次へ続く）

## OpenVPNのエラーの存在がわかりにくい
OpenVPNのエラーはログファイルに書き込まれるわけですが、起動した時点では、たとえエラーでも何も表示されません。しかも、systemdで見たときのOpenVPNは`active`になっているのでそちらを信用してしまうと、エラーで起動していないことすら見逃してしまったりします。`ps`コマンドを使ってちゃんとプロセスが起動していることを確認しましょう。

## マスカレードに設定したIPとVPNで使うIPを一致させる
`/etc/openvpn/server.conf`の`server`に設定するIPアドレス（サブネットマスク）と、`/etc/ufw/before.rules`にIPマスカレードとして追加するIPアドレス（サブネットマスク）が一致していないとマスカレードが機能しません。当たり前だろうと思いますが設定してるときは間違えていても意外に気づかなかったりします。

## プライベートIPアドレスがかぶってはいけない
これに関しては自分はつまづかなかったのですが、直近のネットワークのプライベートIPと、VPN先のプライベートIPが競合すると接続できなくなるようです。プライベートIPアドレスは、VPNに入る前にいるものと被らないものを設定しましょう。

## 再起動を忘れずに
これは基本的なことではありますが、UFWにしろOpenVPNにしろ、設定を変更しても再起動しないと変更が反映されません。特にUFWの場合は変更が反映されていなくても、`status`には変更後の状態で表示されるので、反映されたものと勘違いすることが1〜2回ありました。設定の変更後は再起動を忘れずに。

# まとめ
VPN構築は、簡単なようにも見えますが、ちょっと設定を間違えるとつながらなくて、ログもわかりにくいので原因を追求するのが大変です。自分の場合は、10時間以上原因がわからなくて、最終的には「前にエラーでダメだったところなんだけど、もう一回やってみたらうまくいった」という結果でした。

人によってつまづくポイントはさまざまだと思いますが、この記事が、OpenVPNをこれから構築する人たちの役に立てば幸いです。

# 参考サイト
* [Ubuntu 14.04 で OpenVPN](http://felis-silvestris-catus.hatenablog.com/entry/2015/05/27/222434)
* [OpenVPNでリモートアクセスVPNのトラフィックを全てVPN経由にする方法](http://dev.classmethod.jp/cloud/aws/openvpn-vpn-traffic/)
* [クライアントのすべてのトラフィック（Webトラフィックを含む）をVPN経由にルーティングする](http://www.openvpn.jp/document/how-to/#AllTraffic)
* [OpenVPN using TUN & routing](http://d.hatena.ne.jp/johnyuan2000/20141101/1414818243)
* [Raspberry Pi - unable to start connection to openvpn server](https://forums.openvpn.net/viewtopic.php?t=20772)
* [OpenVPN環境の構築](https://blog.k3n.link/2016/06/29/openvpn/)
