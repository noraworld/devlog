---
title: "NordVPN の便利な機能についてまとめてみた"
emoji: "🛡"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vpn", "nordvpn", "openvpn", "wireguard", dns"]
published: true
order: 147
layout: article
---

# はじめに
筆者は最近 NordVPN を契約して使い始めたのですが、調べているとかなり便利な機能がたくさんあることに気づきました。

そこで今回は NordVPN が提供するいくつかの便利機能についてまとめてみようと思います。

なお、この記事で紹介する各機能の「利用方法」については基本的に Linux での利用を前提としています。Windows や macOS、iOS、Android などをご利用の場合は各々の公式ドキュメントをご覧ください。



# 固定 IP (Dedicated IP)
固定 IP はその名の通り固定の IP アドレスを利用できる機能です。固定 IP を利用しない場合は他のユーザとの共有 IP を利用することになりますが、共有 IP はサービスによってブロックされたり、アクセス制限をかけられたりすることがあります。

固定 IP を利用することにより、VPN サービスの IP アドレスにアクセス制限をしているサービスも利用することができるようになります[^2]。

## 利用方法
固定 IP は OpenVPN プロトコルでないと使えません。そのためまずは OpenVPN プロトコルに切り替えます。

```shell
nordvpn set technology openvpn
```

その後、サーバの番号を指定して VPN に接続します。

```shell
# 形式
nordvpn connect <国コード+サーバ番号>

# 例
nordvpn connect us4955
```

## 注意点
固定 IP はすべての国のサーバで提供されているわけではありません。サポートされているのは以下の 5 ヶ国のみです[^1][^4]。

* アメリカ
* イギリス
* オランダ
* フランス
* ドイツ

[^4]: 固定 IP を利用できるサーバが置かれている国が 5 ヶ国という意味です。日本からは利用できないという意味ではありません。

## 参考
* [Get a dedicated IP](https://nordvpn.com/features/dedicated-ip/)
* [How to connect to your dedicated IP on Linux?](https://support.nordvpn.com/General-info/1489354602/How-to-connect-to-your-dedicated-IP-on-Linux.htm)



# 難読化サーバ (Obfuscated Servers)
VPN からのアクセスを制限するウェブサイトが、その接続を判定する際に行う方法としてデータパケットをチェックするというものがあります。この方法により、どの国・地域からアクセスしているかはわからないものの、少なくとも VPN を利用してアクセスしている、ということはウェブサイト側に検出されてしまう可能性があります。

それを防ぐ手段として難読化サーバというものが存在します。

難読化サーバを利用することにより、データパケットを改変して VPN からのアクセスであることをデータパケットから推測できないようにすることができます。これにより、VPN からのアクセスを制限しているサービスを利用することができるようになります[^2]。

## 利用方法
難読化サーバは OpenVPN プロトコルでないと使えません。そのためまずは OpenVPN プロトコルに切り替えます。

```shell
nordvpn set technology openvpn
```

その後、難読化サーバを有効にします。

```shell
nordvpn set obfuscate on
```

## 注意点
難読化サーバはすべての国のサーバで提供されているわけではありません。サポートされている国の一覧は、難読化サーバを有効にしたあと、以下のコマンドで取得できます。

```
nordvpn countries
```

また、Linux で難読化サーバに接続する際の注意点として、コマンド実行時に国の名前ではなく国コードを指定しないといけません。

```shell
# NG
nordvpn connect United_States

# OK
nordvpn connect us
```

これは難読化サーバではないときには起こらない問題で、サポートに問い合わせたところ、どうやらバグのようです。将来的には修正されるかもしれません。

## 参考
* [Obfuscated Servers & How to Bypass VPN Blocks](https://nordvpn.com/features/obfuscated-servers/)



# SmartDNS
SmartDNS は VPN 接続時の DNS リークを防止するための仕組みです。DNS リークを防止することにより、DNS サーバ管理会社へ通信の情報が流出するのを防いだり、ストリーミングサービスの VPN アクセスによる制限を回避したりすることができます。

## DNS リークとは？
VPN に接続すると、インターネット利用時にご自宅のネットワークの情報 (IP アドレスなど) が隠蔽されますが、DNS サーバへの問い合わせをご自宅のネットワークから直接行ってしまうことにより、DNS サーバ管理会社へ通信の情報が漏れてしまったり、インターネットサービスプロバイダの情報がウェブサーバに筒抜けになってしまったりします。これが DNS リークです。

信頼できる DNS サーバを利用していれば問題ないのですが、ストリーミングサービスなどの中には、VPN からのアクセスを制限しているものもあります。そしてそれを DNS リークしているかどうかで判定しているサービスもあります。

例としては Amazon Prime Video が挙げられます。Amazon Prime Video では、VPN 接続時に DNS リークが発生しているとコンテンツを視聴することができません[^1]。

[^1]: 2022 年 7 月 21 日現在。

| DNS リークしている場合 | DNS リークしていない場合 |
| --- | --- |
| ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-21%20at%2019.25.59.png) | (スクリーンショットが用意できたら更新する) |
| ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-21%20at%2019.28.48.png) | (スクリーンショットが用意できたら更新する) |

DNS リークを防止することによりこれらのコンテンツにアクセスすることができます[^2]。

[^2]: すべてのサービスが同じ方法で VPN の判定を行っているわけではないため、この対策を行っても視聴できないサービスもあります。

## 判定方法
DNS リークが発生しているかどうかを判定してくれるいくつかのサービスを紹介します。なお、以下の手順は NordVPN に接続しているときに行います。

* [dnsleaktest.com](https://www.dnsleaktest.com)
* [dnsleak.com](https://dnsleak.com)

### dnsleaktest.com
[dnsleaktest.com](https://www.dnsleaktest.com) では、現在の IP アドレスと、利用している上流 DNS の IP アドレス、ホストネーム、インターネットサービスプロバイダなどを表示してくれます。

以下の 2 つの条件が揃っていれば DNS リークは発生していません。片方でも条件に合致していなければ DNS リークしている可能性があります。

* テスト後の DNS サーバの数が 1 つであること
* テストを行う前に表示された IP アドレスと、テスト後の DNS の IP アドレスが一致していること

| DNS リークしている場合 | DNS リークしていない場合 |
| --- | --- |
| (スクリーンショットを取り損ねたのであとで追加) | ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-22%20at%200.42.42.png) |
| ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-22%20at%200.34.26.png) | ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-22%20at%201.52.46.png)

### dnsleak.com
[dnsleak.com](https://dnsleak.com) では、上記に加え、DNS リークが発生しているかどうかをメッセージで表示してくれます。

| DNS リークしている場合 | DNS リークしていない場合 |
| --- | --- |
| ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-22%20at%200.39.59.png) | ![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/nordvpn-features/Screen%20Shot%202022-07-22%20at%201.47.31.png) |

こちらも IP アドレスと DNS の IP アドレスが一致しているかどうかで DNS リークを判定しています。

## 利用方法
利用するデバイスで以下の DNS サーバを設定するだけです。

* `103.86.96.103`
* `103.86.99.103` [^3]

[^3]: セカンダリ DNS サーバが設定できなければ設定しなくても良いです。

上記の DNS サーバを設定したあと、先述した DNS リークテストを行いリークしていないことを確認します。ただし、DNS キャッシュがあると正しい結果が返ってこない可能性があるので、キャッシュが切れるまで待つか、デバイスを再起動してから試す必要がある場合もあります。

## 参考
* [What is SmartDNS?](https://support.nordvpn.com/General-info/SmartDNS/1161156142/What-is-SmartDNS.htm)



# 脅威対策機能 (Threat Protection)
脅威対策機能は一言で説明するとセキュリティやプライバシーを向上させる機能です。

具体的には以下のメリットがあります。

* 悪質なウェブサイトやマルウェアからデバイスを保護することができる
* トラッキングをブロックしてプライバシーを強化できる
* ポップアップや煩わしい広告をブロックして快適なブラウジングができる

## 利用方法
Linux では Threat Protection Lite (通称 TPL) という機能が提供されています。

TPL を有効にするには以下のコマンドを実行します。

```shell
nordvpn set tpl on
```

## 注意点
NordVPN では VPN 接続時の上流 DNS サーバを設定することができますが、TPL と併用することはできません。

下記のような DNS を設定するコマンドを実行すると、自動的に TPL が無効になります。

```shell
nordvpn set dns 103.86.96.103 103.86.99.103
```

## 参考
* [Increase your cybersecurity with Threat Protection](https://nordvpn.com/features/threat-protection/)



# NordLynx
NordVPN では、以下の 2 つのプロトコルを利用できます。

* OpenVPN
* WireGuard

NordLynx は NordVPN 上で利用できる WireGuard プロトコルを利用した接続方式のことです。

## WireGuard とは？
VPN を利用するためのプロトコルやアプリケーションはいくつか存在し、その代表例が OpenVPN です。

ただ、OpenVPN を始めとする一般的な VPN プロトコルは以下のような問題が存在します。

* セットアップが大変
* 接続が安定しない
* 再接続に時間がかかる
* 古い暗号方式を利用している
* 潜在的なバグが含まれていることがある

これらの問題を解決するための新しいプロトコルとして誕生したのが WireGuard です。

## 利用方法
NordLynx を利用するには以下のコマンドを実行します。

```shell
nordvpn set technology nordlynx
```

あとは通常通り VPN サーバに接続します。

## 注意点
ここまでの説明で、OpenVPN プロトコルでないと使えない機能がいくつかあったと思います。残念ながら NordLynx と同時に利用できない機能がいくつかあるため、ここは一長一短といえます。

## 参考
* [What is NordLynx?](https://support.nordvpn.com/General-info/1438624372/What-is-NordLynx.htm)
* [WireGuard](https://ja.wikipedia.org/wiki/WireGuard)



# さいごに
NordVPN は数多くの便利な機能を提供しています。他にも便利な機能が見つけたら記事を更新しようと思います。
