---
title: "【チーム団欒ノスヽメ】GitHub のコメントに自動で LGTM 画像を投稿しよう"
emoji: "⭐️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHub", "GitHubActions", "LGTM"]
published: true
order: 128
layout: article
---

# はじめに
筆者が所属しているプロジェクトのチームでは、GitHub の Issue や PR で "LGTM" を含むコメントをすると LGTM 画像が投稿される。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/lgtm-github-actions/Screen%20Shot%202022-03-08%20at%2021.46.27.png)

上記のスクリーンショットの例では釜玉うどんの LGTM 画像が表示されているが、この画像は毎回ランダムで表示される。

この記事では、これの導入方法について解説する。



# 何か意味あるの？
一見すると何の生産性も上がらない無駄なもののように思えるが、潜在的には必ずしもそうとは限らないと筆者は考えている。

たしかに業務の効率化などには全くならないかもしれないが、チーム内の話のネタや雰囲気作りになり、それによりコミュニケーションが円滑にできるようになり、結果的にチーム全体としての生産性は上がるのではないかと思っている。

実際、筆者が所属しているプロジェクトでも、この LGTM 画像をきっかけに Slack で会話が弾んだりしてコミュニケーションが取れることがよくある。

業務においてコミュニケーションが取りやすいというのはかなり重要である。何かわからないことがあったときに気軽に質問できる雰囲気、困ったことがあったときに相談できる雰囲気があるチームのほうが、経験上、仕事もうまくいくことが多いように感じる。

そういう観点でいえば導入する価値はあるのではないだろうか。毎回どんな LGTM 画像が出るのかというガチャ的な要素もあって PR にコメントするのが楽しくなるのもメリットの一つだ。



# 導入方法
すでにこれを実現するサービスと GitHub Actions が存在する。それらを利用することで、とても簡単に導入することができる。

* [LGTMoon](https://lgtmoon.dev)
* [action-lgtmoon](https://github.com/Doarakko/action-lgtmoon)

`.github/workflows/main.yml`[^1] というファイルを作成し、その中に以下の設定を追加するだけで良い。

[^1]: `.github` は隠しディレクトリである点に注意。

```yml:.github/workflows/main.yml
name: LGTM
on:
  issue_comment:
    types: [created]
  pull_request_review:
    types: [submitted]
  pull_request_review_comment:
    types: [created]

jobs:
  lgtm:
    runs-on: ubuntu-latest
    steps:
      - name: LGTM
        uses: Doarakko/action-lgtmoon@v1.0
        if: >-
          contains(github.event.comment.body, 'lgtm')
          || contains(github.event.review.body, 'lgtm')
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
```

特に書き換える必要がある部分はない。`${{secrets.GITHUB_TOKEN}}` もそのままで良い。

バージョンは `v1.0` に固定すること。`v1.1` は正常に動作しない[^2]。

[^2]: https://github.com/Doarakko/action-lgtmoon/issues/3 が解決されたら、解決されたあとのバージョンや `@main` を指定しても良いかもしれない。

## ファイル名は任意
ファイル名は `main.yml` である必要はない。他の GitHub Actions のファイルもある場合は、わかりやすく `lgtm.yml` とかにしても良いかもしれない。

## ディレクトリは固定
ファイルを置く位置は `.github/workflows` とすること。

## ブランチはデフォルト
GitHub Actions はデフォルトブランチに上記のような YAML ファイルがないと動作しない。つまり、`main` ブランチや `develop` ブランチなどがデフォルトブランチだった場合はそのブランチにファイルがないといけない。

そのため、**トピックブランチを切って上記の YAML ファイルを作成して、デフォルトブランチにマージする PR を作っても、その時点では動作しない** 点に注意すること。

裏を返せば正しく動作するかどうかはデフォルトブランチにマージしてみないとわからない。デバッグがしづらいのが GitHub Actions の弱点だろうか。



# 動作確認
デフォルトブランチに上記の YAML ファイルを作成したら、実際に動作確認してみよう。

適当にテスト用の Issue を作って "LGTM" を含むコメントをした際に、`github-actions` という bot からランダムな LGTM 画像が投稿されれば正しく動作している。

Issue だけでなく PR でも同様に機能するはずだ。



# 参考サイト
* [【LGTMoon】LGTM すると自動で LGTM 画像が投稿される GitHub Actions を作りました](https://zenn.dev/peperoncicicino/articles/f92bfc548d7b72)
