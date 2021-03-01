---
title: "OpenVPN のアクセスログを保存しないようにする方法"
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["OpenVPN", "VPN", "ネットワーク"]
published: true
order: 46
---

# はじめに
OpenVPN では、クライアントからのアクセスログを記録することができますが、クライアントを常時 OpenVPN に接続してインターネットを使用していると、ログファイルの容量が膨大になってしまいます。自分の環境では、Mac や iPhone で数ヶ月 OpenVPN に接続してインターネットを利用していたら、OpenVPN のクライアントのログファイルだけで 20GB 近くまで膨れ上がってしまいました。

ログを記録しておくことはサーバ管理において非常に重要ですが、OpenVPN では容量削減のためにログを記録しないようにしておくのも一つの方法です。今回は OpenVPN におけるあらゆるログを記録しないようにする設定方法について説明します。

# サーバの設定ファイルを変更
やることはとても簡単です。サーバの設定ファイルを変更して、OpenVPN を再起動するだけです。以下のように、ログに関する設定をコメントアウトして無効化します。

```diff
- status     /var/log/openvpn-status.log
- log        /var/log/openvpn.log
- log-append /var/log/openvpn.log
- verb       3
+ ; status     /var/log/openvpn-status.log
+ ; log        /var/log/openvpn.log
+ ; log-append /var/log/openvpn.log
+ verb         0
```

OpenVPN の設定ファイルでは、行頭に `;` をつけるとコメントアウトすることができます。

`status`、`log`、`log-append` の 3 つはログの保存場所を指定する設定なので、これらをコメントアウトすることでログを記録させないようにします。また、`verb` はログの冗長度を数値で表したもので、`0` にすると、必要最低限のみのログだけ記録するようにします。

これで設定は完了です。

# OpenVPN の再起動
設定の変更を反映するために OpenVPN を再起動します。

```bash
$ sudo systemctl restart openvpn
```

以上でログが記録されないようになりました。お疲れさまでした。なお、OpenVPN のエラーなどで作業が必要になったときは、ログがヒントになっていることが多いので、変更を元に戻すことを推奨します。設定ファイルの変更後は OpenVPN の再起動を忘れずに行ってください。

# 参考サイト
* [OpenVPNのインストールとセットアップからインターネット接続までのガイドブック](https://qiita.com/noraworld/items/2fe6be489e1d93c748b8)
* [Ubuntu クライアントから OpenVPN サーバに接続する方法](https://qiita.com/noraworld/items/05658055446c41482cce)
