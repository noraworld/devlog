---
title: "Web プロキシサーバ Squid を利用して、特定のサイト・時間帯・曜日にアクセスできないようにする"
emoji: "😸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["プロキシ", "squid"]
published: true
order: 64
layout: article
---

# はじめに
以前にこのような記事を公開しました。

[Dnsmasq を使って特定のウェブサイトに OpenVPN 経由でアクセスできないようにする方法](https://qiita.com/noraworld/items/a0df2a53c4359ff04fa9)

Dnsmasq を利用して、VPN を経由したデバイスで特定のサイトにアクセスできないようにする方法を紹介した記事です。

しかし、あとになってよくよく考えてみると、別に VPN を利用しなくてもプロキシを設定すれば良いんじゃね......？ ということに気づきました。しかも、わざわざ VPN サーバ（VPS など）を用意しなくても、自宅にある適当な PC をプロキシサーバ代わりにすれば良いのではないかと思いました。

というわけで今回は自宅にある Mac mini をプロキシサーバにしてみたのでその方法をご紹介します。

# 環境
macOS Catalina（バージョン 10.15.2）

macOS での手順を紹介しますが、Linux でもできると思います。実行するコマンドや設定ファイルのパスが異なりますので適宜読み替えてください。

# Squid のインストール
今回使用するプロキシサーバは Squid というものです。まずは Squid を Homebrew でインストールします。Linux の場合はそれぞれのディストリビューションのパッケージマネージャを使用してください。

```bash
$ brew install squid
```

# 設定ファイルの編集
Squid をインストールすると `/usr/local/etc` 直下に、以下の 3 つのファイルが追加されます。

- `squid.conf`
- `squid.conf.default`
- `squid.conf.documented`

`squid.conf.default` はデフォルトの設定ファイルですので編集せずにそのままにしておきます。`squid.conf.documented` はドキュメントですので適宜参考にしてください。

今回編集するのは `squid.conf` です。このファイルを開いて設定を編集します。

## 設定ファイルの書き方
今回は例として、「0:00 〜 18:00 の間は YouTube にアクセスできないようにする」という設定にしてみたいと思います。

`INSERT YOUR OWN RULE(S) HERE TO ALLOW ACCESS FROM YOUR CLIENTS` と書かれたコメントがあるかと思いますので、このコメントのすぐ下あたりに設定を追加していきます。

```configuration:/usr/local/etc/squid.conf
#
# INSERT YOUR OWN RULE(S) HERE TO ALLOW ACCESS FROM YOUR CLIENTS
#
acl blacklist dstdomain "/usr/local/etc/squid/blacklist"
acl blacktime time SMTWHFA 0:00-18:00
http_access deny blacklist blacktime
```

次に、ブラックリスト（自分が特定の時間帯・曜日にアクセスしたくないサイト）を作成します。`/usr/local/etc` 直下に `squid` というディレクトリを作成し、`blacklist` というファイルを生成します。

```bash
$ mkdir /usr/local/etc/squid
$ vi /usr/local/etc/squid/blacklist
```

`blacklist` には以下を記述します。

```:/usr/local/etc/squid/blacklist
.youtube.com
```

これで設定は完了です。上記の設定について解説していきます。

## 追記した設定の解説
まず、1 行目の `acl blacklist dstdomain "/usr/local/etc/squid/blacklist"` ではブラックリストのファイルを指定します。今回は `/usr/local/etc/squid/blacklist` としましたが、自分のわかりやすい場所で構いません。

次に 2 行目の `acl blacktime time SMTWHFA 0:00-18:00` でアクセスを禁止する時間帯と曜日を指定します。`SMTWHFA` が曜日を表し、`0:00-18:00` が時間帯を表しています。曜日に関しては以下のようになっています。

| 記号 | 曜日 |
|:-:|:-:|
| S | 日曜日 |
| M | 月曜日 |
| T | 火曜日 |
| W | 水曜日 |
| H | 木曜日 |
| F | 金曜日 |
| A | 土曜日 |

上記の設定では `SMTWHFA` となっていますので、「毎日」という指定になります。`MTWHF` とすれば「平日」です。`MH` とすれば「月・木」となります。

時間帯のフォーマットに関しては説明不要かと思います。

なお、時間帯・曜日の設定は省略することができます。時間帯や曜日に関わらず、常に特定のサイトをブロックしたい場合は単純にこの行を書かなければ OK です。

最後に 3 行目の `http_access deny blacklist blacktime` で、先ほど設定したサイト・時間帯・曜日でアクセス制限をします。`blacklist` の箇所はブラックリストを設定したときの名前を、`blacktime` は時間帯・曜日を設定したときの名前を指定します。`deny` とすることでアクセス制限をすることができ、逆にホワイトリスト形式にしたい場合は `allow` とします。

また、ブラックリストの書き方についてですが、先頭に `.` をつけるとサブドメインを含めすべてブロックすることになります。上記の例では `.youtube.com` としていますが、この場合は `www.youtube.com` や `music.youtube.com`、`m.youtube.com` などがブロックされることになります。単純に `www.youtube.com` のみをブロックしたい場合はそのように記述してください。

# Squid の起動
設定ファイルを編集できたら、Squid を起動します。

```bash
$ brew services start squid
```

起動しているかどうかを確認するには以下のコマンドを実行します。

```bash
$ brew services list
Name  Status  User      Plist
squid started noraworld /Users/noraworld/Library/LaunchAgents/homebrew.mxcl.squid.plist
```

`Name` が `squid` となっている行の `Status` が `started` になっていれば起動しています。

## Squid の停止と再起動 (optional)
Squid の停止方法は以下の通りです。

```bash
$ brew services stop squid
```

また、再起動は以下の通りです。

```bash
$ brew services restart squid
```

**設定ファイルを書き換えたときには再起動**する必要があります。

# プライベート IP アドレスの固定
おそらくネットワークの設定を何もいじっていない場合は、IP アドレスの割当が自動（DHCP サーバを使用）になっているかと思います。何かしらの拍子に IP アドレスが変わってしまうと、そのたびにクライアント側のプロキシの設定を書き換えないといけなくなってしまうので固定化します。

まず、「システム環境設定」を開きます。

「ネットワーク」を開きます。

![スクリーンショット 2020-01-17 17.48.56.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/d11130ac-dd96-879e-3b24-ca51baf9bcac.png)

「IPv4 の設定」の箇所が「DHCP サーバを使用」になっていたら、「手入力」に変更してください。すると、IP アドレス、サブネットマスク、ルーターが入力できるようになりますので、入力してください。たいていの場合は「手入力」にする前に設定されていた値と同じものをそのまま入力すれば良いはずです。

![スクリーンショット 2020-01-17 17.52.34.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/af693dd3-3282-e36e-053a-8416a8a9ccde.png)

これでプロキシサーバ側の設定は終了となります。

# プロキシサーバを設定する
ここからクライアントの設定に移ります。プロキシサーバの指定方法はデバイスごとに異なりますので適宜調べてください。ここでは iOS、macOS、Nintendo Switch、PlayStation 4 での設定方法をご紹介します。なお、Nintendo Switch と PlayStation 4 では動作未検証です。

## iOS
※ iOS 13.3 での設定方法です。バージョンによって多少異なる可能性があります。

1. 設定アプリを開きます
2. 「Wi-Fi」をタップします
3. プロキシを設定したいネットワークの右端にある `i` マークをタップします
4. 「プロキシを構成」をタップします
5. 「手動」をタップします
6. 「サーバ」に先ほど設定したプロキシサーバの IP アドレスを入力します
7. 「ポート」に `3128` を入力します

## macOS
※ macOS 10.15.2 での設定方法です。バージョンによって多少異なる可能性があります。

1. 「システム環境設定」を開きます
2. 「ネットワーク」を開きます
3. 「詳細...」ボタンを押します
4. 「プロキシ」タブを押します
5. 「Web プロキシ（HTTP）」にチェックを入れます
6. 入力欄の左側（コロンの左側）に先ほど設定したプロキシサーバの IP アドレスを入力します
7. 入力欄の右側（コロンの右側）に `3128` を入力します
8. 「保護された Web プロキシ（HTTPS）」にチェックを入れます
9. 先ほどと同じように IP アドレスと `3128` を入力します
10. 「OK」ボタンを押します
11. **「適用」ボタンを押します**

## Nintendo Switch
※ システムバージョン : 9.1.0 での設定方法です。バージョンによって多少異なる可能性があります。

1. ホーム画面に行きます
2. 「設定」を開きます
3. 「インターネット」を選択します
4. 「インターネット設定」を選択します
5. プロキシを設定したいネットワークを選択します
6. 「設定の変更」を選択します
7. 「Proxy 設定」を選択し、「する」を選択します
8. 「サーバー」に先ほど設定したプロキシサーバの IP アドレスを入力します
9. 「ポート」に `3128` を入力します
10. 「保存する」を選択します

## PlayStation 4
※ システムソフトウェア 7.02 での設定方法です。バージョンによって多少異なる可能性があります。

1. ホーム画面に行きます
2. 「設定」を開きます
3. 「ネットワーク」を開きます
4. 「インターネット接続を設定する」を選択します
5. 「Wi-Fi を使う」または「LAN ケーブルを使う」を選択します
6. 「カスタム」を選択します
7. 「IP アドレス設定」「DHCP ホスト名」「DNS 設定」「MTU 設定」などを設定します（基本的にはデフォルトで問題ないです）
8. 「プロキシサーバー」の画面に来たら「使う」を選択します
9. 「アドレス」に先ほど設定したプロキシサーバの IP アドレスを入力します
10. 「ポート番号」に `3128` を入力します
11. 「次へ」を選択します

## Apple TV
Apple TV は通常の方法（設定アプリ内）ではプロキシの設定をすることができません。Apple Configurator を利用することでプロキシを設定することができるようですが、未検証です。

[Apple Configurator を使ってネットワーク上の Apple TV に接続する](https://support.apple.com/ja-jp/HT208124)

## Amazon Fire TV
Fire TV も Apple TV と同様に、通常の方法ではプロキシの設定をすることができません。開発者ツールを利用すればできるかもしれませんが、軽く調べただけで未検証なのでわかりません。

[開発者ツールのオプション](https://developer.amazon.com/ja/docs/fire-tv/system-xray-developer-tools.html#network-proxy)

# 動作検証
最後に、プロキシを設定したデバイスで、ブラウザを開き、特定のサイトにアクセスできなくなっているのを確認したら終了です。お疲れさまでした。

ちなみに、当たり前ですが**プロキシを通過しないネットワークアクセスでは上記のアクセス制限はかからない**ことに注意してください。たとえば、`ping` コマンドや `curl` コマンドを実行する際はプロキシを通過しないのでふつうにアクセスできます。また、Nintendo Switch でも注意書きにある通り、一部のソフトではプロキシを使えないようです。

# さいごに
いかがだったでしょうか。自宅のマシンを利用するため、VPN に比べて手軽にできるのでおすすめです。これをするモチベーションとしては、[Dnsmasq のときと同じ](https://qiita.com/noraworld/items/a0df2a53c4359ff04fa9#%E3%83%A2%E3%83%81%E3%83%99%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3) です。

もちろん VPN + プロキシという組み合わせでもできると思いますので、お好みの環境で試してみてください。

ちなみに、VPN + Dnsmasq の組み合わせができるなら、VPN を使わずに、自宅のマシンに Dnsmasq をインストールして DNS サーバ代わりにする、という手もありますが、調べた限りでは、Dnsmasq では時間帯や曜日によって切り替えるということができないのではないかと思います。もしできるのであればそっちのほうがお手軽かもしれません。Apple TV や Fire TV ではプロキシの設定がやや煩雑なので。

OpenVPN を利用した VPN 環境構築についても以前に記事にしていますので参考まで。

[OpenVPNのインストールとセットアップからインターネット接続までのガイドブック](https://qiita.com/noraworld/items/2fe6be489e1d93c748b8)

# 参考にしたサイト
- [3分で Mac OS X に squid プロキシをたてる](https://tofu.hatenadiary.com/entry/2017/03/14/squid-on-mac-osx)
- [Squid でプロキシサーバを立てる](https://hidde.hatenadiary.org/entry/20090521/1242883305)
- [Squid で安全なインターネットアクセス環境を構築する方法](https://blog.cybozu.io/entry/2017/02/03/080000)
- [squid - 特定のユーザーが制限された時間だけブロックされたサイトにアクセスできるようにする](https://tutorialmore.com/questions-428407.htm)
