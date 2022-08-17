---
title: "Raspberry Pi を再起動するとシステム日時が狂う問題の解決法"
emoji: "🕰"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["raspberrypi", "linux", "date", "timedatectl", "ntp"]
published: true
order: 151
layout: article
---

# はじめに
最近になって、Raspberry Pi を再起動したら急に日時が狂うようになりました。

https://twitter.com/i/web/status/1559228842375385088

これは 2022 年 8 月 16 日のツイートなのですが、Raspberry Pi の日付は 2022 年 4 月 21 日になっています。

しかも再起動するたびに変わります。最初は数日前の日付だったのが、1 日前になったり 1 週間後になったり……。一番ひどかったのが上記のツイートの 4 ヶ月前です。

今回は NTP サーバと正しく同期することで、再起動時にシステムの日時が狂う問題を解決する方法について紹介します。



# 環境
* Raspberry Pi 4
* Ubuntu 22.04.1 LTS



# `ntpdate` のアンインストール
現在の Ubuntu では、`timedatectl` を使用して NTP サーバと時刻を同期します[^2]。伝統的には `ntpdate` を使うようですが、今後は `timedatectl` が主流になるはずなので、`ntpdate` がインストールされている場合はアンインストールします。

[^2]: [【Ubuntu】ntpdateではなくtimedatectlによる時刻合わせ](https://self-development.info/%E3%80%90ubuntu%E3%80%91ntpdate%E3%81%A7%E3%81%AF%E3%81%AA%E3%81%8Ftimedatectl%E3%81%AB%E3%82%88%E3%82%8B%E6%99%82%E5%88%BB%E5%90%88%E3%82%8F%E3%81%9B/)

```shell:Shell
sudo apt -y purge ntp
sudo apt -y purge ntpdate
sudo apt -y purge ntpsec-ntpdate
```



# `timedatectl` のインストール
`timedatectl` はデフォルトでインストールされているはずですが、もし `timedatectl` コマンドが使えない場合はインストールします。

```shell:Shell
sudo apt -y install systemd-timesyncd
```



# NTP サーバの設定
`/etc/systemd/timesyncd.conf.d/main.conf` というファイルを作成し、以下を追加します[^1]。`/etc/systemd/timesyncd.conf.d/` ディレクトリが存在しない場合は作成します。

[^1]: `/etc/systemd/timesyncd.conf` をいじっても良いのですが、`/etc/systemd/timesyncd.conf.d/*.conf` を使用することが推奨されているため、今回はこちらを利用します。ファイル名は何でも良いのですが、拡張子は `.conf` とする必要があります。

```conf:/etc/systemd/timesyncd.conf.d/main.conf
[Time]
NTP=ntp.nict.jp
```

`ntp.nict.jp` は日本の代表的な NTP サーバのドメインです。他の NTP サーバを使いたい場合、もしくは海外にお住まいの場合は適宜ドメインを変更してください。



# 設定の反映
設定を反映させるために以下のコマンドを実行します。

```shell:Shell
sudo systemctl daemon-reload
sudo systemctl restart systemd-timesyncd
sudo timedatectl set-ntp on
```



# NTP のポートを許可
UFW (ファイアウォール) を有効にしている場合は、NTP ポートを許可しておきます。

```shell:Shell
sudo ufw allow ntp
sudo ufw reload
sudo systemctl restart ufw
```



# 動作確認
再起動時に問題が起こらないかどうかを確認したいので、まずは再起動します。

```shell:Shell
sudo reboot
```

再起動完了後、以下のコマンドを実行し、現在時刻が正しいことを確認します。

```shell:Shell
date
```

より厳密に確認するには `timedatectl` コマンドを実行します。

```shell:Shell
timedatectl
```

```
               Local time: Thu 2022-08-18 00:02:33 JST
           Universal time: Wed 2022-08-17 15:02:33 UTC
                 RTC time: n/a
                Time zone: Asia/Tokyo (JST, +0900)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

`System clock synchronized` が `yes` になっており、かつ `NTP service` が `active` になっていれば時刻が正しく同期できています。お疲れさまでした！



# 余談: ハードウェアクロックについて
たいていの PC にはハードウェアクロックが搭載されています。これが搭載されている場合、NTP サーバと同期できない (インターネット接続がない) 場合でも PC 内にあるクロックが時を刻んでくれるので、時刻が大幅にずれることはありません。もちろん正確ではないのでそのままずっと放置し続けると少しずつ正しい時刻とはずれていきます。

Raspberry Pi はハードウェアクロックを搭載していないので、NTP サーバと同期しない (できない) 状態で再起動した場合、前回記録された日時まで巻き戻ってしまいます。

ハードウェアクロックがマシンに搭載されているかどうかは、`timedatectl` コマンドの `RTC time` (リアルタイムクロック) の項目を見るとわかります。

```shell:Shell
timedatectl
```

```
               Local time: Thu 2022-08-18 00:02:33 JST
           Universal time: Wed 2022-08-17 15:02:33 UTC
                 RTC time: n/a
                Time zone: Asia/Tokyo (JST, +0900)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

Raspberry Pi で実行すると、`RTC time` が `n/a` となっているのでハードウェアクロックが搭載されていない、もしくは有効になっていないことがわかります。

Raspberry Pi にハードウェアクロックを搭載することもできるようですが、ハードウェアの改造が必要なようなので今回は見送りました。興味のある方は以下の記事が参考になるかもしれません。

* [Set Up Real Time Clock (RTC) on Raspberry Pi](https://www.instructables.com/Set-up-Real-Time-Clock-RTC-on-Raspberry-Pi/)
* [Raspberry PiでRTCを使って時刻管理 (RPZ-PowerMGR)](https://www.indoorcorgielec.com/resources/raspberry-pi/rpz-powermgr-rtc/)



# さいごに
今まで Raspberry Pi を再起動しても問題が起こらなかったのに最近になって急に問題が発生したのは謎ですが、ひとまずこれで再起動しても日時が狂うことはなくなりました。
