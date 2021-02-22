---
title: "Nginxでトレイリングスラッシュとファイル拡張子を削除する秘伝わざ"
emoji: "💨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nginx", "トレイリングスラッシュ", "拡張子"]
published: false
order: 30
---

# はじめに
Nginxのファイル配信のみでWebサイトを構築するとき、トレイリングスラッシュとファイル名を表示させないようにする方法を紹介します。

## トレイリングスラッシュとは
トレイリングスラッシュは、パスの末尾につくスラッシュ記号のことです。

```
http://example.com/about
http://example.com/about/
```

上がトレイリングスラッシュなしで、下がトレイリングスラッシュありです。

トレイリングスラッシュの有無には明確なルールがあります。ディレクトリの中にある`index.html`や`index.php`を配信するとき、よく`index.html`や`index.php`が省略されますが、この省略された状態のパスにはトレイリングスラッシュがつくことになっています。

つまり、上記の例だと、`about`というディレクトリの中の`index.html`を配信するときにトレイリングスラッシュがつきます。

一方で、パスの末尾がファイル名で終了していた場合はトレイリングスラッシュがつきません。たとえば上記の例だと、`about`というファイルを配信する場合はトレイリングスラッシュがつきません。また、Nginxの設定で`try_files`を利用するとファイルの拡張子を省略した場合にもファイルを配信するようにできます。`try_files`を設定すれば、たとえば、`about.html`というファイルを配信するときに`http://example.com/about`としてアクセスすることができます。この場合も末尾のパスがファイル名を意味するのでトレイリングスラッシュがつきません。

## 気になる点
上記のようにトレイリングスラッシュありなしにはルールがあるため、好みのほうを自分で選択するものではないのですが、個人的にはどうしてもこのトレイリングスラッシュが気になってしまいます。サーバサイドのアプリケーションフレームワークを使ってルーティングをすればトレイリングスラッシュなしにすることができますが、Nginxのファイル配信だけでも同様のことをしたいのです。

また、`index.html`や`about.html`など、ファイル名を省略してアクセスした場合でも、下記の例のように明示的にファイル名をつけてアクセスすることができてしまうのも、なんとなくすっきりしないと感じてしまいます。

```
http://example.com/about.html
http://example.com/about/index.html
```

それから細かいことではありますが、ディレクトリの中の`index.html`を配信する際に、もし`index.html`が存在しない場合は、`404 Not Found` ではなく `403 Forbidden` を返してしまうのも気になります。

* トレイリングスラッシュをなしにしたい
* ファイル拡張子を隠蔽したい
* ディレクトリ参照でファイルが見つからないとき404を返す

今回はこの3つを実現するためのNginxの設定を紹介します。

# 環境
* Nginx 1.10.2

# 実現方法
今回の個人的な解決法では、HTML（CSSやJSなど含む）のみの場合とPHPを使用する場合とで設定が変わります。

## HTMLのみの場合
Nginxの設定ファイルを以下のようにしてください。`http`コンテキストは省略しています。

```nginx:nginx.conf
server {
    listen       80;
    server_name  example.com;

    root       /home/username/www;
    index      index.html;
    try_files  $uri.html $uri/index.html $uri =404;

    location ~ \.html$ {
        internal;
    }

    location ~ index$ {
        internal;
    }

    error_page  404              /404.html;
    error_page  500 502 503 504  /500.html;

    location = /404.html {
        root  /home/username/error_page;
        internal;
    }
    location = /500.html {
        root  /home/username/error_page;
        internal;
    }
}
```

`example.com`にはドメインを、`/home/username/www`にはファイルを配信するルートディレクトリ（ドキュメントルート）を設定します。また、`404.html`や`500.html`を配信するディレクトリは`/home/username/www`以外のディレクトリ（上記の例では`/home/username/error_page`）にしてください。そしてその中に、`404.html`と`500.html`を置き、それぞれのエラーページを作ります。

ポイントは`try_files`です。通常は、`index`に`index.html`を設定することでディレクトリの中の`index.html`を探して配信してくれるのですが、これだけだとトレイリングスラッシュがついてしまいます。

`try_files`に`$uri/index.html`を設定することでトレイリングスラッシュなしでもアクセスできるようになります。また、`$uri.html`を設定することでファイルの拡張子を省略した場合でも、`.html`がつくファイルを探して配信してくれるようになります。最後の`=404`は、このいずれにも該当しない場合は `404 Not Found` を返すという意味になります。これで、ディレクトリ参照のときにファイルが見つからなかったら`403`ではなく`404`になります。

上記の設定だとトレイリングスラッシュをなしにしたり、ファイル名を省略することが出来ますが、ファイル名をつけた場合にも同様に配信されてしまいます。それを解決するのが `location ~ \.html$` ディレクティブです。

これは、パスの末尾が`.html`で終わっていた場合に該当します。つまり`http://example.com/about.html`のようにアクセスした場合に該当します。これを配信しないようにするために`internal`を設定しています。`internal`は、Nginxが内部的に該当ファイルを探して見つかった場合には配信しますが、直接そのファイルを参照するようなGETリクエストがあった場合には配信しません。たとえば`http://example.com/about`のようにアクセスして、Nginxが`about.html`を参照する場合は配信されますが、`http://example.com/about.html`のように直接アクセスした場合は配信されません。

また、`location = /404.html` と `location = /500.html` では、エラーページを返す際に、直接アクセスしたときにそのまま配信されないように設定しています。たとえば、`http://example.com/500.html`でアクセスするとサーバエラーでもないのにサーバエラーのページが表示されてしまうので、これを制御します。`http://example.com/404.html`の場合はある意味 `Not Found` なので要らないんじゃないかと言う人もいますが、表示されるページが同じでも`internal`を設定しない場合は `200 OK` としてレスポンスを返してしまうので、つけるほうが好ましいです。

ちなみに`404.html`や`500.html`のファイルを別のディレクトリに設置しているのは、仮に同じディレクトリに配置してしまうと、`http://example.com/404`や`http://example.com/500`でもアクセスできるようになってしまい、それらに`internal`をつけることを考えると設定が増えてしまうため、敢えて別ディレクトリで管理するようにしています。また、このようにエラーページ専用のディレクトリを設けることで、複数のドメインでエラーページを使いまわしできるというメリットもあります。

`location ~ index$` に関してですが、これは`http://example.com/index`でアクセスしたパターンでの制御です。`http://example.com/index.html`では`\.html$`にマッチするので配信されませんが、`http://example.com/index`の場合は配信されてしまうので追加しています。

以上で、トレイリングスラッシュなし、ファイル拡張子の隠蔽、403 Forbidden を返さない設定ができました。試しに以下のようなディレクトリ構成をして確認してみましょう。

```
/home/username/www
├── about
│   └── index.html
├── empty
├── index.html
└── profile.html
```

以下のパスでは、`404 Not Found` となりファイルが配信されません。

```
http://example.com/index.html
http://example.com/index
http://example.com/profile.html
http://example.com/profile/
http://example.com/about/index.html
http://example.com/empty
http://example.com/empty/
http://example.com/404
http://example.com/404.html
http://example.com/500
http://example.com/500.html
```

以下のパスでは `200 OK` となりファイルが配信されます。

```
http://example.com
http://example.com/about
http://example.com/about/
http://example.com/profile
```

上記を見て、3つめの例ではトレイリングスラッシュがありますが、`about`ディレクトリの中の`index.html`を配信する際には、トレイリングスラッシュありなし、どちらでもアクセスできるようになります。一方で、`profile.html`を配信する際にはトレイリングスラッシュありではアクセスできません。

これに関してですが、トレイリングスラッシュの有無は、一般的には無視されがちなので、ユーザがトレイリングスラッシュをつけてアクセスして `404 Not Found` を返してしまうなど混乱の元になりますので、トレイリングスラッシュありでもアクセスできるようにはしておいたほうが良いというのが個人的見解です。ちなみに`try_files`を設定しない場合だと、`http://example.com/about`でアクセスしたときに`http://example.com/about/`にリダイレクトされてしまうので、トレイリングスラッシュなしでアクセスできません。

トレイリングスラッシュありでのアクセスを許容したくない場合は、`about.html`のように設定してください。なお、`about.html`と`about`ディレクトリを混在させると、トレイリングスラッシュをつけた場合とつけない場合で別々のファイルが参照されてしまうので注意してください。

## PHPを使用する場合
以下のように設定してください。

```nginx:nginx.conf
server {
    listen       80;
    server_name  example.com;

    root       /home/username/www;
    index      index.php;
    try_files  $uri.php $uri/index.php $uri =404;

    location / {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
        try_files      $uri.php $uri/index.php $uri =404;
    }

    location ~ \.(css|js|txt)$ {
        root   /home/username/www;
    }

    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
        internal;
    }

    location ~ \.html$ {
        internal;
    }

    location ~ index$ {
        root           /home/username/www;
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
        internal;
    }

    error_page  404              /404.html;
    error_page  500 502 503 504  /500.html;

    location = /404.html {
        root  /home/username/error_page;
        internal;
    }
    location = /500.html {
        root  /home/username/error_page;
        internal;
    }
}
```

この設定ファイルには、2つの注意点があります。

* `.php`以外に配信したいファイルがある場合は、その拡張子を別途追加する必要がある
* `.html`は配信できない

`\.php`や`index$`、エラーページの設定などはHTMLの場合と同じです。`fastcgi`等の設定はPHPを配信するために必要なだけなのでここでは説明は省略します。

`fastcgi`に関する設定は`server`ディレクティブ直下に記述することができないため、`location /` ディレクティブに記述しています。そのときのポイントとして、`location`ディレクティブの中にも`try_files`を入れることです。他の`location`ディレクティブにマッチしないときはすべて `location /` にマッチしますが、ここで`fastcgi`によってPHPが解釈されますが、`try_files`がないと、`try_files`によってマッチしたことがPHP側で解釈されないので、配信してはいけないものだと判断して、`403 Forbidden` を返してしまいます。

`location \.(css|js|txt)$` は`.php`以外のファイルを配信するときの設定です。先ほど説明した通り、`location /`以外の複数ある`location`ディレクティブのうち、どれにもマッチしない場合は`location /`にマッチします。そして`location /`には`fastcgi`の設定が書かれているため、すべてPHPとして解釈されます。CSSファイルやJavaScriptファイルを配信しようとしたときに、`location /`にマッチしてしまうとPHPとして解釈されてしまうので `403 Forbidden` となってしまいます。

なので、css, js, txt 以外に配信したいファイルがある場合は、各自で追加してください。これに関してはスマートではないですが他に良い設定が思い浮かばなかったです。もしもっとスマートな設定法がありましたら教えていただけると嬉しいです。

この設定では、`.php`と`.html`を混在させて使用することが困難になっています。そのためエラーページ以外のHTMLは配信することが出来ません。`404.html`と`500.html`に関してはディレクトリが異なるのでエラーになったときに限り配信することができます。通常のHTMLファイルを配信する際は、拡張子を`.html`から`.php`とすることで配信することが出来るようになります。こちらもスマートな方法ではないですが、PHPファイルは、PHPのタグを使わなければ実質HTMLファイルのようなものなので、特に支障はないかと思います。

以上でPHPを使用する場合の設定ができました。確認例はHTMLの配信の場合と同様ですが、CSSやJavaScriptのファイルを作成して、それらのファイルが参照できることを確認してください。

# 注意点
ブラウザは、ステータスコードが 301 Moved Permanently だと、次回以降、キャッシュが削除されるまでリダイレクト前のURLにはアクセスしないという仕様があります。

Nginxの設定を間違えて、`http://example.com/about`でアクセスした際に`http://example.com/about/`に301リダイレクトしてしまったとします。その後、設定ファイルを正しいものに書き換えてNginxをリロードしたとしても、ブラウザは相変わらず`http://example.com/about/`のみを参照してしまうことがあります。設定が正しかったとしてもトレイリングスラッシュがついてしまうことがあるので注意です。

これの解決策としては、この設定を試す際にはブラウザのシークレットモードを使用し、Nginxの設定を書き換えた場合はシークレットモードのウィンドウを一旦閉じて、もう一度シークレットモードのウィンドウを開きアクセスすると良いです。これによりブラウザは301リダイレクトを記憶しないので、設定が合っていた場合はトレイリングスラッシュなしでアクセスできるようになります。

ブラウザを起動してから、シークレットモードを使用せずに、検証用ドメインで、リダイレクトが発生するようなURLにアクセスしてしまった場合は、一度ブラウザを再起動することが必要かもしれません（未検証）

# 誤った設定
ネットで "nginx remove trailing slash" などで検索するとなぜかほとんどのサイトでは以下のように設定するように紹介されています。

```nginx:nginx.conf
server {
    listen      80;
    server_name example.com;

    rewrite  ^/(.*)/$ /$1 permanent;
}
```

要点となる部分だけを記述しています。

上記は`rewrite`を使って、制御する方法です。条件が`^/(.*)/$`なので、トレイリングスラッシュがある場合にマッチします。条件がマッチしたときにリダイレクトするパスが`/$1`なので、トレイリングスラッシュがないパスにリダイレクトします。`permanent`の有無はステータスコードが`301`か`302`かの違いです。

トレイリングスラッシュがあった場合はないものにリダイレクトする、という設定なので、一見正しい設定で、しかもたった1行でシンプルなのですが、実際にこれで試してみるとリダイレクトループが発生します。

先ほども述べましたが、Nginxは、たとえば`about`ディレクトリの中の`index.html`を参照する際に、`http://example.com/about`のようにトレイリングスラッシュなしでアクセスすると、`http://example.com/about/`に301リダイレクトするようになっています。これが無限ループを発生させる理由で、トレイリングスラッシュなしだとトレイリングスラッシュありにリダイレクトし、トレイリングスラッシュありだと上記の設定でトレイリングスラッシュなしにリダイレクトするので、トレイリングスラッシュありなしを永遠にリダイレクトしてしまうので、ブラウザがリダイレクトループを検出して、エラーとなってしまいます。

上記の設定だとうまくいかないのに、なぜか多くのサイトでこの方法が紹介されているので、もしかしたら、古いバージョンのNginxではこれでうまくいったのかもしれません（実際に、参考にしたサイトはどれも2〜3年前の記事ばかりでした）

また、`try_files`を追加する例も多く見かけましたが、どのサイトも設定が不十分で、ディレクトリ内の`index.html`を配信する際にはやはりトレイリングスラッシュがついてしまうものが多かったです。

# SEOに対する見解について
いろんなサイトを見ている中で、「トレイリングスラッシュありとなしで両方同じコンテンツが表示される場合はGoogleがコピーコンテンツと認識する」という情報を見かけました。

この記事の設定だと、`about`ディレクトリに`index.html`があり、これを配信する際、`http://example.com/about`と`http://example.com/about/`どちらでもアクセスできるので、SEO的に問題なんじゃないかということが議論になります。

SEOに関しては詳しくないので、もしかしたらトレイリングスラッシュありなしで同じものが表示されるのはよくないことなのかもしれません。しかし、YouTube や GitHub, Twitter などの有名なサイトやRailsで作成したWebアプリケーションでは、トレイリングスラッシュありとなしで同じコンテンツが表示されます。

これは憶測ですが、トレイリングスラッシュありなしでコンテンツが重複していたとしても、それは検索エンジンとしても理解できるので特にペナルティにはならないと思われます。なので、個人的には特に問題がないと解釈しています。

もし、トレイリングスラッシュありとなしで両方同じものが表示されるのが気になる場合は、ディレクトリ内の`index.html`ではなく`about.html`のようなファイル配信にするか、トレイリングスラッシュをつけていた場合は`internal`を設定する、などの設定を追加して対応してください。

# まとめ
Nginxのトレイリングスラッシュに関する情報はたくさんありましたが、どれを試しても自分の実現したいことに合致するサイトは見つらなかったので、結局いろいろ設定ファイルをいじりまくりながら自己解決しました。

Nginxは設定が簡便で非常に便利なので個人的にはとても気に入っています。ですが、今回みたいに凝ったことをするといろいろ試行錯誤しないといけません。この記事での実現方法はベストプラクティスではないかもしれませんが、同じことを実現しようとしている人の参考になれば幸いです。
