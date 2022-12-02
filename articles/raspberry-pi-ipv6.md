---
title: "ルータにした Raspberry Pi を IPv6 に対応させる"
emoji: "🦔"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["dns", "dnsmasq", "network", "ufw", "netplan"]
published: false
order: 159
layout: article
---

# はじめに
この記事は『[物理的にネットワークを分離して特定のサイトに特定の時間帯にアクセスできないようにする](https://zenn.dev/noraworld/articles/network-isolation)』の続編です。前回の記事で IPv4 に関しては完結しましたが IPv6 には対応していませんでした。そこで今回は IPv6 対応させるための手順について紹介します。

前回の記事を先にご覧いただくことをおすすめしますが、IPv6 対応のみ知りたい場合は本記事だけでも役立つ部分はあるかと思います。



# 大前提
当たり前ですが、IPv6 対応させるためにはプロバイダが IPv6 を提供している必要があります。



# 概要
![independent network](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/network-isolation/independent_network.jpeg)

ネットワークを 2 つに分離することにより、各種端末は本物のルータとは独立したネットワークに属することになります。

この場合、ネットワーク A では本物のルータ (プロバイダ提供のルータ) が IPv6 に対応していれば利用することができますが、ネットワーク B は別ネットワークのため IPv6 アドレスが割り振られません。

つまり、ネットワーク A の本物のルータから Raspberry Pi (`eth1`) に割り振られた IPv6 アドレスを使って、ネットワーク B の各種端末に IPv6 アドレスを割り振る方法について紹介します。



#
