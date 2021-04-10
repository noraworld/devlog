---
title: "JavaScript でテキストエリア内の文字列を書き換えた際に undo や redo が効くようにする"
emoji: "🎃"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["JavaScript"]
published: true
order: 63
layout: article
---

# はじめに
以前にこのような記事を書きました。
[JavaScript でテキストエリア内のカーソルのある位置に文字列を挿入する方法](https://qiita.com/noraworld/items/d6334a4f9b07792200a5)

しかし、この方法でテキストエリア内の文字列を書き換えると、一つ問題が生じます。それは、**undo (`command + z`) や redo (`command + shift+ z`) が効かなくなること**です。

この記事では、undo や redo が効く方法でテキストエリア内の文字列を書き換える方法をご紹介します。

# execCommand を使おう
結論から言うと、`execCommand` というものを使うと undo や redo が効く状態でテキストエリア内の文字列を書き換えることができます。

使用例としては以下の通りです。

```javascript
document.execCommand('insertText', false, '挿入したい文字列');
```

上記の JavaScript を実行すると、キャレット (カーソル) のある位置に、挿入したい文字列が挿入されます。文字列が選択状態だった場合は、選択範囲の文字列は削除されます。

# 実用的な例
`execCommand` を使った実用的な例を一つご紹介します。

```javascript
const TAB_SIZE = 4;
const SPACES = ' '.repeat(TAB_SIZE);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    document.execCommand('insertText', false, SPACES);
  }
});
```

テキストエリア内でタブキーを押すと、次の要素にフォーカスを移動させる代わりに 4 つ分のスペースを入れることができます[^1]。

[^1]: もっと厳密に実装しようとしたら、フォーカスがテキストエリア内になければ実行しないとか、修飾キーと一緒に押されていた場合は無視するとかの処理が必要だと思いますが、この記事では省略します。

ちなみに、`document.execCommand()` だと、テキストエリアが同ページに複数あった場合は、どのテキストエリアなの？ と疑問に思いましたが、単純にフォーカスされているテキストエリアに限定されるようです。

そのため、上記の例のようにキーで発動させるのではなく、ボタンを押して発動させる場合、ボタンを押した時点でテキストエリアからボタンへとフォーカスが移動してしまいますので、ボタンを押す前のテキストエリアの要素を事前に取得しておいて、ボタンが押されたときにテキストエリアへとフォーカスを戻す、といった処理が必要になるかと思います。

# もっと詳しく
実はこの `execCommand` は、文字列の挿入以外にも様々なことができます。第一引数の `insertText` に疑問を持った方もいるかもしれませんが、まさにこの第一引数を変えることで様々なことができるようになります。

具体的にどのようなコマンドがあるかは、MDN のページに詳しく書かれていますので、気になる方はこちらをご覧ください。

[Document.execCommand() - MDN - Mozilla](https://developer.mozilla.org/ja/docs/Web/API/Document/execCommand)
