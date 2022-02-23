---
title: "AquesTalk Pi (ゆっくりボイス、棒読みちゃん) が Raspberry Pi 4 でも動作するようになったぞ！！"
emoji: "🍓"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["AquesTalk", "RaspberryPi", "Ubuntu", "ARM64", "AArch64"]
published: true
order: 124
layout: article
---

# はじめに
以前にこのような記事を書いた。

[AquesTalk Pi を Ubuntu 20 で動作させるのは不可能らしい](https://zenn.dev/noraworld/articles/aquestalk-pi-ubuntu20-arm64)

上記の記事を執筆した時点 (2021 年 9 月 29 日) では、まだ 64-bit 版のバイナリが提供されていなかった。

しかし、2022 年 2 月 7 日に、ついに AquesTalk Pi が 64-bit 版をサポートするようになった。

これにより、現時点の最新版の Raspberry Pi (Raspberry Pi 4 Model B) でも、AquesTalk、いわゆる、ゆっくりボイス、棒読みちゃんを利用することができるようになった。

正直これだけでこの記事を終えても良いのだが、せっかくなので、このソフトウェアが何なのか、インストール方法、使用方法について改めて紹介する。





# AquesTalk とはなにか
[AquesTalk](https://www.a-quest.com/products/index.html) は日本語用の音声合成エンジンである。

説明するよりも、[オンラインデモページ](https://www.a-quest.com/demo/index.html) にあるサンプル音源を聴いたほうが早いだろう。

オンラインデモページにあるような音声で、自由に発声させることができるソフトウェアが AquesTalk である。

巷ではよく「ゆっくりボイス」とか「棒読みちゃん」などと呼ばれている。YouTube でも「ゆっくり実況」とか雑学解説系の動画でよく耳にする声だ。

その AquesTalk の Raspberry Pi 版が [AquesTalk Pi](https://www.a-quest.com/products/aquestalkpi.html) である。Raspberry Pi 版ではないバイナリとして [AquesTalk1](https://www.a-quest.com/products/aquestalk_1.html), [AquesTalk2](https://www.a-quest.com/products/aquestalk_2.html), [AquesTalk10](https://www.a-quest.com/products/aquestalk10.html) などがあるが、こちらは x86-64 用のバイナリなので、ARM64 (AArch64) である Raspberry Pi 4 では動作しない。

以前までは AquesTalk Pi は 32-bit バイナリのみ提供していたため、64-bit 版の OS で動作する Raspberry Pi 4 では利用することができなかったが、ついに 64-bit 版でも利用することができるようになったというわけだ。





# インストール方法
[zcat](https://command-not-found.com/zcat) がインストールされていない場合は、事前にインストールする。

[インストーラ](https://github.com/noraworld/aquestalk-installer) を使ってインストールすることができる。

```shell
wget -qO- https://raw.githubusercontent.com/noraworld/aquestalk-installer/master/bin/pi | sh
```

インストール後、カレントディレクトリに `aquestalkpi` というディレクトリがあるはずだ。





# 使い方
[aplay](https://command-not-found.com/aplay) がインストールされていない場合は、事前にインストールする。

そして `aquestalkpi` ディレクトリに移動しておく。

```shell
cd aquestalkpi
```

使い方は簡単だ。`AquesTalkPi` の実行結果を aplay (wave 音声を再生するコマンド) に渡すだけで良い。

```shell
./AquesTalkPi 漢字も読めます。 | aplay
```

```shell
echo ゆっくりしていってね？ | ./AquesTalkPi -b -f - | aplay
```

ファイルに wave ファイルとして出力して、あとからそれを再生することもできる。

```shell
./AquesTalkPi -s 150 -v f2 -k -o out.wav "ファイルニ、シュツ'リョクシマ_ス。"
aplay out.wav
```

より詳しい使い方はヘルプオプションをつけることで見ることができる。

```shell
./AquesTalkPi -h
```





# さいごに
よく使われる使われ方としてはやはり YouTube などの動画サイトの吹き込みなので、Windows での需要が一番多いのではないかと思う。

しかし、エンジニアからすると Raspberry Pi で利用できるようになることには無限の可能性を感じずにはいられない。

そんな AquesTalk を使おうと思った当初 (2021 年 9 月) は、Raspberry Pi 4 (64-bit) で利用できないことが本当に残念だったが、その分、密かに期待していたこともあり、64-bit 版の提供が開始されたことを知った今はとてもテンションが上がっている。

もしかしたら以前にアクエスト社の担当の方に問い合わせてみたのが提供開始のきっかけだったのかも？ とか一瞬思ったが、もし違っていたらただの思い上がり野郎で恥ずかしいのでその考えは捨てておこう。

ともあれ、AquesTalk Pi の 64-bit 版の提供を開始してくださったアクエスト社の方には本当に感謝しています。この場を借りてお礼を申し上げます。
