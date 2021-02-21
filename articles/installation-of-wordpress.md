---
title: "CentOS7 + Nginx で WordPress をインストールする"
emoji: "💭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["WordPress", "nginx", "CentOS"]
published: false
order: 17
---

# はじめに
WordPressは導入が簡単と聞いていましたが、ひっかかるポイントが多く苦戦したので、メモとしてインストール手順を残しておこうと思います。

# WordPressをダウンロード
公式サイトからファイルをダウンロードします。今回はホームディレクトリ以下にWordPressのファイルを置くことにします。ホームディレクトリに移動したあと、以下のコマンドを実行します。
`$ wget https://ja.wordpress.org/latest-ja.tar.gz`

ダウンロードが完了したらファイルを展開します。
`$ tar xzf latest-ja.tar.gz`

展開すると、ホームディレクトリに`wordpress`ディレクトリが生成されます。展開が完了したら`latest-ja.tar.gz`は必要ないので削除してOKです。

# PHPの実行環境を整える
WordPressはPHPで動いています。PHPの実行環境の導入に関しては以下の記事を参照してください。

[CentOS7 + Nginx + PHP-FPM でPHPを実行する環境を整える](http://qiita.com/noraworld/items/fd491a77af9d4e1ccffa)

# MySQLの環境を整える
WordPressではMySQLを使用します。

## mysql-communityをインストールする
MySQLをWordPressで利用するにはmysql-serverをインストールする必要がありますが、これはデフォルトではyumリポジトリに登録されていないので、まずはmysql-communityをインストールする必要があります。以下のコマンドでインストールできます。
`$ sudo yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm`

## MySQL Server をインストールする
以下のコマンドでインストールします。
`$ sudo yum -y install mysql-server`

## WordPressに必要なMySQL拡張をインストールする
これがないとMySQLは使用できてもWordPressでは使用できません。以下のコマンドでインストールします。
`$ sudo yum -y install php-mysql`

インストール後、反映させるためにはPHP-FPMを再起動する必要があります。
`$ sudo systemctl restart php-fpm`

## MySQLデーモンを起動する
MySQLを起動します。
`$ sudo systemctl start mysqld`

## MySQLが起動できるか確認する
以下のコマンドでMySQLが起動できるかどうか確認してください。
`$ mysql`

`mysql>`というプロンプトになれば成功です。MySQLを終了する場合は`\q`と入力してください。

### エラーが出てMySQLが起動できない場合
`mysql`コマンドを実行したときに、`Can't connect to local MySQL server through socket '/var/lib/mysql/mysql.sock'` と表示された場合は何らかの理由でソケットファイルが削除されてしまった可能性があります。以下のコマンドでソケットファイルを作成します。
`$ sudo touch /var/lib/mysql/mysql.sock`

念のためMySQLデーモンを再起動します。
`$ sudo systemctl restart mysqld`

もう一度`mysql`コマンドを実行して、`mysql>`プロンプトが出れば成功です。

# データベースを設定する
WordPressで使用するデータベースを作成します。rootでMySQLに接続します。
`$ mysql -u root`

プロンプトが`mysql>`となれば成功です。

その状態で以下のSQL文を実行します。

```mysql
mysql> create database wordpress;
Query OK, 1 row affected (0.01 sec)

mysql> grant all on wordpress.* to dbuser@localhost identified by '任意のパスワード';
Query OK, 0 rows affected (0.04 sec)

mysql> \q
Bye
```

⚠️ 入力するのは`mysql>`の行のみです。

`wordpress`の箇所はデータベース名です。好きなデータベース名を設定してください。`dbuser`はこのデータベースのユーザです。データベース名と同じく好きな名前を設定してください。`任意のパスワード`の箇所にパスワードを設定してください。なお、ここで設定したデータベース名、データベースユーザ名、パスワードは後で使用するので覚えておいてください。

# 設定したデータベースをWordPressに登録する
先ほど設定したデータベースをWordPressで使用できるように設定します。

設定は`wordpress`ディレクトリ内の`wp-config.php`というファイルに記述します。configファイルのサンプルは`wp-config-sample.php`なので、これをコピーして`wp-config.php`とします。
`$ cp ~/wordpress/wp-config-sample.php ~/wordpress/wp-config.php`

コピーした`wp-config.php`を開き、以下のように変更します。

```diff
- define('DB_NAME', 'database_name_here');
+ define('DB_NAME', 'wordpress');

- define('DB_USER', 'username_here');
+ define('DB_USER', 'dbuser');

- define('DB_PASSWORD', 'password_here');
+ define('DB_PASSWORD', '設定したパスワード');

- define('AUTH_KEY',         'put your unique phrase here');
- define('SECURE_AUTH_KEY',  'put your unique phrase here');
- define('LOGGED_IN_KEY',    'put your unique phrase here');
- define('NONCE_KEY',        'put your unique phrase here');
- define('AUTH_SALT',        'put your unique phrase here');
- define('SECURE_AUTH_SALT', 'put your unique phrase here');
- define('LOGGED_IN_SALT',   'put your unique phrase here');
- define('NONCE_SALT',       'put your unique phrase here');
+ define('AUTH_KEY',         'ランダムな文字列');
+ define('SECURE_AUTH_KEY',  'ランダムな文字列');
+ define('LOGGED_IN_KEY',    'ランダムな文字列');
+ define('NONCE_KEY',        'ランダムな文字列');
+ define('AUTH_SALT',        'ランダムな文字列');
+ define('SECURE_AUTH_SALT', 'ランダムな文字列');
+ define('LOGGED_IN_SALT',   'ランダムな文字列');
+ define('NONCE_SALT',       'ランダムな文字列');
```

`DB_NAME`に先ほど設定したデータベース名、`DB_USER`にデータベースユーザ名、`DB_PASSWORD`にデータベースで設定したパスワードを入力します。

`AUTH_KEY`, `SECURE_AUTH_KEY `, `LOGGED_IN_KEY`, `NONCE_KEY`, `AUTH_SALT`, `SECURE_AUTH_SALT`, `LOGGED_IN_SALT`, `NONCE_SALT` の8つはランダムな文字列を設定します。この文字列は自分で設定するよりも以下のサイトで自動生成された内容をコピーして丸々貼り付けたほうが楽です。

[WordPress.org の秘密鍵サービス](https://api.wordpress.org/secret-key/1.1/salt/)

# Nginxの設定をする
Nginxの設定は [CentOS7 + Nginx + PHP-FPM でPHPを実行する環境を整える](http://qiita.com/noraworld/items/fd491a77af9d4e1ccffa) でも紹介したのでここでは細かいことは省略しますが、今回は説明を簡単にするために`root`をホームディレクトリに変更します。

```diff:/etc/nginx/conf.d/default.conf
  location / {
-     root   /home/ユーザ名/www;
+     root   /home/ユーザ名;
      index  index.html index.htm index.php;
  }

  location ~ \.php$ {
-     root           /home/ユーザ名/www;
+     root           /home/ユーザ名;
      fastcgi_pass   127.0.0.1:9000;
      fastcgi_index  index.php;
      fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
      include        fastcgi_params;
  }
```

設定したら再起動します。
`$ sudo systemctl restart nginx`

# WordPressを設定する
ここまででWordPressが利用できるようになっているはずです。あとはWordPressのインストール画面にアクセスしてインストールを完了させてください。

お使いのブラウザで、`http://ドメイン名/wordpress/wp-config.php` にアクセスします。`ドメイン名`にはサーバで設定したドメインを入力してください。ローカルで環境を整えている場合は、`http://localhost/wordpress/wp-config.php` または `http://IPアドレス/wordpress/wp-config.php` にアクセスしてください。

バージョンによってレイアウトは異なりますが、以下のような画面が表示されればOKです。

![wordpress_installation.png](https://qiita-image-store.s3.amazonaws.com/0/113895/bf5a97d1-6263-6657-539f-5c27caba758f.png)

表示された画面に従って、サイトのタイトル、ユーザ名、パスワード、メールアドレスを設定してインストールボタンを押すとインストールは完了です。お疲れさまでした。

# 「お使いのサーバーのPHPではWordPressに必要なMySQL拡張を利用できないようです」と表示された場合
WordPressのインストール画面でこのメッセージが表示された場合は`php-mysql`がインストールされていないことを警告しています。

また、重要なのが、このメッセージを確認したあと、`php-mysql`をインストールしてからPHP-FPMを再起動する必要があります。
`$ sudo systemctl restart php-fpm`

これは忘れがちなので注意してください。

また、確認していないのでわかりませんが、念のため`mysqld`と`nginx`を再起動しておくと確実かもしれません。
`$ sudo systemctl restart mysqld`
`$ sudo systemctl restart nginx`

参考: [お使いのサーバーのPHPではWordPressに必要なMySQL拡張を利用できないようです＠Nginx](http://blog.showzine.co/entry/wordpress_no_php-mysql)

# 参考サイト
* [【シンプル】CentOS6にMySQL5.6をyumで簡単にインストールする手順](http://blog.ybbo.net/2014/01/22/%E3%80%90%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91centos6%E3%81%ABmysql5-6%E3%82%92yum%E3%81%A7%E7%B0%A1%E5%8D%98%E3%81%AB%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E3%81%99%E3%82%8B/)

* [mysqlが起動できなくなった（Can't connect to local MySQL server through socket '/tmp/mysql.sock' (2)）](http://qiita.com/carotene512/items/e00076fe3990b9178cc0)

* [#02 WordPressをインストールしよう - dotinstall.com](http://dotinstall.com/lessons/basic_wordpress/22702)

* [お使いのサーバーのPHPではWordPressに必要なMySQL拡張を利用できないようです＠Nginx](http://blog.showzine.co/entry/wordpress_no_php-mysql)
