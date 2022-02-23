---
title: "AquesTalk Pi を Ubuntu 20 で動作させるのは不可能らしい"
emoji: "🍓"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["RaspberryPi", "Ubuntu", "arm64", "AArch64", "AquesTalk"]
published: true
order: 110
layout: article
---

# 重要
**この記事の内容は古く、現在は AquesTalk Pi を Ubuntu 20 で動作させるのは『可能』である。そのため、この記事を読む必要はない。インストール方法や使い方については新しく記事を執筆したためそちらを参照すること。**

[AquesTalk Pi (ゆっくりボイス、棒読みちゃん) が Raspberry Pi 4 でも動作するようになったぞ！！](https://zenn.dev/noraworld/articles/aquestalk-pi-version-1-20-ubuntu20-arm64)

# タイトルの曖昧さ回避
タイトルは、簡潔にするために多少端折っているが、正確にはこうだ。

**CPU アーキテクチャが 64-bit の Raspberry Pi に、64-bit 版の Ubuntu 20 以上のバージョンをインストールして、AquesTalk を動作させることは、現状、実質不可能である。**

## CPU アーキテクチャが 64-bit
現状では [Raspberry Pi 4 Model B](https://www.raspberrypi.org/products/raspberry-pi-4-model-b/) のことを指す。いわゆる arm64 のことだ。

```shell:Shell
dpkg --print-architecture
```

```
arm64
```

## AquesTalk
タイトルでは [AquesTalk Pi](https://www.a-quest.com/products/aquestalkpi.html) と記載しているが、これには [AquesTalk2](https://www.a-quest.com/products/aquestalk_2.html) や [AquesTalk10](https://www.a-quest.com/products/aquestalk10.html) など、Raspberry Pi 用ではないバージョンのものも含まれる。

## 実質
筆者が方法を知らないだけで、本当はできるのかもしれない。しかし、現実的な方法で動作させる環境を用意する方法は残念ながら見つからなかった。詳しくは後述する。

## 現状
2021 年 9 月 29 日 (水) 現在。



# 環境
試した環境をまとめると、以下の通りとなる。

| 項目 | 内容 |
| --- | --- |
| モデル | Raspberry Pi 4 Model B |
| CPU アーキテクチャ | arm64 |
| OS | Ubuntu 20.04.3 (64-bit) |




# AquesTalk とは
そもそも AquesTalk とは何か。

[AquesTalk](https://www.a-quest.com/products/index.html) とは日本語用の音声合成エンジンである。

これだけ聞いても何のことかわからないかもしれないが、「棒読みちゃん」や「ゆっくりボイス」と言えば聞き馴染みがあるかもしれない。

公式サイトの [オンラインデモのページ](https://www.a-quest.com/demo/index.html) にアクセスするとサンプル音声を聴くことができる。この音声を聞いたことがある人は少なくないのではないだろうか。

実は、この俗に言う「ゆっくりボイス」のもとになっているのが AquesTalk である。

「棒読みちゃん」をはじめとする、ゆっくりボイスを流すツールには AquesTalk が組み込まれている。

個人利用かつ非営利目的の場合は一定の条件のもとで無償で利用することができる。




# 理由
なぜ上記に示した環境で動作させることが不可能なのか、その理由について以降で説明する。

本当に不可能なのかどうかは、正直わからない。筆者の調査不足かもしれない。そのため、もし知っている方がいればご教授願いたい。

## AquesTalk
AquesTalk にはいくつかの種類がある。

* [AquesTalk1](https://www.a-quest.com/products/aquestalk_1.html)
* [AquesTalk2](https://www.a-quest.com/products/aquestalk_2.html)
* [AquesTalk10](https://www.a-quest.com/products/aquestalk10.html)
* [AquesTalk Pi](https://www.a-quest.com/products/aquestalkpi.html)

このうち、AquesTalk1、AquesTalk2、AquesTalk10 は Windows や macOS、Linux などクロスプラットフォームに対応したものとなっており、AquesTalk Pi は Raspberry Pi 用にビルドされたものとなっている。

### AquesTalk Pi
Raspberry Pi で動作させたいのだから、まずは AquesTalk Pi をダウンロードして試してみる。

使用方法は簡単だ。公式サイトからバイナリをダウンロードしてきて実行するだけだ。

```shell:Shell
wget https://www.a-quest.com/archive/package/aquestalkpi-20201010.tgz
zcat aquestalkpi-20201010.tgz | tar xv
cd aquestalkpi
./AquesTalkPi -h
```

`wget` で指定している URL は、現時点のリビジョンのダウンロード URL なので、今後変更になる可能性がある。上記 URL でダウンロードできなかった場合は、[ダウンロードページ](https://www.a-quest.com/products/aquestalkpi.html) のダウンロードボタンから URL を調べて置き換えること。

本来であれば、最後の `./AquesTalkPi -h` を実行した際に、AquesTalk Pi のヘルプメッセージが表示されるはずだ。しかし、筆者の環境では以下のように表示される。

```
zsh: no such file or directory: ./AquesTalkPi
```

指定しているパスやファイル名は間違っていない (補完も正しく効いている) のに、なぜか上記のエラーが出る。

これは非常にわかりにくいが、実はファイルが見つからないということではないらしい。64-bit 版の OS で 32-bit 版のバイナリを実行すると、上記のエラーになるらしい。

参考: [Linuxでファイルを実行したら「No such file or directory」と言われた時には？](https://qiita.com/charon/items/2c83be19ef93b48f7a53)

ファイルの形式を見てみると、たしかに 32-bit 版のバイナリであることがわかる。

```shell:Shell
file AquesTalkPi
```

```
AquesTalkPi: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-armhf.so.3, for GNU/Linux 3.2.0, BuildID[sha1]=0124bfc7a6c4ada0c0229c1ce5956dc52e3335dd, stripped
```

そして、先述した通り、Raspberry Pi 4 Model B は arm64 で、64-bit 版の Ubuntu をインストールしている。

```shell:Shell
dpkg --print-architecture
```

```
arm64
```

つまり、64-bit 版の OS で、32-bit 版のバイナリを実行していたのでエラーになっていた、というわけだ。

余談だが、`no such file or directory` というエラーはさすがにひどいと思う。完全に初心者泣かせだ。

ともあれ、これで AquesTalk Pi がこのままでは実行できないということがわかった。

#### 64-bit 版で 32-bit 版バイナリを実行したい
次に、64-bit 版の OS で 32-bit 版バイナリを実行する方法について調査した。

すると、いくつかの参考になる記事が出てきた。

* [64bit-Linuxで32bitバイナリ実行環境を構築](https://sonickun.hatenablog.com/entry/2014/06/09/233801)
* [How to run 32-bit app in Ubuntu 64-bit?](https://askubuntu.com/questions/454253/how-to-run-32-bit-app-in-ubuntu-64-bit)

他にも記事は見つかったが、基本的にはどれも同じ解決方法について述べられていた。

しかし、どの方法を試してみても、パッケージ参照元 URL が Not Found だったり、パッケージが見つからないというエラーになってしまう。

どうやら、これらの記事は昔の Ubuntu (Debian ベースの OS) ではできたらしいのだが、今は 32-bit 版を実行するためのパッケージが提供を終了しているようだ。

参考: [Ubuntu 20.04 その6 - Ubuntu 20.04 LTSで引き続き提供する32bit版パッケージ・約1,700のソースパッケージが対象に](https://kledgeb.blogspot.com/2019/12/ubuntu-2004-6-ubuntu-2004-lts32bit1700.html)

昔はまだ 32-bit コンピュータがそこそこ主流だったため、32-bit と 64-bit どちらでも動かせるようにパッケージが提供されていたのだが、今は 64-bit コンピュータがかなり普及してきたので、今後は 32-bit のサポートの提供を終了していく方針なのだろう。

というわけで、Raspberry Pi 4 Model B に 64-bit 版の Ubuntu 20 以降の OS をインストールした場合は、残念ながら AquesTalk Pi は実行できないという結論に至った。

仮に現時点で実行できる方法があったとしても、それも近い将来でまた使えなくなってしまう可能性が高い。

### AquesTalk10
それならば、ということで、AquesTalk Pi ではなく AquesTalk10 を試してみることにした。

AquesTalk10 は Linux 版も提供されているため、Ubuntu をインストールした Raspberry Pi でも動作するのではないかと考えたのだ。

こちらも使い方はそこまで難しくなかった。公式サイトからバイナリをダウンロードしたあと、[マニュアル](https://www.a-quest.com/archive/manual/aqtk10_lnx_man.pdf) の手順に従い、ライブラリを配置してコンパイルするだけだ。

```shell:Shell
sudo apt -y install unzip build-essential
wget https://www.a-quest.com/archive/package/aqtk10_lnx_110.zip
unzip aqtk10_lnx_110.zip
cd aqtk10_lnx
sudo cp lib64/libAquesTalk10.so.1.1 /usr/lib
sudo ln -sf /usr/lib/libAquesTalk10.so.1.1 /usr/lib/libAquesTalk10.so.1
sudo ln -sf /usr/lib/libAquesTalk10.so.1 /usr/lib/libAquesTalk10.so
sudo /sbin/ldconfig -n /usr/lib
g++ -o HelloTalk samples/HelloTalk.c -lAquesTalk10 -Ilib64
```

しかし、コンパイルしようとすると以下のエラーが出力される。

```
/usr/bin/ld: skipping incompatible /usr/lib/gcc/aarch64-linux-gnu/9/../../../../lib/libAquesTalk10.so when searching for -lAquesTalk10
/usr/bin/ld: skipping incompatible /lib/../lib/libAquesTalk10.so when searching for -lAquesTalk10
/usr/bin/ld: skipping incompatible /usr/lib/../lib/libAquesTalk10.so when searching for -lAquesTalk10
/usr/bin/ld: skipping incompatible /usr/lib/gcc/aarch64-linux-gnu/9/../../../libAquesTalk10.so when searching for -lAquesTalk10
/usr/bin/ld: skipping incompatible /lib/libAquesTalk10.so when searching for -lAquesTalk10
/usr/bin/ld: skipping incompatible /usr/lib/libAquesTalk10.so when searching for -lAquesTalk10
/usr/bin/ld: cannot find -lAquesTalk10
collect2: error: ld returned 1 exit status
```

エラー文の 6 行目で、先ほどシンボリックリンクを貼った `/usr/lib/libAquesTalk10.so` を参照しているので、ファイルはたしかに参照しているのだが、`AquesTalk10` というヘッダファイルが見つからないと言われてしまう。

エラー内容が `skipping incompatible` となっているので、オブジェクトファイルの中身を覗いてみる。

```shell:Shell
objdump -a /usr/lib/libAquesTalk10.so
```

```
/usr/lib/libAquesTalk10.so:     file format elf64-little
/usr/lib/libAquesTalk10.so
```

比較するために、Ubuntu インストール時から存在している他のオブジェクトファイルを適当にピックアップしてそれの中身を覗いてみる。

```shell:Shell
objdump -a /usr/lib/libdmmp.so.0.2.0
```

```
/usr/lib/libdmmp.so.0.2.0:     file format elf64-littleaarch64
/usr/lib/libdmmp.so.0.2.0
```

ファイルフォーマットが違うので、何やら怪しい雰囲気が漂っているのだが、このレイヤーの技術に関して筆者はあまり詳しくないので、もう少し深堀りしてみる。

`readelf` コマンドを使用すると、より詳しいバイナリの情報が出てくるらしい。

参考: [アーキテクチャ不明のELFバイナリ調査 ではreadelfを使う](https://qiita.com/thetsuthetsu/items/02d50347cf5eb4cb7ffa)

```shell:Shell
readelf -h /usr/lib/libAquesTalk10.so
```

```
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              DYN (Shared object file)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x4fa0
  Start of program headers:          64 (bytes into file)
  Start of section headers:          381088 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         6
  Size of section headers:           64 (bytes)
  Number of section headers:         30
  Section header string table index: 27
```

```shell:Shell
readelf -h /usr/lib/libdmmp.so.0.2.0
```

```
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              DYN (Shared object file)
  Machine:                           AArch64
  Version:                           0x1
  Entry point address:               0x18a0
  Start of program headers:          64 (bytes into file)
  Start of section headers:          33064 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         7
  Size of section headers:           64 (bytes)
  Number of section headers:         25
  Section header string table index: 24
```

見比べなくてもわかってしまったが、既存のオブジェクトファイル (今回の例だと `/usr/lib/libdmmp.so.0.2.0`) は `Machine` の箇所が `AArch64` になっているのに対し、`/usr/lib/libAquesTalk10.so` は `Advanced Micro Devices X86-64` になっている。

| オブジェクトファイル | マシン (アーキテクチャ) |
| --- | --- |
| `/usr/lib/libdmmp.so.0.2.0` | `AArch64` |
| `/usr/lib/libAquesTalk10.so` | `Advanced Micro Devices X86-64` |

つまり、AquesTalk10 は x86_64 アーキテクチャでのみ動作するようだ。Raspberry Pi は ARM の CPU を採用しており、同じ 64-bit でもアーキテクチャが異なるため、コンパイルすることができない。

というわけで、AquesTalk10 も Raspberry Pi 4 Model B では実行できないということがわかった。というより、どのモデルの Raspberry Pi でも AquesTalk10 は利用できないということになる。

ちなみにこれは AquesTalk1 や AquesTalk2 も同様のようで、試しに AquesTalk2 もコンパイルしようとしてみたが、同じエラーでコンパイルすることができなかった。




# 結論
ということで、まとめると以下のようになる。

* AquesTalk Pi は 32-bit 版でのみ動作する
* Ubuntu 20 以降では、基本的に 64-bit 版で 32-bit 版のバイナリを実行することはできない
* AquesTalk1, AquesTalk2, AquesTalk10 は x86_64 アーキテクチャのコンピュータでのみ動作する
* **結果として、arm64 アーキテクチャの Raspberry Pi 4 Model B に 64-bit 版の Ubuntu 20.04.3 をインストールして AquesTalk を利用することは現状できない**

もちろんこれはあくまで現時点での話なので、今後、アクエスト社が 64-bit 版に対応した AquesTalk Pi を提供してくれれば、あるいは AquesTalk10 等が ARM アーキテクチャをサポートしてくれれば利用できるようになる。

しかし現状ではこれらは提供されていないため、筆者の環境のように 64-bit 版 Ubuntu 20.04.3 をインストールした Raspberry Pi 4 Model B では残念ながら動作させることができないようだ。

かといって、AquesTalk を動作させるためだけに、現状 64-bit 版で動作させている Raspberry Pi に、敢えて 32-bit 版の OS をインストールして運用したいとは思わない。筆者の自宅の Raspberry Pi は、DNS サーバ & DHCP サーバ & Bluetooth オーディオサーバという重要な役割を担っているのだ。

というわけで、AquesTalk を使うのは諦めることにした。

繰り返しになるが、筆者の調査不足なだけで、現実的に動作させる方法があるのかもしれない。もしその方法をご存知の方がいたらご教授いただけるとありがたい。




# 謝辞
今回の件に関しては、アクエスト社に問い合わせを行い、AquesTalk Pi が 32-bit 版のみの提供であること、AquesTalk10 等が x86_64 のみをサポートしていることなどを丁寧にご教授いただきました。対応していただいた株式会社アクエストの担当の方に、この場を借りてお礼を申し上げます。
