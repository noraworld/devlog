---
title: "Mac で Linux のディスクの中身にアクセスする方法 (ただしリードオンリー)"
emoji: "🐧"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ext4", "ext4fuse", "osxfuse", "macfuse", "diskutil"]
published: false
order: 73
---

# はじめに
Raspberry Pi 4 に Ubuntu を入れて遊んでいたのですが、操作を誤って OS が起動不能に。再インストールする前に、ディスク内のデータのバックアップを取ろうと思い、SD カードを Mac に接続したのですが、マウントすることができませんでした。

```shell
$ diskutil list
# /dev/disk0 と /dev/disk1 は macOS のものなので省略

/dev/disk2 (external, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *63.9 GB    disk2
   1:             Windows_FAT_32 ⁨system-boot⁩             268.4 MB   disk2s1
   2:                      Linux ⁨⁩                        63.6 GB    disk2s2

# /dev/disk2s2 が Linux のディスクということがわかったが、マウントできず...
$ diskutil mount /dev/disk2s2
Volume on disk2s2 failed to mount
Perhaps the operation is not supported (kDAReturnUnsupported)
If you think the volume is supported but damaged, try the "readOnly" option
```

SD カードを接続した際に自動的に `/dev/disk2s1` がマウントされるのですが、これはシステムブートなので Linux の中身ではありません。

調べてみると、どうやら macOS では Linux のファイルシステムである **ext4** をサポートしていないようです。ext4 をマウントできるようにするためには `ex4fuse` と呼ばれるツールが必要のようなので、今回はそれのインストール方法と使い方を紹介します。

# 環境
- macOS Big Sur 11.1
- Ubuntu Desktop 20.10 (今回検証した SD カード内の Linux ディスクの OS)

# インストール
```shell
$ brew install --cask osxfuse
$ brew install ext4fuse
```

インストールに失敗する場合はアプリケーションを許可する必要があります。「システム環境設定」 > 「セキュリティとプライバシー」 > 「一般」 > 「ダウンロードしたアプリケーションの実行許可」の項目に許可されていない項目が出てきたら許可します。許可するためには事前に左下の南京錠をクリックする必要があります。

![スクリーンショット 2020-12-17 0.04.12.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/feb5adbe-89a7-c4c2-e059-bca5a988709c.png)

許可したあとは再起動を求められるので再起動します。

# 使い方
まずはマウント先のディレクトリを作っておきます。以下の例では `~/raspberrypi4` をマウント先としています。

```shell
$ mkdir ~/raspberrypi4
```

:warning: マウント先としてホームディレクトリやデスクトップなど、macOS にもともと存在するコアなディレクトリを指定するのは推奨されません。アンマウントするまでもともとのディレクトリにアクセスできなくなるためです。

次にマウント対象のディスクを見つけます。

```shell
$ diskutil list
# /dev/disk0 と /dev/disk1 は macOS のものなので省略

/dev/disk2 (external, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *63.9 GB    disk2
   1:             Windows_FAT_32 ⁨system-boot⁩             268.4 MB   disk2s1
   2:                      Linux ⁨⁩                        63.6 GB    disk2s2
```

いくつか表示されると思いますが、どれが Ubuntu (Linux) がインストールされている SD カード (あるいは USB メモリーなど) のものなのかはなんとなく勘でわかると思います。自分の環境では `/dev/disk2` が SD カードのディスクでした。

その中の、`TYPE` が `Linux` になっているものを見つけます。上記の場合だと一番下の `disk2s2` が該当します。なのでマウント対象のディスクは `/dev/disk2s2` であることがわかりました。

マウント対象のディスクがわかったら、以下のコマンドを実行します。なお、ここでも許可を求められることがありますので、その場合は「システム環境設定」 > 「セキュリティとプライバシー」 > 「一般」 > 「ダウンロードしたアプリケーションの実行許可」の項目から許可をします。

```shell
$ sudo ext4fuse /dev/disk2s2 ~/raspberrypi4 -o allow_other
```

`/dev/disk2s2` はマウント対象のディスク、`~/raspberrypi4` は先ほど作成した空のディレクトリを指定します。

これで `~/raspberrypi4` の中身が Linux の中身になっていると思います。

```shell
$ ls ~/raspberrypi4
bin  boot  dev  etc  home  lib  lost+found  media  mnt  opt  proc  root  run  sbin  snap  srv  swapfile  sys  tmp  usr  var
```

## アンマウント
`umount` コマンドでアンマウントできます。アンマウントすると `~/raspberrypi4` は空のディレクトリに戻ります。

```shell
$ sudo umount ~/raspberrypi4
```

# 欠点
この方法なら無料で Linux のディスクをマウントすることができますが、**リードオンリーである** という点に注意してください。つまりマウントしたディスクの中身のファイルを編集したりすることはできません。

編集などもしたい場合は [extFS for Mac by Paragon Software](https://www.paragon-software.com/jp/home/extfs-mac/) という GUI アプリがありますが、こちらは有料です。どうしても Mac で Linux のファイルの中身を編集したい場合はこちらを検討する必要がありますが、そこまでするなら別の Linux 環境でマウントしたほうが良さそうですね (当然、Linux なら Linux のディスクをマウントすることができるので)。

# おまけ: ディスク丸ごとコピーしたい場合
SD カード内のディスクを丸ごとコピーしたい場合は `dd` コマンドが使えます。

```shell
$ sudo dd if=/dev/rdisk2 of=~/raspberrypi4.img
```

`if=` には `diskutil list` の SD カードのディスクを指定します。`/dev/disk2` が SD カード (あるいは USB メモリーなど) だった場合、`/dev/disk2` の代わりに `/dev/rdisk2` を指定すると高速になるそうです。

`of=` には書き出し先のパスを指定します。上記の例では `~/raspberrypi4.img` に書き出すようにしています。

ただし、以下の 2 点に注意してください。

- ディスク丸ごとコピーするので Mac の容量が圧迫される
- めちゃくちゃ時間がかかる

64 GB の SD カードの中身を丸ごとコピーしたら、同然 Mac の容量を 64 GB 消費します。また、64 GB の SD カードの中身を丸ごとコピーするのにかかった時間 (上記の `dd` コマンドの実行時間) は **8 時間 27 分 54 秒** でした。

そのため、一部のファイルのみをバックアップしたり取り出したりしたい場合は、この記事で紹介したようにマウントして取り出したほうが無難です。

# 参考サイト
- [Macで「ext4」を読み書きする](https://news.mynavi.jp/article/osxhack-244/)
- [osxfuse not compatible with MacOS Big Sur](https://github.com/osxfuse/osxfuse/issues/705)
- [Macにext4のHDDをマウントする](https://qiita.com/sameyasu/items/bc937fc70f536ef84ee7)
