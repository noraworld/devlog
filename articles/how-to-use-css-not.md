---
title: "CSS の :not() の使いかた"
emoji: "🍣"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["CSS"]
published: false
---

CSS でスタイルを適用したいけど、ここだけは適用したくない！ っていうときがたまにあります。

そういうときは、:not() を使うと簡単に実装できます。

# p タグだけ除外
```lang:style.css
:not(p) {
  /* something */
}
```

# id="foo" だけ除外
```lang:style.css
:not(#foo) {
  /* something */
}
```

# href 属性がある要素だけ除外
```lang:style.css
:not([href]) {
  /* something */
}
```


# type="text" だけ除外
```lang:style.css
:not([type="text"]) {
  /* something */
}
```

# container 要素の子要素 h1 だけを除外
```lang:index.html
<div id="container">
  <h1>タイトル</h1>
  <p>説明説明説明</p>
  <p>説明説明説明</p>
</div>
```

```lang:style.css
#container :not(h1) {
  /* something */
  /* p タグには適用され、 h1 タグには適用されない */
}
```

⚠️ container 要素の子孫セレクタ h1 を :not() で否定するので、`#container` と `:not(h1)` の間には子孫セレクタの書き方と同じように**スペース**を入れてください。

```
#container :not(h1) /* OK */
#container:not(h1)  /* NG */
```

# container 要素の子要素 img に適用させたいけど、emoji クラスがある img は除外
```lang:index.html
<div id="container">
  <img src="something.jpg">
  <img src="something.png">
  <img src="something.gif" class="emoji">
</div>
```

```lang:style.css
#container img:not(.emoji) {
  /* something */
  /* something.jpg と something.png には適用され、something.gif には適用されない */
}
```

⚠️ さきほどとは逆で、`img`と`:not()`の間にはスペースを**入れないで**ください
