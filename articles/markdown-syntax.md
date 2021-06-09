---
title: "マークダウン記法についてまとめてみた"
emoji: "🌟"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Markdown"]
published: false
order: 97
layout: article
---

# クイックリファレンス
TBD



# はじめに
自分のブログでマークダウンが意図した通りにレンダリングされているかを確かめるために、各記法を使用した記事を毎回探すのは煩わしいと感じた。

今さらマークダウンの記法について解説しても全く需要はないと思うが、レンダリングチェックも兼ねてマークダウン記法を説明する記事として公開することにした。

ただ単に記法を紹介するだけでなく、パーサの仕様によってはうまくレンダリングできない書き方などについても説明する。



# 用語の説明
説明を簡略化するため、よく出てくる事柄についての用語の説明をする。

## 実装依存
[オリジナルの仕様](https://daringfireball.net/projects/markdown/syntax) ([RFC 7763](https://tools.ietf.org/html/rfc7763)) に準拠しない、またはオリジナルの仕様に存在しないシンタックスやルールを指す。マークダウンのパーサライブラリや、その他ライブラリの実装によって出力が異なる可能性があることを示す。

## HTML 依存
マークダウンではなく HTML をそのまま記述することによって表現するシンタックスを指す。HTML がエスケープされる場合はこのシンタックスを用いることはできない。

これはマークダウンの仕様ではないが、マークダウンでは表現しきれない出力を行いたい場合に必要になることがあるため、それらもこの記事で紹介する。しかし、あくまで HTML であるため、マークダウンと区別するために明記する。



# 太字
文字を太字にする。強調したいときなどに使用する。

## シンタックス・ルール
2 種類存在する。

### `**` 記法
* 太字にしたい単語や文を `**` で囲む
* 囲まれる単語や文の前後にスペースを入れてはいけない

### `__` 記法
* 太字にしたい単語や文を `__` で囲む
* 囲まれる単語や文の前後にスペースを入れてはいけない
* `__太字にしたい単語や文__` の前後にスペースを 1 つ以上入れなければならない

## 入力
```markdown:Markdown
`**` で囲まれた部分が**太字**になる。

`__` で囲む場合は外側の前後に __スペース__ が必要になる。
```

## 出力
`**` で囲まれた部分が**太字**になる。

`__` で囲む場合は外側の前後に __スペース__ が必要になる。



# イタリック体
文字をイタリック体にする。

## シンタックス・ルール
2 種類存在する。

### `*` 記法
* イタリック体にしたい単語や文を `*` で囲む
* 囲まれる単語や文の前後にスペースを入れてはいけない

### `_` 記法
* イタリック体にしたい単語や文を `_` で囲む
* 囲まれる単語や文の前後にスペースを入れてはいけない
* `_イタリック体にしたい単語や文_` の前後にスペースを 1 つ以上入れなければならない

## 入力
```markdown:Markdown
`*` で囲まれた部分が*イタリック体*になる。

`_` で囲む場合は外側の前後に _スペース_ が必要になる。
```

## 出力
`*` で囲まれた部分が*イタリック体*になる。

`_` で囲む場合は外側の前後に _スペース_ が必要になる。



# 打ち消し線 (実装依存)
文字に打ち消し線を付与する。以前に書いたことを訂正したいときなどに使用する。

## シンタックス・ルール
* **[実装依存]** 打消し線を入れたい単語や文を `~~` で囲む
* 囲まれる単語や文の前後にスペースを入れてはいけない

## 入力
```markdown:Markdown
`~~` で囲まれた部分に~~打ち消し線~~が入る。
```

## 出力
`~~` で囲まれた部分に~~打ち消し線~~が入る。



# インラインコード
文字をインラインコードとして表示する。コードの一部を文章内に含めたい場合などに使用する。

## シンタックス・ルール
* インラインコードにしたい単語や分を `` ` `` で囲む
* インラインコード内に `` ` `` を含めたい場合は、含めたい `` ` `` の数よりも 1 つ以上多い `` ` `` で連続して囲み、囲む `` ` `` の内側の前後に `` ` `` ではない文字を入れる
  * 内側の前後にスペースを入れても出力には反映されないため、スペースを入れることをおすすめする

## 入力
```markdown:Markdown
`` ` `` で囲まれた部分が `インラインコード` になる。

インラインコード内で `` ` `` を表示させたい場合は、表示させたい数よりも 1 つ以上多い `` ` `` で連続して囲み、囲む `` ` `` の内側の前後にスペースを 1 つ以上入れる。

`` ` `` をインラインコード内に 2 つ表示させたい場合は、3 つ以上の `` ` `` で連続して囲み、内側の前後にスペースを 1 つ以上入れる。

たとえば ```` ``` `` ``` ```` のように表記すれば ``` `` ``` のようにインラインコード内に `` ` `` が 2 つ表示される。
```

## 出力
`` ` `` で囲まれた部分が `インラインコード` になる。

インラインコード内で `` ` `` を表示させたい場合は、表示させたい数よりも 1 つ以上多い `` ` `` で連続して囲み、囲む `` ` `` の内側の前後にスペースを 1 つ以上入れる。

`` ` `` をインラインコード内に 2 つ表示させたい場合は、3 つ以上の `` ` `` で連続して囲み、内側の前後にスペースを 1 つ以上入れる。

たとえば ```` ``` `` ``` ```` のように表記すれば ``` `` ``` のようにインラインコード内に `` ` `` が 2 つ表示される。

## 補足
参考: [Markdown でバッククオートを含むインラインコードを書くには](https://qiita.com/uasi/items/251f4e66ceb95c043b3d)



# アンカーなしリンク (実装依存)
URL がそのまま文字列として表示されるリンクを追加する。

## シンタックス・ルール
* **[実装依存]** URL をそのまま書く
* `http://` や `https://` を含めなければならない

## 入力
```markdown:Markdown
https://github.com
```

## 出力
https://github.com

## 補足
マークダウンやサイトの実装によっては、以下のようにリンクカードとして表示されることもある。

![Link Card](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/markdown-syntax/link_card.png)



# アンカー付きリンク
指定した文字列が表示されるリンクを追加する。

## シンタックス・ルール
* `[]()` と書き、`[]` の中にリンクとして表示したい単語や文を書き、`()` の中に URL を書く
* `[]` の中身は基本的には空にできない
  * 空にすると HTML としてはリンクに変換されるが表示される文字がなくなってしまうため
* リンクは現在のタブで開かれる
  * 新しいタブで開くリンクを生成することはできない
  * **[実装依存]** Qiita のように、qiita.com 以外のサイトのリンクは新しいタブで開かれるように実装されている場合もある

## 入力
```markdown:Markdown
[GitHub](https://github.com)
```

## 出力
[GitHub](https://github.com)

## 補足
HTML を直接書くことで新しいタブで開かれるリンクにすることもできるが、HTML がエスケープされる場合はそれもできない。



# 画像
画像を挿入する。

## シンタックス・ルール
* `![]()` と書き、`[]` の中に画像の説明を書き、`()` の中に画像の URL を書く
  * 画像の説明は HTML の `<img>` タグの `alt` 属性に使われる
* `[]` の中身は省略可能
* **[実装依存]** 前後の行が空行である必要がある場合もある
* 画像の大きさを変更することはできない
  * **[実装依存]** ただし Zenn のように画像の大きさを変更するための独自記法を用意している場合もある

## 入力
```markdown:Markdown
![画像の説明をここに書く](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)
```

## 出力
![画像の説明をここに書く](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)



# 絵文字 (実装依存)
絵文字を入れる。

## シンタックス・ルール
* **[実装依存]** 絵文字のショートコードを `:` で囲む
  * ショートコード一覧は [EMOJI CHEAT SHEET](https://www.webfx.com/tools/emoji-cheat-sheet/) を参照のこと

## 入力
```markdown:Markdown
絵文字のショートコードを `:` で囲むと絵文字になる :smile:

ショートコードによる絵文字がサポートされていない場合は、絵文字のユニコードを記述して絵文字を入れることもできる 😀
```

## 出力
絵文字のショートコードを `:` で囲むと絵文字になる :smile:

ショートコードによる絵文字がサポートされていない場合は、絵文字のユニコードを記述して絵文字を入れることもできる 😀

## 補足
[gemoji](https://github.com/github/gemoji) のように、マークダウンパーサではなく絵文字パーサのライブラリとして独立しているものもある。また、依存ライブラリとして絵文字パーサを含むことで、この記法を使用できるようにしているマークダウンパーサもある。

絵文字のショートコード一覧を確認したい場合は [EMOJI CHEAT SHEET](https://www.webfx.com/tools/emoji-cheat-sheet/) が便利。ただし絵文字は追加されることもあるため、ここに記載されているものがすべてではない可能性がある。

ショートコードによる絵文字がサポートされていない場合は絵文字のユニコードをそのまま記述することもできるが、ショートコードによる絵文字と全く同じになるとは限らない点に注意。ショートコードによる絵文字は、予め用意された絵文字の画像に変換される実装もある。

たとえば、[Jemoji](https://github.com/jekyll/jemoji) では `:smile:` と記述すると以下の HTML に変換される。

```html
<img class="emoji" title=":smile:" alt=":smile:" src="https://github.githubassets.com/images/icons/emoji/unicode/1f604.png" height="20" width="20">
```



# 注釈 (実装依存)
注釈を入れる。注釈文は記事の一番下に表示される。

## シンタックス・ルール
* **[実装依存]** `[^]` と書き、`^` の後ろに識別名を入れて注釈をつけたい箇所に書き、別の行の先頭に同じ注釈記号と `:` を付け、そのあとに注釈となる文を書く
* 識別名は任意だが、スペースを入れてはいけない
* マークダウン内で注釈文を入れる位置は任意だが、どこに書いても表示は一番下になる
* 複数箇所で注釈を使い、識別名が重複した場合、注釈文は後ろに書いたほうが優先され、注釈を参照する箇所は同じ注釈文を参照することになる
* **[実装依存]** 識別名に日本語などのマルチバイト文字がサポートされていない場合もある
  * 識別名はアルファベット・数字・ハイフンの組み合わせが無難
* 注釈に入れた箇所に表示される番号は、上から順に自動的に付与される

## 入力
```markdown:Markdown
`[^]` と書き、`^` の後ろに識別名を入れて注釈を付与する[^footnote]。ここでは `footnote` が識別名に当たる。

[^footnote]: この注釈文は以降に同名の識別名の注釈文が存在するため表示されない。

同じ識別名を使うと後ろに書いたほうが優先される[^footnote]。

[^footnote]: 同じ識別名を使って注釈を入れる。この注釈文はこの記事の一番下に表示される。

識別名に日本語などのマルチバイト文字はサポートされていない場合もある[^日本語の識別名]。

[^日本語の識別名]: これが注釈文となるかそのまま表示されてしまうかはマークダウンパーサの実装による。
```

## 出力
`[^]` と書き、`^` の後ろに識別名を入れて注釈を付与する[^footnote]。ここでは `footnote` が識別名に当たる。

[^footnote]: この注釈文は以降に同名の識別名の注釈文が存在するため表示されない。

同じ識別名を使うと後ろに書いたほうが優先される[^footnote]。

[^footnote]: 同じ識別名を使って注釈を入れる。この注釈文はこの記事の一番下に表示される。

識別名に日本語などのマルチバイト文字はサポートされていない場合もある[^日本語の識別名]。

[^日本語の識別名]: これが注釈文となるかそのまま表示されてしまうかはマークダウンパーサの実装による。



# 見出し
見出しを表示する。項目を分けたいときなどに使用する。

## シンタックス・ルール
2 種類存在する。ただし `===` と `---` はそれぞれ HTML の `<h1>` と `<h2>` に対応しており `<h3>` 以降は `#` 記法でしか表現できない点に注意。

### `#` 記法
* `#` とスペースのあとに見出しとして表示する単語や文を書く
* `#` の数は 1 〜 6 個まで
  * HTML に `<h6>` までしか存在しないことと同じ
* `#` の数が多くなるごとに見出しが小さくなっていく
* `#` のあとのスペースは 1 つ以上
* インライン要素 (太字、イタリック体、インラインコードなど) と併用することができる

### `===` & `---` 記法
* 見出しとして表示する単語や文を書き、その次の行に `===` または `---` を入れる
* 見出しと `===` または `---` の間に空行を入れてはいけない
  * 空行を入れた場合は区切り線になる
* `=` または `-` の数は 3 つ以上であれば何個でも良い
* `===` は `<h1>` (`#`) に該当し、`---` は `<h2>` (`##`) に該当する
* この記法では `<h3>` 以降を表現することはできない
* インライン要素 (太字、イタリック体、インラインコードなど) と併用することができる

## 入力
```markdown:Markdown
# `#` の見出し 1
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## `##` の見出し 2
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### `###` の見出し 3
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

#### `####` の見出し 4
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

##### `#####` の見出し 5
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

###### `######` の見出し 6
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

`===` の見出し 1
===
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

`---` の見出し 2
---
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# **太字** の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# *イタリック体* の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# ~~打消し線~~ の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# `インラインコード` の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# [リンク](https://github.com) の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# ![画像](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg) の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# :smile: の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# 注釈[^footnote-in-headline]の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

[^footnote-in-headline]: 見出しにつけた注釈
```

## 出力
# `#` の見出し 1
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## `##` の見出し 2
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### `###` の見出し 3
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

#### `####` の見出し 4
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

##### `#####` の見出し 5
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

###### `######` の見出し 6
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

`===` の見出し 1
===
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

`---` の見出し 2
---
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# **太字** の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# *イタリック体* の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# ~~打消し線~~ の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# `インラインコード` の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# [リンク](https://github.com) の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# ![画像](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg) の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# :smile: の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

# 注釈[^footnote-in-headline]の見出し
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

[^footnote-in-headline]: 見出しにつけた注釈



# 見出しのページ内リンク (実装依存)
これはシンタックスではないが、パーサの実装によっては、見出し (`<h1>` タグなど) に `id` 属性が付与される。

その `id` 属性を利用して、特定の見出しにジャンプするページ内リンクを貼ることができる。

## シンタックス・ルール
* `[]()` と書き、`[]` の中にページ内リンクとして表示したい単語や文を書き、`()` の中に `#` と見出しの名前を書く
* `#` と見出しの名前の間にスペースを入れてはいけない
* スペースなど、URL でエスケープしなければならない文字が見出しに含まれていた場合はその文字をエスケープする必要がある
* **[実装依存]** 日本語などのマルチバイト文字を含む場合は `id` 属性が勝手に別の名前に変更されてしまう場合もある
* **[実装依存]** 日本語などのマルチバイト文字を含む場合はパーセントエンコーディングが必要になる場合もある

## 入力
```markdown:Markdown
マークダウンでの見出しの記法については【[見出し](#見出し)】の項を参照すること。
```

## 出力
マークダウンでの見出しの記法については【[見出し](#見出し)】の項を参照すること。

## 補足
[CommonMarker](https://github.com/gjtorikian/commonmarker) (v0.17.13) では、見出しを日本語にした場合に、その見出しの `id` 属性が勝手に `section-?` (`?` には数字が順番に入る) という名前に変わってしまう。

見出しのページ内リンクがサポートされていたとしても、必ずしも見出しの名前の通りのリンクにならない可能性があることに注意。



# 区切り線
区切り線を入れる。

## シンタックス・ルール
2 種類存在する。

### `---` 記法
* `---` を入れる
* `-` の数は 3 つ以上であれば何個でも良い
* この行には `-` 以外の文字を入れてはいけない
  * **[実装依存]** ただし任意の数のスペースは許容される場合もある
  * スペースを入れるメリットは特にないので `-` 以外の文字を入れないほうが無難
* `---` の上の行に空行を入れなければならない
  * 空行を入れない場合は上の行が見出しとして見なされる
  * **[実装依存]** ただし上の行が段落 (`<p>` タグに変換されるもの) ではないもの (テーブルやコードブロックなど) だった場合は空行ではなくても良い場合もある
* **[実装依存]** 前後の行に空行を入れなければならない場合もある

### `***` 記法
* `***` を入れる
* `*` の数は 3 つ以上であれば何個でも良い
* この行には `*` 以外の文字を入れてはいけない
  * **[実装依存]** ただし任意の数のスペースは許容される場合もある
  * スペースを入れるメリットは特にないので `*` 以外の文字を入れないほうが無難
* **[実装依存]** 前後の行に空行を入れなければならない場合もある

## 入力
```markdown:Markdown
ハイフン 3 つで区切り線を入れる。

---

アスタリスクでも良い。

***

ハイフンをたくさんつけても良い。

----------

アスタリスクをたくさんつけても良い。

**********
```

## 出力
ハイフン 3 つで区切り線を入れる。

---

アスタリスクでも良い。

***

ハイフンをたくさんつけても良い。

----------

アスタリスクをたくさんつけても良い。

**********



# 番号なしリスト
番号なしリストを表示する。複数の項目を箇条書きで列挙したい場合などに使用する。

## シンタックス・ルール
* 行頭に `*` または `-` または `+` とスペースを書き、そのあとにリスト形式で表示したい単語または文を書く
* 行頭に複数個のスペースを入れることでリストをネストすることができる
  * 何重までネストできるかは、仕様上は特に制限はないが、パーサの実装によっては制限があるかもしれない
  * ネストさせる際、同じ階層に表示させたい場合はスペースの数を揃える必要がある
    * **[実装依存]** 2 スペースと 3 スペースのように、スペースの数の差が 1 以下の場合は同じ階層になる場合もある
  * ネストさせる際の行頭のスペースの数には特に仕様上の制限はないが、スペースの数が多すぎるとリストにならないこともある
    * 個人的には 2 スペースを推奨する
  * **[実装依存]** ネストをさらに深くする際に、追加するスペースの数が一致していないとリストにならないこともある
    * 良い例: ネストが深くなるごとに、行頭スペースの数が 2, 4, 6, 8, ... となっている
    * 悪い例: ネストが深くなるごとに、行頭スペースの数が 2, 6, 8, 12, ... となっている
* **[実装依存]** 同じリスト内で行頭の `*` と `-` と `+` を混合させても良いが、同じリストの集合として認識される場合もあれば、違うリストの集合として認識される場合もある
* リスト形式で表示し始めてから空行が来るまでは、行頭が `*` または `-` または `+` でなくてもリスト表示が続く
  * マークダウン内の改行がそのまま改行として反映される場合は、リストでもそのまま改行として扱われる
  * そうでない場合は、リストの途中で改行しても出力では改行されずにスペース 1 つ分になる
* **[実装依存]** リストを開始する上の行が空行である必要がある場合もある

## 入力
```markdown:Markdown
* 行頭に `*` または `-` または `+` を入れることでリスト形式で表示する
  * ネストすることもできる
    * さらにネストすることもできる
      * もっとネストすることもできる
        * もっともっとネストすることもできる
          * あまりネストさせすぎるとレイアウトが崩れるので注意
* ネストするときのスペースの数は偶数、特に 2 スペースを推奨する
  * ネストを深くする際の追加するスペースの数は途中で変更しないほうが良い

* 空行を入れることで新たなまとまりとしてリスト形式で表示する
- 行頭の記号を途中で別の記号に変更すると、空行がなくても新たなまとまりとなってしまう可能性もある
  + ただしネストさせた場合は別の記号でも同じまとまりになる場合もある
  + 行頭の記号を途中で変更するメリットは特にないので同じ記号で統一したほうが良い
```

## 出力
* 行頭に `*` または `-` または `+` を入れることでリスト形式で表示する
  * ネストすることもできる
    * さらにネストすることもできる
      * もっとネストすることもできる
        * もっともっとネストすることもできる
          * あまりネストさせすぎるとレイアウトが崩れるので注意
* ネストするときのスペースの数は偶数、特に 2 スペースを推奨する
  * ネストを深くする際の追加するスペースの数は途中で変更しないほうが良い

* 空行を入れることで新たなまとまりとしてリスト形式で表示する
- 行頭の記号を途中で別の記号に変更すると、空行がなくても新たなまとまりとなってしまう可能性もある
  + ただしネストさせた場合は別の記号でも同じまとまりになる場合もある
  + 行頭の記号を途中で変更するメリットは特にないので同じ記号で統一したほうが良い



# 番号付きリスト
番号付きリストを表示する。作業手順等を列挙したい場合に使用する。

## 入力
```markdown:Markdown
1. 先頭に数字とドットを付けることで番号付きリストを表示する
1. マークダウンで記述する際には数字は順番に記述する必要はない
1. ずっと `1.` のままでも自動的にインクリメントされる
9999. 逆に言うと数字は適当で良い
  1. 番号付きリストをネストさせることができるかどうかはパーサの実装による
  * 番号付きリストに番号なしリストをネストさせることができるかどうかもパーサの実装次第
    1. 2 段階以上のネストをすることができるかどうかもパーサの実装次第
```

1. 先頭に数字とドットを付けることで番号付きリストを表示する
1. マークダウンで記述する際には数字は順番に記述する必要はない
1. ずっと `1.` のままでも自動的にインクリメントされる
9999. 逆に言うと数字は適当で良い
  1. 番号付きリストをネストさせることができるかどうかはパーサの実装による
  * 番号付きリストに番号なしリストをネストさせることができるかどうかもパーサの実装次第
    1. 2 段階以上のネストをすることができるかどうかもパーサの実装次第

## 注意点
ネストさせた場合や番号なしリストと併用した場合にどのような表示になるかはパーサの実装によるところが大きい。

確実に意図した通りに表示させたい場合は、ネストや番号なしリストとの併用は避けるべき。



# タスクリスト
チェックボックス付きのリストを表示する。

## 入力
```markdown:Markdown
- [ ] ハイフンと大カッコを付けることでチェックボックス付きのリストを表示する
- [x] カッコの中に `x` を入れることでチェック済みになる
```

## 出力
- [ ] ハイフンと大カッコを付けることでチェックボックス付きのリストを表示する
- [x] カッコの中に `x` を入れることでチェック済みになる

## 注意点
チェックなしのボックスを用意する際はカッコの中にスペースを入れなければならない。



# 定義型リスト (HTML 依存)
これはマークダウンではないが、黒丸や番号を付与したくないリストを使用したい場合に使用する。ただし、繰り返しになるがマークダウンではないため、HTML がエスケープされる場合は使用できない。

## 入力
```html:HTML
<dl>
  <dt>Windows</dt>
  <dd>ビル・ゲイツが開発した OS</dd>
  <dt>macOS</dt>
  <dd>スティーブ・ジョブズが開発した OS</dd>
  <dt>Linux</dt>
  <dd>リーナス・トーバルズが開発した OS</dd>
</dl>
```

## 出力
<dl>
  <dt>Windows</dt>
  <dd>ビル・ゲイツが開発した OS</dd>
  <dt>macOS</dt>
  <dd>スティーブ・ジョブズが開発した OS</dd>
  <dt>Linux</dt>
  <dd>リーナス・トーバルズが開発した OS</dd>
</dl>



# テーブル
テーブルを表示する。

## シンタックス・ルール
* 各セルの区切りを `|` で表記し、1 行目はテーブルのヘッダを記載し、2 行目はセル内を `---` で表記し、3 行目以降はテーブルのボディを記載する
* 1 行目と 2 行目の列の数は統一しておく必要がある
* 3 行目以降で、列の数が足りない場合は、不足分は空のセルになる
* **[実装依存]** 3 行目以降で、列の数が多い場合は、超過分が出力される場合もあれば出力されない場合もある
* 2 行目の `-` の数は 3 つ以上であれば何個でも良い
* 2 行目の `---` の前後に `:` をつけることでその列のセルを特定の方向に寄せることができる
  * `:` を左に付けると左寄せになる
    * 例: `:---`
  * `:` を右に付けると右寄せになる
    * 例: `---:`
  * `:` を両端につけると中央寄せになる
    * 例: `:---:`
* **[実装依存]** テーブルの前後に空行が必要な場合もある
  * テーブルの直前の行が見出しの場合もテーブルにならない可能性がある (kramdown)
* インライン要素 (太字、イタリック体、インラインコードなど) と併用することができる
* 一部のセルを結合したテーブルを作ることはできない

## 入力

### 左寄せ・中央寄せ・右寄せ

```markdown:Markdown
| 左寄せ | 中央寄せ | 右寄せ | 指定なし |
| :--- | :---: | ---: | --- |
| 左寄せで表示される | 中央寄せで表示される | 右寄せで表示される | 指定がない場合は基本的には左寄せと同じように表示される |
| `<td>` に `style="text-align:left"` が付与される | `<td>` に `style="text-align:center"` が付与される | `<td>` に `style="text-align:right"` が付与される | `style` は付与されない |
```

### 空白・省略ルール

```markdown:Markdown
| 列 1 | 列 2 | 列 3 | 列 4 |
| --- | --- | --- | --- |
| `|` を | 一つだけにすると | その行のすべてのセルを | 空白にすることができる |
|
| | 特定のセルを | | 空白にすることもできる |
| 列の数が足りない場合は残りのセルは空白扱いになる |
| 列の数が多い場合 | 余ったセルが | 表示されるか省略されるかは | パーサの実装による | つまりこれが表示されるかはパーサの実装による |
```

### インライン要素の併用

```markdown:Markdown
| 名称 | 説明 | 出力 |
| --- | --- | --- |
| 太字 | 文字を太字にする | **太字** |
| イタリック体 | 文字をイタリック体にする | *イタリック体* |
| 打消し線 | 文字に打ち消し線を付与する | ~~打ち消し線~~ |
| インラインコード | 文字をインラインコードとして表示する | `インラインコード` |
| アンカーなしリンク | URL がそのまま文字列として表示されるリンクを追加する | https://github.com |
| アンカー付きリンク | 指定した文字列が表示されるリンクを追加する | [GitHub](https://github.com) |
| 画像 | 画像を挿入する | ![マークダウンのロゴ](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg) |
| 絵文字 | 絵文字を挿入する | :smile: |
| 注釈 | 注釈を挿入する | 注釈[^footnote-in-table] |

[^footnote-in-table]: テーブルにつけた注釈
```

### CSS によるテーブルの表示確認

```markdown:Markdown
| 折返し不可の長い文字列がある列 | 折返し不可の長い文字列がない列 | 折返し不可の長い文字列がある列 | 折返し不可の長い文字列がない列 |
| --- | --- | --- | --- |
| `8dbc48453dbfb69f36ee2ba1f508e431ffcd26d00d47a71e932bd5f51b4e628f3275f33259c96506` | この列はどのように表示されますか | `49cc90f692dc330f107949ea43e66d60f12d03cc072d2a9e34a3b8917f9f90119f29791a548aa6eb` | How does this column look like? |
```

## 出力

### 左寄せ・中央寄せ・右寄せ

| 左寄せ | 中央寄せ | 右寄せ | 指定なし |
| :--- | :---: | ---: | --- |
| 左寄せで表示される | 中央寄せで表示される | 右寄せで表示される | 指定がない場合は基本的には左寄せと同じように表示される |
| `<td>` に `style="text-align:left"` が付与される | `<td>` に `style="text-align:center"` が付与される | `<td>` に `style="text-align:right"` が付与される | `style` は付与されない |

### 空白・省略ルール

| 列 1 | 列 2 | 列 3 | 列 4 |
| --- | --- | --- | --- |
| `|` を | 一つだけにすると | その行のすべてのセルを | 空白にすることができる |
|
| | 特定のセルを | | 空白にすることもできる |
| 列の数が足りない場合は残りのセルは空白扱いになる |
| 列の数が多い場合 | 余ったセルが | 表示されるか省略されるかは | パーサの実装による | つまりこれが表示されるかはパーサの実装による |

### インライン要素の併用

| 名称 | 説明 | 出力 |
| --- | --- | --- |
| 太字 | 文字を太字にする | **太字** |
| イタリック体 | 文字をイタリック体にする | *イタリック体* |
| 打消し線 | 文字に打ち消し線を付与する | ~~打ち消し線~~ |
| インラインコード | 文字をインラインコードとして表示する | `インラインコード` |
| アンカーなしリンク | URL がそのまま文字列として表示されるリンクを追加する | https://github.com |
| アンカー付きリンク | 指定した文字列が表示されるリンクを追加する | [GitHub](https://github.com) |
| 画像 | 画像を挿入する | ![マークダウンのロゴ](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg) |
| 絵文字 | 絵文字を挿入する | :smile: |
| 注釈 | 注釈を挿入する | 注釈[^footnote-in-table] |

[^footnote-in-table]: テーブルにつけた注釈

### CSS によるテーブルの表示確認

| 折返し不可の長い文字列がある列 | 折返し不可の長い文字列がない列 | 折返し不可の長い文字列がある列 | 折返し不可の長い文字列がない列 |
| --- | --- | --- | --- |
| `8dbc48453dbfb69f36ee2ba1f508e431ffcd26d00d47a71e932bd5f51b4e628f3275f33259c96506` | この列はどのように表示されますか | `49cc90f692dc330f107949ea43e66d60f12d03cc072d2a9e34a3b8917f9f90119f29791a548aa6eb` | How does this column look like? |



# コードブロック
コードブロックを挿入する。コードを表示する場合に使用する。

## シンタックス・ルール
2 種類存在する。

### ```` ``` ```` 記法
* バッククオート 3 つ以上でコードブロックにしたい部分を囲む
* バッククオートの数は開始と終了で一致していなければならない
* **[実装依存]** 囲まれるブロックの前後の行が空行である必要がある場合もある
* **[実装依存]** コードブロックを開始する側のバッククオートに続いて言語名を指定するとシンタックスハイライトが有効になる場合もある
  * 例: `ruby`
* **[実装依存]** 言語名の代わりにその言語のファイルの拡張子を使用することができる場合もある
  * 例: `rb`
* **[実装依存]** 言語名を指定したあとに `:` を書き、続けて任意の文字列 (ファイル名など) を指定すると、コードブロックの左上にその文字列が表示される場合もある
  * **[実装依存]** 任意の文字列内にスペースを入れてはいけない場合もある
  * **[実装依存]** `:` の前後にスペースを入れてはいけない場合もある
  * 例: `ruby:main.rb`
* **[実装依存]** 言語名を省略して任意の文字列のみを表示させることができる場合もある
  * 例: `:main.rb`
  * この場合はシンタックスハイライトは有効にはならない
* コードブロック内にバッククオート 3 つ以上だけの行を含めることはできない
  * コードブロックの終了と認識されてしまうため

### 4 スペース記法
* コードブロックにしたい部分すべての行頭にスペースを 4 つ入れる
  * スペースの数を 4 つより多くした場合、余分に増やした分だけ実際にスペースとして反映される
  * たとえば行頭にスペースを 6 つ入れた場合、その行には 2 スペースのインデントが入る
  * ただし空行の場合は行頭にスペースを 4 つ入れる必要はない
* **[実装依存]** コードブロックの開始と終了の前後の行が空行である必要がある場合もある
* そもそも実装依存ではあるが、この記法の場合はシンタックスハイライトを有効にしたり任意の文字列を表示したりすることはできない
  * その代わりこの記法の場合はバッククオート 3 つ以上だけの行を含めることができる

## 入力

### シンタックスハイライトなし・ファイル名なし

    ```
    # The Greeter class
    class Greeter
      def initialize(name)
        @name = name.capitalize
      end

      def salute
        puts "Hello #{@name}!"
      end
    end

    # Create a new object
    g = Greeter.new("world")

    # Output "Hello World!"
    g.salute
    ```

### シンタックスハイライトあり・ファイル名なし

    ```ruby
    # The Greeter class
    class Greeter
      def initialize(name)
        @name = name.capitalize
      end

      def salute
        puts "Hello #{@name}!"
      end
    end

    # Create a new object
    g = Greeter.new("world")

    # Output "Hello World!"
    g.salute
    ```

### シンタックスハイライトなし・ファイル名あり

    ```:greet.rb
    # The Greeter class
    class Greeter
      def initialize(name)
        @name = name.capitalize
      end

      def salute
        puts "Hello #{@name}!"
      end
    end

    # Create a new object
    g = Greeter.new("world")

    # Output "Hello World!"
    g.salute
    ```

### シンタックスハイライトあり・ファイル名あり

    ```ruby:greet.rb
    # The Greeter class
    class Greeter
      def initialize(name)
        @name = name.capitalize
      end

      def salute
        puts "Hello #{@name}!"
      end
    end

    # Create a new object
    g = Greeter.new("world")

    # Output "Hello World!"
    g.salute
    ```

## 出力

### シンタックスハイライトなし・ファイル名なし

```
# The Greeter class
class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def salute
    puts "Hello #{@name}!"
  end
end

# Create a new object
g = Greeter.new("world")

# Output "Hello World!"
g.salute
```

### シンタックスハイライトあり・ファイル名なし

```ruby
# The Greeter class
class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def salute
    puts "Hello #{@name}!"
  end
end

# Create a new object
g = Greeter.new("world")

# Output "Hello World!"
g.salute
```

### シンタックスハイライトなし・ファイル名あり

```:greet.rb
# The Greeter class
class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def salute
    puts "Hello #{@name}!"
  end
end

# Create a new object
g = Greeter.new("world")

# Output "Hello World!"
g.salute
```

### シンタックスハイライトあり・ファイル名あり

```ruby:greet.rb
# The Greeter class
class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def salute
    puts "Hello #{@name}!"
  end
end

# Create a new object
g = Greeter.new("world")

# Output "Hello World!"
g.salute
```



# 引用
文章を引用文として表示する。他の文献等から引用する場合に使用する。

## シンタックス・ルール
* 行頭に `>` を書き、そのあとに引用する文を書く
* **[実装依存]** `>` の後ろにスペースを入れなければならない場合もある
  * `>` の後ろにスペースを入れても出力には反映されない
* 引用を始めてから空行が来るまでは、行頭が `>` でなくても引用が続く
  * マークダウン内の改行がそのまま改行として反映される場合は、引用でもそのまま改行として扱われる
  * そうでない場合は、引用の途中で改行しても出力では改行されずにスペース 1 つ分になる
* `>` の数を増やすことで引用をネストすることができる
  * 何重までネストできるかは、仕様上は特に制限はないが、パーサの実装によっては制限があるかもしれない

## 入力
```markdown:Markdown
> 行頭に `>` を入れることで引用を開始する。
引用を開始してから空行が来るまでは行頭が `>` でなくても引用が続く。
改行しても引用は続くが、オリジナルの仕様では改行しても出力に反映されるわけではないことに注意。

> 空行を入れることで引用を終了する。
そしてまた `>` を入れることで別の引用を開始することができる。
>> 引用をネストさせることもできる。
>>>>>> どこまでネストできるかは、仕様上は特に制限はないが、パーサの実装によっては制限があるかもしれない。
ただしあまりネストさせすぎるとレイアウトが崩れるので注意。

> ネストを元に戻すことはできないので、一旦、引用を終了する必要がある。
```

## 出力
> 行頭に `>` を入れることで引用を開始する。
引用を開始してから空行が来るまでは行頭が `>` でなくても引用が続く。
改行しても引用は続くが、オリジナルの仕様では改行しても出力に反映されるわけではないことに注意。

> 空行を入れることで引用を終了する。
そしてまた `>` を入れることで別の引用を開始することができる。
>> 引用をネストさせることもできる。
>>>>>> どこまでネストできるかは、仕様上は特に制限はないが、パーサの実装によっては制限があるかもしれない。
ただしあまりネストさせすぎるとレイアウトが崩れるので注意。

> ネストを元に戻すことはできないので、一旦、引用を終了する必要がある。



# 改行
改行を挿入する。

## シンタックス・ルール
3 通り存在する。

### スペース 2 つ記法
* 行末にスペースを 2 つ以上付与する (2 つ以上なら何個でも良い)

### `<br>` 記法
* **[HTML 依存]** `<br>` タグを使用する

### そのまま改行記法
* **[実装依存]** マークダウンで入力した改行がそのまま改行として見なされる場合もある

## 入力
```markdown:Markdown
オリジナルの仕様では
マークダウンの文章内で改行しても
改行にはならずスペース 1 つ分として扱われる。

ただし行末にスペース 2 つ以上もしくは `<br>` タグを入れることによって<br>
このように改行することができる。
```

## 出力
オリジナルの仕様では
マークダウンの文章内で改行しても
改行にはならずスペース 1 つ分として扱われる。

ただし行末にスペース 2 つ以上もしくは `<br>` タグを入れることによって<br>
このように改行することができる。

## 補足
基本的にマークダウンでは改行を挿入することを想定されていない。改行 (`<br>`) を使うのではなく、段落 (`<p>`) を変えることによって文章の構成が変わったことを表現する。

どうしても改行で表現しなければならないときのみ使用する。

ただし、パーサの実装によっては、改行がサポートされている場合もある。その場合は単にマークダウンに改行を入れることでそのままそれが改行として反映される。

なお、VS Code の設定で `trimTrailingWhitespace` を `true` にしている場合は、ファイル保存時に自動的に行末スペースが削除されてしまうが、マークダウンのファイルのみ行末スペースを残したい場合は以下のように設定する。

```json:settings.json
    "files.trimTrailingWhitespace": true,
    "[markdown]": {
        "files.trimTrailingWhitespace": false
    },
```

[Trim Trailing Whitespace Breaks Markdown](https://github.com/microsoft/vscode/issues/1679#issuecomment-323608456)



# スペース (HTML 依存)
スペースを挿入する。

## シンタックス・ルール
* スペースを付与したい位置に `&nbsp;` を書く

## 入力
```markdown:Markdown
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;行頭のスペースや複数の連続したスペースは無視されるが、`&nbsp;` を使うことで&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;このように連続したスペースを入れることができる。
```

## 出力
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;行頭のスペースや複数の連続したスペースは無視されるが、`&nbsp;` を使うことで&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;このように連続したスペースを入れることができる。

## 補足
参考元: [行頭に半角スペースを置く](https://qiita.com/toyokky/items/47a5a56c20ad99e1784c#%E8%A1%8C%E9%A0%AD%E3%81%AB%E5%8D%8A%E8%A7%92%E3%82%B9%E3%83%9A%E3%83%BC%E3%82%B9%E3%82%92%E7%BD%AE%E3%81%8F)



# 折りたたみ (HTML 依存)
クリックすると文章が展開される構成を表現する。すべての人が読む必要のない長い文章や、問題の解答を隠したいときなどに使用する。

## シンタックス・ルール
* **[HTML 依存]** `<details><summary></summary><div></div></details>` と書き、`<summary></summary>` の中に展開前の概要文を書き、`<div></div>` の中に展開後の内容を書く
* **[実装依存]** `<div>` の開始タグと展開後の内容の間に空行が必要な場合もある
* **[実装依存]** `<div>` の終了タグと展開後の内容の間に空行が必要な場合もある
* **[実装依存]** 展開後の内容にマークダウンを記述した際、それがパースされない場合もある
  * パースされない場合は、展開後の内容をマークダウンではなく HTML もしくはプレーンテキストとして記載する必要がある

## 入力
```markdown:Markdown
<details><summary>サンプルコード</summary><div>

| aaa | bbb |
| --- | --- |
| ccc | ddd |
</div></details>
```

## 出力

## 補足
マークダウンと HTML を併用できる場合でも、HTML 内のマークダウンがパースされるかどうかはパーサの実装次第なので、パースされない場合は `<div>` の中身も HTML で記述する必要がある。

HTML がエスケープされる場合は使用できない上、実装依存によるところが多いため、あまり積極的に使う記法ではないかもしれない。



# おまけ
マークダウンに関する豆知識をまとめておく。

## オリジナルのシンタックス
[Daring Fireball: Markdown Syntax Documentation](https://daringfireball.net/projects/markdown/syntax) に記載されているシンタックスが、オリジナルである。[RFC 7763](https://tools.ietf.org/html/rfc7763) として管理されている。

参考: [Markdown - Wikipedia](https://en.wikipedia.org/wiki/Markdown)

## 標準化された拡張シンタックス (フレーバー)
世の中にはオリジナルのマークダウンのシンタックスを拡張した実装がいくつかあるが、標準化されているものは以下の 9 種類である[^information-freshness-rfc-7764]。

[^information-freshness-rfc-7764]: 情報は 2021 年 5 月 3 日 (月) 現在

| 識別名 | 名称 | RFC |
| --- | --- | --- |
| MultiMarkdown | MultiMarkdown | [RFC 7764](https://tools.ietf.org/html/rfc7764) |
| GFM | [GitHub Flavored Markdown](https://github.github.com/gfm/) | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| pandoc | Pandoc | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| Fountain | Fountain | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| CommonMark | CommonMark | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| kramdown-rfc2629 | Markdown for RFCs | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| rfc7328 | Pandoc2rfc | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| Extra | Markdown Extra | [RFC 7764](https://tools.ietf.org/html/rfc7764)
| SSW | Markdown for SSW | |

参考: [Markdown Variants](https://www.iana.org/assignments/markdown-variants/markdown-variants.xhtml)

この記事で紹介した実装依存のシンタックスについては、拡張シンタックスでサポートされているものもある。

たとえば [アンカーなしリンク](#アンカーなしリンク-(実装依存)) は GitHub Flavored Markdown (GFM) ではサポートされている。GitHub でマークダウンをプレビューした際に URL がそのままリンクになるのは、GFM を使用しているためである。

## 各言語のライブラリ
各言語ごとにどのようなマークダウンパーサのライブラリがあるのかは [Awesome Markdown](https://project-awesome.org/BubuAnabelas/awesome-markdown) に詳しくまとめられている。

他にも、マークダウンがサポートされているサービス・CMS・ブログ・ツールなどの情報も載っている。

ちなみにオリジナルは Perl で実装されている。

[Daring Fireball: Markdown](https://daringfireball.net/projects/markdown/)

## サービスで使用されているパーサライブラリ
自分がよく使うサービスで使用されているパーサライブラリをまとめてみた[^information-freshness-services-parser-library]。

[^information-freshness-services-parser-library]: 情報は 2021 年 5 月 3 日 (月) 現在

| サービス | ライブラリ | 言語 |
| --- | --- | --- |
| GitHub | [github-markdown](https://rubygems.org/gems/github-markdown) | Ruby |
| Qiita | [Qiita::Markdown](https://github.com/increments/qiita-markdown) | Ruby |
| Zenn | [markdown-it](https://github.com/markdown-it/markdown-it) | JavaScript |
| Jekyll (built by GitHub Pages) | [kramdown](https://github.com/gettalong/kramdown) or [jekyll-commonmark-ghpages](https://github.com/github/jekyll-commonmark-ghpages) | Ruby |
