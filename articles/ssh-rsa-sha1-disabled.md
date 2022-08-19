---
title: "SSH で RSA/SHA1 が使えなくなったので対策する"
emoji: "🔑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ubuntu", "linux", "ssh", "rsa", "ed25519"]
published: true
order: 153
layout: article
---

# はじめに
SSH のアップデートにより、RSA/SHA1 暗号方式の鍵 (ssh-rsa) がデフォルトで無効になったようです[^1]。

[^1]: RSA/SHA-256/512 は引き続き利用可能です。

Ubuntu 22.04.1 LTS (Jammy Jellyfish) にアップグレードすると自動的に SSH もアップデートされるため、対応が必要な場合があります。

解決策としては

* RSA/SHA1 暗号ではない鍵 (デフォルトで使用可能な暗号方式の鍵) を作り直し、それと入れ替える (推奨)
* RSA/SHA1 暗号鍵が引き続き使用できるように許可する

のいずれかの対応が必要です。

この記事ではそれぞれの解決策での対応方法について説明します。

**OS をアップグレードしたら SSH できなくなった、という事態を避けるために、事前に対策を行っておくことをおすすめします**。



# 鍵が利用可能か確認
これからアップデートを検討される方は、そもそも現状の鍵がアップデート後もそのまま使えるかどうかを知りたいかと思います。

対象の鍵 (公開鍵) に対して、以下のコマンドを実行します。`~/.ssh/id_ed25519` の部分には対象の公開鍵のファイルパスを指定します。

```shell:Shell
ssh-keygen -l -f ~/.ssh/id_ed25519.pub
```

RSA の SHA256 や、ECDSA、ED25519 などになっていれば、引き続き利用可能です。そのため、対応の必要はありません。

RSA の SHA1 だった場合は対応の必要があります。



# RSA/SHA1 暗号ではない鍵 (デフォルトで使用可能な暗号方式の鍵) を作り直し、それと入れ替える (推奨)
RSA/SHA1 暗号方式を鍵を利用している場合、アップデート後にデフォルトでは使えなくなりますので、デフォルトで利用可能な新しい鍵に入れ替えます。

## macOS / Linux
せっかくなので今回は、RSA 暗号より強固とされている、楕円曲線暗号の一種である ed25519 鍵を生成してみようと思います。

まずは以下のコマンドを実行します。

```shell:Shell
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
```

`~/.ssh/id_ed25519` の部分は保存先のファイルパスです。必要に応じて変更してください。

以下のメッセージが表示されたら、パスフレーズを入力します。

```shell:Shell
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase):
```

パスフレーズは鍵を使用する際に入力するパスワードのようなものです。

何も入力せずにエンターキーを押すとパスフレーズを設定せずに鍵を生成することもできますが、**一般的にパスフレーズは設定することが推奨されている** ようです。

なお、パスフレーズは OS の鍵保管庫 (macOS であればキーチェーン) に登録しておけば SSH する際に毎回パスフレーズを入力する必要はありません。

以下のメッセージが表示されたら先ほどのパスフレーズをもう一度入力します。

```shell:Shell
Enter same passphrase again:
```

**ここで設定したパスフレーズは忘れないようにしてください**。

これで鍵が生成できました。`ssh-keygen` コマンド実行時にファイルパスを `~/.ssh/id_ed25519` とした場合は、公開鍵ファイルパスは `~/.ssh/id_ed25519.pub` となります。この公開鍵の中身をコピーして、サーバの `~/.ssh/authorized_keys` にペーストします。

これで SSH できるようになります。

## iOS Shortcuts
iOS Shortcuts には Run script over SSH というアクションがあり、たとえば Siri に話しかけて SSH 経由でサーバに任意のコマンドを実行させたりすることができます。

この際の SSH 鍵方式に、ed25519 と RSA があるのですが、RSA を選択すると RSA/SHA1 暗号鍵を許可しない限り弾かれてしまいます。

そこで、今まで RSA を使っていた場合は ed25519 に入れ替えます。

まず、適当なショートカットで Run script over SSH アクションを追加します。"Authentication" の部分は "SSH Key" にしておきます。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/ubuntu-22-upgrade/IMG_3507.PNG)

"SSH Key" の項目を選択すると鍵の情報が出てきます。ここに "Generate New Key" という項目があるのでこれをタップします。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/ubuntu-22-upgrade/IMG_3508.PNG)

鍵の種類で ed25519 と RSA が選択できるようになっているので、ed25519 を選択します。コメントは必要に応じて変更してください。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/ubuntu-22-upgrade/IMG_3509.PNG)

"Done" を押して鍵を (再) 生成します。

再生成する場合は警告が表示されます。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/ubuntu-22-upgrade/IMG_3510.PNG)

これは iOS Shortcuts 内で使われているすべての鍵が変更されることを意味しています。逆にいうと、適当なショートカットで一回変更すればすべてのショートカットに影響するので、一つずつ変更していく必要はありません。

鍵の (再) 生成ができたら、もう一度、鍵の情報を表示するページに遷移して、"Copy Public Key" をタップします。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/ubuntu-22-upgrade/IMG_3508.PNG)

クリップボードに公開鍵がコピーされるので、あとはこれをサーバの `~/.ssh/authorized_keys` にペーストします。

iOS のクリップボードからサーバの `~/.ssh/authorized_keys` にペーストする方法ですが、以下の方法を参考してみてください。

* Apple デバイス間のクリップボード共有機能を利用する
    * iPhone (iPad) と Mac で同じ Apple ID を利用している場合は、クリップボードが共有されます
* 一時的にクラウドのどこかに公開鍵をアップロードしておき、それを PC でコピーしてサーバにペーストする



# RSA/SHA1 暗号鍵が引き続き使用できるように許可する
別のアプローチとして、今まで通り RSA/SHA1 暗号鍵も使えるようにすることもできます。

ただし、あくまで推奨は上記で説明した RSA/SHA1 暗号方式ではない鍵に置き換える方法です。以下の方法は、どうしても RSA/SHA1 暗号鍵でなければいけない場合のみ検討してください。

`/etc/ssh/sshd_config` または `/etc/ssh/sshd_config.d/*.conf` に以下の 1 行を追加します。

```conf:/etc/ssh/sshd_config
PubkeyAcceptedAlgorithms=+ssh-rsa
```

SSH デーモンを再起動します。

```shell:Shell
sudo systemctl restart ssh
```

これで引き続き RSA/SHA1 が利用できるようになります。



# さいごに
アップグレードしていきなり SSH できなくなると焦るので、事前に情報をチェックしておくことが重要だなと感じました。



# 参考
* [OpenSSH、RSA/SHA1をデフォルトで無効化](https://news.mynavi.jp/techplus/article/20210831-1960865/)
* [Ubuntu 22.04 LTSのインスタンスにSSH接続/ログインできません。](https://help.arena.ne.jp/hc/ja/articles/5737789875223-Ubuntu-22-04-LTS%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%82%BF%E3%83%B3%E3%82%B9%E3%81%ABSSH%E6%8E%A5%E7%B6%9A-%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3%E3%81%A7%E3%81%8D%E3%81%BE%E3%81%9B%E3%82%93-)
* [お前らのSSH Keysの作り方は間違っている](https://qiita.com/suthio/items/2760e4cff0e185fe2db9)
