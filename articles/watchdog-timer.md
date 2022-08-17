---
title: "Linux でシステムのフリーズを検知して自動的に再起動させる方法"
emoji: "🐶"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["watchdog", "linux", "ubuntu", "systemd"]
published: true
order: 150
layout: article
---

# はじめに
我が家の Raspberry Pi が定期的にフリーズするのですが、原因が全くわかません。

何か対応策はないものかと調べていたら、Linux には Watchdog timer という仕組みがあることがわかりました。

今回は Ubuntu 22.04.1 LTS をインストールした Raspberry Pi で Watchdog timer を有効にして、システムフリーズ時に自動的に再起動するようにしてみます。

基本的には Raspberry Pi & Ubuntu でなくても、Linux をインストールしたマシンなら同じ方法で設定できると思いますので、ぜひ参考にしてみてください。



# Watchdog timer の有効化
まずは Watchdog timer を有効にします。

`/boot/config.txt` に以下の 1 行を追加します。このファイルを今までに作ったことがない場合はファイルを新規作成します。

```conf:/boot/config.txt
dtparam=watchdog=on
```



# Heartbeat の設定
Heartbeat は日本語に訳すと心臓の鼓動で、システムが正常に動作しているかどうかの確認を一定間隔ごとに行うものです。後述する設定で、このハートビートが一定期間以上なかった場合は再起動するようにします。

`/etc/systemd/system.conf.d/main.conf` というファイルを作成し、以下の 1 行を追加します[^1][^2]。`/etc/systemd/system.conf.d/` ディレクトリがない場合は作成します。

[^1]: `/etc/systemd/system.conf` をいじっても良いのですが、`/etc/systemd/system.conf.d/*.conf` を使用することが推奨されているので今回はこちらを使用します。

[^2]: ファイル名は任意なので `main.conf` でなくても大丈夫です。ただし拡張子は `.conf` としてください。

```conf:/etc/systemd/system.conf.d/main.conf
[Manager]
RuntimeWatchdogSec=5
```

上記の設定で、5 秒ごとに Heartbeat を行います。



# 再起動のしきい値の設定
先ほど設定した Heartbeat が一定期間以上来なかったら再起動する設定を行います。

`/etc/modprobe.d/bcm2835-wdt.conf` に以下の 1 行を追加します。ファイルがない場合は新規作成します。

```conf:/etc/modprobe.d/bcm2835-wdt.conf
options bcm2835_wdt heartbeat=10 nowayout=0
```

上記の設定で、10 秒以上 Heartbeat が来なかった場合は再起動するようにします。



# 再起動
システムを再起動して設定を反映させます。

```shell:Shell
sudo reboot
```



# 起動しているか確認
ログを見て Watchdog timer が起動しているか確認します。

まずは以下のコマンドを実行します。

```shell:Shell
sudo dmesg | grep bcm2835-wdt
```

以下のような出力があれば OK です。

```
[    1.949143] bcm2835-wdt bcm2835-wdt: Broadcom BCM2835 watchdog timer
```

次に以下のコマンドを実行します。

```shell:Shell
sudo dmesg | grep systemd | grep watchdog
```

以下のような出力がされれば OK です。

```
[    9.389119] systemd[1]: Using hardware watchdog 'Broadcom BCM2835 Watchdog timer', version 0, device /dev/watchdog
[    9.401138] systemd[1]: Set hardware watchdog to 5s.
```



# 動作確認
本当にフリーズしたときに再起動するのか試してみます。

フリーズさせる方法はいろいろありますが、代表的な方法として [フォーク爆弾](https://ja.wikipedia.org/wiki/Fork%E7%88%86%E5%BC%BE) を投下してみます。以下のコマンド[^3]を実行します。

[^3]: はじめて見る方はコマンドには見えないかもしれませんが、これは Bash や Zsh で動作するコマンドです。

```shell:Shell
:(){ :|:& };:
```

実行後、シェルが急激に重くなります。

数分待って、システムが自動的に再起動されれば成功です。



# さいごに
これはあくまで応急処置であって、本当はシステムが頻繁にフリーズする原因を突き止めるのが得策です。

でも、システムのフリーズなどという漠然とした問題の原因を突き止めるのは容易ではないですし、それなりに時間もかかります。Watchdog timer は根本原因解決までの代替手段としては有効かなと思います。

あるいは、このような問題がなかったとしても、何が起こるかはわからないので、盤石な構成にしておくという意味で有効にするのはありかなと思います。



# 参考
* [ラズパイが2～3日でフリーズするのでウォッチドッグタイマーを設定して回避した](https://torisky.com/%E3%83%A9%E3%82%BA%E3%83%91%E3%82%A4%E3%81%8C2%EF%BD%9E3%E6%97%A5%E3%81%A7%E3%83%95%E3%83%AA%E3%83%BC%E3%82%BA%E3%81%99%E3%82%8B%E3%81%AE%E3%81%A7%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81%E3%83%89%E3%83%83/)
* [ラズパイ安定化対策－フリーズ対応編](https://www.my-hacks.info/2019/05/16/post-682/)
* [【WatchDogTimer】Raspberry Pi4サーバがフリーズ(停止)した場合に自動再起動する方法【HeartBeat】](https://debimate.jp/2020/11/28/%E3%80%90watchdogtimer%E3%80%91raspberry-pi4%E3%82%B5%E3%83%BC%E3%83%90%E3%81%8C%E3%83%95%E3%83%AA%E3%83%BC%E3%82%BA%E5%81%9C%E6%AD%A2%E3%81%97%E3%81%9F%E5%A0%B4%E5%90%88%E3%81%AB%E8%87%AA%E5%8B%95/)
