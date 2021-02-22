---
title: "JavaScript でテキストエリア内のカーソルのある位置に文字列を挿入する方法"
emoji: "🍵"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["JavaScript"]
published: false
order: 32
---

# 実現したいこと
テキストエリア内に下記のような文章があったとします。

```markdown:markdown
# 家族旅行
今日は家族で旅行に行ってきました

とても楽しかったです
```

「今日は家族で旅行に行ってきました」と「とても楽しかったです」の間にカーソルがあったとして、このカーソルの位置に JavaScript で文字列を挿入したいときの実現方法を紹介します。

たとえば文章の途中で画像をアップロードしたくなったときに、ユーザが画像をアップロードして、その処理が終わったあとに JavaScript で以下のようなマークダウンをカーソルの位置に自動挿入する、などの機能を実現したいときを想定しています。

```markdown:markdown
![travel](/images/travel.png)
```

# 実現方法
以下の JavaScript で実現できます。

```javascript
var textarea = document.querySelector('textarea');

var sentence = textarea.value;
var len      = sentence.length;
var pos      = textarea.selectionStart;

var before   = sentence.substr(0, pos);
var word     = '挿入したい文字列';
var after    = sentence.substr(pos, len);

sentence = before + word + after;

textarea.value = sentence;
```

カーソルの位置を取得するには `selectionStart` を使用します。`selectionStart` は、テキストの一部の範囲が選択状態になっているときの、選択開始の位置を取得します。選択終了の位置を取得するものとして `selectionEnd` も用意されています。

これらはテキストが選択状態になっていなくても使うことができます。選択状態になっていない場合は、カーソルの位置を取得することができます。選択状態でない場合は `selectionStart` と `selectionEnd` は同じ値を返すので、どちらを使用しても良いです。今回は `selectionStart` を使用しています。

各変数の内容を下にまとめます。

|変数|意味|
|---|---|
|sentence|テキストエリア内の文章|
|len|文章の文字数|
|pos|カーソルの位置|
|before|カーソルより前にある文章|
|word|挿入したい文字列|
|after|カーソルより後にある文章|

先ほど説明した `selectionStart` を使用してカーソルの位置を `pos` に代入しています。

`before` と `after` には `substr()` を使用し、それぞれカーソル前後の文章を代入しています。`substr()` は第一引数に取得する文字列を開始する位置、第二引数に文字数を指定して「第一引数の位置から第二引数の文字数分だけ文字列を抽出する」関数です。

これで文章をカーソル前後で分けることができたので、`before + word + after` でカーソルの位置に文字列が挿入された文章が完成します。これをテキストエリアに代入することでカーソルの位置に文字列を挿入することができます。
