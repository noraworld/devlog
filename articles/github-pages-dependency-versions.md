---
title: "GitHub Pages の Jekyll 自動ビルドで使えるプラグインをまとめてみた"
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Jekyll", "GitHubPages", "GitHub", "Ruby", "SSG"]
published: true
order: 116
layout: article
---

# はじめに
GitHub 上の HTML を Web ページとして公開してくれる GitHub Pages というサービスがある。作ったツールのドキュメントなどを、自分でサーバを用意することなく Web ページとして公開することができるが、サイトジェネレータを使用すればブログのようなサイトを GitHub Pages で公開することもできる。

HTML / CSS / JavaScript しか使用できない (Ruby や Go などサーバサイドの処理は行えない) ので、基本的にはブログ記事をマークダウン等で書いたら、それをローカルでビルドして HTML に変換してからその HTML を GitHub リポジトリ上にプッシュすることになるが、実は Jekyll というサイトジェネレータに限っては、自分でローカルでビルドせずとも、GitHub が自動でビルドまで行ってくれる。つまりマークダウンをそのまま GitHub リポジトリ上にプッシュすれば GitHub が自動的に HTML に変換して Web ページを作ってくれるというわけだ。

ただし、それには制限がある。自分でローカルでビルドする場合は、世の中に公開されているものや自分で作った Jekyll プラグインを使って HTML を生成することができるが、GitHub 上でビルドしてもらう場合は使えるプラグインに制限がある。というより、GitHub が認めたものしか使えない。

この記事では、現時点 (2021/12/29) で使用可能な Jekyll プラグインについて紹介する。

## 自動ビルドのメリット
自分でビルドしなくて良いのにはどのようなメリットがあるか。それはスマホでサイトを更新したい場合だろう。

自分でビルドする必要があるということは、必然的に PC で作業する必要がある。絶対に PC でしかサイトを更新しないのであればそれでも良いが、ブログなどを手軽にスマホで更新したいこともあるだろう。そういうときにこの自動ビルドがあれば、いちいち PC を用意してビルドしなくてもスマホだけで完結するのでとても便利だ。もちろん最初の Jekyll のファイルやディレクトリを生成したり、デザインを更新したりする場合は PC を使うことになるだろうが、単純に記事を作ったり編集したりするだけなら、スマホ用の Git クライアントアプリだけで簡単に更新ができてしまうのである。

## リンク
この記事で紹介するのはあくまで現時点 (2021/12/29) でのものである。最新の状態と、自動ビルドに使われる各プラグインのバージョンは以下のリンクを参照すること。

* [Web ページ](https://pages.github.com/versions/)
* [JSON](https://pages.github.com/versions.json)



# プラグイン一覧
* 必須
    * [Jekyll](#jekyll)
    * [Ruby](#ruby)
    * [Jekyll::Paginate](#jekyll%3A%3Apaginate)
    * [Liquid template engine](#liquid-template-engine)
    * [Nokogiri](#nokogiri)
    * [SafeYAML](#safeyaml)
* ユーティリティ
    * [GitHub Pages Health Check](#github-pages-health-check)
    * [GitHub Pages Ruby Gem](#github-pages-ruby-gem)
* Markdown パーサ
    * [HTML::Pipeline](#html%3A%3Apipeline)
    * [jekyll-commonmark-ghpages](#jekyll-commonmark-ghpages)
    * [kramdown GFM parser](#kramdown-gfm-parser)
    * [kramdown](#kramdown)
* トランスパイラ
    * [Jekyll::Coffeescript](#jekyll%3A%3Acoffeescript)
    * [Jekyll Sass Converter](#jekyll-sass-converter)
    * [Sass](#sass)
* 変換ツール
    * [Jekyll Avatar](#jekyll-avatar)
    * [Jekyll::Gist](#jekyll%3A%3Agist)
    * [Jekyll Mentions](#jekyll-mentions)
    * [Jekyll Relative Links](#jekyll-relative-links)
    * [Jemoji](#jemoji)
    * [Rouge](#rouge)
* SEO
    * [Jekyll Feed plugin](#jekyll-feed-plugin)
    * [Jekyll SEO Tag](#jekyll-seo-tag)
    * [Jekyll Sitemap Generator Plugin](#jekyll-sitemap-generator-plugin)
* 自動化
    * [GitHub Metadata](#github-metadata)
    * [Jekyll Optional Front Matter](#jekyll-optional-front-matter)
    * [Jekyll Readme Index](#jekyll-readme-index)
    * [JekyllRedirectFrom](#jekyllredirectfrom)
    * [Jekyll Titles from Headings](#jekyll-titles-from-headings)
* レイアウト補助・テーマ補助
    * [Jekyll Default Layout](#jekyll-default-layout)
    * [Jekyll Remote Theme](#jekyll-remote-theme)
* レイアウト・テーマ
    * [Swiss Jekyll Theme](#swiss-jekyll-theme)
    * [The Architect theme](#the-architect-theme)
    * [The Cayman theme](#the-cayman-theme)
    * [The Dinky theme](#the-dinky-theme)
    * [The Hacker theme](#the-hacker-theme)
    * [The Leap day theme](#the-leap-day-theme)
    * [The Merlot theme](#the-merlot-theme)
    * [The Midnight theme](#the-midnight-theme)
    * [The Minimal theme](#the-minimal-theme)
    * [The Modernist theme](#the-modernist-theme)
    * [The Primer theme](#the-primer-theme)
    * [The Slate theme](#the-slate-theme)
    * [The Tactile theme](#the-tactile-theme)
    * [The Time machine theme](#the-time-machine-theme)
    * [minima](#minima)



## Jekyll

| Attribute    | URL                              |
| ------------ | -------------------------------- |
| Homepage     | https://jekyllrb.com             |
| GitHub repo  | https://github.com/jekyll/jekyll |
| RubyGems.org | https://rubygems.org/gems/jekyll |

これはプラグインというか、Jekyll 本体である。これがないことにはそもそも自動ビルドも行ってくれないので必然的に必要となる。逆に、このサイトジェネレータじゃないもの (Hugo など) を使いたい場合は自動ビルドはやってもらえないので、自分でローカルでビルドした HTML を公開する必要がある。



## GitHub Pages Health Check

| Attribute    | URL                                                 |
| ------------ | --------------------------------------------------- |
| Homepage     | https://github.com/github/pages-health-check        |
| GitHub repo  | https://github.com/github/pages-health-check        |
| RubyGems.org | https://rubygems.org/gems/github-pages-health-check |

GitHub Pages で独自ドメインを使用する場合に、そのドメインの DNS レコードが正常に登録され、GitHub Pages で使用可能な状態かどうかを確認するためのツール。独自ドメインを使用しない場合、およびすでに正常にレコードが登録されていることを確認済みの場合は使用する機会はないだろう。



## GitHub Pages Ruby Gem

| Attribute    | URL                                    |
| ------------ | -------------------------------------- |
| Homepage     | https://github.com/github/pages-gem    |
| GitHub repo  | https://github.com/github/pages-gem    |
| RubyGems.org | https://rubygems.org/gems/github-pages |

ローカルで Jekyll の環境を整える際に、GitHub Pages で使用できる RubyGems とそのバージョンを自動的に指定してインストールしてくれるツール。これは GitHub Pages で公開する Web ページに直接影響を与えるものではない。あくまで環境構築のツールだと思っておけば良いだろう。



## HTML::Pipeline

| Attribute    | URL                                         |
| ------------ | ------------------------------------------- |
| Homepage     | https://github.com/gjtorikian/html-pipeline |
| GitHub repo  | https://github.com/gjtorikian/html-pipeline |
| RubyGems.org | https://rubygems.org/gems/html-pipeline     |

マークダウンで書いた文章を HTML に変換してくれるツール。そのほか、コードのシンタックスハイライトや絵文字ショートコードの絵文字変換や `@user` をそのユーザページの URL に変換してくれたりする機能もある。



## Jekyll Avatar

| Attribute    | URL                                     |
| ------------ | --------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-avatar |
| GitHub repo  | https://github.com/jekyll/jekyll-avatar |
| RubyGems.org | https://rubygems.org/gems/jekyll-avatar |

Jekyll でビルドした Web ページ上に GitHub のアバター (プロフィール画像) を表示してくれるツール。手動でアバターをダウンロードして貼り付ける方法もあるが、このツールを使用すれば自動的にその時点の最新のアバターを添付してくれるので便利だろう。GitHub のアバターを変えた際に、いちいち Web ページ上の画像も差し替える必要がない。



## Jekyll::Coffeescript

| Attribute    | URL                                           |
| ------------ | --------------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-coffeescript |
| GitHub repo  | https://github.com/jekyll/jekyll-coffeescript |
| RubyGems.org | https://rubygems.org/gems/jekyll-coffeescript |

CoffeeScript を JavaScript に変換してくれるツール。Jekyll の Web ページ上で実現したい処理を CoffeeScript で記述したい人にはおすすめだが、はじめから JavaScript で記述する際には不要だろう。



## jekyll-commonmark-ghpages

| Attribute    | URL                                                 |
| ------------ | --------------------------------------------------- |
| Homepage     | https://github.com/github/jekyll-commonmark-ghpages |
| GitHub repo  | https://github.com/github/jekyll-commonmark-ghpages |
| RubyGems.org | https://rubygems.org/gems/jekyll-commonmark-ghpages |

マークダウンを HTML に変換してくれるツール。取り消し線や URL の自動リンク化、タグフィルターなどをサポートしている。



## Jekyll Default Layout

| Attribute    | URL                                                |
| ------------ | -------------------------------------------------- |
| Homepage     | https://github.com/benbalter/jekyll-default-layout |
| GitHub repo  | https://github.com/benbalter/jekyll-default-layout |
| RubyGems.org | https://rubygems.org/gems/jekyll-default-layout    |

Jekyll の Web ページにまだ何もレイアウトを適用していなかった場合に、最低限のレイアウトを自動的に適用してくれるツール。とりあえず出来合いの Web デザインでコンテンツを GitHub Pages 上で公開したい場合には使えるだろうが、自分でデザインを作ったり他のもっとオシャレなデザインを使う場合は不要になるだろう。

それと、`jekyll new` して最初に適用されているのは、後述する minima というデザインなので、これを使用する機会は、自ら選択しない限りはないだろう。



## Jekyll Feed plugin

| Attribute    | URL                                   |
| ------------ | ------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-feed |
| GitHub repo  | https://github.com/jekyll/jekyll-feed |
| RubyGems.org | https://rubygems.org/gems/jekyll-feed |

フィード (簡単に言うと、ブログを更新したことを他の人に伝えるための仕組み) 用の XML を自動的に生成してくれるツール。対応しているのは Atom のみで、RSS はサポートされていない。

フィードをサポートして困ることはないと思うので、とりあえず入れておくべきだろう。ちなみに `jekyll new` した際に自動的にインストールされている。



## Jekyll::Gist

| Attribute    | URL                                   |
| ------------ | ------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-gist |
| GitHub repo  | https://github.com/jekyll/jekyll-gist |
| RubyGems.org | https://rubygems.org/gems/jekyll-gist |

Gist の ID を指定して専用のタグを書くと、HTML の `<script>` タグに自動的に変換して Web ページ上に Gist の内容が埋め込まれるようになるツール。Gist を頻繁に利用するなら入れておいても良いかもしれないが、全く使わないなら入れなくて良いかも。



## GitHub Metadata

| Attribute    | URL                                              |
| ------------ | ------------------------------------------------ |
| Homepage     | https://github.com/jekyll/github-metadata        |
| GitHub repo  | https://github.com/jekyll/github-metadata        |
| RubyGems.org | https://rubygems.org/gems/jekyll-github-metadata |

Jekyll ではサイトのタイトルや説明文を設定する変数が用意されているが、これらの変数が設定されていなかった場合に、代わりに GitHub リポジトリ上のリポジトリ名や説明文をサイトのものとして入れてくれるというツール。

Jekyll の設定ファイル側で設定しておけば良いだけなので、これも使う機会はあまりないだろう。メリットを挙げるなら、タイトルや説明文を変えたくなったときに、わざわざ GitHub リポジトリ側とサイト側の両方を編集する必要がないことだが、あくまでリポジトリ上のそれらとサイト上のそれらが一緒でも良いという場合に限るので、汎用性はあまりない気がする。



## Jekyll Mentions

| Attribute    | URL                                       |
| ------------ | ----------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-mentions |
| GitHub repo  | https://github.com/jekyll/jekyll-mentions |
| RubyGems.org | https://rubygems.org/gems/jekyll-mentions |

`@user` を自動的にリンクに変換してくれるツール。設定ファイルに URL を設定して、それぞれの記事内で `@user` のように記述するとその URL のサービスの該当ユーザのページの URL に変換される。

たとえば、設定ファイルに `jekyll-mentions: https://twitter.com` と書いておいて、記事ファイルに `@user` と書くと、その部分が `https://twitter.com/user` というリンクになる。

毎回、記事内の冒頭で Twitter のアカウントを掲載する人だったらこれは便利だと思う。毎回リンクを貼らなくても良くなるので。



## Jekyll Optional Front Matter

| Attribute    | URL                                                       |
| ------------ | --------------------------------------------------------- |
| Homepage     | https://github.com/benbalter/jekyll-optional-front-matter |
| GitHub repo  | https://github.com/benbalter/jekyll-optional-front-matter |
| RubyGems.org | https://rubygems.org/gems/jekyll-optional-front-matter    |

Jekyll では、作成したマークダウンに YAML フロントマター (マークダウンファイルの一番上の行に追加される、そのマークダウンのタイトルや公開日時などを記述するための YAML ヘッダ) が必ず必要になる。しかしこのプラグインを使うと、それが必要なくなる。

ブログのような Web サイトではなく、それぞれ独立した単純なマークダウンを HTML に変換する場合に、このツールを使えばわざわざ YAML フロントマターを毎回書かなくても良いというメリットがある。しかしブログとして公開する場合はあまり使う機会はなさそうだ。個人的には、正直あまり使いみちが見つからない。



## Jekyll::Paginate

| Attribute    | URL                                       |
| ------------ | ----------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-paginate |
| GitHub repo  | https://github.com/jekyll/jekyll-paginate |
| RubyGems.org | https://rubygems.org/gems/jekyll-paginate |

ページネーションを行うツール。サイト上でページネーションを行う際は必然的にこのツールが必要になる。



## Jekyll Readme Index

| Attribute    | URL                                              |
| ------------ | ------------------------------------------------ |
| Homepage     | https://github.com/benbalter/jekyll-readme-index |
| GitHub repo  | https://github.com/benbalter/jekyll-readme-index |
| RubyGems.org | https://rubygems.org/gems/jekyll-readme-index    |

GitHub リポジトリ上の README の内容を、そのままサイトのインデックスページにすることができるツール。

ドキュメントのようなサイトを構築する場合は、README の内容がそのままトップページになることは充分あり得るので便利だが、ブログのようなサイトの場合は、トップページは記事一覧ページになるだろうから、あまり役立たないかもしれない。



## JekyllRedirectFrom

| Attribute    | URL                                            |
| ------------ | ---------------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-redirect-from |
| GitHub repo  | https://github.com/jekyll/jekyll-redirect-from |
| RubyGems.org | https://rubygems.org/gems/jekyll-redirect-from |

他のブログサービスなどから (想定としては、おそらくドメインも同じになるように) 移行した際に、旧ブログサービスのパスでアクセスされた際に、自動的に新しいパスにリダイレクトしてくれるツール。リダイレクトのためだけのファイルを生成する必要がなくなる。

旧ブログサービスで運用していて、手軽にリダイレクト処理を実現したい場合には便利だろう。旧ブログから移行しない場合は不要。



## Jekyll Relative Links

| Attribute    | URL                                                |
| ------------ | -------------------------------------------------- |
| Homepage     | https://github.com/benbalter/jekyll-relative-links |
| GitHub repo  | https://github.com/benbalter/jekyll-relative-links |
| RubyGems.org | https://rubygems.org/gems/jekyll-relative-links    |

拡張子が `.md` になっているリンク (サイト内の他の記事を参照するリンク) の拡張子を、自動的に `.html` に変換してくれるツール。これにより、GitHub リポジトリ上でも、サイト上でも有効なリンクになる。

サイト上で有効なリンクとして機能するのはもちろんのこと、GitHub リポジトリ上でも有効なリンクとして維持しておきたい場合に便利。これによりサイト上でも GitHub リポジトリ上でも快適に記事を閲覧することができるよになる。



## Jekyll Remote Theme

| Attribute    | URL                                              |
| ------------ | ------------------------------------------------ |
| Homepage     | https://github.com/benbalter/jekyll-remote-theme |
| GitHub repo  | https://github.com/benbalter/jekyll-remote-theme |
| RubyGems.org | https://rubygems.org/gems/jekyll-remote-theme    |

GitHub 上で公開されている Jekyll テーマを適用することができるツール。テーマは GitHub 上でパブリックリポジトリとして公開されている必要がある。その代わり、RubyGems に公開しておく必要はない。Jekyll テーマのルールに従ったソースコードになっていれば良い。

このプラグインのおかげで、実質的に GitHub 側の自動ビルドでも様々なテーマが使えるようになる。自分でデザインを決めて、該当サイトのみに直接コーディングする場合には不要にはなるが、せっかくなら誰でも使えるテーマとして別リポジトリで公開して、このプラグインを使って自分のサイトにも適用するのが良いだろう。それができるという意味でもこのプラグインは便利だと思う。



## Jekyll Sass Converter

| Attribute    | URL                                             |
| ------------ | ----------------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-sass-converter |
| GitHub repo  | https://github.com/jekyll/jekyll-sass-converter |
| RubyGems.org | https://rubygems.org/gems/jekyll-sass-converter |

Sass で記述した内容を CSS に変換してくれるツール。Sass だけでなく SCSS もサポートされている。このツールは Jekyll 本体にバンドルされているので、自分で指定してインストールする必要はない。

単純に Sass や SCSS が使えたほうがデザインを構築する際に便利だろう。



## Jekyll SEO Tag

| Attribute    | URL                                      |
| ------------ | ---------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-seo-tag |
| GitHub repo  | https://github.com/jekyll/jekyll-seo-tag |
| RubyGems.org | https://rubygems.org/gems/jekyll-seo-tag |

SEO 用のタグを自動的に付与してくれるツール。これはもう入れない手はないだろう。デフォルトではインストールされていないのでぜひインストールするべきプラグインである。

より最適化してくれるツールに [Jekyll SEO Gem](https://github.com/pmarsceill/jekyll-seo-gem) というものがあるが、残念ながらこちらは自動ビルドの対象外のツールとなる。このツールをどうしても使いたい場合は自動ビルドを諦めて手動でビルドしたものを公開することになる。



## Jekyll Sitemap Generator Plugin

| Attribute    | URL                                      |
| ------------ | ---------------------------------------- |
| Homepage     | https://github.com/jekyll/jekyll-sitemap |
| GitHub repo  | https://github.com/jekyll/jekyll-sitemap |
| RubyGems.org | https://rubygems.org/gems/jekyll-sitemap |

サイトマップを自動的に追加してくれるツール。単純にメリットしかないので SEO のツールとあわせて入れておくべきだろう。



## Swiss Jekyll Theme

| Attribute    | URL                                    |
| ------------ | -------------------------------------- |
| Homepage     | https://broccolini.net/swiss/          |
| GitHub repo  | https://github.com/broccolini/swiss    |
| RubyGems.org | https://rubygems.org/gems/jekyll-swiss |

Jekyll のテーマの一つ。どのようなテーマなのかはホームページを見たほうが早いだろう。

ただ、Jekyll Remote Theme があるので、これを単体でわざわざサポートしている意味はよくわからない。このテーマを使いたければ、Jekyll Remote Theme を使うか直接これを使うか、どちらでも良いだろう。



## The Architect theme

| Attribute    | URL                                              |
| ------------ | ------------------------------------------------ |
| Homepage     | https://pages-themes.github.io/architect/        |
| GitHub repo  | https://github.com/pages-themes/architect        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-architect |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Cayman theme

| Attribute    | URL                                           |
| ------------ | --------------------------------------------- |
| Homepage     | https://pages-themes.github.io/cayman/        |
| GitHub repo  | https://github.com/pages-themes/cayman        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-cayman |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Dinky theme

| Attribute    | URL                                          |
| ------------ | -------------------------------------------- |
| Homepage     | https://pages-themes.github.io/dinky/        |
| GitHub repo  | https://github.com/pages-themes/dinky        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-dinky |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Hacker theme

| Attribute    | URL                                           |
| ------------ | --------------------------------------------- |
| Homepage     | https://pages-themes.github.io/hacker/        |
| GitHub repo  | https://github.com/pages-themes/hacker        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-hacker |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Leap day theme

| Attribute    | URL                                             |
| ------------ | ----------------------------------------------- |
| Homepage     | https://pages-themes.github.io/leap-day/        |
| GitHub repo  | https://github.com/pages-themes/leap-day        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-leap-day |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Merlot theme

| Attribute    | URL                                           |
| ------------ | --------------------------------------------- |
| Homepage     | https://pages-themes.github.io/merlot/        |
| GitHub repo  | https://github.com/pages-themes/merlot        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-merlot |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Midnight theme

| Attribute    | URL                                             |
| ------------ | ----------------------------------------------- |
| Homepage     | https://pages-themes.github.io/midnight/        |
| GitHub repo  | https://github.com/pages-themes/midnight        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-midnight |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Minimal theme

| Attribute    | URL                                            |
| ------------ | ---------------------------------------------- |
| Homepage     | https://pages-themes.github.io/minimal/        |
| GitHub repo  | https://github.com/pages-themes/minimal        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-minimal |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Modernist theme

| Attribute    | URL                                              |
| ------------ | ------------------------------------------------ |
| Homepage     | https://pages-themes.github.io/modernist/        |
| GitHub repo  | https://github.com/pages-themes/modernist        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-modernist |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Primer theme

| Attribute    | URL                                           |
| ------------ | --------------------------------------------- |
| Homepage     | https://pages-themes.github.io/primer/        |
| GitHub repo  | https://github.com/pages-themes/primer        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-primer |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Slate theme

| Attribute    | URL                                          |
| ------------ | -------------------------------------------- |
| Homepage     | https://pages-themes.github.io/slate/        |
| GitHub repo  | https://github.com/pages-themes/slate        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-slate |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Tactile theme

| Attribute    | URL                                            |
| ------------ | ---------------------------------------------- |
| Homepage     | https://pages-themes.github.io/tactile/        |
| GitHub repo  | https://github.com/pages-themes/tactile        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-tactile |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## The Time machine theme

| Attribute    | URL                                                 |
| ------------ | --------------------------------------------------- |
| Homepage     | https://pages-themes.github.io/time-machine/        |
| GitHub repo  | https://github.com/pages-themes/time-machine        |
| RubyGems.org | https://rubygems.org/gems/jekyll-theme-time-machine |

Jekyll のテーマの一つ。それ以上のことは Swiss Jekyll Theme で説明したので割愛。



## Jekyll Titles from Headings

| Attribute    | URL                                                      |
| ------------ | -------------------------------------------------------- |
| Homepage     | https://github.com/benbalter/jekyll-titles-from-headings |
| GitHub repo  | https://github.com/benbalter/jekyll-titles-from-headings |
| RubyGems.org | https://rubygems.org/gems/jekyll-titles-from-headings    |

マークダウンで記述された記事に YAML フロントマターでタイトルを指定していなかったとき、そのマークダウンの一番最初の行が HTML でいう `<h1>`, `<h2>`, `<h3>` に該当する場合は、その見出しをその記事のタイトルにしてくれるツール。

ブログ記事の一番最初の見出しを必ず記事タイトルにする人の場合は、タイトルを書く手間が省けるので便利だろう。



## Jemoji

| Attribute    | URL                              |
| ------------ | -------------------------------- |
| Homepage     | https://github.com/jekyll/jemoji |
| GitHub repo  | https://github.com/jekyll/jemoji |
| RubyGems.org | https://rubygems.org/gems/jemoji |

`:smile:` のような絵文字ショートコードを絵文字の画像に変換してくれるツール。変換される絵文字の画像は GitHub CDN でホスティングされているものが使用される。

PC でもスマホでも、最近は `😀` のように絵文字のユニコードを直接入力できるようになっているから、これを使う必要性はあまりないのかも。あるとしたら、ユニコードの場合は OS によって絵文字の表示 (見た目) がかなり変わってしまうけど、画像の場合はどの OS や端末で見ても同じになる、ということだろう。



## kramdown GFM parser

| Attribute    | URL                                           |
| ------------ | --------------------------------------------- |
| Homepage     | https://github.com/kramdown/parser-gfm        |
| GitHub repo  | https://github.com/kramdown/parser-gfm        |
| RubyGems.org | https://rubygems.org/gems/kramdown-parser-gfm |

マークダウンを HTML に変換してくれるツール。[GitHub Flavored Markdown](https://github.github.com/gfm/) パーサと謳っておきながら URL は HTML リンクにパースされなかったりと、嘘つきなツール。しかしマークダウンパーサを自分で指定しなかった場合はこれがデフォルトで使われる。解せぬ。



## kramdown

| Attribute    | URL                                   |
| ------------ | ------------------------------------- |
| Homepage     | https://kramdown.gettalong.org        |
| GitHub repo  | https://github.com/gettalong/kramdown |
| RubyGems.org | https://rubygems.org/gems/kramdown    |

マークダウンを HTML に変換してくれるツール。kramdown GFM parser と同じくこちらも [GitHub Flavored Markdown](https://github.github.com/gfm/) をサポートしていると言っているので、両者で何が違うのかはよくわからない。kramdown GFM parser は kramdown を依存パッケージとして持つので、kramdown GFM parser には kramdown が含まれているのは確か。



## Liquid template engine

| Attribute    | URL                               |
| ------------ | --------------------------------- |
| Homepage     | https://shopify.github.io/liquid/ |
| GitHub repo  | https://github.com/Shopify/liquid |
| RubyGems.org | https://rubygems.org/gems/liquid  |

Jekyll で使われているテンプレートエンジン。Jekyll 内でバンドルされているので、必須のツールとなる。

HTML ファイル内で `{{ code }}` や `{% code %}` のように書くことで、条件分岐をしたりループを回したり Jekyll の変数を参照したりすることができる。



## minima

| Attribute    | URL                              |
| ------------ | -------------------------------- |
| Homepage     | https://jekyll.github.io/minima/ |
| GitHub repo  | https://github.com/jekyll/minima |
| RubyGems.org | https://rubygems.org/gems/minima |

Jekyll のテーマの一つ。`jekyll new` した際にデフォルトで適用されるのがこのテーマ。

可もなく不可もなくといった地味で無難なデザインだが、レスポンシブデザインに対応しているので、とりあえずサイトを公開したいときの最初のテーマとしてこれで充分なんじゃないかと思う。



## Nokogiri

| Attribute    | URL                                       |
| ------------ | ----------------------------------------- |
| Homepage     | https://nokogiri.org                      |
| GitHub repo  | https://github.com/sparklemotion/nokogiri |
| RubyGems.org | https://rubygems.org/gems/nokogiri        |

Ruby の HTML / XML パーサ。これが GitHub Pages の自動ビルドでサポートされているのはどういうことなのかよくわからない。Jekyll が内部的に使っているのだろうか。しかし依存関係にはなかった気がする。



## Rouge

| Attribute    | URL                                 |
| ------------ | ----------------------------------- |
| Homepage     | http://rouge.jneen.net              |
| GitHub repo  | https://github.com/rouge-ruby/rouge |
| RubyGems.org | https://rubygems.org/gems/rouge     |

記事内のコードブロックをシンタックスハイライトしてくれるツール。`jekyll new` した際にデフォルトでインストールされている。記事内でコードを書くことがあってもなくてもとりあえず入れておくと良いだろう。



## Ruby
もはやこれはプラグインでも RubyGems でもなくプログラミング言語そのものだが、一応バージョンを記載するために表記しているのだと思う。



## SafeYAML

| Attribute    | URL                                 |
| ------------ | ----------------------------------- |
| Homepage     | https://github.com/dtao/safe_yaml   |
| GitHub repo  | https://github.com/dtao/safe_yaml   |
| RubyGems.org | https://rubygems.org/gems/safe_yaml |

YAML パーサ。Jekyll が記事内の YAML フロントマターを処理するのに使用していると思われる。デフォルトでインストールされている。

余談だが、Ruby は RubyGems をインストールしなくても YAML をパースすることができるが、アプリが任意のコードを実行してしまう脆弱性があった。この RubyGems はその心配がないように設計されている。だからこの名前なのだろう。



## Sass

| Attribute    | URL                               |
| ------------ | --------------------------------- |
| Homepage     | https://sass-lang.com             |
| GitHub repo  | https://github.com/sass/ruby-sass |
| RubyGems.org | https://rubygems.org/gems/sass    |

Sass を CSS に変換してくれるツール。しかしこの RubyGems はメンテナンスやサポートが終了している。代わりに Jekyll Sass Converter が使えるが、GitHub はいつまでもこれをサポートしていて良いのだろうか……。

結論、この RubyGems は使わなくて良い、というか使わないほうが良いだろう。
