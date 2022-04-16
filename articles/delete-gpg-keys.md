---
title: "GPG キーを削除する方法"
emoji: "🗑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GnuPG", "GPG", "PGP"]
published: true
order: 142
layout: article
---

# はじめに
この記事では GPG キーを削除する方法について解説する。

GPG キーを削除する手順は 2 ステップある。

まずは秘密鍵を削除してから、次に公開鍵を削除する。先に公開鍵を削除しようとするとエラーになる。



# 秘密鍵の削除
以下のコマンドを実行して削除したい GPG キーを調べる。

```shell
gpg -k
```

```
/Users/username/.gnupg/pubring.kbx
----------------------------------
pub   ed25519 2022-04-03 [SC]
      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
uid           [ unknown] noraworld <mail@noraworld.com>
sub   cv25519 2022-04-03 [E]
```

`XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` となっている部分をクリップボードにコピーする。

以下のコマンドを実行して秘密鍵を削除する。

```shell
gpg --delete-secret-keys XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```
gpg (GnuPG) 2.3.4; Copyright (C) 2021 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


sec  ed25519/XXXXXXXXXXXXXXXX 2022-04-03 noraworld <mail@noraworld.com>

Delete this key from the keyring? (y/N)
```

`y` を押してエンターキーを押す。

```
This is a secret key! - really delete? (y/N)
```

再度確認されるので、もう一度 `y` を押してエンターキーを押す。

```
┌──────────────────────────────────────────────────────────────────┐
│ Do you really want to permanently delete the OpenPGP secret key: │
│ "noraworld <mail@noraworld.com>"                                 │
│ 255-bit EDDSA key, ID XXXXXXXXXXXXXXXX,                          │
│ created 2022-04-03.                                              │
│ ?                                                                │
│                                                                  │
│     <Delete key>                                    <No>         │
└──────────────────────────────────────────────────────────────────┘
```

`<Delete key>` にフォーカスされた状態でエンターキーを押す。`<No>` のほうにフォーカスが当たっている場合は左矢印キーを押してフォーカスを変更する。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Do you really want to permanently delete the OpenPGP secret subkey key: │
│ "noraworld <mail@noraworld.com>"                                        │
│ 255-bit ECDH key, ID XXXXXXXXXXXXXXXX,                                  │
│ created 2022-04-03 (main key ID XXXXXXXXXXXXXXXX).                      │
│ ?                                                                       │
│                                                                         │
│      <Delete key>                                         <No>          │
└─────────────────────────────────────────────────────────────────────────┘
```

次はサブキーを削除しても良いかと訊かれるので、先ほどと同様に `<Delete key>` にフォーカスされた状態でエンターキーを押す。

これで秘密鍵が削除できた。



# 公開鍵の削除
次に公開鍵を削除する。`XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` は先ほど調べたものと同じ。

```shell
gpg --delete-keys XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```
gpg (GnuPG) 2.3.4; Copyright (C) 2021 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


pub  ed25519/XXXXXXXXXXXXXXXX 2022-04-03 noraworld <mail@noraworld.com>

Delete this key from the keyring? (y/N)
```

`y` を押して削除する。



# 本当に削除されたか確認
以下のコマンドを実行する。

```shell
gpg -k
```

該当の GPG キーが表示されなければ (キーがもともと一つしかなかった場合は何も表示されなければ) 削除されたことが確認できる。

上記コマンドの代わりに以下のコマンドでも良い。

```shell
gpg --list-secret-keys --keyid-format=long
```



# 注意点
一度 GPG キーを削除すると、同じキーは二度と復元することができない。

削除する際は、本当に削除しても良いかを充分検討すること。
