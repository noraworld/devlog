---
title: "phpenvで最新版のPHPをインストールしてWebサイトで使用する"
emoji: "👌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PHP", "phpenv", "php-build", "php-fpm", "openssl"]
published: false
---

# はじめに
唐突にPHPを使って簡易的なWebサイトを作りたくなったのでPHPの環境構築をすることにしました。そしてせっかくなので最新版のPHPをインストールすることにしました。公式サイトからソースをダウンロードしてビルドしてもよかったのですが、バージョン管理とか更新がめんどうなので、PHPのバージョン管理ができるphpenvを使ってインストールしたのですが、その作業が結構大変だったので、今回は自分が成功した手順を紹介したいと思います。

ちなみにPHPのバージョン管理にはphpenvとphpbrewがあって、phpbrewのほうがGitHubリポジトリのスターの数が多いですが、Rubyはrbenv, Pythonはpyenvを使用していてコマンド類がとても良く似ていて使いやすいのでphpenvを使用することにしました。

もう一つの理由としてはphpbrewはどうやら PHP 7 系をインストールするときに発生するバグがあるらしく、自分も試した結果、phpbrewのインストールまではうまくいったけど、その後PHPをビルドする際にエラーが発生して全くインストールできなかったです。またGitHubのIssueを確認すると、多くの人が同じエラーが出ると言っていますが、解決法を試してもダメだったので、諦めました。

今回の環境構築では「[phpenvで複数のPHPのバージョンを管理する](http://qiita.com/toshiro3/items/2ca2765c1a5fee78d504)」の記事を大変参考にさせていただきました:pray:
ほとんどこちらのサイト通りで問題ないのですが、一部追加で必要なパッケージがあったり、自分の環境では壮絶なOpenSSL問題が発生したりしたので、そのへんも詳しく紹介していきます。

# TL;DR
読むのがめんどうな人向けです。

```bash
$ git clone https://github.com/CHH/phpenv.git
$ cd phpenv/bin
$ ./phpenv-install.sh
```

```bash:~/.bashrc
export PATH="$HOME/.phpenv/bin:$PATH"
eval "$(phpenv init -)"
```

```bash
$ source ~/.bashrc
$ git clone https://github.com/CHH/php-build.git ~/.phpenv/plugins/php-build
$ sudo yum -y install epel-release
$ sudo yum -y install gcc libxml2 libxml2-devel libcurl libcurl-devel libpng libpng-devel libmcrypt libmcrypt-devel libtidy libtidy-devel libxslt libxslt-devel openssl-devel bison libjpeg-turbo-devel readline-devel autoconf
$ phpenv install --list
$ phpenv install x.x.x
```

**phpenv install で OpenSSL に関するエラーが発生したら「[OpenSSLとの壮絶な闘い](http://qiita.com/noraworld/items/26e516e0245ff619f648#openssl%E3%81%A8%E3%81%AE%E5%A3%AE%E7%B5%B6%E3%81%AA%E9%97%98%E3%81%84)」を参照**

```bash
$ phpenv global x.x.x
$ php -v
$ cp ~/.phpenv/versions/x.x.x/etc/php-fpm.d/www.conf.default ~/.phpenv/versions/x.x.x/etc/php-fpm.d/www.conf
$ cp ~/.phpenv/versions/x.x.x/etc/php-fpm.conf.default ~/.phpenv/versions/x.x.x/etc/php-fpm.conf
$ ~/.phpenv/versions/x.x.x/sbin/php-fpm
$ ps -ef | grep php-fpm | grep -v grep
```

**Webサーバを起動してPHPが使用できるか確認する**
**「[CentOS7 + Nginx + PHP-FPM でPHPを実行する環境を整える](http://qiita.com/noraworld/items/fd491a77af9d4e1ccffa)」参照**

```bash
# composerのインストール（任意）
$ php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
$ php -r "if (hash_file('SHA384', 'composer-setup.php') === '55d6ead61b29c7bdee5cccfb50076874187bd9f21f65d8991d46ec5cc90518f447387fb9f76ebae1fbbacf329e583e30') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
$ php composer-setup.php
$ php -r "unlink('composer-setup.php');"
$ sudo mv composer.phar /usr/local/bin/composer
$ composer --version
```

# 環境
* CentOS 7

# phpenvのインストール
まずはphpenvをGitHubのリポジトリからダウンロードしてインストールします。

phpenvのリポジトリは、[phpenv/phpenv](https://github.com/phpenv/phpenv)と[CHH/phpenv](https://github.com/CHH/phpenv)の2種類あって、phpenv/phpenvのほうが如何にも公式って感じでこちらでインストールしようとしたのですが、こちらはバグが多すぎる上に、Issueに載っている解決法もバラバラで、さらにすべて試してもうまくいかないことがあったので、諦めました。そしてCHH/phpenvをインストールしたら何の問題もなくあっさり出来たので、こちらをインストールします。

```bash
$ git clone https://github.com/CHH/phpenv.git
$ cd phpenv/bin
$ ./phpenv-install.sh
```

インストールが終わったら、以下の設定を`.bashrc`に追加します。

```bash:~/.bashrc
export PATH="$HOME/.phpenv/bin:$PATH"
eval "$(phpenv init -)"
```

追加したら、`.bashrc`を再読み込みします。

```bash
$ source ~/.bashrc
```

phpenvがインストールできたら、クローンしたリポジトリ（`phpenv`ディレクトリ）は必要ないので削除して大丈夫です。間違って`.phpenv`を削除しないように注意してください。

# php-buildのインストール
次にphp-buildをインストールします。

```bash
$ git clone https://github.com/CHH/php-build.git ~/.phpenv/plugins/php-build
```

# 依存関係のあるパッケージのインストール
インストールの前にEPELリポジトリを追加しないとインストールできないパッケージがあるので、以下のコマンドでEPELリポジトリをインストールします。

```bash
$ sudo yum -y install epel-release
```

参考: [CentOS7.1 64bitのyumリポジトリにEPELを追加](http://www.kakiro-web.com/linux/epel-install.html)

PHPでは非常に多くのパッケージをインストールしないといけなくて、パッケージが存在しないぞというエラーが、毎回インストールで時間が経ったあとに出てくるので大変でした。なので、無駄な時間を消費しないために、先に必要なパッケージを一気にインストールします。

```bash
$ sudo yum -y install gcc libxml2 libxml2-devel libcurl libcurl-devel libpng libpng-devel libmcrypt libmcrypt-devel libtidy libtidy-devel libxslt libxslt-devel openssl-devel bison libjpeg-turbo-devel readline-devel autoconf
```

`devel`のついているほうとついていないほうはどちらかがインストールできれば良いと思いますが、あとでインストールし損じてエラーになるのが厄介なので、両方まとめて指定します（どちらか一方のみがインストールされることが多いです）

# PHPのインストール
以下のコマンドでインストール可能なPHPのバージョンを確認します。

```bash
$ phpenv install --list
```

現在の安定版のバージョンは、[公式のダウンロードページ](https://secure.php.net/downloads.php)で確認できます。

確認したら、インストールしたいバージョンを指定してインストールします。

```bash
$ phpenv install x.x.x
```

`x.x.x`の箇所にインストールしたいバージョンを指定してください。形式は必ずしもこうとは限らないので、`phpenv install --list` で表示された通りに指定してください。

なお、インストールにはかなり時間がかかります。自分の環境では20分ちょっとかかりました。時間に余裕があるときにゆっくりと作業してください:coffee:

最後にsuccessfullyと表示されればインストール完了です。

もしここでOpenSSLに関するエラーが発生した場合は後述する[OpenSSLとの壮絶な闘い](http://qiita.com/noraworld/items/26e516e0245ff619f648#openssl%E3%81%A8%E3%81%AE%E5%A3%AE%E7%B5%B6%E3%81%AA%E9%97%98%E3%81%84)を参考にしてください。

この状態でPHPのバージョンを確認しようとすると以下のように表示されます。

```bash
$ php -v
phpenv: php: command not found

The `php' command exists in these PHP versions:
 x.x.x
```

これはPHPはインストールされているけど、`php`コマンドとしてのパスが通っていないことを示します。
以下のコマンドでパスを通します。

```bash
$ phpenv global x.x.x
```

`php`コマンドを打ったときに実行されるPHPのバージョンを選んで指定してください。複数バージョンをインストールしても、特に指定しない場合に実行されるバージョンが上記で指定したバージョンになります。

そしてもう一度バージョンを確認します。

```bash
$ php -v
```

バージョンなどが表示されればOKです。

# PHP-FPMのインストール
ここまでの設定だと、`php`コマンドを実行した際には、今回インストールしたPHPが使えますが、Webアプリケーションとしては使用できません（`.php`のファイルをWebサーバで配信することができません。仮に実行できたとしたらそれは以前にyumでインストールしたPHPを使用している可能性があります。）

そのため、今回インストールしたPHPをWebアプリケーションとして実行できるようにするために、PHP-FPMを使えるようにします。

```bash
$ cp ~/.phpenv/versions/x.x.x/etc/php-fpm.d/www.conf.default ~/.phpenv/versions/x.x.x/etc/php-fpm.d/www.conf
$ cp ~/.phpenv/versions/x.x.x/etc/php-fpm.conf.default ~/.phpenv/versions/x.x.x/etc/php-fpm.conf
```

`x.x.x`にはインストールしたPHPのバージョンを指定してください。

次にPHP-FPMのプロセスを起動します。

```bash
$ ~/.phpenv/versions/x.x.x/sbin/php-fpm
```

起動できたか確認するには以下のコマンドを実行します。

```bash
$ ps -ef | grep php-fpm | grep -v grep
```

PHP-FPMにプロセス（画面に何か）が表示されればOKです。

参考: [Mac OS X El CapitanにNginx + phpenv + php-build + php-fpmの環境を構築する手順](http://qiita.com/jshimazu/items/09be38be00a5863acc08)

# Webサーバで確認
今回インストールされたPHPがWebアプリケーションとして実行できるか確認します。これに関しては「[CentOS7 + Nginx + PHP-FPM でPHPを実行する環境を整える](http://qiita.com/noraworld/items/fd491a77af9d4e1ccffa)」を参考にしてください。最後の確認（`phpinfo()`の内容）で、今回インストールしたPHPのバージョンが表示されればOKです。

# Composerのインストール（おまけ）
PHPがインストールできてしまえば、Composerのインストールはとても簡単なのでついでに紹介します。

ComposerとはPHPのパッケージ管理ツールです。RubyでいうGem, NodeでいうNPMに相当します。結構便利なので、PHPで開発する際はインストールしておいて損はないと思います。

インストールするには以下のコマンドを実行します。

```bash
$ php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
$ php -r "if (hash_file('SHA384', 'composer-setup.php') === '55d6ead61b29c7bdee5cccfb50076874187bd9f21f65d8991d46ec5cc90518f447387fb9f76ebae1fbbacf329e583e30') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
$ php composer-setup.php
$ php -r "unlink('composer-setup.php');"
```

:warning: 2つめの長いコマンドに関してですが、これはインストーラのSHAの検証を行っています。ここで指定している値が今後将来的に同じかどうかはよくわからないので、上記のコマンドでうまくいかない場合は[公式サイトのダウンロードページ](https://getcomposer.org/download/)に行ってダウンロードスクリプトをコピペして実行してください。

インストールされたら以下のコマンドでバージョンを確認してください。

```bash
$ ./composer.phar --version
```

バージョンが表示されればOKです。

このままでも使えますが、一般的なコマンドではなくて少し使いづらいので、`composer.phar`を移動させて、汎用的なコマンドとして実行できるようにします。

```bash
$ sudo mv composer.phar /usr/local/bin/composer
```

`composer`コマンドで同じ結果が表示されたら成功です。

```bash
$ composer --version
```

参考: [Composer を CentOS にインストールする手順](http://weblabo.oscasierra.net/php-composer-centos-install/)

:warning: コマンドが見つからないと表示された場合は`/usr/local/bin`のパスを通してください。

```bash:~/.bashrc
export PATH="/usr/local/bin:$PATH"
```

`.bashrc`を再読み込みします。

```bash
$ source ~/.bashrc
```

# OpenSSLとの壮絶な闘い
**こちらは、OpenSSLでエラーが発生する場合についてです。上記の手順で問題なくインストールできた場合は気にする必要はありません。**

少し前に、「[OpenSSLをソースからビルドしてNginxで使用する](http://qiita.com/noraworld/items/9c1d3c56293b68ca05b0)」という記事を投稿しました。これにある通り、自分はOpenSSLをソースからビルドして、OpenSSL 1.0.2 系の環境にしました。実はこれが、自分の環境でのインストールを厄介にさせた一番の理由でした。この問題に悩まされなかったVM上の環境では上記の手順ですんなりいけたのに、1.0.2系をインストールしたマシン上では相当苦労しました…

このようなエラーが発生しました。

```
/tmp/php-build/source/x.x.x/ext/ftp/php_ftp.c:313: undefined reference to `OPENSSL_init_ssl'
/tmp/php-build/source/x.x.x/ext/ftp/php_ftp.c:314: undefined reference to `OPENSSL_init_crypto'
/tmp/php-build/source/x.x.x/ext/ftp/php_ftp.c:315: undefined reference to `OPENSSL_init_crypto'
/tmp/php-build/source/x.x.x/ext/ftp/php_ftp.c:316: undefined reference to `OPENSSL_init_crypto'
/tmp/php-build/source/x.x.x/ext/ftp/php_ftp.c:318: undefined reference to `OPENSSL_init_ssl'
ext/ftp/.libs/ftp.o: In function `ftp_login':
/tmp/php-build/source/x.x.x/ext/ftp/ftp.c:283: undefined reference to `TLS_client_method'
/tmp/php-build/source/x.x.x/ext/ftp/ftp.c:292: undefined reference to `SSL_CTX_set_options'
ext/phar/.libs/util.o: In function `phar_verify_signature':
/tmp/php-build/source/x.x.x/ext/phar/util.c:1563: undefined reference to `EVP_MD_CTX_new'
/tmp/php-build/source/x.x.x/ext/phar/util.c:1595: undefined reference to `EVP_MD_CTX_free'
/tmp/php-build/source/x.x.x/ext/phar/util.c:1586: undefined reference to `EVP_MD_CTX_free'
ext/phar/.libs/util.o: In function `phar_create_signature':
/tmp/php-build/source/x.x.x/ext/phar/util.c:1860: undefined reference to `EVP_MD_CTX_new'
/tmp/php-build/source/x.x.x/ext/phar/util.c:1892: undefined reference to `EVP_MD_CTX_free'
collect2: error: ld returned 1 exit status
```

その原因についてですが、いろいろ調べていたら PHPのビルドではOpenSSLのSSLv2に関する関数を実行しているのですが、OpenSSL 1.0.2f 以降のバージョンでは、実はこの関数はセキュリティ上の理由から削除されてしまいました。

参考: [php-5.3.3のビルドでエラーが出てしまう](https://teratail.com/questions/32141)
参考: [OpenSSL 1.0.2 Series Release Notes](https://www.openssl.org/news/openssl-1.0.2-notes.html)

ビルドの際に使用する関数が使えなくなってしまったので、当然エラーが発生します。ここで一番困るのが、エラーが発生するタイミングです。コマンドを実行して即座にエラーが発生するならまだしも、この関数を使用するのはインストールの最後のほうなので、ただでさえ20分以上かかるPHPのビルドで散々待たされた結果、OpenSSLでエラーが発生するので、非常に酷でした。後述しますが、何度も失敗しているので、この20分近く待たされる状態を数回繰り返しました。

結局問題がわかったので、少し前のバージョン（SSLv2に関する関数が用意されているバージョン）を使えば良いというのが解決策なのですが、いろんなサイトを調べると、全く同じエラーに関する解決策を示すサイトが山ほどあるのに、どれを試しても一切解決しませんでした。

以下のように、ヘッダーファイルが見つからないとか、ライブラリが不足している（不足していないのに）と言われてしまいます。

```
configure: error: Cannot find OpenSSL's <evp.h>
```

```
configure: error: Cannot find OpenSSL's libraries
```

そして、唯一PHPのビルドに成功したのが、以下のサイトの手順です。

[PHP+OpenSSLバージョンアップ](http://kenzo0107.hatenablog.com/entry/2016/02/22/184456)

上記サイトのOpenSSLバージョンアップの作業に従ってOpenSSLをインストールして、`phpenv`でインストールするときに`--with-openssl`オプションをつけると、ようやくビルドが通るようになりました。結局、エラーが直らなかった原因は、OpenSSLのインストール先が違っていたことなんですが、他のサイトでは`/usr/local/openssl`とかにインストールすることが多くて、これだとうまくいきませんでした。`/usr/local`にインストールしたときに限っては`/usr/local/bin`と`/usr/local/include`にそれぞれOpenSSLのバイナリファイルとライブラリ等のファイルがインストールされ、php-buildが正しくOpenSSLを認識してくれるようになりました。でもこれはどこを調べても解決しなかったので、解決するまで非常に時間がかかりました。

これで問題は解決かというと実はそうではなくて、今度はComposerをインストールするときに同様にOpenSSLでエラーが発生してインストールできませんでした。Composerのインストールのときにも同様に特定のOpenSSLを指定する方法がわからないし、ここまで来るともはやPHPに関する何かしらをインストールする度にエラーが発生するので、ついにここで心が折れて、yumでインストールできる`oepnssl-devel`に戻すことにしました。せっかく最新版のOpenSSLをソースからビルドしたので、正直すごく嫌でしたが、これからのことも考えて仕方なく決めました。

ただ、yumの`openssl-devel`がインストールされていて、`openssl`コマンドを実行するときにもちゃんとそちらが実行されるようになっていたのですが、なぜかビルドするときには、最新版のOpenSSLが使用されてしまってエラーが発生するので、ソースからビルドしたOpenSSLをすべてアンインストールすることにしました。

```bash
$ sudo rm -rf /usr/local/ssl
$ sudo rm -rf /usr/local/openssl
$ sudo rm -rf /usr/local/bin/openssl
$ sudo rm -rf /usr/local/include/openssl
```

そして念のため`openssl`をアンインストールし`openssl-devel`を再インストールしました。

```bash
$ sudo yum -y remove openssl
$ sudo yum -y remove openssl-devel
$ sudo yum -y install openssl-devel
```

`openssl-devel`だけだと`openssl`コマンドは使えませんが、バイナリ自体はどこかに存在するので、今回ビルドを通す分には問題ありませんでした。

さらに念には念を入れて、サーバを再起動しました。そしてもう一度Composerをインストールしようとしましたが、同じエラーでした。そこで一旦インストールしたPHPを削除してもう一度インストールし直してみました。

```bash
$ rm -rf ~/.phpenv/versions/x.x.x
```

`x.x.x`にはPHPのバージョンが入ります。

そして、もう一度インストールしました。

```bash
$ phpenv install x.x.x
```

今度はyumでインストールした`openssl-devel`を使用してビルドしたので、`--with-openssl`オプションをつけなくても、エラーなくインストールすることができました。

そして、もう一度Composerをインストールしたら、ちゃんとインストールすることができました…！

というわけで結論ですが、phpenvに限らずPHPをソースからビルドする際に、OpenSSLの最新版（1.0.2系など）をソースからビルドした環境で行うと、果てしなくエラーに悩まされるのでおすすめしません。素直に`openssl-devel`をyumでインストールすればこれらの問題は起こりません。実際、多くのサイトではそのように解決されているので、今回のケースでの解決がなかなかできませんでした。

結局ソースからビルドしたOpenSSLではComposerのインストールまでできなかったし、解決したか、と言われると微妙なのですが、PHPのビルドとComposerのインストールに関しては「一応解決した」ということにしておきます。

解決方法というより、ほとんど愚痴っぽい感じになってしまいましたが、OpenSSL問題で同じく苦労された人に役立てば幸いです。
