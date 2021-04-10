---
title: "iOS でページ全体はスクロールを無効にし、個別の要素（textarea など）では有効にする方法"
emoji: "😊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["iOS", "JavaScript", "CSS", "HTML"]
published: true
order: 31
layout: article
---

# iOS 以外での実現方法
PC や Android など、iOS 以外のデバイスで、ページ全体をスクロール無効にし、それ以外の要素は有効にしたい場合は、以下の CSS を追加すれば良いです。

```css
html, body {
  overflow: hidden;
}
```

実に簡単です。

しかし、iOS では、この方法だとうまくいきません。

# iOS でページ全体のスクロールを無効にする方法
ググってみるとたくさん記事が出てきます。一番シンプルでオーソドックスな方法は、以下の JavaScript を使用する方法です。

```javascript
window.addEventListener('touchmove', function(event) {
    event.preventDefault();
});
```

`touchmove` イベントハンドラを設置し、タップした状態から指を動かしたときに、`preventDefault()` を呼ぶことでイベントをキャンセルします。

これならたしかにスクロールを無効にすることができます。しかし、これだと、たとえばテキストエリアがあった場合にはそのテキストエリア内のスクロールもできなくなってしまいます。

ページ全体（body）はスクロール無効にしたいけど、それ以外のテキストエリアなどの要素に対してはスクロールを有効にしたい、そういうときの実現方法を紹介します。

[特定のエリアのみスクロールを無効にする方法](http://qiita.com/mimoe/items/f5f668cebb697d073553#%E7%89%B9%E5%AE%9A%E3%81%AE%E3%82%A8%E3%83%AA%E3%82%A2%E3%81%AE%E3%81%BF%E3%82%B9%E3%82%AF%E3%83%AD%E3%83%BC%E3%83%AB%E3%82%92%E7%84%A1%E5%8A%B9%E3%81%AB%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95)についての記事はありますが、今回実現したいのは、これの逆です。

# 実現方法
以下の JavaScript で実現することができます。例としてテキストエリア内をスクロール有効にしています。

```javascript
var textarea = document.querySelector('textarea');
textarea.scrollTop = 1;

window.addEventListener('touchmove', function(event) {
  if (event.target === textarea && textarea.scrollTop !== 0 && textarea.scrollTop + textarea.clientHeight !== textarea.scrollHeight) {
    event.stopPropagation();
  }
  else {
    event.preventDefault();
  }
});

textarea.addEventListener('scroll', function(event) {
  if (textarea.scrollTop === 0) {
    textarea.scrollTop = 1;
  }
  else if (textarea.scrollTop + textarea.clientHeight === textarea.scrollHeight) {
    textarea.scrollTop = textarea.scrollTop - 1;
  }
});
```

`touchmove` イベントが発火したときに、コールバック関数は引数 `event` を受け取ることができます。そしてこのイベントがどの要素で発火したのかを `event.target` で取得することができます。これがテキストエリアだった場合は、イベントの伝搬を中止する、というのがざっくりとして処理です。

ところがちょっと厄介なこととして、テキストエリア内で、一番上にスクロールされた状態でさらに上にスクロールしようとすると、body（ページ全体）がスクロールされてしまいます。一番下でスクロールした場合も同じです。

これだと完全にページ全体のスクロールを無効化したとは言い難いので、もう少し工夫します。テキストエリア内はスクロールできるけど、一番上（下）にスクロールされた状態では、イベントキャンセルの適用外、つまりスクロールができないようにします。

しかし、これには問題があり、ページがロードされた段階ではテキストエリアは一番上にスクロールされた状態なので、テキストエリア内でスクロールができなくなってしまいます。そのため `textarea.scrollTop = 1;` を最初に実行することで回避します。

まだ問題があって、一度でも一番上や下までスクロールしてしまうと、そこからスクロールできなくなってしまいます。なので、`scroll` イベントハンドラを設置し、一番上（下）までスクロールしたら、その位置から+1（-1）だけ位置を移動させて、ほんの僅かな量だけ一番上（下）までスクロールできないようにします。こうすることで、常に一番上（下）にはスクロールされた状態にはならないので、テキストエリア内のスクロールを通してページ全体がスクロールされてしまうことを防ぐことができます。

# まとめ
少し回りくどい実装方法ではありますが、iOS でも body に `overflow: hidden;` をかけたのとほぼ同等の挙動になりました。

テキストエリアではなくほかの要素に対して同じことをしたい場合は1行目を書き換えてください。また複数スクロール可能にしたい場合は要素と処理を追加してください。

ちなみに最初は、イベントの伝搬をバブリングからキャプチャリングに変更し、body までイベントが伝搬したタイミングでイベントの伝搬を止める、という処理をしようとしてましたが、body まで伝搬したタイミングで止める方法が思いつかなかった（わからなかった）のであきらめました x(
