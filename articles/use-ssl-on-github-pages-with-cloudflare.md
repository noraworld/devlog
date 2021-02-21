---
title: "GitHub Pages + CloudFlare で独自ドメインをSSL化する"
emoji: "🔖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["github-pages", "独自ドメイン", "cloudflare", "SSL", "HTTPS"]
published: true
order: 23
---

# はじめに
GitHub Pages に公開すると、`ユーザ名.github.io`または`ユーザ名.github.io/リポジトリ名`というドメインでスタティックなページが利用可能になります。

あらかじめGitHubから用意されたこれらのドメインはSSL(HTTPS)に対応しているのですが、独自ドメインを利用するとSSLが利用できなくなります。

そこで、間にCloudFlareを仲介させることで、GitHub Pages で独自ドメインを利用する際にSSLを利用できるようにします。

この記事は、「[CloudFlareでブログをHTTPS化](https://tbd.kaitoy.xyz/2016/07/01/https-support-by-cloudflare/)」を参考にさせていただきました。仕組みについても画像でわかりやすく説明されているので、詳しく知りたい方は参考にしてください。この記事の説明をベースに、実際に作業して異なった部分を編集して自分なりにまとめてみました。

## ドメインを取得
レジストラでドメインを取得してください。[ムームードメイン](https://muumuu-domain.com)や[GoDaddy](https://jp.godaddy.com)などがおすすめです。

# CloudFlareの登録
## アカウントを作成
https://www.cloudflare.com にアクセスして `Sign Up` からアカウントを登録してください。

## ドメインを登録
`Add Your First Domain Name` に登録したいドメインを登録してください。登録には1分ほど時間がかかります。その間、動画が再生されるので、動画を見ながらお待ち下さい。

## DNS設定
トラフィックをGitHubのサーバに向けるようにDNSの設定を行います。参考サイトでは`CNAME`レコードで登録していますが、Zone Apex (サブドメインではないドメイン。`www.example.com` ではなく `example.com` のこと) にはレコードの仕組み上、`CNAME`は登録できません。なので、サブドメインを利用する場合は`CNAME`でも良いですが、ここでは Zone Apex でも対応できるように`A`レコードでの登録の説明をします。

### Type
`A`を選択してください。

### Name
登録したドメイン (例: example.com) を入力してください。

### IPv4 address
`192.30.252.153`と`192.30.252.154`を登録してください。同時に設定するのではなく、一旦、`192.30.252.153`を登録したあとに、別の項目として、`192.30.252.154`を登録してください。

### TTL
`Automatic TTL` を選択してください。

### Traffic
雲のアイコンがあると思いますが、この雲がオレンジ色になっていることを確認してからレコードを登録してください。灰色になっている場合はクリックしてオレンジ色にしてください。

## プランの選択
CloudFlareは有料プランにするとさまざまな恩恵を得られますが、SSL化をするだけなら無料プランでもOKです。`Free Website` を選択して次に進みます。

## ネームサーバの確認
ここまで来るとCloudFlareがネームサーバを用意してくれます。おそらく2つのネームサーバが表示されていると思います。`Change Nameservers to:` に書かれている2つのネームサーバをどこかにメモしておきます。

# レジストラの設定
ClouFlareからネームサーバが与えられたらドメインを取得したレジストラのサイトに戻って、ネームサーバの設定を行います。ネームサーバの設定はレジストラによって設定ページが異なるのでここでは割愛します。だいたいは登録したドメインを選択してDNS設定などのページからネームサーバの設定ができるはずです。元々設定されているネームサーバを削除して、CloudFlareのネームサーバを2つ設定してください。

DNSサーバのキャッシュがクリアされ、サイトが表示されるようになるまでの時間はTTLの値で変更することができます。レジストラ側でTTLの変更ができない場合は、DNSサーバのキャッシュがクリアされるまでしばらくお待ちください。大抵は3600秒（1時間）ですが、場合によってはもっと長い可能性があります。

DNSサーバのキャッシュがクリアされ、ドメインがCloudFlareのサーバに向いたかどうかは、`dig`コマンドで確認することができます。

```bash
$ dig 登録したドメイン +nostats +nocomments ns

; <<>> DiG 9.8.3-P1 <<>> 登録したドメイン +nostats +nocomments ns
;; global options: +cmd
;登録したドメイン.                   IN  NS
登録したドメイン.             00000  IN  NS    なんとか.ns.cloudflare.com.
登録したドメイン.             00000  IN  NS    なんとか.ns.cloudflare.com.
なんとか.ns.cloudflare.com. 00000  IN  A     192.168.10.100
なんとか.ns.cloudflare.com. 00000  IN  A     192.168.10.101
なんとか.ns.cloudflare.com. 00000  IN  AAAA  0000:0000:0000:0::0000:0000
```

上記のようにCloudFlareのネームサーバが表示されていればDNSサーバのキャッシュがクリアされたことになります。CloudFlareのネームサーバになっていない場合はお待ちください。

# CloudFlareの設定
ここまでの設定で、GitHub Pages へのアクセスに対して、CloudFlareのサーバが仲介してくれるようになりました。ここからSSLの設定をしていきます。ネームサーバを確認したあと、次に進むとダッシュボードが表示されます。

## SSL
ダッシュボード内の`Crypto`タブをクリックすると`SSL`という項目があります。初期設定では`Full`となっていますが、`Flexible`に変更してください。

これでクライアントとCloudFlareサーバ間の通信は暗号化され、CloudFlareサーバとGitHubサーバ間は平文で通信を行います。`Full`だとCloudFlareとGitHub間も暗号化して通信されますが、GitHub側にはこちらが用意したドメインの証明書は存在しないのでSSLエラーになってしまいます。

## HSTS
同じく`Crypto`のタブに `HTTP Strict Transport Security (HSTS)` という項目があります。設定を変更しようとすると英語の文章が出てきますが、一番下の `I understand` にチェックを入れて次に進むと設定項目が表示されるので、以下のように設定してください。

### Enable HSTS (Strict-Transport-Security)
`On`に設定してください。

### Max Age Header (max-age)
`6 months (recommended)` に設定してください。

### Apply HSTS policy to subdomains (includeSubDomains)
サブドメインにも同様の設定を行いたい場合は`On`、サブドメインを使用しない場合は`Off`にしてください。あとから変更できるので、現状でサブドメインを使う予定がない場合は`Off`でOKです。

### Preload
`On`に設定してください。

### No-Sniff Header
`On`に設定してください。

## HTTPSへのリダイレクト
`Page Rules` のタブからルールを追加します。`Create Page Rule` をクリックします。URLを入力する欄に登録したドメインを入力します。`http://`からはじめてください。その下にある `Add a Setting` をクリックしてプルダウンメニューから `Always Use HTTPS` を選択して保存します。

これで`http://`でアクセスしても`https://`に自動的にリダイレクトされるようになります。なお、取得したドメインがCloudFlareのネームサーバに向いていないと `Always Use HTTPS` が表示されない場合があります。その場合はキャッシュがクリアされるまでお待ち下さい。

# GitHubへプッシュ
あとはGitHubにプッシュすれば、独自ドメイン + SSL + GitHub Pages が利用できるようになります。

GitHub Pages に関してですが、以下の3つの方法で公開することができます。

1. `ユーザ名.github.io` というリポジトリにプッシュする
2. `gh-pages`ブランチにプッシュする
3. `master`ブランチの`docs/`ディレクトリ以下にプッシュする

1つめの方法は一つのアカウントにつき一つしか使えません。ポートフォリオ等を公開する人が多いです。デフォルトのドメインは`ユーザ名.github.io`です。

2つめはどのような名前のリポジトリでも公開できますが、`master`ブランチとの差分をマージするのに手間がかかったりします。デフォルトのドメインは`ユーザ名.github.io/リポジトリ名`です。

3つめは基本的には2つめと同じですが、`master`ブランチにプッシュするのでブランチ間のファイルの管理が楽になります。デフォルトのドメインは2つめと同じです。

どれで公開するかはお好みで選んでください。今回は、3つめの方法で説明します。

## ページの作成
プッシュする作業ディレクトリ直下に `docs/`ディレクトリを作り、そこに GitHub Pages で公開したいスタティックなページを作ります。

## CNAMEの登録
`docs/`ディレクトリ内(ディレクトリ直下)に`CNAME`というファイルを作り登録したドメインを追加します。

```plain:CNAME
登録したドメイン
```

ちなみに`CNAME`というファイルを自分で作らなくても、リポジトリの `Settings > GitHub Pages > Custom domain` に登録したドメインを入力すれば、GitHubが自動で`CNAME`を生成して `Create CNAME` というコミットメッセージで勝手にコミットしてくれます。ただし、先に `GitHub Pages の設定`をしておく必要があります。

## プッシュ
GitHubでリポジトリを作成し、プッシュします。

## GitHub Pages の設定
作成したリポジトリのページに行き、`Settings`タブから `GitHub Pages` の項目に行きます。`Source`の項目で `master branch /docs folder` を選択して保存します。

# さいごに
ドメインがCloudFlareのネームサーバに向いていて、設定が間違っていなければ、SSL+独自ドメインで GitHub Pages に公開されているはずです。お疲れさまでした！

# 参考サイト
* [CloudFlareでブログをHTTPS化](https://tbd.kaitoy.xyz/2016/07/01/https-support-by-cloudflare/)
* [カスタムドメインの GitHub Pages で HTTPS を使う](http://qiita.com/superbrothers/items/95e5723e9bd320094537)
* [2016年新機能! GitHubのmasterブランチをWebページとして公開する手順](http://qiita.com/tonkotsuboy_com/items/f98667b89228b98bc096)
