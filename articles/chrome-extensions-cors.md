---
title: "Chrome 拡張機能の content_scripts で CORS を回避する方法"
emoji: "😇"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["JavaScript", "Chrome", "Extensions", "CORS", "API"]
published: true
order: 115
layout: article
---

# 注意
現在は [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/) が登場しているので、もしかしたら Manifest V3 とはやり方が異なるかもしれないが、備忘録として残しておく。Manifest V3 での方法については気が向いたらいずれ投稿する予定。



# 概要
Chrome 拡張機能の `content_scripts` のスクリプト内で `XMLHttpRequest` や `fetch` などの非同期通信を実行すると以下のようなエラーが発生する。

```
XMLHttpRequest cannot load https://example.com/. Origin chrome-extension://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx is not allowed by Access-Control-Allow-Origin
```

このエラーは CORS というセキュリティ機能によるもので、許可されていない異なるドメインから JavaScript 経由でアクセスしようとしたときにブロックされるというものである。

* [なんとなく CORS がわかる...はもう終わりにする。](https://qiita.com/att55/items/2154a8aad8bf1409db2b)
* [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)



# よくある対応内容
拡張機能からアクセスしたいドメインを `permissions` に追加すると送信できるようになる、という解決方法をネットでよく見かける。

```json
"permissions": [
  "https://example.com/*"
]
```

* [Chrome拡張でCORS対応](https://qiita.com/okmttdhr/items/09b34e9dadb9895092da)

実際、この `permissions` の追加は必要なのだが、これだけではうまくいかない。昔はこれだけでもうまくいったのかもしれないが、現在だとうまくいかない。



# 解決策
簡潔にまとめると、以下のフローでこの問題を解決することができる。上述した `permissions` に関してはすでに追加済みとする。

1. `manifest.json` の `background` にスクリプトを追加する
2. `content_scripts` で `chrome.runtime.sendMessage` を使い `background` に情報を伝達する
3. `background` で `chrome.runtime.onMessage.addListener` を使い `content_scripts` からの情報を受け取る
4. 受け取った情報をもとに非同期通信を行う
5. 必要に応じて結果を返して `content_scripts` で後処理を行う

以下、具体的に説明する。

## 1. `manifest.json` の `background` にスクリプトを追加する
`manifest.json` に以下を追加する。`permissions` や `content_scripts` やそれ以外の項目については割愛する。

```json
{
  // 省略

  "background": {
    "scripts": [
      "background.js"
    ],
    "persistent": false
  }

  // 省略
}
```

パスは必要に応じて変更すること。上記の例のままであれば、同ディレクトリに `background.js` を作成する。

## 2. `content_scripts` で `chrome.runtime.sendMessage` を使い `background` に情報を伝達する
`content_scripts` のスクリプト内で、非同期通信を行いたい部分に以下を追加する。

```javascript
chrome.runtime.sendMessage(
  {
    contentScriptQuery: 'post',
    endpoint: 'https://example.com'
  },
  (response) => {
    console.log(response);
  }
);
```

`chrome.runtime.sendMessage` の第一引数はハッシュで、`background` に送りたいデータを指定する。第二引数はコールバック関数を指定する。

## 3. `background` で `chrome.runtime.onMessage.addListener` を使い `content_scripts` からの情報を受け取る
`background` のスクリプト内に以下を追加する。

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) {
    sendResponse({
      'status': false,
      'reason': 'message is missing'
    });
  }
  else (message.contentScriptQuery === 'post') {
    fetch(message.endpoint, {
      'method': 'GET'
    })
    .then((response) => {
      if (response && response.ok) {
        sendResponse(response);
      }
    })
    .catch((error) => {
      sendResponse({
        'status': false,
        'reason': 'failed to fetch'
      });
    });
  }

  return true;
});
```

`content_scripts` 側で `chrome.runtime.sendMessage` を実行すると、こちら側 (`background`) の `chrome.runtime.onMessage.addListener` の中身がバックグラウンドで実行される。

`chrome.runtime.onMessage.addListener` には関数を指定する。その関数が受け取る引数は 3 つ `(message, sender, sendResponse)` あり、それぞれ以下のデータが格納される。

* `message`
    * `chrome.runtime.sendMessage` の第一引数で指定したハッシュ
        * 今回の例だと `contentScriptQuery` と `endpoint` を送っているので、それぞれ `message.contentScriptQuery` と `message.endpoint` で中身を取得できる
        * 複数の箇所でそれぞれ異なる非同期通信を行いたい場合は `contentScriptQuery` の中身を変えて条件分岐することで実現できる
* `sender`
    * (調べていないのであとで調べて追記)
* `sendResponse`
    * `chrome.runtime.sendMessage` 側に結果を返すための関数

### 重要事項
**`chrome.runtime.onMessage.addListener` は、必ず `true` を返す必要がある点に注意すること。そうしないとエラーが出て正しく動作しない。**

## 4. 受け取った情報をもとに非同期通信を行う
上記は `https://example.com` に GET リクエストを送るだけのシンプルな例だが、実際にはもう少し複雑な通信を行うこともあるだろう。

たとえば HTTP ヘッダやペイロードなどを付与したい場合は `chrome.runtime.sendMessage` の第一引数にそれらを追加し、それを `message` から参照することで実現できる。

## 5. 必要に応じて結果を返して `content_scripts` で後処理を行う
また、通信した結果を `content_scripts` 側で扱いたいこともあるだろう。

その場合は上記の例のように `sendResponse` の引数に結果を指定する。すると、その結果を `chrome.runtime.sendMessage` の第二引数に指定したコールバック関数で受け取ることができる。本記事の `chrome.runtime.sendMessage` の例では、受け取った `response` をただコンソールに表示するだけだが、ここに行いたい後処理を入れることができる。



# まとめ
多少めんどうな実装にはなるが、これで `content_scripts` 内でも非同期通信を扱うことができるようになる。厳密には `content_scripts` は `background` に非同期通信を任せているだけなのだが。



# Manifest V3 について
筆者はまだ Manifest V3 を試したことがないのだが、軽く調べてみた感じだと、`host_permissions` というプロパティを使えば非同期通信が行えるようになるようだ。

[Chrome 拡張機能の CORS エラーを回避（Manifest V3）](https://qiita.com/not13/items/d805d66814a0bc81dc6a)

それから、開発した拡張機能を Chrome Web Store で公開することを検討している場合は、Manifest V3 にすることで審査にかかる期間を短縮できるようだ。

これを機に Manifest V2 で開発した拡張機能を Manifest V3 にアップデートしてみよう。

[Manifest V3 への移行方法](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)
