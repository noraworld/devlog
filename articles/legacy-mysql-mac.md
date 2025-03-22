---
title: "Homebrew ではインストールできなくなった古い MySQL 5.7 を macOS にインストールする方法"
emoji: "🗑️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mysql", "sql", "macos", "mac", "homebrew"]
published: true
order: 169
layout: article
---

# はじめに
[2024 年 8 月から MySQL 5.7 は Homebrew でインストールできなくなりました](https://github.com/Homebrew/homebrew-core/blob/bd6394bad2c4f2cc77c4298573f6bf818b991c90/Formula/m/mysql@5.7.rb#L22)。

インストール手順については公式ページ ([2.8.4 Installing MySQL Using a Standard Source Distribution](https://dev.mysql.com/doc/refman/5.7/en/installing-source-distribution.html#installing-source-distribution-preconfiguration)) にありますが、これはディレクトリ構成が今と異なっていたり実際に使えるようになるまでの包括的な内容になっていなかったりします。

そこで今回は macOS に MySQL 5.7 をソースコードからビルドしてインストールする方法についてご紹介します。



# 既存の MySQL の削除
すでに新しいバージョンの MySQL を Homebrew でインストールしている場合はトラブルを避けるために一度削除してください。

```shell:Shell
brew uninstall mysql
```



# 必要なライブラリのインストール
以下のライブラリが必要なため事前にインストールします。

| Library   | Version    | Package  |
| --------- | ---------- | -------- |
| `bison`   | `>= 2.1`   | Xcode    |
| `cmake`   | `n/a`      | Homebrew |
| `gcc`     | `>= 5.3`   | Xcode    |
| `git`     | `n/a`      | Homebrew |
| `make`    | `>= 3.75`  | Xcode    |
| `ncurses` | `n/a`      | Homebrew |
| `openssl` | `>= 1.0.1` | Homebrew |

```shell:Shell
xcode-select --install
brew install cmake git ncurses openssl
```



# ソースコードのダウンロード
[MySQL Community Server (Archived Versions)](https://downloads.mysql.com/archives/community/) から必要なバージョンをダウンロードします。以下は 5.7.44 をインストールする場合の例です。

| Item             | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Product Version  | 5.7.44                                                     |
| Operating System | Source Code                                                |
| OS Version       | All Operating Systems (Generic) (Architecture Independent) |

"Compressed TAR Archive, Includes Boost Headers" の項目を選択しダウンロードします。

![MySQL のソースコードのダウンロード画面](https://github.com/noraworld/developers-blog-media-ja/blob/5cd1b8ee9d231f0b7bb18268275c473c056f7b25/legacy-mysql-mac/mysql_download.png?raw=true)

これ以降の説明で `VERSION` と記載されている部分はここでダウンロードした MySQL のバージョンに読みかえてください。



# アーカイブファイルの展開
先ほどダウンロードしたソースコードのアーカイブを展開します。ダウンロードしたディレクトリまで移動し以下を実行します。

```shell:Shell
tar zxvf mysql-boost-VERSION.tar.gz
```

展開が完了すると同ディレクトリに `mysql-VERSION` というフォルダが生成されるはずです。



# ディレクトリの作成
インストール時に生成されるファイルやフォルダを格納するためのディレクトリを作成します。ソースコードが展開された場所やアーカイブファイルと同じディレクトリに以下の 2 種類のディレクトリを作成します。

```shell:Shell
mkdir mysql-home
mkdir boost
```



# インストール
MySQL のインストールを行います。まずは `mysql-VERSION` ディレクトリに移動します。

```shell:Shell
cd mysql-VERSION
```

続いて `cmake` を実行します。`/path/to/` の部分は先ほど作成した `mysql-home` や `boost` があるディレクトリの絶対パスに読みかえてください。

```shell:Shell
cmake -DCMAKE_INSTALL_PREFIX=/path/to/mysql-home \
      -DDOWNLOAD_BOOST=1                         \
      -DWITH_BOOST=/path/to/boost                \
      -DDEFAULT_CHARSET=utf8                     \
      -DDEFAULT_COLLATION=utf8_general_ci        \
      -DWITH_INNOBASE_STORAGE_ENGINE=1
```

次に `make` を実行します。

```shell:Shell
make
make install
```

必要なライブラリが足りていて特に問題なければこれで MySQL がインストールされました。



# データの初期化
実際に使用する前にまずはデータを初期化する必要があります。先ほど作成した `mysql-home` ディレクトリに移動します。

```shell:Shell
cd mysql-home
```

そこに新しく `mysql-files` というディレクトリを作成します。

```shell:Shell
mkdir mysql-files
```

作成したディレクトリの所有者と権限を変更します。

```shell:Shell
sudo chown mysql:mysql mysql-files
sudo chmod 750 mysql-files
```

以下のコマンドを実行し初期化を行います。

```shell:Shell
bin/mysqld --initialize --user=mysql
```

実行して以下のようなメッセージが表示されれば成功です。

```
2024-09-03T06:30:15.306122Z 1 [Note] A temporary password is generated for root@localhost: AyVCZ+whY9R(
```

一時的に使用するパスワード (ここでは `AyVCZ+whY9R(`) が表示されるのでこれを控えておきます。



# MySQL デーモンの起動
以下のコマンドを実行し MySQL のサーバを起動します。

```shell:Shell
mysqld
```



# MySQL へログイン
ここで別のタブやウィンドウを開いて新しいセッションを開始します。続いて以下のコマンドを実行します。

```shell:Shell
mysql -u root -p
```

パスワード求められるので先ほど表示されたパスワード (この記事では `AyVCZ+whY9R(` と表記されているもの) を入力して MySQL にログインします。プロンプトが `mysql>` となればログイン成功です。



# パスワードの変更
先ほど一時的に発行されたパスワードを任意のパスワードに変更します。これを先に行わないと他のデータベースの操作はできませんのでご注意ください。`my_new_password` の部分は適宜変更してください。

```sql:MySQL
SET PASSWORD = PASSWORD('my_new_password');
```

今後 `mysql -u root -p` でログインするときは上記で設定したパスワードを使ってください。



# データベースの確認
最後に、データベースが正常に動作しているか確認します。以下の SQL を実行します。

```sql:MySQL
SELECT Host, User FROM mysql.user WHERE User = 'root';
```

以下のようにホストとユーザの情報が表示されれば成功です。

```sql
+-----------+------+
| Host      | User |
+-----------+------+
| localhost | root |
+-----------+------+
1 row in set (0.01 sec)
```

MySQL からログアウトするには以下を実行します。

```sql:MySQL
exit
```

これで MySQL のインストールは以上となります。お疲れさまでした。



# 参考
* [MySQL をソースからコンパイルしてインストール](https://qiita.com/ekzemplaro/items/512a73578460576f3a5d)
* [Reset MySQL root password using ALTER USER statement after install on Mac](https://stackoverflow.com/questions/33467337/reset-mysql-root-password-using-alter-user-statement-after-install-on-mac)
* [2.9.1 Initializing the Data Directory](https://dev.mysql.com/doc/refman/5.7/en/data-directory-initialization.html)
