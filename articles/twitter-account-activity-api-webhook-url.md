---
title: "【エラーコード別解説】Twitter の Account Activity API の Webhook URL が登録できないときの解決法"
emoji: "🐤"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Twitter", "TwitterAPI", "AccountActivityApi", "Webhook", "Node.js"]
published: false
order: 72
---

# はじめに
Twitter の Account Activity API を使う機会があり、[こちらの記事](https://qiita.com/sbtseiji/items/7957de5db0987d9a6891) を参考に Webhook URL を登録しようとしたのですが、なかなか登録できず、丸一日ほど費やしてしまいました。

Webhook の登録はかなり罠があり、調べても解決法が全然出てこなかったため、この記事では、発生するエラーコードを紹介し、その原因と解決法について解説します。参考になりましたら幸いです。

# 正しい設定方法だけ見たい
[正しい設定方法](#正しい設定方法)

# 事前準備
Webhook URL を登録する際には POST リクエストを Twitter に送る必要があります。そのリクエストを送るために、本記事では [Postman](https://www.postman.com) を利用します。あらかじめアカウント登録し、デスクトップ版アプリをインストールしておいてください。

cURL でもできる気がしますが、罠が多すぎていちいちパラメータをいじるのがめちゃくちゃ大変だったので Postman の使用をおすすめします。

## アカウント登録
アカウントを持っていない場合は [こちら](https://www.postman.com) からアカウントを作成してください。

## アプリのインストール
アカウント登録またはサインイン後に `Workspace` に行き、画面右下の `Desktop Agent` から `Download desktop agent` をクリックしてダウンロードしてください。
![スクリーンショット 2020-11-20 13.22.17.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/f22fd622-3957-f423-a44e-3aad75451569.png)

または、macOS をお使いの方は Homebrew Cask からインストールすることもできます。

```shell
$ brew cask install postman
```

その後、アプリを起動し、サインインしてください。

### アプリをインストールする必要がありますか？ ブラウザではダメですか？
Postman は Web 版で使用することもできます。しかし、ブラウザで検証したところ、CORS の制約に引っかかってしまいリクエストを送信することができませんでした。そのためアプリ版を使用する必要があります。

# 目次
発生したエラーコードの解説だけ知りたい方は以下の目次をご活用ください。

- [エラーコード 32](#エラーコード-32)
- [エラーコード 261](#エラーコード-261)
- [エラーコード 89](#エラーコード-89)
- [エラーコード 200](#エラーコード-200)
- [エラーコード 357](#エラーコード-357)
- [エラーコード 34](#エラーコード-34)
- [エラーコード 131](#エラーコード-131)
- [エラーコード 214](#エラーコード-214)

# エラーコード 32
エラーメッセージは `Could not authenticate you` です。「認証できませんでした」ということなのですが、理由が全く書かれていないためこれだけではわかりません。

```json
{
 "errors": [
 {
 "code": 32,
 "message": "Could not authenticate you."
 }
 ]
}
```

[公式のトラブルシューティング](https://developer.twitter.com/en/support/twitter-api/error-troubleshooting) を見ても「リクエストの認証データに問題がある」ということしかわからず、認証データの「どこ」に問題があるかはわかりません。
![スクリーンショット 2020-11-19 22.44.01.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/4bd71cff-4879-82ee-7a8a-2c02c3ad470f.png)

ネットで調べてみると、このエラーで苦しんでいる人が多くいるようでした。何を隠そう、自分もこのエラーで苦しみました。

## 原因
このエラーが発生する原因として考えられるのは、**Webhook URL をクエリパラメータとして設定していること** です。つまり、リクエストの URL を、以下のように指定しているためです。

```
https://api.twitter.com/1.1/account_activity/all/:ENV_NAME/webhooks.json?url=https%3A%2F%2Fyour_domain.com%2Fwebhook%2Ftwitter
```

`:ENV_NAME` には、設定した Dev environment label が入ります。何を意味しているかわからない場合は「[エラーコード 200](#エラーコード-200)」の解説をご覧ください。

[公式ドキュメント](https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium) にはクエリパラメータとして Webhook URL を指定する例が載っているのでこれが正しそうな気がしますが、なぜかこれではうまくいきません。

## 解決方法
これの解決方法は、**POST リクエストの Body にこのパラメータを入れること** です。つまり、
![スクリーンショット 2020-11-20 13.54.52.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/e126caac-4c82-6890-d556-6efd4b6bd26c.png)
**↑ こうではなく**
![スクリーンショット 2020-11-20 13.56.20.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/447548bf-cdec-b3c7-269f-83c5f4f91b40.png)
**↑ こうしてください**。

`Body` タブを開き `x-www-form-urlencoded` を選択して、`KEY` に `url`、`VALUE` にあなたの Webhook URL を指定してください。

このときの注意点として、**Webhook URL はパーセントエンコーディングしてはいけません**。上記の例で説明すると、`https%3A%2F%2Fyour_domain.com%2Fwebhook%2Ftwitter` ではなく `https://your_domain.com/webhook/twitter` と記載してください。

# エラーコード 261
エラーメッセージは `Application cannot perform write actions` です。書き込み権限がないというエラーです。

```json
{
 "errors": [
 {
 "code": 261,
 "message": "Application cannot perform write actions. Contact Twitter Platform Operations through https://help.twitter.com/forms/platform."
 }
 ]
}
```

エラーメッセージに「Twitter プラットフォームオペレータに連絡してください」とありますが、アカウントが凍結したりアプリが停止処理を受けていない限りは連絡しても解決しません。そもそもまだ Webhook URL の登録すらできていないのでアプリが停止処理を受けているなんてことはふつうありえません。

## 原因
このエラーが発生する原因として考えられるのは、**アプリに書き込み権限を与えていないこと** です。

## 解決方法
[Twitter Portal Dashboard](https://developer.twitter.com/en/portal/dashboard) にアクセスし、アプリの権限を変更してやります。

左カラムの `Projects & Apps` のタブを開き、使用しているプロジェクトまたはアプリを開き、`App permissions` を確認します。ここが `Read only` になっている場合は右上の `Edit` をクリックして権限を変更します。
![スクリーンショット 2020-11-20 14.13.24.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/0ceaf50a-9d2e-1918-2797-4d3281fe0522.png)

一番下の `Read + Write + Direct Messages` を選択して保存します。
![スクリーンショット 2020-11-20 14.18.00.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/57a56bd7-5637-eb3f-b84a-fe346a172ed7.png)
DM の権限がいらない場合は、おそらく `Read and Write` でも問題ないかもしれませんが、試していません。少なくとも `Read` ではダメです。

次に、`Keys and tokens` のタブをクリックし、`Access token & secret` の権限を確認します。先ほど `App permissions` で `Read only` になっていた場合は、権限修正後もここが `Read only` になっているかと思います。その場合は `Regenerate` をクリックしてトークンを再発行します。
![スクリーンショット 2020-11-20 14.18.28.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/d54ffe31-e389-a9e5-6fbe-eb090c88beaf.png)
トークンが変わるので、再度 Webhook URL 登録のリクエストを送る際に忘れずにトークンを変更してください。

# エラーコード 89
エラーメッセージは `Invalid or expired token` です。トークンが無効か期限切れであるというエラーです。

```json
{
 "errors": [
 {
 "code": 89,
 "message": "Invalid or expired token."
 }
 ]
}
```

## 原因
おそらくこれは先ほどのエラーコード 261 の解決法の手順でトークンを変更したのを忘れていた場合に発生すると思います。

## 解決方法
`Regenerate` を実行したあとはキーやトークンが変わるので忘れずに変更してください。

# エラーコード 200
エラーメッセージは `Forbidden` です。これまたシンプルなメッセージですね。シンプルすぎて原因が不明です。

```json
{
 "errors": [
 {
 "code": 200,
 "message": "Forbidden."
 }
 ]
}
```

## 原因
このエラーが発生する原因として考えられるのは、**Account Activity API の Dev environment label を、認証しようとしているアプリに紐づけていないためです**。何を言っているのかわからないかと思いますのでスクリーンショットで解説します。

## 解決方法
左カラムの `Products` のタブを開き、`Dev Environments` を開きます。すると 3 つの環境をセットできる画面が表示されます。そのうちの `Account Activity API / Sandbox` の項目を見てください。まだ何も設定していない場合は `NOT SET UP` と表示されているはずです。その場合は `Set up dev environment` をクリックし、環境をセットアップしてください。
![スクリーンショット 2020-11-20 14.41.17.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/0442c2bb-e90b-3199-2dca-471a43749454.png)

`Dev environment label` と `App` を設定するダイアログが表示されます。`Dev environment label` には任意の名前、`App` は使用しているプロジェクトまたはアプリを選択します。
![スクリーンショット 2020-11-20 14.42.54.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/208b646c-2e0d-def9-cfab-b69c172f8b0b.png)
`Dev environment label` は任意と言いましたが、URL の一部となるため、わかりやすい名前にするのが良いです。本番環境で使用するつもりのアプリなら `prod` や `production`、開発環境で使用するつもりなら `dev` や `development` などです。

とりあえずテストで使うなら `test` としても良いですが、**一度設定してしまうと、あとから環境を作り直しても同じ Dev environment label 名は使用することができない** そうなので十分注意してください。

そして、ここで設定した Dev environment label を、Webhook URL を登録する POST リクエストの URL の `:ENV_NAME` の部分に当てはめます。

```
https://api.twitter.com/1.1/account_activity/all/:ENV_NAME/webhooks.json
```

たとえば Dev environment label を `prodcution` とした場合、

```
https://api.twitter.com/1.1/account_activity/all/production/webhooks.json
```

としてください。

# エラーコード 357
エラーメッセージは `url: queryParam is required` です。Webhook URL が設定されていないのが原因です。

## 原因
このエラーが発生する原因として考えられるのは、主に Webhook URL を指定し忘れているか、指定するキーが間違っていることです。

## 解決方法
Postman を使用している場合は、Webhook URL のパラメータにチェックが入っていることと、`KEY` を間違えていないことを確認してください。正しい `KEY` は `url` です。
![スクリーンショット 2020-11-20 15.35.51.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/9b26b653-868b-220a-7051-3d76a1c7a3a2.png)

# エラーコード 34
エラーメッセージは `Sorry, that page does not exist` です。ページが存在しないというエラーです。

```json
{
 "errors": [
 {
 "message": "Sorry, that page does not exist",
 "code": 34
 }
 ]
}
```

## 原因
これはおそらく URL の `:ENV_NAME` の部分をそのままにしているパターンです。
![スクリーンショット 2020-11-20 15.43.06.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/a5a89c81-6992-bac6-7961-6fe3aaa353fb.png)

## 解決方法
`:ENV_NAME` には Dev environment label を指定します。詳細は「[エラーコード 200](#エラーコード-200)」の解説を確認してください。

# エラーコード 131
エラーメッセージは `Internal error` です。その名の通り内部エラーです。エラーが発生してエラー内容が「内部エラー」って何かのとんちですかね？

```json
{
 "errors": [
 {
 "message": "Internal error",
 "code": 131
 }
 ]
}
```

## 原因
これはおそらく Webhook URL をサンプルのまま書いているパターンです。
![スクリーンショット 2020-11-20 16.39.03.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/1e8d4ac1-28d9-3ed0-1846-34a7026142ee.png)

## 解決方法
`https://your_domain.com/webhook/twitter` はあくまで例なので、実際に自分が用意した Webhook URL を使用してください。

# エラーコード 214
エラーコード 214 は原因によって 4 種類のエラーメッセージが発生しました。一つずつ解説します。

## Unable to connect during CRC GET request
エラーメッセージは `Unable to connect during CRC GET request` です。「こちらが指定した Webhook URL に Twitter が GET リクエストを送信したところ、GET リクエストが送信できなかった」というエラーです。

```json
{
 "errors": [
 {
 "code": 214,
 "message": "Unable to connect during CRC GET request."
 }
 ]
}
```

### 原因
これの原因として考えられるのは、Webhook URL が間違っていて Webhook 先のサーバにアクセスできないということです。Postman で Webhook URL として指定した URL をコピーしてその後ろに `?crc_token=foo` とつけてブラウザでアクセスしてください。たとえば以下のような URL です。

```
https://your_domain.com/webhook/twitter?crc_token=foo
```

このときブラウザでは以下のように表示されることが期待されます。

```json
{"response_token":"sha256=2rzGn72Vut3ALp+QtkkTgnQ/dE3tmn/HXT+XThpve4B="}
```

もし Web サイトにアクセスできなかった場合はこのエラーメッセージに該当するはずです。ドメインが間違っていたり、DNS の設定がまだ反映されていなかったり、自分で設定した Webhook 先のサーバがダウンしていたりなどが原因として挙げられます。

## Non-200 response code during CRC GET request (i.e. 404, 500, etc)
エラーメッセージは `Non-200 response code during CRC GET request (i.e. 404, 500, etc)` です。「こちらが指定した Webhook URL に Twitter が GET リクエストを送信したところ、200 OK ではない HTTP ステータスが返ってきた」というエラーです。

```json
{
 "errors": [
 {
 "code": 214,
 "message": "Non-200 response code during CRC GET request (i.e. 404, 500, etc)."
 }
 ]
}
```

[Unable to connect during CRC GET request](#unable-to-connect-during-crc-get-request) と同じように Webhook URL の後ろに `?crc_token=foo` とつけてアクセスした際に 404 Not Found や 500 Internal Server Error などが表示されるはずです。

### 原因
おそらくこれは Nginx などの Web サーバの設定が間違っているか、Webhook を受け付けるスクリプトの実装が間違っているかです。どちらもサーバのログを見てエラー内容を調べる必要があります。

### 参考スクリプト
ぼくが使用した Node.js のスクリプトを載せておきます。Node.js で実装しましたが、他のプログラミング言語でも問題ありません。参考にしてみてください。

```javascript:index.js
require('dotenv').config();

const express = require('express');
const app = express();
const port = 5000;
const crypto = require('crypto');

app.get('/webhook', (req, res) => {
 console.log('GET /webhook');
 const hmac = crypto.createHmac('sha256', process.env.CONSUMER_SECRET).update(req.query.crc_token).digest('base64');
 res.send('{"response_token":"sha256=' + hmac + '"}');
});

app.listen(port, () => {
 console.log(`App listening at http://localhost:${port}`);
});
```

```plaintext:.env
CONSUMER_SECRET=<YOUR_CONSUMER_SECRET>
```

```shell:command
$ npm init
$ npm install express --save
$ npm install dotenv --save
$ node index.js
```

事前に Express.js や dotenv のインストールが必要です。また、`http://localhost:5000` を Nginx 等でリバースプロキシする必要があります。

## Webhook URL does not meet the requirements
エラーメッセージは `Webhook URL does not meet the requirements` です。Webhook URL が要件を満たしていないというエラーです。

```json
{
 "errors": [
 {
 "code": 214,
 "message": "Webhook URL does not meet the requirements. Please use HTTPS."
 }
 ]
}
```

### 原因
主な原因としては 2 つ考えられます。

#### HTTPS 対応していない
エラーメッセージに `Please use HTTPS` と書かれていることからもわかる通り、Webhook URL は HTTPS でなければなりません。もし HTTPS になっていない場合は Let’s Encrypt などを使用して HTTPS 対応をしてください。

Nginx + Let’s Encrypt での対応方法については以前に記事にまとめていますので参考にしてください。
[Nginx+リバースプロキシ環境でWebサーバを停止させずに Let's Encrypt (Certbot) のSSL証明書を自動更新する](https://qiita.com/noraworld/items/a2b4a5fabd7bf6ca25e0)

#### URL の指定方法が間違っている
有効な URL が指定されていないとこのメッセージが表示されます。ご丁寧にも `Please use HTTPS` と書かれているのが逆にややこしいですが、`http://` になっているだけでなく、それ以外の無効な URL だった場合も同様のメッセージなので、正しい URL かどうかを確認してください。

よくありがちなのは、パーセントエンコーディングしてしまっている場合です。「[エラーコード 32](#エラーコード-32)」のときにも書きましたが、POST リクエストの Body に Webhook URL を含める際に、パーセントエンコーディングしてはいけません。

![スクリーンショット 2020-11-20 16.30.29.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/0e29299b-5e10-a6ea-4a63-5a10e075b21e.png)
**↑ こうではなく**
![スクリーンショット 2020-11-20 16.31.19.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/45cf0dd9-fd74-2ba3-ff3c-0510ea3458c1.png)
**↑ こうしてください**。

## Too many resources already created
エラーメッセージは `Too many resources already created` です。すでに Webhook URL の登録が完了しています。おめでとうございます 🎉

```json
{
 "errors": [
 {
 "code": 214,
 "message": "Too many resources already created."
 }
 ]
}
```

補足しておくと、無料版[^1]では [1 つしか Webhook URL を設定することができません](https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/subscribe-account-activity/overview)。

2 つ以上の Webhook URL を登録したかったら [有料版を契約する](https://developer.twitter.com/en/pricing/aaa-all) 必要がありますが、有料版は一番安くても $339 / month (約 35,000 円 / 月)[^2]なので一般人には手が出せませんね……。おそらくこれは企業向けだと思います。

なので、遊びで複数のサービスやアプリを作りたくて、なおかつ Account Activity API を使用する場合は、一つの Webhook URL を使い回すことになります。登録した Webhook URL に Twitter からアクティビティがリアルタイムで届くので、それを受け取るスクリプトを用意しておいて、受け取ったデータを各サービスやアプリにパススルーするような実装になると思います。

[^1]: 無料版は Free Premium という名前らしいですが、無料なのにプレミアムってなんか不思議なネーミングですね。
[^2]: 2020 年 11 月 20 日現在

# 正しい設定方法
正しい設定方法でまとめると、以下のようになります。以下は Postman での設定例です。

## Authorization
まず `Authorization` タブを開きます。そして以下の通りにパラメータ等を指定します。
![スクリーンショット 2020-11-20 16.47.50.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/6fe54164-12aa-9293-5a98-84e07114c371.png)

| 番号 | 値 | 補足 |
|:---:|---|---|
| ① | `POST` ||
| ② | Dev environment label に設定した値 | 詳しくは「[エラーコード 200](#エラーコード-200)」の解説を参照 |
| ③ | `OAuth 1.0` ||
| ④ | `Request Headers` ||
| ⑤ | Signature Method は `HMAC-SHA1` を指定 ||

なお、`Consumer Key` と `Consumer Secret` というのは [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) の画面でいう `API key & secret` のことです。`View Keys` をクリックすれば見ることができます。
![スクリーンショット 2020-11-20 17.02.05.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/d8589c89-185c-df5d-5fcb-3cdee2b10d99.png)
`Access token & secret` は一度だけしか表示されずあとから見ることができませんので、忘れてしまった場合は `Regenerate` で再発行してください。

## Headers
次に `Headers` タブを開きます。そして以下の通りにパラメータを指定します。
![スクリーンショット 2020-11-20 17.08.39.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/29ec8395-dd91-b01e-e8cc-92295992e1fb.png)

| KEY | VALUE |
|---|---|
| `Content-type` | `application/x-www-form-urlencoded` |

これは設定しなくてもうまくいくかもしれません。うまくいかなかったら設定してみてください。

## Body
最後に `Body` タブを開きます。そして以下の通りにパラメータ等を指定します。
![スクリーンショット 2020-11-20 17.13.17.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/b2edf5ee-1cad-a985-050e-453d91ccf784.png)

| 番号 | 値 | 補足 |
|:---:|---|---|
| ⑥ | `x-www-form-urlencoded` ||
| ⑦ | KEY に `url` ||
| ⑧ | VALUE に Webhook URL | `https://your_domain.com/webhook/twitter` ではなく、自分の Webhook URL を設定すること |

# 終わりに
結構罠があって大変でしたがなんとか Webhook URL を登録することができたと思います。エラーコードで調べてもあまり大した情報がないということと、Twitter のトラブルシューティングやドキュメントページが丁寧なようでいまいちよくわからない内容だったということがあって原因を解決するのに時間がかかりました。

特に罠だと思ったのが、[公式ドキュメント](https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium) にはクエリパラメータとして Webhook URL を指定する例が載っているのにこれではうまくいかないという点ですね。

それから、Twitter のアプリを登録するページの UI や URL が昔とだいぶ変わっていて、現在の UI で紹介されている記事がほとんど見つからなかったのも地味に戸惑ったポイントでした。

この記事が参考になりましたら幸いです。

# 参考サイト
- [TwitterのAccount Activity APIとwebhookを使用する](https://qiita.com/sbtseiji/items/7957de5db0987d9a6891)
- [TwitterのAccount Activity APIとwebhookでDM自動応答Botを作成する](https://qiita.com/sbtseiji/items/f21398495cc2841fc4a5)
- [TwitterのAccount Activity APIを叩くnodejsコード](https://qiita.com/Fushihara/items/79913a5b933af15c5cf4)
- [Twitter API 1.1でなぜか"Could not authenticate you"と言われる](https://fkm.hatenablog.com/entry/20130216/p1)
- [Twitter Account Activity API を使ってリプライ自動返信する(Go)](https://kotaroooo0-dev.hatenablog.com/entry/2020/06/25/005036)
