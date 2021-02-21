---
title: "Nginx+リバースプロキシ環境でWebサーバを停止させずに Let's Encrypt (Certbot) のSSL証明書を自動更新する"
emoji: "🌊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["letsencrypt", "certbot", "webroot", "nginx", "リバースプロキシ"]
published: false
order: 24
---

# はじめに
Let's Encrypt の証明書を入手・更新するための`certbot`コマンドには以下のモードがあります。

* webroot
* standalone
* apache
* nginx
* manual

[Getting certificates (and chosing plugins)](https://certbot.eff.org/docs/using.html#getting-certificates-and-chosing-plugins)

証明書を入手・更新するときにはいずれかのモードを指定します。

`webroot`はそのドメインで稼働しているサイトのwebroot(サーバのパス)を指定します。例えば `example.com` が `/var/www/html` 以下のHTMLファイルを配信しているとしたら`webroot`は `/var/www/html` になります。

`standalone`はWebサーバを停止した状態で実行します。webrootを指定する必要はありませんが、サーバを一時的に停止させなければいけません。

`apache`はWebサーバとしてApacheを使用している場合に使用できます。webrootを指定したりWebサーバを止めたりする必要がありません。

`nginx`は`apache`のNginx版です。`apache`同様にwebrootの指定やWebサーバの停止が不要です。

上記の中で、`standalone`はなるべく避けたいです。なぜなら Let's Encrypt の証明書の有効期限は90日で、更新処理を行うたびにWebサーバを止めるのは可用性に問題があるからです。

そのため`webroot`を使用するほうがいいですが、RailsやExpressなどのWebアプリケーションを稼働させていてリバースプロキシを使用している場合はこのモードは使用できません。webrootはあくまで静的ファイルを配信するときのサーバのパスなので、リバースプロキシを使用している場合はそのパスが存在しません。

そこでリバースプロキシを使用している場合でもWebサーバを止めずに更新処理を行う方法として `apache`, `nginx` モードがあります。WebサーバにApacheを使用している場合はこのモードを使用するのがベストでしょう。ところがNginxを使用している場合は少しだけ問題があります。

`apache`は元々あったモードですが、`nginx`モードはCertbotのバージョンが`0.9.0`から導入されたもので、`0.9.0`がリリースされたのは2016年10月5日なのでつい1ヶ月前のことです。([Release v0.9.0 · certbot/certbot](https://github.com/certbot/certbot/releases/tag/v0.9.0))

ソースはGitHubに公開されているので、ソースからビルドすればおそらくは使用できますが、OSのパッケージマネージャーからインストールした場合（正規のインストール方法の場合）はまだリポジトリに登録されておらず`0.9.0`以降のバージョンが使用できない場合があります。この記事を書いている時点で`yum`リポジトリはまだ更新されていませんでした。

なので今回は、Nginxを使用していて、リバースプロキシを使用している環境でもWebサーバを停止させずに更新処理を行う方法を紹介します。

# Certbotのインストール
Certbotをインストールしていない場合（はじめて Let's Encrypt で証明書を発行してもらう場合）はCertbotをインストールしてください。

[公式サイト](https://certbot.eff.org/)にアクセスして、使用しているWebサーバとOSを選択してください。あとは表示されたページの説明に従ってコマンドを実行してインストールしてください。ここではインストール方法についての詳細は割愛します。

# 設定方法
今回行う方法は、リバースプロキシを使用している場合でも仮想的にwebrootを作り出して、`webroot`モードで更新処理を行う、という方法です。

この設定方法に関しては、以下のサイトを大いに参考にさせていただきました:pray:
[Let's Encrypt Auto-Renewal for Nginx Reverse Proxies](http://tom.busby.ninja/letsecnrypt-nginx-reverse-proxy-no-downtime/)

## webrootの生成
まずは仮想webrootとなるディレクトリ(パス)を生成します。

```bash
$ sudo mkdir -p /var/www/ssl-proof/rancher/.well-known
```

次に確認用のHTMLを生成します。

```bash
$ sudo touch /var/www/ssl-proof/rancher/.well-known/test.html
```

生成された`test.html`に`test`と書いて保存します。`test`ではなくてもいいです。書いた内容があとで確認できればOKです。

## webrootの設定
Nginxに先ほど作成した仮想webrootの設定をします。Nginxの設定ファイルを開いて以下の内容を追加します。Nginxの設定ファイルのパスは適宜読み替えてください。

```nginx:/etc/nginx/conf.d/nginx.conf
http {
    server {
        # listenやserver_name

        location /.well-known {
            root  /var/www/ssl-proof/rancher/;
        }

        # リバースプロキシの設定
        # SSLの設定 (まだ証明書の発行をしていない場合はあとで記述してください。詳細は省略)
        # エラーページの設定
    }
}
```

webrootに関係ない設定は省略していますが、`location`に先ほどのパスを設定します。

設定が終わったら、Nginxを再起動します。

```bash
$ sudo systemctl restart nginx

# または

$ sudo nginx -s reload
```

## 設定の確認
正しくwebrootが設定されたことを確認します。`http://example.com/.well-known/test.html` にアクセスして`test`と表示されていればOKです。`example.com` は自分のドメインを入力してください。

確認が完了したら`test.html`は削除してください。削除するファイルを間違えないように注意してください。

```bash
$ sudo rm /var/www/ssl-proof/rancher/.well-known/test.html
```

## 証明書の発行
Let's Encrypt から証明書の発行をしてもらいます。すでに発行済みの場合でも、前回に違うモードで入手・更新した場合は同様です。

```bash
$ sudo certbot certonly --webroot -w /var/www/ssl-proof/rancher/ -d example.com
```

`example.com`には証明書を発行してもらいたい自分のドメインを入力してください。

証明書の発行に成功すると以下のように表示されます。

```
IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at
   /etc/letsencrypt/live/example.com/fullchain.pem. Your cert
   will expire on 2016-11-05. To obtain a new version of the
   certificate in the future, simply run Certbot again.
 - If you lose your account credentials, you can recover through
   e-mails sent to admin@example.com.
 - Your account credentials have been saved in your Certbot
   configuration directory at /etc/letsencrypt. You should make a
   secure backup of this folder now. This configuration directory will
   also contain certificates and private keys obtained by Certbot so
   making regular backups of this folder is ideal.
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
```

これで、リバースプロキシを使用しているNginxでも`webroot`モードで証明書の更新を行うことができました！

## 次回以降の証明書の更新
一度、上記のモードで更新した場合は、次回以降は`renew`コマンドで前回の設定と全く同じ条件で証明書の更新を行うことができます。

```bash
$ sudo certbot renew
```

あとはcronなどを使用して定期的に実行するように設定すればOKです。

ただし、証明書の更新は、現在有効の証明書の有効期限が30日を切らないと更新できないようになっています。30日を切っていないときでも強制的に更新処理を行いたい場合はオプションをつけます。

```bash
$ sudo certbot renew --force-renew
```

上記コマンドの実行は一つ注意しなければいけません。Let's Encrypt では証明書を更新できる回数に制限を設けています。公式サイトを確認すると、1ドメインにつき、1週間に20回まで、と記述されています。

[Rate Limits - Let's Encrypt](https://letsencrypt.org/docs/rate-limits/)

ふつうに使っている分にはこの制限に引っかかることはまずないですが、制限があることは覚えておいてください。

ちなみに更新できるかどうかを確かめたいだけなら以下のオプションをつければOKです。

```bash
$ sudo certbot --dry-run
```

`--dry-run`オプションは現在の設定で`renew`コマンドを実行したときにちゃんと更新できるかどうかを確認できます。確認するだけなので実際の更新処理は行いません。つまり更新制限に引っかかる心配もありません。なので、強制的に更新しなければいけないとき以外は`--force-renew`はつけないことをおすすめします。

# 参考サイト
* [Let's Encrypt Auto-Renewal for Nginx Reverse Proxies](http://tom.busby.ninja/letsecnrypt-nginx-reverse-proxy-no-downtime/)
* [How To Secure Nginx with Let's Encrypt on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-14-04)
* [Certbot](https://certbot.eff.org/)
* [Getting certificates (and chosing plugins)](https://certbot.eff.org/docs/using.html#getting-certificates-and-chosing-plugins)
* [Rate Limits - Let's Encrypt](https://letsencrypt.org/docs/rate-limits/)
* [Let’s Encryptで発行したSSL証明書を自動更新するときのノウハウ](http://racchai.hatenablog.com/entry/2016/04/18/070000)
