---
title: "Jekyll × Commonmarker で iframe タグがレンダリングされない問題の解決法"
emoji: "🧪"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Jekyll", "CommonMark", "GitHub"]
published: true
order: 174
layout: article
---

# 前菜
[`jekyll-commonmark-ghpages` の README](https://github.com/github/jekyll-commonmark-ghpages/tree/c71cd81ab75ce4606551f6788a7b1c032f4b42d0?tab=readme-ov-file#jekyll-commonmark-ghpages) を見ると以下のような設定を `_config.yml` に追加する方法が紹介されています。

```yaml
commonmark:
  options: ["UNSAFE", "SMART", "FOOTNOTES"]
  extensions: ["strikethrough", "autolink", "table", "tagfilter"]
```

しかしこれだと `iframe` が正しく表示されなくなるという問題が発生しました。

![](https://noraworld.github.io/box-ivysaur/2025/04/21/0ab24b7fa8743b8ee599bcdd667cb244.png)

タグがそのまま表示されてしまいます。



# メインディッシュ
これの解決策はシンプルで、`tagfilter` を削除します。

```yaml
commonmark:
  options: ["UNSAFE", "SMART", "FOOTNOTES"]
  extensions: ["strikethrough", "autolink", "table"]
```

これで `iframe` が表示されるようになりました。

![](https://noraworld.github.io/box-ivysaur/2025/04/21/ca0289b9983909641b074dcab93e1955.png)

## `iframe` を表示させる方法
そもそもセキュリティ上の観点から、デフォルトでは Jekyll でビルドした記事の中の `iframe` はサニタイズされ表示されません。

それを表示するためのオプションが、[Commonmarker](https://github.com/gjtorikian/commonmarker) では `UNSAFE` です。これをつけることで `iframe` が表示されるようになります。

```yaml
commonmark:
  options: ["UNSAFE"]
```

[Render options](https://github.com/gjtorikian/commonmarker/tree/7029b5cfa486239f77d67e19664a02a444af43df?tab=readme-ov-file#render-options)

## HTML タグをそのまま表示させる方法
一方で、HTML タグをそのまま表示させる拡張も用意されています。これが冒頭で登場した `tagfilter` です。

```yaml
commonmark:
  extensions: ["tagfilter"]
```

[Extension options](https://github.com/gjtorikian/commonmarker/tree/7029b5cfa486239f77d67e19664a02a444af43df?tab=readme-ov-file#extension-options)

これを追加すると、`<` が `&lt;` に、`>` が `&gt;` にそれぞれエスケープされるため、たとえば `<iframe>` と書いてあると `&lt;iframe&gt;` と変換され、ページ上では `<iframe>` のようにそのまま文字として表示されることになります。

[Disallowed Raw HTML (extension) | GitHub Flavored Markdown Spec](https://github.github.com/gfm/#disallowed-raw-html-extension-)

つまり、`UNSAFE` と `tagfilter` を同時に指定すると、せっかく `UNSAFE` で `iframe` が表示されるようになったのに、それをただのタグとしてそのまま表示してしまうので冒頭であげたような問題が発生してしまう、というわけです。

だから

```yaml
commonmark:
  options: ["UNSAFE", "SMART", "FOOTNOTES"]
  extensions: ["strikethrough", "autolink", "table", "tagfilter"]
```

のように `UNSAFE` と `tagfilter` が両方指定されているのはどういう意味があるのか謎なんですよね。まあもちろん `UNSAFE` がないとそもそも `iframe` タグすら表示されないので挙動の違いはあるのですが、`iframe` をページに反映させると同時に HTML タグとしてそのまま表示させる、そんな需要あるのか？という疑問が浮かびました。



# デザート
まあ単にぼくがあまり理解せずにそのままコピペしていたのが問題なんですが、意外に調べてもこのことを解説しているサイトは見つからなかったので備忘録として書くことにしました[^chatgpt]。

[^chatgpt]: ChatGPT に聞いても意外とドンピシャな答えは返してくれませんでした。結果的には ChatGPT が提示した最小構成のサンプルを試したときに動いたのでその差分で原因にたどり着くことができたので壁打ちにはなりましたが。[Jekyll ページネーション問題](https://chatgpt.com/share/67e7fed0-02d0-8004-b25c-832f8160b413)

今回この問題をややこしくした（解決までに時間がかかった）のは、`github-pages` だとこの問題が発生しないからです。

```ruby
gem 'github-pages'
```

ただこれ、考えてみれば当たり前で、`github-pages` は [Dependency versions](https://pages.github.com/versions/) に示されたライブラリやプラグインをもとに動作するように設計されていて、この中に [Commonmarker](https://github.com/gjtorikian/commonmarker) は含まれていないんですよね。

つまり、`github-pages` を使った場合はこの設定は単に無視されて、代わりに [kramdown](https://github.com/gettalong/kramdown) が使われていたので冒頭のような問題が発生しなかった、ということになります。Jekyll は GitHub Pages のエコシステムと密につながっていて、このへんがちょっとわかりづらいと感じるのはぼくだけですかね 🤔

以上となります。わかっている人にとってはすごく当たり前のことを書きましたが、意外にハマってしまったので記録として残しておくことにしました。参考になれば幸いです。
