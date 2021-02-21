---
title: "Firefox 49 から background-position がサポートされるようになった"
emoji: "🙌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["CSS", "firefox", "firefox49", "background-position-x", "background-position-y"]
published: true
order: 25
---

# はじめに
この記事を書いてる途中であることに気づいてしまって、この記事の構成が総崩れになってしまいました。しかし途中で書くのを放棄するのもアレなので、最後まで書いたあとにオチを話したいと思います。よければ最後までお付き合いくださいm(_ _)m

# 現象

```css
div {
  background-position-x: 20%;
  background-position-y: 40%;
}
```

Google Chrome, Safari, Opera, IE では上記のように指定すればバックグラウンド画像の位置を指定できるのですが、なぜかFirefoxだけうまくいきません。

ディベロッパーツールで確認すると注意マークが出ているのがわかりましたが、最初は何がいけないのかわかりませんでした。

調べたら一発で解決しました（Google 先生に感謝です）
[Firefoxでbackground-positionが効かなかった件](http://rikei-webmemo.hateblo.jp/entry/2013/08/11/090631)

~~どうやらFirefoxは `background-position-x`, `background-position-y` プロパティに対応していないみたいです。~~

このプロパティは元々IEが独自で使用していたもので、~~Firefoxはこのプロパティを実装していません。~~

# 解決策
`background-position-x`, `background-position-y` の代わりに `background-position` を使います。`background-position` はIE独自で作られたプロパティではなくFirefoxでも使用できます。

先ほどのCSSは以下のようにするとFirefoxでも動作します。

```css
div {
  background-position: 20% 40%;
}
```

X座標の位置、Y座標の位置、の順にスペース区切りで値を指定します。

ちなみにどちらも初期値は`0%`なので、片方のみを指定したい場合は指定しないほうを`0%`とすれば良いです。

```css
div {
  /* background-position-x: 20%; としたい場合 */
  background-position: 20% 0%;
}
```

~~Firefoxでも `background-position-x`, `background-position-y` が使えるようになるといいですね。~~

# 実はサポートされていた！
と、思って調べていたらなんと、Firefox 49 から `background-position-x`, `background-position-y` がサポートされるようになりました :tada:

[background-position-x - MDN](https://developer.mozilla.org/ja/docs/Web/CSS/background-position-x#Browser_compatibility)

Can I use... で調べてもちゃんとサポートされています。
[background-position-x & background-position-y - Can I use...](http://caniuse.com/#search=background-position-x)

実はFirefoxをしばらく使ってなくてCSSの確認のために開いたときに自分のFirefoxはバージョンが古くて、今回のような問題に当たりました。でも更新して再起動したら普通に動いたので、これはもしかしたら…と思って調べたら案の定新しいバージョンではサポートされていました。

これで主要ブラウザ最新版ではすべて対応したことになります。しかしまだ古いバージョンのFirefoxを使っているユーザもいるかもしれない（特にサポートされたのが49からと、かなり遅いので）です。なので、しばらくはまだ古いバージョンのFirefoxにも対応しておいたほうが良いかもしれません。

# 結論
* 最新バージョンでは主要ブラウザすべてが対応している
* ただしFirefoxは対応したのが割と最近のバージョンからなので、古いバージョンにも対応する場合は使わないほうが無難

# 参考サイト
* [Firefoxでbackground-positionが効かなかった件](http://rikei-webmemo.hateblo.jp/entry/2013/08/11/090631)
* [background-position-x - MDN](https://developer.mozilla.org/ja/docs/Web/CSS/background-position-x#Browser_compatibility)
* [background-position-x & background-position-y - Can I use...](http://caniuse.com/#search=background-position-x)
