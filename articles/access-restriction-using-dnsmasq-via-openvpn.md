---
title: "Dnsmasq を使って特定のウェブサイトに OpenVPN 経由でアクセスできないようにする方法"
emoji: "👻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["dnsmasq", "OpenVPN", "dns", "VPN"]
published: true
order: 62
layout: article
---

# はじめに
この記事では、OpenVPN に接続しているクライアント（PC、スマホなど）で、特定のサイトにアクセスできないようにする方法を紹介します。

# TL;DR
Dnsmasq のインストール

```bash
$ sudo apt -y install dnsmasq
```

設定ファイルの編集

```/etc/dnsmasq.conf
listen-address=127.0.0.1, 10.8.0.1
```

DNS の変更

```diff:/etc/openvpn/server.conf
- push "dhcp-option DNS 8.8.8.8"
+ push "dhcp-option DNS 10.8.0.1"
```

OpenVPN の再起動

```bash
$ sudo systemctl restart openvpn
```

ファイアウォールの変更と再起動

```bash
$ sudo ufw allow 53
$ sudo ufw reload
```

ブロックしたいサイトの追加

```/etc/dnsmasq.d/main
address=/youtube.com/127.0.0.1
```

Dnsmasq の再起動

```bash
$ sudo systemctl restart dnsmasq
```

確認

```bash
$ curl -I https://www.youtube.com
```

# モチベーション
なぜそんなことをするのかって？ それはぼくが **YouTube にハマりすぎて趣味の開発をする時間を確保できなくなってしまうから**です。

YouTube 以外にも、Twitter や Facebook、Instagram、LINE、まとめサイトなど、気を散らすコンテンツは大量に潜んでいます。

それらのコンテンツは我々にこれでもかというくらい退屈させない時間を提供してくれますが、そのコンテンツの波に完全に身を任せてしまうともはや意志の力だけでは戻ることができません。

**本当にやりたいことを実現するための時間を手に入れるためには、意志の力ではなく、コンテンツの波を提供するサイト自体を遮断するのが効果的です**。

そこで今回は、OpenVPN 経由でのアクセスにおいて、Dnsmasq を使って特定のドメイン（ぼくの場合は `youtube.com`）の接続先アドレスを書き換えることによって、アクセスできないようにする方法について紹介します。

特定のサイトにハマりすぎることがない人にとっては、この記事で紹介する内容はあまり役には立たないかもしれませんが、ぼくと同じようにある特定のサイトにハマってしまう人には役に立つと思います。

# OpenVPN + Dnsmasq を使わない方法とその弱点
もし、OpenVPN を使わずに、もっと手軽に特定のサイトを遮断することをお望みならば、お使いの PC で `/etc/hosts` を編集することをおすすめします。

```/etc/hosts
127.0.0.1 www.youtube.com
```

これだけで `www.youtube.com` にはアクセスできなくなります[^cannot-access]。

[^cannot-access]: 正確には「アクセスできない」ではなくて、`www.youtube.com` の接続先が自分に向くと言ったほうが正しいのですが、以降も便宜上は「アクセスできない」と表現することにします。

ただし、この方法には 2 つの弱点があります。

## 1. ワイルドカードが使えない
残念ながら `/etc/hosts` 内ではドメインに対してワイルドカード使えません。今でこそ YouTube Gaming は YouTube 本体に統合されましたが、昔は `gaming.youtube.com` でも YouTube と同じコンテンツを視聴することができました。

YouTube に限って言えばワイルドカードが使えないことに関してはあまりデメリットはないのかもしれませんが、複数のサイトをブロックしたいときに、それぞれのサイトでサブドメインで別のコンテンツが提供されるような場合はやはりワイルドカードが使いたくなることがあると思います。

## 2. スマホでは hosts ファイルをいじれない
これはあくまで PC の設定であり、スマホで `/etc/hosts` をいじることはできません。

なので、VPN 上の DNS で特定のサイトにアクセスできないようにしておいて、その DNS を使うように設定された VPN にスマホを接続することで、スマホでも特定のサイトにアクセスできないようにすることができます。

これは、ウェブブラウザからのアクセスに限らず、アプリ内でも効力を果たすのでとても役に立ちます。

# 環境構築と設定方法
OpenVPN + Dnsmasq の有用性について紹介したところで、ここからは具体的な設定方法について説明していきます。

## OpenVPN の環境構築
こちらに関してはすでに過去のぼくが記事を書いているのでそちらを参考にしてみてください。

- [OpenVPNのインストールとセットアップからインターネット接続までのガイドブック](https://ja.developers.noraworld.blog/openvpn-installation-and-setup-guidebook)

関連記事も参考になるかもしれません。

- [Ubuntu クライアントから OpenVPN サーバに接続する方法](https://ja.developers.noraworld.blog/how-to-connect-openvpn-via-ubuntu-client)
- [OpenVPN のアクセスログを保存しないようにする方法](https://ja.developers.noraworld.blog/not-to-save-access-log-of-openvpn)

## Dnsmasq の設定方法
この記事は Dnsmasq の設定方法を中心に説明します。

### Dnsmasq のインストール
まずは Dnsmasq をインストールします。

```bash
$ sudo apt -y install dnsmasq
```

### ローカル IP アドレスの調査
次に、ローカル IP アドレスを調べておきます。

```bash
$ ip a
```

いくつか表示されると思います。環境によって表示が変わると思うので説明が難しいのですが、`inet` という項目に IP アドレスが記載されているはずです。

複数ある `inet` の項目のうち、`127.0.0.1` ではなく、グローバル IP アドレスでもないもの、つまりそのサーバに割り当てられているローカル IP アドレスを探してください。

以降の説明ではこのローカル IP アドレスを `10.8.0.1` として説明します。

### dnsmasq.conf の編集
ローカル IP アドレスを調べたら、いくつかの設定ファイルを編集します。

```/etc/dnsmasq.conf
listen-address=127.0.0.1, 10.8.0.1
```

`/etc/dnsmasq.conf` を見ると数百行に渡ってコメントアウトされた行があると思います。その行の中から `listen-address` を探し、コメントを外して上記のように記述してください。`10.8.0.1` はご自身の環境に併せて変更してください。

### OpenVPN 設定ファイルの編集
「[OpenVPNのインストールとセットアップからインターネット接続までのガイドブック](https://ja.developers.noraworld.blog/openvpn-installation-and-setup-guidebook)」の通りに環境構築をされた場合は、`/etc/openvpn/server.conf` という設定ファイルに以下のような記述があるかと思います。

```/etc/openvpn/server.conf
push "dhcp-option DNS 8.8.8.8"
```

これは VPN に接続してきた端末（PC やスマホなど）が使用する DNS を指定するものです。`8.8.8.8` は Google Public DNS なので、これを使う代わりに Dnsmasq を通すように書き換えましょう。

```diff:/etc/openvpn/server.conf
- push "dhcp-option DNS 8.8.8.8"
+ push "dhcp-option DNS 10.8.0.1"
```

設定を変更したら OpenVPN を再起動しましょう。

```bash
$ sudo systemctl restart openvpn
```

うまくいかない場合は[「OpenVPNのインストールとセットアップからインターネット接続までのガイドブック」の「OpenVPN サーバが起動できない場合」](https://ja.developers.noraworld.blog/openvpn-installation-and-setup-guidebook#openvpn-%E3%82%B5%E3%83%BC%E3%83%90%E3%81%8C%E8%B5%B7%E5%8B%95%E3%81%A7%E3%81%8D%E3%81%AA%E3%81%84%E5%A0%B4%E5%90%88)あたりも参考にしてみてください。

### ファイアウォールの編集
せっかく Dnsmasq を通すようにしても、DNS のポートが空いていなければどのサイトの名前解決もできなくなってしまいます。なのでファイアウォールで 53 番ポートを開放します。

```bash
$ sudo ufw allow 53
```

開放したらファイアウォールをリロードします。

```bash
$ sudo ufw reload
```

53 番ポートが開放されていることを確認したい場合は以下のようにします。

```bash
$ sudo ufw status
```

### ブロックしたいサイトを設定する
いよいよお待ちかねのサイトブロックの設定です。

`/etc/dnsmasq.d/` のディレクトリ以下に配置したファイルは Dnsmasq の設定ファイルとしてロードされます。ファイル名はなんでも良いです。ここでは `main` とします。

```/etc/dnsmasq.d/main
address=/youtube.com/127.0.0.1
```

`address=/<ブロックしたいサイトのドメイン>/127.0.0.1` という形式で記述します。複数ある場合は次の行に同じように記述すれば良いです。

### Dnsmasq の再起動
最後に Dnsmasq を再起動することを忘れずに。

```bash
$ sudo systemctl restart dnsmasq
```

問題なければデーモンが起動しているはずです。

```bash
$ systemctl status dnsmasq
```

### 確認
この状態で、まずは `curl` を実行してみましょう。

```bash
$ curl -I https://www.youtube.com
```

以下のように表示されてサイトにアクセスできないようになっていれば OK です。

```
curl: (35) gnutls_handshake() failed: The TLS connection was non-properly terminated.
```

ただ、まだこの段階では VPN サーバ上でアクセスできないことが確認できただけです。クライアント側でも同様に上記のコマンドを実行するか、ブラウザでアクセスしてみてください。もし設定が正しければアクセスできないようになっているはずです！

### エラーハンドリング
もしうまくいかないのであれば問題を切り分けて考えてみましょう。

#### OpenVPN に接続できない
そもそも OpenVPN に接続できない場合は OpenVPN の設定が間違っている可能性が高いです。[「OpenVPNのインストールとセットアップからインターネット接続までのガイドブック」の「注意ポイント」](https://ja.developers.noraworld.blog/openvpn-installation-and-setup-guidebook#%E6%B3%A8%E6%84%8F%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88)が参考になるかもしれません。

#### ブロックしたサイトにアクセスできてしまう
VPN サーバ上ではアクセスできないようになっていたが、クライアント側では依然としてアクセスできてしまう場合は、クライアントで使用する DNS が正しく設定できていない可能性があります。

クライアント側で `dig` コマンドを実行してみます。

```bash
$ dig www.youtube.com
```

`SERVER` と表示されている部分が、先ほど設定した VPN サーバのローカル IP アドレスになっていない場合は OpenVPN の設定が正しくできていないか、再起動を忘れている可能性が高いです。

```
;; SERVER: 10.8.0.1#53(10.8.0.1) # <- こうなっていれば正しい
;; SERVER: 8.8.8.8#53(8.8.8.8)   # <- これだとたぶんうまくいかない
```

#### どのサイトにもアクセスできない
同じく VPN サーバ上ではアクセスできないようになっていたが、クライアントではどのサイトにもアクセスできない（`dig` コマンドも応答が返ってこない）場合は DNS のポートが閉じていることを疑います。

VPN サーバ側でファイアウォールの設定をもう一度確認してみましょう。

```bash
$ sudo ufw status
```

53 番ポートが開放されていなければ開放してください。再起動も忘れずに実行してください。

# さいごに
多少めんどくさくはありますが、これで特定のサイトをブロックすることができました。

ぼくの場合は SSH 鍵がローカルになく[^sshkey]、設定を変更するためにはわざわざウェブのコンソールにログインしないといけないため、ちょうど良い抑止力になっています。

[^sshkey]: 厳密にはあるが、だいぶ前から `Permission denied` になったまま放置している。

最悪、ウェブのコンソールからはアクセスできるので、思い切って VPN サーバ用の SSH 鍵を捨ててしまうのもあり[^not-password]だと思います。

[^not-password]: 念のため言っておくと、パスワード認証にするという意味ではないです。

それでは、みなさんも無限のコンテンツに邪魔されない最高の時間をお楽しみください。
