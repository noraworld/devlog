---
title: "GPG キーを他のデバイスと共有する方法"
emoji: "🙌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GPG", "PGP"]
published: true
order: 141
layout: article
---

# この記事を読むと実現できること
既存の GPG キーを新しいデバイスにコピー・移動させることができる。

# GPG キー ID の取得
GPG キーが存在するデバイスで、以下のコマンドを実行する。

```shell
gpg -k
```

上記コマンドを実行すると以下のように表示されるはずだ。

```
pub   ed25519 2022-04-03 [SC]
      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
uid           [ultimate] noraworld <mail@noraworld.com>
sub   cv25519 2022-04-03 [E]
```

`XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` となっている部分をコピーする。

# 秘密鍵のエクスポート
先ほど取得した GPG キー ID をもとに、秘密鍵をファイルにエクスポートする。

GPG キーが存在するデバイスで、以下のコマンドを実行する。

```shell
gpg --export-secret-key -a XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX > private_key
```

カレントディレクトリに秘密鍵が生成される。

`private_key` は秘密鍵なので、**誰かが画面を見ているときやシェルのログを記録している場合などは不用意にファイルの中身を開かないほうが良い** だろう。

# 秘密鍵のコピー
先ほど生成した `private_key` を、新しいデバイスにコピーする。USB メモリなどに `private_key` をコピーし、それを新しいデバイスにコピーする。

`private_key` をコピーする際は、**ネットワークを介さないほうが理想だが、ネットワーク経由でないとコピーできない場合は必ず `scp` などの暗号化された通信で行う** こと。

# 秘密鍵のインポート
`private_key` をインポートする。

新しいデバイスで、以下のコマンドを実行する。

```shell
gpg --import private_key
```

これで GPG キーが新しいデバイスで使えるようになった。

# 確認
新しいデバイスで、以下のコマンドを実行する。

```shell
gpg -k
```

同じ GPG キー ID が表示されたら正しくインポートされたことがわかる。

# 秘密鍵の安全な削除
**この作業は絶対に怠ってはいけない**。

エクスポート・インポートのために生成した `private_key` を完全削除する。

ここで注意すべきは、**`rm` コマンドを使って削除してはいけない** ということだ。ましてやゴミ箱に移動させるだけなどもってのほかだ。

代わりに `shred` コマンドを使う。

`shred` コマンドの詳細については、「[ハードディスク内のデータを本当の意味で完全消去する方法](https://zenn.dev/noraworld/articles/delete-data-in-hdd-completely)」を参考にしてみてほしい。

以下のコマンドを、GPG キーがもともと存在するデバイスと新しいデバイスの両方で実行する。USB メモリなどにコピーした場合は、その USB メモリ内でも同様に実行する。

```shell
shred -uvz private_key
```

これでほぼ復元不可能な状態で `private_key` を削除することができた。

# 注意点おさらい
* 不用意に秘密鍵のファイルの中身を開かない
* 秘密鍵は安全にコピーする
* インポートし終わったら秘密鍵は完全に削除する

# 参考サイト
* [How can I use my gpg key with other devices?](https://dotmethod.me/posts/pass-password-manager-share-gpg-key/)
