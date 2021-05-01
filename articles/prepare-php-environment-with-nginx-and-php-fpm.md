---
title: "CentOS7 + Nginx + PHP-FPM でPHPを実行する環境を整える"
emoji: "🐘"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PHP", "php-fpm", "nginx", "CentOS"]
published: true
order: 16
layout: article
---

# はじめに
PHPをインストールしてNginxの設定でCGIを実行できるようにすれば簡単にできると思っていましたが、実際にやってみると意外とハマったのでメモとして残しておきます。

# PHPのインストール
以下のコマンドを実行します。

```bash
$ sudo yum -y install php
```

インストールできたかどうかを確認します。

```bash
$ php --version
```

📝 最新版のPHPをインストールしたい場合、あるいはプロジェクトごとに異なるバージョンのPHPを簡単に管理したい場合は、phpenvをおすすめします。phpenv利用したPHPのインストール手順については「[phpenvで最新版のPHPをインストールしてWebサイトで使用する](https://ja.developers.noraworld.blog/how-to-install-latest-version-of-php-with-phpenv)」を参考にしてください。

# PHP-FPMのインストール
以下のコマンドを実行します。

```bash
$ sudo yum -y install php-fpm
```

# Nginxのインストール
こちらの記事を参照してください。

[CentOS 7 (5, 6) で "安定版 (最新版)" のNginxをインストールする方法](https://ja.developers.noraworld.blog/how-to-install-latest-or-stable-version-of-nginx)

# PHP-FPMの設定を変更
Apacheを使用する場合は特に変更することはありませんが、Nginxを使用する場合は設定ファイルの変更が必要です。`/etc/php-fpm.d/www.conf`内の`user`と`group`を`nginx`に変更します。

```diff:/etc/php-fpm.d/www.conf
- user = apache
- group = apache
+ user = nginx
+ group = nginx
```

設定したら、PHP-FPMを起動(再起動)します

```bash
$ sudo systemctl restart php-fpm
```

# Nginxの設定を変更
Nginxの設定を変更してPHPを実行できるようにします。`/etc/nginx/conf.d/default.conf` を編集します。今回はホームディレクトリ以下に `www` というディレクトリを作り、その中にある `index.php` を実行できるようにします。

⚠️ 初期設定に戻せるように設定のバックアップを取りたい人はこのファイルを直接編集せずに、コピーして編集してください。コピー先ファイルは `default.conf` と同じディレクトリ、ファイル名は任意ですが、拡張子は `.conf` としてください。なお、今回は `default.conf` を直接編集することを前提として説明します。

```diff:/etc/nginx/conf.d/default.conf
- location / {
-     root   /usr/share/nginx/html;
-     index  index.html index.htm;
- }
+ location / {
+     root   /home/ユーザ名/www;
+     index  index.html index.htm index.php;
+ }

- #location ~ \.php$ {
- #    root           html;
- #    fastcgi_pass   127.0.0.1:9000;
- #    fastcgi_index  index.php;
- #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
- #    include        fastcgi_params;
- #}
+ location ~ \.php$ {
+     root           /home/ユーザ名/www;
+     fastcgi_pass   127.0.0.1:9000;
+     fastcgi_index  index.php;
+     fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
+     include        fastcgi_params;
+ }
```

`ユーザ名`のところに自分のユーザ名を入力してください。注意すべき点は、`location ~ \.php$` ブロック内の `root` を `location /` の `root` と同じにすること、`fastcgi_param` のパスを上記のように変更することの2点です。

また、`location /`ブロックの`index`に`index.php`を追加することを忘れずにしてください。なお、ここでいう`index.php`はファイルを省略した場合に参照するファイルなので、たとえば`info.php`というファイルにアクセスしたい場合でもNginx設定ファイル内の`index.php`の部分は変更する必要はありません。

上記を設定に変更したらNginxを起動(再起動)します。

```bash
$ sudo systemctl restart nginx
```

# PHPファイルを作成
PHPのファイルを作成します。ホームディレクトリに`www`ディレクトリを作り、その中に`index.php`を作成します。

```
$ mkdir ~/www
$ vi ~/www/index.php
```

`index.php`に以下を追加します。

```php:index.php
<?php
  phpinfo();
?>
```

# 確認
ブラウザで`http://ドメイン名/index.php`にアクセスして、PHPに関する情報が表示されたら成功です。お疲れさまでした。

# 403 Forbidden と表示されたとき
ホームディレクトリのパーミッションが正しいか確認してください。パーミッションを正しく設定するには以下を実行します。

```bash
$ chmod 755 /home/ユーザ名/
```
