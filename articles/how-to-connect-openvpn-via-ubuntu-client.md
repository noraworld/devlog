---
title: "Ubuntu クライアントから OpenVPN サーバに接続する方法"
emoji: "🗂"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["OpenVPN", "Ubuntu", "VPN", "ubuntu16.04", "ネットワーク"]
published: false
order: 45
---

# はじめに
以前に投稿した「[OpenVPNのインストールとセットアップからインターネット接続までのガイドブック](https://qiita.com/noraworld/items/2fe6be489e1d93c748b8)」（以下、サーバガイドブックとします）という記事では、OpenVPN サーバの構築方法と、Mac や iPhone から OpenVPN サーバに接続する方法を紹介しました。本記事では、Ubuntu から OpenVPN サーバに接続する方法について紹介します。

今回試した環境は Ubuntu 16.04 ですが、他のバージョンでもほぼ同じだと思われます。操作が若干異なる場合は、各自でお調べください。なお、本記事では、OpenVPN サーバがすでに構築されており、VPN をトンネルしてインターネットに接続できる環境が整っている状態を前提に説明します。まだサーバ側の環境が整っていない場合は、サーバガイドブックを参考にしてください。

# 鍵の生成
Ubuntu クライアント用の鍵を生成します。鍵生成の手順に関してはサーバガイドブックでも説明していますので、詳しくはそちらをご覧ください。

```bash
$ cd easy-rsa/easyrsa3
$ ./easyrsa build-client-full ubuntu
```

`ubuntu` という部分は任意のクライアント名を入力します。本記事では `ubuntu` という名前で説明します。違う名前にする場合は適宜読み替えてください。

コマンド実行後、パスフレーズを訊かれるのでパスフレーズを入力します。1 回目は任意のパスフレーズ（パスワード）を設定します。2 回目は 1 回目と同じものを入力します。3 回目は CA 証明書（`ca.crt`）に設定したパスフレーズを入力します。

# 鍵のコピー・移動
生成した鍵ファイルを Ubuntu クライアントに移動させます。詳細はサーバガイドブックをご覧ください。

```bash
$ sudo cp /etc/openvpn/ca.crt ~
$ cp pki/issued/ubuntu.crt ~
$ cp pki/private/ubuntu.key ~
$ sudo chown $USER:$USER ~/ca.crt
$ sudo chown $USER:$USER ~/ubuntu.crt
$ sudo chown $USER:$USER ~/ubuntu.key
```

ホームディレクトリに移動した各種の鍵を安全な方法で Ubuntu クライアントに移動させてください。方法はいくつかありますが、`scp` を使用するのが簡単です。

# OpenVPN クライアントのインストール
Mac では Tunnelblick という GUI ベースのアプリケーションが必要でしたが、Ubuntu では GUI ベースのものは必要ありません。コマンドラインのみで簡単にインストールすることができます。

```bash
$ sudo apt -y install network-manager-openvpn-gnome
```

# VPN の設定の追加
Ubuntu クライアントに、使用する OpenVPN の設定を追加します。

「システム設定」→「ネットワーク」と進み、ネットワーク設定画面を開きます。

![system_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/27ad652e-0577-c6cb-e3fd-6d9fe65f0fc5.png)

![all_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/625e163e-5c64-3206-4e80-bcd74719945f.png)

ネットワーク設定画面の左下の「+」マークをクリックして、新しいインターフェースを追加します。

![network_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/92d4ad14-6791-474b-d3b8-8686825d8f9f.png)

インターフェースを「VPN」に設定し「作成する」をクリックします。

![interface_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/ee648ce2-7130-1f95-66a7-fa7c03b61af0.png)

VPN の種類を「OpenVPN」に設定し「作成」をクリックします。デフォルトの場合、VPN の種類が「PPTP」しか選択できませんが、先ほど説明した `network-manager-openvpn-gnome` をインストールすることで「OpenVPN」を選択することができます。

![vpn_type_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/c9a8fa92-7d9c-088d-a6d3-bbc003c18a89.png)

接続する OpenVPN の設定を入力します。下記の表の説明通りに設定します。

| 項目 | 内容 | 例 |
|:-:|:-:|:-:|
| 接続名 | 接続する OpenVPN を識別する任意の名称 | MyVPN |
| ゲートウェイ | 接続する OpenVPN サーバのグローバル IP アドレス | 100.110.120.130 |
| タイプ | 認証方式 | 証明書 (TLS) |
| ユーザー証明書 | 鍵生成で生成されたユーザー証明書 (.crt) | ubuntu.crt |
| CA 証明書 | 接続する OpenVPN サーバで使用される CA 証明書 (.crt) | ca.crt |
| 秘密鍵 | 鍵生成で生成された秘密鍵 (.key) | ubuntu.key |
| 秘密鍵のパスワード | 鍵を生成する際に入力したパスフレーズ (パスワード) | *** (パスフレーズ) |

![my_vpn_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/247e6db0-43a0-1d6f-0598-c201d5de3076.png)

「ユーザー証明書」「CA 証明書」「秘密鍵」の 3 つは、先ほどクライアントに移動させた 3 つのファイルを選択します。「秘密鍵のパスワード」は、鍵を生成した際に入力した、1 回目（2 回目）のパスフレーズを入力します。

入力したら「詳細」をクリックして、詳細設定画面を開きます。

![my_vpn_custom_settings.png](https://qiita-image-store.s3.amazonaws.com/0/113895/8d2d9796-6c50-3821-32e5-e1340b4c8fa5.png)

サーバガイドブックと同じ手順で OpenVPN サーバを構築した場合は、上記スクリーンショットのように、「LZO データ圧縮を利用する」にチェックを入れます。その他、ポート番号、TCP/UDP、デバイスタイプ（TUN/TAP）などを変更した場合は、それぞれチェックを入れて、値を変更してください。デフォルトのまま変更していない項目に関してはチェックを入れる必要はありません。

詳細設定をしたら「OK」をクリックして詳細設定画面を閉じ、VPN の設定画面で「保存」をクリックして設定を保存します。

保存するとネットワーク設定画面のインターフェースに、設定した VPN の接続名（ここでは「MyVPN」とします）が追加されます。「MyVPN」をクリックして、右上のスイッチをオンにすると、VPN への接続が開始されます。設定や接続状況に問題がなければ、接続が完了します。

![vpn_connection.png](https://qiita-image-store.s3.amazonaws.com/0/113895/54344963-8b6b-bef8-6903-5f46df77ef9c.png)

VPN に正しく接続され、インターネットにアクセスできることを確認するには[こちら](https://noraworld.net)にアクセスします。グローバル IP アドレスが、VPN 側のアドレスに切り替わっていれば、正しく接続できています。お疲れ様でした！

# 参考サイト
* [Ubuntu17.10にOpenVPNクライアント導入](https://gtrt7.com/blog/linux/openvpncl_ubuntu1710)
* [OpenVPNのインストールとセットアップからインターネット接続までのガイドブック](https://qiita.com/noraworld/items/2fe6be489e1d93c748b8)
