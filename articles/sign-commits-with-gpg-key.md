---
title: "GitHub 上で表示されるコミットを署名付きにする方法"
emoji: "🦔"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHub", "GPG", "PGP", "Git"]
published: true
order: 140
layout: article
---

# 実現できること
この記事の手順を実践すると、GitHub 上のコミット欄に "Verified" マークをつけることができる。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/sign-commits-with-gpg-key/Screen%20Shot%202022-04-03%20at%2015.49.42.png)

単にマークをつけられるだけでなく、そのコミットが本人のものであるということを証明することができる。つまり、[コミットの偽装防止](https://qiita.com/s6n/items/bb869f740a53a3bf169e) ができる。



# 環境
* macOS Big Sur Version 11.6.4
* gpg (GnuPG) 2.3.4
* git version 2.35.1

環境やバージョンによって、以降で使用する `gpg` コマンドの仕様が異なる可能性がある点に留意すること。



# GPG キーの生成
以下のコマンドを実行する。

```shell:Shell
gpg --full-generate-key
```

ここから先は対話形式でいろいろ質問されるので答えていく。

```
gpg (GnuPG) 2.3.4; Copyright (C) 2021 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

## 鍵の種類の選択
生成する鍵の種類を訊かれる。

```
Please select what kind of key you want:
   (1) RSA and RSA
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
   (9) ECC (sign and encrypt) *default*
  (10) ECC (sign only)
  (14) Existing key from card
Your selection?
```

特にこだわりがなければ、何も選択せずにエンターキーを押すとデフォルトのものが選択される。

## 楕円曲線の選択
必要な楕円曲線を選択する。

これは前項で選択する鍵の種類によっては訊かれないかもしれない。

```
Please select which elliptic curve you want:
   (1) Curve 25519 *default*
   (4) NIST P-384
   (6) Brainpool P-256
Your selection?
```

特にこだわりがなければ、何も選択せずにエンターキーを押すとデフォルトのものが選択される。

## 鍵の有効期限の設定
鍵の有効期限を設定する。

```
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
```

`0` と入力するか何も入力せずにエンターキーを押すと、無期限になり、以下のメッセージが表示される。

```
Key does not expire at all
```

有効期限を設定した場合は、その期限が来たら鍵を更新する必要がある。

## 設定の確認
これまでの設定が正しいかどうかを訊かれる。

```
Is this correct? (y/N)
```

間違っていない場合は `y` と入力したあとにエンターキーを押す。

## 氏名とメールアドレスの設定
続いて、氏名とメールアドレスを設定する。

```
GnuPG needs to construct a user ID to identify your key.
```



```
Real name:
Email address:
Comment:
```

| 項目 | 説明 | 備考 |
| --- | --- | --- |
| Real name | 氏名 | 本来は本名を入力するのだろうが、最悪、本名じゃなくても大丈夫 |
| Email address | メールアドレス | **GitHub に登録されているメールアドレスにする必要がある** |
| Comment | コメント | 空でも良い |

ここで重要なポイントは、**メールアドレスは GitHub に登録されているものを設定する必要がある** ということ。

もし自分のメールアドレスを公開したくない場合は、代わりに [`<RANDOM_NUMBER>+<GITHUB_USERNAME>@users.noreply.github.com`](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-user-account/managing-email-preferences/setting-your-commit-email-address#setting-your-commit-email-address-on-github) を設定すれば良い[^1]。

[^1]: ここで指定するメールアドレスは、自分で勝手に決めるものではなく、GitHub から発行されたものを指す。詳細は [Setting your commit email address on GitHub](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-user-account/managing-email-preferences/setting-your-commit-email-address#setting-your-commit-email-address-on-github) を参照すること。

設定が完了すると以下のようなメッセージが表示される。

```
You selected this USER-ID:
    "noraworld <mail@noraworld.com>"
```

## 最終確認
ここまでの設定で問題ないか、再度確認される。

```
Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit?
```

問題なければ、`O` を入力してエンターキーを押す。

## パスフレーズの設定
最終確認後、以下のような TUI が表示される。

```
┌──────────────────────────────────────────────────────┐
│ Please enter the passphrase to                       │
│ protect your new key                                 │
│                                                      │
│ Passphrase: ________________________________________ │
│                                                      │
│       <OK>                              <Cancel>     │
└──────────────────────────────────────────────────────┘
```

鍵に設定するパスフレーズを求められる。このパスフレーズは鍵を使用する際に入力する。

パスフレーズを入力してエンターキーを押すと、再入力を求められる。

```
┌──────────────────────────────────────────────────────┐
│ Please re-enter this passphrase                      │
│                                                      │
│ Passphrase: ________________________________________ │
│                                                      │
│       <OK>                              <Cancel>     │
└──────────────────────────────────────────────────────┘
```

もう一度同じパスフレーズを入力してエンターキーを押す。

すると、以下のようなメッセージが表示される。

```
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.
gpg: revocation certificate stored as '/Users/noraworld/.gnupg/openpgp-revocs.d/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.rev'
public and secret key created and signed.

pub   ed25519 2022-04-03 [SC]
      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
uid                      noraworld <mail@noraworld.com>
sub   cv25519 2022-04-03 [E]
```

これで鍵の生成は完了。

### コラム: パスフレーズを設定しない場合
パスフレーズを入力せずにエンターキーを押すと以下の警告が表示される。

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ You have not entered a passphrase - this is in general a bad idea!                            │
│ Please confirm that you do not want to have any protection on your key.                       │
│                                                                                               │
│ <Yes, protection is not needed>                                    <Enter new passphrase>     │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

`Yes, protection is not needed` を選択してパスフレーズを設定せずに鍵を生成することもできるが、警告メッセージにもあるとおり非推奨である。

`Enter new passphrase` を選択すると先ほどのパスフレーズ入力画面に戻る。

毎回パスフレーズを入力するのが面倒だから設定しないという人もいるかもしれないが、ここで設定したパスフレーズを OS の機構で安全に保存しておくこともできる (macOS ならキーチェイン) ので、入力が面倒以外の理由がないならパスフレーズを設定しておくことをおすすめする。

### コラム: 脆弱なパスフレーズを設定した場合
設定したパスフレーズが脆弱な場合 (`password` など) は以下のような警告が表示される。

```
┌────────────────────────────────────────────────────────────────────┐
│ Warning: You have entered an insecure passphrase.                  │
│                                                                    │
│ A passphrase should contain at least 1 digit or                    │
│ special character.                                                 │
│                                                                    │
│ <Take this one anyway>                      <Enter new passphrase> │
└────────────────────────────────────────────────────────────────────┘
```

`Take this one anyway` を選択すると脆弱なパスフレーズを使用することができるが、警告メッセージにもあるとおり非推奨である。

`Enter new passphrase` を選択してより安全なパスフレーズを設定することをおすすめする。





# 公開鍵の取得
生成した鍵ペアのうち、公開鍵を取得する。

以下のコマンドを実行する。

```shell:Shell
gpg --list-secret-keys --keyid-format=long
```

以下のような情報が表示される。

```
gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
/Users/noraworld/.gnupg/pubring.kbx
--------------------------------
sec   ed25519/482CAD94D37AF0D1 2022-04-03 [SC]
      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
uid                 [ultimate] noraworld <mail@noraworld.com>
ssb   cv25519/XXXXXXXXXXXXXXXX 2022-04-03 [E]
```

GPG キー ID (上記の例でいう `482CAD94D37AF0D1` の部分) をクリップボードにコピーする。

コピーした GPG キー ID を指定して、以下のコマンドを実行する。

```shell:Shell
gpg --armor --export 482CAD94D37AF0D1
```

以下のような公開鍵が表示される[^2]。

[^2]: ちなみにここにサンプルとして表示されているのはテスト用に生成した公開鍵で、実際に筆者が使用しているものとは異なる。

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEYklT4BYJKwYBBAHaRw8BAQdAJsA2XRtL5Kuw3elY0Irk/HafE1ksFrAlbRxO
LRMmgva0GXRlc3QxIDx0ZXN0MUBleGFtcGxlLmNvbT6IlAQTFgoAPBYhBLbbTYYh
GmRRNfOfS78JBNOfzIMIBQJiSVPgAhsDBQsJCAcCAyICAQYVCgkICwIEFgIDAQIe
BwIXgAAKCRC/CQTTn8yDCMu1AQDfzO7GKQp1+Hqi/U/RqV81Q9vg7bts5WMfblev
zmqR0AEAz4zMtEq7fwZJ9utiH3woqSq7QJu0yv5Ot+hNkUaO7QS4OARiSVPgEgor
BgEEAZdVAQUBAQdA2iWxJcYpgdWerfJj0OVk7j3a4CRBdaa66NAoa82Tig0DAQgH
iHgEGBYKACAWIQS2202GIRpkUTXzn0u/CQTTn8yDCAUCYklT4AIbDAAKCRC/CQTT
n8yDCN+wAP0V1qprWRLvrUn5sQRMRAaAV070j/Hj6pTSrmpDi4qB9QEA8zXXrHpE
48CCL5nqdZMa5tZpVJUM/7k57LAO/XcyMQM=
=b5JQ
-----END PGP PUBLIC KEY BLOCK-----
```

上記の公開鍵を `-----BEGIN PGP PUBLIC KEY BLOCK-----` と `-----END PGP PUBLIC KEY BLOCK-----` も含めてクリップボードにコピーする。




# GitHub アカウントに公開鍵を登録
[Add new GPG keys](https://github.com/settings/gpg/new) にアクセスし、先ほどクリップボードにコピーした公開鍵を指定のフィールドにペーストする。



# GPG キーを Git コマンドに設定
以下のコマンドを実行する。

```shell:Shell
git config --global user.signingkey 482CAD94D37AF0D1
```

`482CAD94D37AF0D1` の部分は、先ほど `gpg --list-secret-keys --keyid-format=long` コマンドを実行したときに表示された GPG キー ID を指定する。




# 署名付きでコミットする方法
以下の 3 通りの方法がある。自分の用途にあわせていずれかを選択、または使い分けると良いだろう。

* コミット単位で署名付きにする方法
* 特定のリポジトリ内のすべてのコミットを署名付きにする方法
* すべてのリポジトリのすべてのコミットを署名付きにする方法

## コミット単位で署名付きにする方法
`git commit` 時に `-S` オプションをつけると、署名付きのコミットにすることができる。

```shell:Shell
git commit -S -m "Signed commit"
```

## 特定のリポジトリ内のすべてのコミットを署名付きにする方法
まず、署名付きのコミットにしたいリポジトリのディレクトリに移動する。

```shell:Shell
cd /path/to/repo
```

そのディレクトリ内で以下のコマンドを実行する。

```shell:Shell
git config commit.gpgsign true
```

## すべてのリポジトリのすべてのコミットを署名付きにする方法
以下のコマンドを実行する。

```shell:Shell
git config --global commit.gpgsign true
```

## コラム: GPG キー ID は公開しても大丈夫
GPG キー ID (この記事内で `482CAD94D37AF0D1` として説明されているもの) は秘匿情報ではないので公開しても大丈夫。

https://stackoverflow.com/questions/48065535/should-i-keep-gitconfigs-signingkey-private

`~/.gitconfig` を `dotfiles` などで管理している人は、`git config --global commit.gpgsign true` を実行した際に GPG キー ID が含まれることになるが、誰かと共有している設定でない限りは `dotfiles` で管理しても問題ない。



# 署名付きでコミットされているか確認
署名付きのコミットをプッシュする。

GitHub のリポジトリにアクセスし、コミット一覧を確認した際に、先ほど署名したコミットに "Verified" マークがついていれば正しく署名できている。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/sign-commits-with-gpg-key/Screen%20Shot%202022-04-03%20at%2015.49.42.png)



# 参考
* [Generating a new GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
* [Adding a new GPG key to your GitHub account](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-new-gpg-key-to-your-github-account)
* [Telling Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
* [Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
