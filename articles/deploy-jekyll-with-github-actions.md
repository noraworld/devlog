---
title: "GitHub Pages で Jekyll を使うときは GitHub Actions を使ったほうがいいかもというお話"
emoji: "🧪"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHub", "GitHubActions", "Jekyll", "Ruby"]
published: true
order: 173
layout: article
---

# はじめに
昨今の GitHub Pages では従来の HTML を配信するだけのモード（クラシックモード）と GitHub Actions を使用するモードが選べます。

![](https://noraworld.github.io/box-ivysaur/2025/04/05/6e4424b46ad2765aa4fdf911dba81916.png)

実はクラシックモードでは HTML を配信する以外に Jekyll という静的サイトジェネレータ（SSG）を使うことができます。というか何も設定していない場合は自動で Jekyll が使用される設定になっています。

他の SSG を使ったり GitHub Pages ではない場所にホスティングしたりしたい場合には GitHub Actions を使うことになりますが、GitHub Pages × Jekyll を使うのであれば GitHub Actions は不要なためとても簡単にセットアップできます。

筆者もそこが気に入っており長らくその構成で GitHub Pages を利用しておりましたが、この構成には様々な制約がありそれが JavaScript 等の力技ではどうにもできなくて不便なので GitHub Actions を使った構成に切り替えることにしました。

今回の記事では具体的な制約（感じた問題点）について解説するとともに、クラシックモードさながらの簡単な方法でセットアップする方法について紹介します。

## クラシックモードで Jekyll を無効にしたい場合
余談ですが、クラシックモードで Jekyll を使わない、つまり純粋な HTML のみをホスティングしたい場合は、リポジトリのルートに `.nojekyll` という空ファイルを置くと Jekyll を無効化できます。

[Bypassing Jekyll on GitHub Pages - The GitHub Blog](https://github.blog/news-insights/bypassing-jekyll-on-github-pages/)

GitHub Actions を使う場合は `.nojekyll` は不要です。



# ライブラリのバージョンが古い問題
クラシックモードの Jekyll ではリポジトリの `Gemfile` を読み取るわけではなく、GitHub が指定したライブラリとそのバージョンが内部的に使用されます。

使用可能なライブラリとバージョン一覧は GitHub が公開しています。

[Dependency versions | GitHub Pages](https://pages.github.com/versions/)

注目してほしいのは Jekyll 本体のバージョンです。2025 年 4 月 5 日現在、最終更新日は 2025 年 1 月 30 日となっています。しかし Jekyll のバージョンは 3.10.0 です。これは現在の最新バージョン [4.4.1](https://rubygems.org/gems/jekyll/versions/4.4.1) から大きく離れています。

このバージョンの違いにより不便だと感じたのが `render_with_liquid` が使えない点です。

## `{{ }}` が使えない問題
Jekyll は内部で Liquid というテンプレートエンジンを使用しています。

[Liquid template language](https://shopify.github.io/liquid/)

Liquid では式を `{% %}` で囲み、変数を `{{ }}` で囲むことで HTML に特定の値を埋め込んだりループ処理をしたりすることができます。これはたとえばブログ記事を Jekyll でビルドする際に、特定のディレクトリから全記事を取得してループ処理して記事一覧ページ（トップページ）を表示する、といった用途で使われます。

とても便利な機能ではあるのですが、この記法は記事内にも反映されるという点に注意が必要です。たとえば技術記事ブログを Jekyll でビルドしたとして、[GitHub Actions で使用される変数](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables) について紹介する際に `${{ env.FOO }}` と書くと `$` と表示されてしまいます。これは `{{ env.FOO }}` の部分が Liquid で処理されてしまうからです。

これを回避するには `{% raw %}` と `{% endraw %}` で囲む必要があります。

```
GitHub Actions で環境変数を参照するには `{% raw %}`${{ env.FOO }}`{% endraw %}` のように書きます。
```

ただ、これを `{{ }}` がある場所に毎回書くのはめんどくさいですよね。それを回避するために、記事内全体で `{{ }}` を Liquid として解釈しないオプションがあります。それが `render_with_liquid` です。

`articles` というディレクトリの中に記事を置いていたとします。そのディレクトリの中にあるファイルに対しては一括で `{{ }}` を Liquid として解釈しないようにするには、`_config.yml` に以下の設定を追加します。

```yaml:_config.yml
defaults:
  - scope:
      type: articles
    values:
      render_with_liquid: false
```

https://github.com/noraworld/devlog/blob/bbe0ec751bbf785610f97b734cc73480d24f26c5/_config.yml#L76-L81

ただし、このオプションは Jekyll 4.0 から追加されたもので、クラシックモードで現在使われている 3.10.0 では使用できません。

[Tags Filters | Jekyll • Simple, blog-aware, static sites](https://jekyllrb.com/docs/liquid/tags/)

つまり、クラシックモードで Jekyll をビルドした場合は毎回 `{% raw %}`${{ env.FOO }}`{% endraw %}` のように書かなければいけません。通常のブログであれば `{{ }}` を使うことはそうそうないかもしれませんが、技術記事を書く場合には不便なことが多いです。



# 規定のマークダウンパーサの挙動が怪しい問題
もう一つ、クラシックモードには大きな制約があります。それはマークダウンパーサが [kramdown](https://rubygems.org/gems/kramdown) しか使えない点です。

これはバージョンが問題というよりパーサ自体にクセがあります。GitHub Flavored Markdown (GFM) と異なる挙動が多く、ふだんから GitHub のマークダウンに慣れ親しんでいる人からすると少々使いづらいです。具体的な例を見ていきましょう。

## ヘッドライン直下のテーブルがパースされない
厳密に言うと、「ヘッドライン直下に空行を入れないと、テーブルがパースされない」です。

```markdown
# ヘッドライン

| ヘッダ 1 | ヘッダ 2 |
| --- | --- |
| 値 1 | 値 2 |
```

は正しくパースされるのですが、

```markdown
# ヘッドライン
| ヘッダ 1 | ヘッダ 2 |
| --- | --- |
| 値 1 | 値 2 |
```

とすると正しくパースされません。テーブルのマークダウンの raw がそのまま表示されてしまいます。

![](https://noraworld.github.io/box-ivysaur/2025/04/05/50db7c8b5eb74680268ea6ef9789a3dd.png)

ヘッドラインの前後に空行があると、マークダウンファイルを raw で見たときに、そのヘッドラインがどこに所属しているのかが見た目としてはっきりしないので筆者はヘッドライン直下に空行を入れずに書くほうが好みです。しかし kramdown だと挙動がおかしくなることがあるので空行を入れないといけません。

### 回避方法
ヘッドライン直下に空行を入れれば解決します。

## `<details>` タグの中身がパースされない
`<details>` タグを使うと長い文章を折りたたむことができます。たとえば

```markdown
<details>
<summary>詳細を表示</summary>

| ヘッダ 1 | ヘッダ 2 |
| --- | --- |
| 値 1 | 値 2 |
</details>
```

と書くと以下のように表示されます。

<details>
<summary>詳細を表示</summary>

| ヘッダ 1 | ヘッダ 2 |
| --- | --- |
| 値 1 | 値 2 |
</details>

GFM では `<details>` の中にマークダウンを書くとそれもパースされます。しかし kramdown ではパースされません。

![](https://noraworld.github.io/box-ivysaur/2025/04/05/b4d23e65c56e13c77545b255f1709a48.png)

### 回避方法
`<details>` タグの中でマークダウンは使えないので、HTML をそのまま書く必要があります。

## リンクテキストに `|` が入るとテーブルとして解釈される
以下のようにリンクテキストの中に `|` を入れたとき、それがテーブルとして解釈されます。

```markdown
[Dependency versions | GitHub Pages](https://pages.github.com/versions/)
```

これは GFM では以下のように表示されます。

[Dependency versions | GitHub Pages](https://pages.github.com/versions/)

しかし kramdown では以下のように表示されます。

![](https://noraworld.github.io/box-ivysaur/2025/04/05/c7197fffbf3d7048f6ac7dff2eed7bf2.png)

### 回避方法
`|` の前に `\` を入れるとテーブルになるのを防げます。

```markdown
[Dependency versions \| GitHub Pages](https://pages.github.com/versions/)
```

## 裸の URL がリンクにならない
https://pages.github.com/versions/ のように URL だけを書いたとき、GFM ではリンクになりますが kramdown ではなりません。

![](https://noraworld.github.io/box-ivysaur/2025/04/05/95ba45dc3ed0d133c11c6b90e0565e2e.png)

### 回避方法
リンクテキストを書く必要があります。

```markdown
[https://pages.github.com/versions/](https://pages.github.com/versions/)
```

---

これらの挙動はおそらくバグではなく仕様ということなのだと思いますが、GFM とは異なるので使い勝手があまりよくないと個人的に感じます。一応、[kramdown-parser-gfm](https://rubygems.org/gems/kramdown-parser-gfm) というライブラリが使用可能ですが、実際のところ GitHub のマークダウンと同じ挙動にはなっていないのが実情です。



# GitHub Actions に移行してみよう
このようにクラシックモードの Jekyll には様々な制約があります。手軽に使用できること、またセルフビルドせずにマークダウンファイルだけを GitHub リポジトリにプッシュすれば勝手にビルド・デプロイしてくれる点も魅力的でした。しかしこれらの制約が長く続くことを踏まえると、やはり GitHub Actions を用いて構築するほうが使い勝手が向上すると思います。

GitHub Actions に移行する前、筆者は SSG でビルドされた HTML をリポジトリに置かなければいけないのではないかという点を憂慮していました。ビルド自体は GitHub Actions でやってくれるとはいえ、そこで生成された HTML ファイルをリポジトリにプッシュされるようにして、それを GitHub Pages で配信する、という形式になるのだろうと思っていました。

しかし最近の GitHub Actions は GitHub Pages の整備もいろいろ整っていて、リポジトリに直接 HTML を置かなくても、内部でビルドされた HTML を GitHub Pages で配信してくれるようです。なので GitHub Actions を使う際に懸念していた問題もすべて解消されました。

唯一 GitHub Actions の欠点があるとすればそれはやはりクラシックモードに比べてセットアップの手間が増えることでしょうか。筆者は複数のリポジトリに GitHub Pages を設定しているので、Ruby のバージョンをアップデートしたり Gemfile を更新したりするたびに各リポジトリでファイルを変更しなければいけないのが少々手間だなと感じておりました。

そこで、各リポジトリで使用している `.ruby-version` や `Gemfile` を共通化し、それを呼び出して使用する Action を作りました。

[noraworld/jekyll-build-pages: A simple GitHub Action for producing Jekyll build artifacts with customizable environments.](https://github.com/noraworld/jekyll-build-pages)

使い方はいたってシンプルです。まずは `https://github.com/<USERNAME>/<REPONAME>/settings/pages` にアクセスし GitHub Pages で GitHub Actions を有効化します。

![](https://noraworld.github.io/box-ivysaur/2025/04/05/6653d1bd537dcc477948626db3abd2b9.png)

あとは数行の YAML の設定を置くだけです。

```yaml:.github/workflows/pages.yml
name: Build and Deploy Jekyll

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build_and_deploy:
    uses: noraworld/jekyll-build-pages/.github/workflows/jekyll-gh-pages.yml@main
```

これで、これを設置したリポジトリで新しいバージョンの Jekyll (`render_with_liquid`) が使えるようになります。

また [`jekyll-commonmark`](https://rubygems.org/gems/jekyll-commonmark) をプリインストールしてあるため [CommonMark](https://rubygems.org/gems/commonmarker) を使用することができます。これは kramdown とは別のマークダウンパーサで、先述した kramdown の問題点がすべて解消されております。

CommonMark を使用するには `_config.yml` に以下を追加します。

```yaml:_config.yml
markdown: CommonMark
commonmark:
  options: ["UNSAFE", "SMART", "FOOTNOTES"]
  extensions: ["strikethrough", "autolink", "table", "tagfilter"]
```

https://github.com/noraworld/devlog/blob/bbe0ec751bbf785610f97b734cc73480d24f26c5/_config.yml#L33-L36

[noraworld/jekyll-build-pages](https://github.com/noraworld/jekyll-build-pages) では現時点での最新の Ruby や Jekyll のバージョンを使用しております。今後もなるべく最新のものに追従していく予定です。

自分の `Gemfile` を使用するオプションなども提供しています。詳細な使い方は [noraworld/jekyll-build-pages の README](https://github.com/noraworld/jekyll-build-pages?tab=readme-ov-file#jekyll-build-pages) をご覧ください。



# おわりに
クラシックモードでの Jekyll のビルドの手軽さとシンプルさが気に入っていたので GitHub Actions に移行するのは少々迷っていましたが、実際に試してみるとほとんどクラシックモードと変わらない使用感だったので移行してよかったなと思います。

また、[noraworld/jekyll-build-pages](https://github.com/noraworld/jekyll-build-pages) を使えばセットアップもほぼ手間がかからないので、今までクラシックモードでビルドしていた方はこれを機に GitHub Actions に移行してみるのはいかがでしょうか。
