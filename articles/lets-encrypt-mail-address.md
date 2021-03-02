---
title: "Let's Encrypt (Certbot) に登録したメールアドレスを確認する方法と変更する方法"
emoji: "👋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["letsencrypt", "certbot"]
published: false
order: 55
---

# はじめに
数ヶ月前に新しいメールアドレスを取得し、そのメールアドレスをメインにしました。頻繁に利用するサービスでは一通りメールアドレスの変更を行ったのですが、Let's Encrypt で最初に登録したメールアドレスを変更するのを忘れていました。

今回は Let's Encrypt に登録したメールアドレスを確認する方法と変更する方法について紹介します。

## 証明書の発行と更新
証明書の発行と更新の方法について知りたい方は、「[Nginx+リバースプロキシ環境でWebサーバを停止させずに Let’s Encrypt (Certbot) のSSL証明書を自動更新する](https://qiita.com/noraworld/items/a2b4a5fabd7bf6ca25e0)」をご覧ください。

# TL;DR
```
# 確認
$ sudo cat /etc/letsencrypt/accounts/acme-v01.api.letsencrypt.org/directory/<hash>/regr.json

# 変更
$ sudo certbot register --update-registration --email <email>
```

`<hash>` は以下のコマンドで確認できる。

```
$ sudo ls /etc/letsencrypt/accounts/acme-v01.api.letsencrypt.org/directory
```

`<email>` は新しいメールアドレスを入力する。

# 確認方法
メールアドレスは、以下の JSON ファイルに記載されています。

```
/etc/letsencrypt/accounts/acme-v01.api.letsencrypt.org/directory/<hash>/regr.json
```

`<hash>` の部分にはランダムなハッシュ値が入ります。ここは人によって違う値なので、`ls` で確認します。

```
$ sudo ls /etc/letsencrypt/accounts/acme-v01.api.letsencrypt.org/directory
```

表示されたハッシュ値を先ほどのパスに当てはめて、JSON ファイルの中身を見ます。

```
$ sudo cat /etc/letsencrypt/accounts/acme-v01.api.letsencrypt.org/directory/<hash>/regr.json
```

`"body"` の中の `"contact"` に記載されているのが、現在登録されているメールアドレスです。

# 変更方法
変更するのはとても簡単です。以下のコマンドを実行するだけです。

```
$ sudo certbot register --update-registration --email <email>
```

`<email>` の箇所には新しいメールアドレスを入力します。

途中で確認のメッセージが表示されるので、同意するために `Y` を押したあと、エンターキーを押します。

正しくメールアドレスが変更されると以下のようなメッセージが表示されます。

```
IMPORTANT NOTES:
 - Your e-mail address was updated to <email>
```

また、メールアドレスを変更するとすぐにメールが届きます。これでメールアドレスが正しく変更されていることがわかります。お疲れさまでした。

# さいごに
実はメールアドレスの変更を忘れてしまったことによって、証明書の有効期限を切らせてしまいました。今まではメール通知が来ていたので気づけたのですが、通知を受け取れなくなった途端に更新を忘れてしまったので、みなさんも気をつけましょう。

# 参考サイト
- [how to change email address for certificates · Issue #3310 · certbot/certbot](https://github.com/certbot/certbot/issues/3310)
- [how do I change the admin email for let's encrypt?](https://serverfault.com/questions/751079/how-do-i-change-the-admin-email-for-lets-encrypt)
