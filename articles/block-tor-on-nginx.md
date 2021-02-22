---
title: "Nginx で Tor からのアクセス制限を行う方法"
emoji: "🈲"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nginx", "Tor", "deny", "geo", "If"]
published: false
order: 37
---

# はじめに
先日、Tor からのアクセスを制限するために Nginx の設定を追加する機会があり、せっかくなので Qiita でその方法を紹介したいと思います。

:warning: この記事は、Tor および Tor を利用するユーザに対する**アンチテーゼではありません**。また、私自身は、Tor および Tor を匿名性の目的で使用するユーザを悪であるとは思っておらず、批判するつもりも全くありません。むしろプライバシー保護という意味での匿名性には大賛成です。しかし、残念ながら、Tor を犯罪目的で利用するユーザが存在することは事実です。Tor からのアクセスを制限することについては賛否両論あるかと思いますが、ユーザが自由に書き込みできるような Web サービスを運営していたとして、万が一そのサービスで犯罪等に関わる悪質な書き込みがされ、刑事沙汰になってしまった場合に、書き込み元が特定できないことによる問題の予防線を張る程度のものであり、**Tor そのものを否定しているわけではない**ということを予めご留意ください。また、この記事はあくまで「Tor からのアクセスを制限する技術的な方法」を記載するものであり、**Tor アクセス制限を推奨、または助長するものではない**ことに関しても併せてご留意ください。

この記事の手順を試す前に、実際に Tor からのアクセス制限がどのようになるか確認したい場合は、[noraworld.jp](https://noraworld.jp) に、通常のブラウザ、Tor Browser それぞれでアクセスしてみてください。Tor Browser の利用に関しては後述の「設定が正しいかどうか確認」をご確認ください。

# Tor からのアクセスを制限する方法
Tor からのアクセスを最も簡単に検知する方法は、IP アドレスが Tor exit ノードのものであるかどうかを調べることです。Tor は、ノードと呼ばれるサーバを複数経由することにより匿名性を実現しています。複数のノードを経由し、一番最後に経由したノードからインターネットに接続し、Web サーバと通信します。このときの一番最後に経由するノードを、インターネットに出るノードということで、Tor exit ノードと呼ばれます。

![tor_exit_nodes.png](https://qiita-image-store.s3.amazonaws.com/0/113895/8c2c5ba5-fde5-023c-9b84-7b38d7353c3c.png)

Tor exit ノードからインターネットに接続し Web サーバと通信を行うので、Web サーバ側でログとして記録される（検出できる）IP アドレスは、直近の IP アドレスである Tor exit ノードのものとなります。つまり、Tor exit ノードの IP アドレスであると認識できれば、Web サーバ側に接続を試みたクライアントが、Tor を利用しているか否かを判定できます。

Tor exit ノードは世界中にたくさんありますが、Tor exit ノードの IP アドレス一覧がいくつかのサイトに公開されています。たとえば Tor プロジェクト公式の [Tor exit nodes - Tor Check](https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1) が挙げられます。この一覧に記載されている IP アドレスをすべてアクセス拒否するように Nginx の設定ファイルに追加することで、Tor からのアクセスを制限することができます。

この記事では、Tor exit ノードの IP アドレス制限を行う際の Nginx の設定方法を 2 種類紹介します。

# 方法 1: deny ディレクティブで制限
最も素直な設定方法は、deny ディレクティブを使用することです。Nginx では

```nginx
deny 192.168.0.1;
```

のように記述することで IP アドレスを制限することができます。上記の例では、IP アドレス `192.168.0.1` からのアクセスがあると、Nginx は HTTP ステータスコード 403 Forbidden を返し、それ以外の IP アドレスからのアクセスは通常通り（制限をかけていない場合と同様に）振る舞います。Tor exit ノードの IP アドレスを上記のようにすべて列挙すれば Tor からのアクセスを制限することができます。

とはいえ、[Tor exit nodes - Tor Check](https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1) を見てわかる通り、これだけの IP アドレスを元々ある Nginx の設定ファイルに丸書きしてしまうと設定ファイルが長くなり可読性が悪くなります。そこで、別のファイルに、拒否する IP アドレスの一覧だけを書いておき、それを元々ある Nginx の設定ファイル側で読み込むようにします。

## Tor exit ノードの IP アドレス一覧を取得
まずは拒否する IP アドレス一覧のファイルを作ります。Nginx の設定ファイルがあるディレクトリに移動し、以下のコマンドを実行します。ファイル名はなんでもいいですが、ここでは `tor-exit-nodes` とします。

```bash
$ curl https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1 | sed '/^#/ !s/^/deny  /g; s/$/;/g' > tor-exit-nodes
```

参考元: [How to block TOR exit nodes from accessing your website on Apache and Nginx](https://www.reaper-x.com/2012/05/15/how-to-block-tor-on-apache-and-nginx/)

作成されたファイルが以下のようになっていることを確認してください。

```nginx
# This is a list of all Tor exit nodes from the past 16 hours that can contact 1.1.1.1 on port 80 #
# You can update this list by visiting https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1 #
# This file was generated on Sun Sep  3 07:04:10 UTC 2017 #
deny 1.160.199.140;
deny 1.160.207.95;
deny 1.163.203.136;
# ...
```

## Nginx の設定ファイルを編集
このファイルを元々の Nginx の設定ファイルから読み込みます。http コンテキストに以下の 1 行を追加します。

```nginx
http {
    include  tor-exit-nodes;

    server {
        # ...
        # ...
    }
}
```

`include ファイル名` とすることで、ファイル名の Nginx の設定を読み込むことができます。これで設定は完了です。

## Nginx の再起動
Nginx の設定ファイルにミスがないかチェックします。

```bash
$ sudo nginx -t
```

問題がなければ再起動します。

```bash
$ sudo nginx -s reload
```

これで Tor からのアクセスを制限することができます。

設定が正しいかどうかを確認するには、後述の「設定が正しいかどうか確認」を参照してください。

# 方法 2: geo ディレクティブで変数を割り当て、if ディレクティブで制限
もう一つの方法として、Tor exit ノードの IP アドレスからのアクセスの際に、固有に変数を割り当て、その変数の値によって処理を振り分ける、という方法です。

## geo ディレクティブとは
`geo` ディレクティブは、IP アドレス（とサブネットマスク）に基づき、変数に特定の値を割り振るためのディレクティブです。

参考: [nginxにおけるmapとその応用 - Qiita](http://qiita.com/cubicdaiya/items/d938f3354f424830630b#ngx_http_geo_module)

```nginx
geo $foo {
    default      0;
    192.168.0.1  1;
    192.168.0.2  1;
    192.168.1.1  2;
    192.168.1.2  2;
}
```

例として、上記の設定では、`192.168.0.1` または `192.168.0.2` からのアクセスの場合には変数 `$foo` に `1` が、`192.168.1.1` または `192.168.1.2` からのアクセスの場合には `2` が、それ以外の IP アドレスからのアクセスの場合には `default` の値である `0` が代入されます。プログラミング言語でいう switch 文に構文が似ていますね。

このように特定の IP アドレスに特定の値を割り振ることで処理を分岐させることができます。これを利用して、先ほどの方法 1 で紹介したように、別の設定ファイルに Tor exit ノードの IP アドレスを列挙しておき、それらの IP アドレスに特定の値を割り当てることで、処理を分岐させます。

## Tor exit ノードの IP アドレス一覧を取得
以下のコマンドを実行して拒否する IP アドレスの一覧を作成します。先ほどは `deny` を使用していましたが、今回は、IP アドレスの後ろに値を割り当てるので、少しファイルの内容が異なります。

```bash
$ curl https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1 | sed '/^#/ !s/$/  1;/g' > tor-exit-nodes
```

作成されたファイルが以下のようになっていることを確認してください。

```nginx
# This is a list of all Tor exit nodes from the past 16 hours that can contact 1.1.1.1 on port 80 #
# You can update this list by visiting https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1 #
# This file was generated on Sun Sep  3 07:04:10 UTC 2017 #
1.160.199.140  1;
1.160.207.95   1;
1.163.203.136  1;
# ...
```

:exclamation: 見栄えのために適切なスペースを入れています。

## Nginx の設定ファイルを編集
先ほどと同様に元々の Nginx の設定ファイルから読み込みます。以下のように設定します。

```nginx
http {
    geo $tor {
        default  0;
        include  tor-exit-nodes;
    }

    server {
        if ($tor) {
            return  403;
        }
        # ...
        # ...
    }
}
```

アクセス制限したい Web サイトの `server` コンテキストで

```nginx
if ($tor) {
    return  403;
}
```

とします。変数 `$tor` は、Tor exit ノードの IP アドレスにマッチする場合は `1`, そうでない場合には `0` となるので、`if` ディレクティブの処理は、`$tor` が `1` のとき、つまり Tor exit ノードの IP アドレスである場合に実行されます。`return 403` を処理するので、`deny` したときと同様に HTTP ステータスコード 403 Forbidden を返すので、方法 1 のときと同じく Tor からのアクセスを制限することができます。

## 有用性
この方法は、方法 1 のときに比べて、若干設定が煩雑である上に、アクセス制限したい Web サイト（`server` コンテキスト）すべてに対して設定する必要があるので、方法 1 で解決する場合はそちらをおすすめします。方法 1 は単に 403 Forbidden を返すことしかできないのに対し、方法 2 では、`server` コンテキストごとに異なる処理をすることができ、また、方法 1 よりも柔軟な処理を行うことができます。

たとえば、Tor からのアクセス制限の場合には A というエラー HTML ページを返却し、それ以外の、たとえば管理者ページなどに対するアクセス制限の場合には B というエラーページを返却したい、という場合には以下のように設定できます。

```nginx
server {
    location / {
        if ($tor) {
            return  403;
        }
        error_page 403  /tor.html;
    }

    location /.well-known {
        return  403;
        error_page 403  /403.html;
    }

    location = /tor.html {
        root  /var/www/html;
        internal;
    }

    location = /403.html {
        root  /var/www/html;
        internal;
    }
}
```

Tor からのアクセスの場合には、`/var/www/html/tor.html` がエラーページとして返され、`/.well-known` に対するアクセスの場合には（この場合は Tor からのアクセスかどうかに関わらず）`/var/www/html/403.html` がエラーページとして返されます。

このように IP アドレスごとに柔軟に処理を振り分けたいときなどには、`geo` ディレクティブと `if` ディレクティブによる分岐が有効です。

## Nginx の再起動
設定できたら、ミスがないか確認し、Nginx を再起動します。

```bash
$ sudo nginx -t
$ sudo nginx -s reload
```

# 設定が正しいかどうか確認
では、Tor からのアクセス制限ができているかどうかを実際に確認します。Tor Browser をインストールしていない場合は、[公式のダウンロードページ](https://www.torproject.org/download/download-easy.html.en)からダウンロードできます。ダウンロードしたら画面の指示に従ってインストールを完了させてください。

Tor からのアクセス制限を行った Web サイトに、通常のブラウザと Tor Browser の両方でアクセスします。通常のブラウザで通常通りのコンテンツが表示され、Tor Browser でエラーページが表示されれば成功です！

# まとめ
単に Tor からのアクセス制限をかけたい場合は方法 1 を、Tor からのアクセスによるエラーページと管理者ページなどへのアクセスによるエラーページを変えたい場合など、柔軟に処理を振り分けたい場合は方法 2 をお試しください。
