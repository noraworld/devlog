---
title: "Vagrantで作成したローカルサーバにFTPクライアント(Cyberduck)からログインできないときの解決法"
emoji: "🎃"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Vagrant", "Cyberduck", "SSH", "ssh公開鍵認証"]
published: false
order: 20
---

# はじめに
`$ vagrant ssh` したときはログインできるのに、FTPクライアント(Cyberduckなど)からはログインできないときの解決法です。

#
Vagrant用に作成されたボックスからサーバを構築すると、通常はユーザ名が`vagrant`、パスワードも`vagrant`のユーザが作成されます(ボックスによってはそうでない場合もあります。詳しくは後述します)。

ところが、FTPクライアントで、ユーザ名`vagrant`、パスワード`vagrant`でログインしようとしても失敗することがあります。でも `$ vagrant ssh` ではログインできます。

こういうときは鍵認証でログインすることができます。

# 公開鍵認証を使用する
サーバが起動している状態で`Vagrantfile`があるディレクトリに移動して `$ vagrant ssh-config` を実行すると以下のように表示されます。

```
Host default
  HostName 127.0.0.1
  User vagrant
  Port 2200
  UserKnownHostsFile /dev/null
  StrictHostKeyChecking no
  PasswordAuthentication no
  IdentityFile /Users/username/path/to/servername/.vagrant/machines/default/virtualbox/private_key
  IdentitiesOnly yes
  LogLevel FATAL
```

FTPクライアントの設定でパスワード認証を公開鍵認証に変更します。するとファイルを選択するダイアログが表示されますので、上記コマンドで表示された`IdentityFile`のパスを指定します。

ただしこのパスは隠しフォルダ内にあるので、OSの設定によっては隠しフォルダを表示するように設定する必要があります。Macではファイル選択画面で`command+shift+g`を押すとファイルのパスを入力できるようになるので、そこに`IdentityFile`のパスをコピペして選択ボタンを押せばOKです。

ちなみにVagrant用に調整されていないボックスでは、ユーザ名が`vagrant`ではない(パスワードも`vagrant`ではない)場合があります(たとえばUbuntuではユーザ名が`ubuntu`だったりします)。FTPクライアントで設定するユーザ名は必ず`vagrant`とは限らないことに注意してください。`$ vagrant ssh-config` で表示された`User`の項目に表示されたユーザ名を指定してください。

正しくユーザ名、秘密鍵のパスを指定すればログインできるようになります。

# さいごに
（`PasswordAuthentication no` となっていても）ボックスによってパスワードでログインできるものとそうでないものがあります。この違いが何なのかはわかりませんが、パスワードでログインできないときは公開鍵認証でのログインを試してみてください。
