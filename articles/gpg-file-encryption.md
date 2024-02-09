---
title: "コマンドラインでファイルやフォルダを暗号化する方法 (GPG 編)"
emoji: "🔑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["gpg", "encryption", "cipher", "cryptography"]
published: true
---

OpenSSL 版は [こちら](https://zenn.dev/noraworld/articles/file-encryption)

# 忙しい人向け
```shell
# フォルダを圧縮
zip -r foo.zip foo

# 暗号化
gpg --encrypt --recipient you@example.com foo.zip          # バイナリデータ
gpg --encrypt --recipient you@example.com --armor foo.zip  # アスキーデータ

# 復号
gpg foo.zip.gpg
```

| | バイナリデータ | アスキーデータ |
| :---: | --- | --- |
| **利点** | ファイルサイズが元のファイルと変わらない | テキストエディタで開ける |
| **欠点** | テキストエディタでは開けない | ファイルサイズが膨らむ |
| **拡張子** | `.gpg` | `.asc` |



# はじめに
前回は `openssl` コマンドを使ってファイルを暗号化する方法について紹介しました。

[コマンドラインでファイルを暗号化する方法 (OpenSSL 編)](https://zenn.dev/noraworld/articles/file-encryption)

しかし `openssl` コマンドによる暗号化だとファイルサイズが大きいファイルを正しく暗号化できないというデメリットがあります。

そこで今回は `gpg` コマンドを使ってファイル・フォルダを暗号化する方法について解説します。



# 前提
* `gpg` コマンドはインストール済みであること
* GPG キー (秘密鍵) は生成済みであること



# フォルダを圧縮
フォルダを直接的に暗号化することはできませんので、まずはフォルダを圧縮して ZIP ファイルにまとめます。フォルダではなくファイルを暗号化する場合はこの手順はスキップしてください。

カレントディレクトリにある `foo` というフォルダを圧縮するには以下のコマンドを実行します。

```shell
zip -r foo.zip foo
```

フォルダを圧縮する際は `-r` を付け忘れないように注意しましょう。付け忘れると空 ZIP ファイルになります。



# 暗号化
ファイルを暗号化するには以下のコマンドを実行します。

```shell
gpg --encrypt --recipient you@example.com foo.zip
```

拡張子が `.gpg` のバイナリファイルが生成されるはずです。

バイナリデータではなくアスキーデータ (テキストエディタで開ける形式) として保存したい場合は以下のように `--armor` オプションを付与します。

```shell
gpg --encrypt --recipient you@example.com --armor foo.zip
```

拡張子が `.asc` のファイルが生成されます。このファイルはテキストエディタで開くことができます。ただしファイルサイズによっては開くと重くなりますのでご注意ください。

## バイナリデータとアスキーデータの違い
両者とも復号すれば全く同じファイルが復元できるため、基本的にはどちらでも良いと思います。主な違いは以下のとおりです。

| | バイナリデータ | アスキーデータ |
| :---: | --- | --- |
| **利点** | ファイルサイズが元のファイルと変わらない | テキストエディタで開ける |
| **欠点** | テキストエディタでは開けない | ファイルサイズが膨らむ[^size] |
| **拡張子** | `.gpg` | `.asc` |

[^size]: 筆者の環境で 1.37 GB の ZIP ファイルをこの方法で暗号化したところ 1.85 GB になりました。



# 復号
暗号化したファイルを復号するには以下のコマンドを実行します。

```shell
gpg foo.zip.gpg
```

元のファイル `foo.zip` が生成されるはずです。



# 参考
* [GPGコマンドで暗号化・復号](https://qiita.com/r_saiki/items/fb0bbbaa861e93f65ce9)
* [GnuPGでファイルを暗号化・復号する手順](https://laboradian.com/encrypt-with-gpg/)
