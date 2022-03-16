---
title: "【設定簡単】GitHub Actions を使ってリポジトリ上の技術記事を Qiita に自動で投稿しよう"
emoji: "🔖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHub", "Qiita", "GitHubActions"]
published: true
order: 134
layout: article
---

# はじめに
以前にこのような記事を書いた。

[Qiita に投稿する技術記事を GitHub で管理する方法](https://zenn.dev/noraworld/articles/github-to-qiita)

この記事で紹介しているのは、GitHub Webhooks を設定して、自分でサーバを用意し、スクリプトをデーモン化して使ってね、というものだった。

ただ、これだと自前でサーバを用意しないといけなくて、気軽に利用してもらえるものではないなーと思った。

そこで、新しい実装として、GitHub Actions を使って同じことを実現するスクリプトを作ったので紹介する。

[GitHub-to-Qiita](https://github.com/noraworld/github-to-qiita) を利用するワークフローを設定すれば、誰でも簡単に設定することができる[^1]。

[^1]: ちなみに以前の実装 (サーバ上でデーモン化して使用する実装) は [noraworld/github-to-qiita-server](https://github.com/noraworld/github-to-qiita-server) に移行した。



# メリット
前回の記事でも書いたが、再掲する。

* 編集履歴をコマンドラインで見ることができる
* 好みのエディタで技術記事を執筆することができる
* Qiita のサーバがダウンしているかどうかを気にすることなく技術記事を書き始めることができる



# セットアップ
GitHub Actions の使い方がわからない？ 大丈夫！ 設定はとても簡単。以下の 3 ステップで設定ができる。

1. Qiita のアクセストークンを生成する
2. 生成したトークンを GitHub リポジトリに設定する
3. GitHub Actions のワークフロー (YAML) をリポジトリに置く

## Qiita のアクセストークンを生成する
[Qiita のアクセストークン生成ページ](https://qiita.com/settings/tokens/new) にアクセスする。

以下の情報を入力して生成ボタンを押す。

| キー | 説明 | 固定値かどうか | サンプル値または固定値 |
| --- | --- | --- | --- |
| Description | わかりやすい名前をつける | false | `GitHub to Qiita` |
| Scopes | 下の画像と同じアクセストークンの権限に設定する | true | `read_qiita` と `write_qiita` |

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-to-qiita-by-github-actions/generate_qiita_access_token.png)

生成ボタンを押すと画面にアクセストークンが表示されるのでコピーしておく。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-to-qiita-by-github-actions/qiita_access_token.png)

**上記スクリーンショットのアクセストークンはダミー。間違ってもここに表示された文字列を外部に公開したり他人に教えたりしないように！**

## 生成したトークンを GitHub リポジトリに設定する
`https://github.com/<USERNAME>/<REPONAME>/settings/secrets/actions/new` にアクセスする。

以下の情報を入力してシークレット追加ボタンを押す。

| キー | 説明 | サンプル値 |
| --- | --- | --- |
| Name | 環境変数名 | `QIITA_ACCESS_TOKEN` |
| Value | Qiita のアクセストークン | `7ace9cfa98815ed3d5cd1e1bba8e745c152e9071` (これはサンプルだよ！) |

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-to-qiita-by-github-actions/actions_secrets.png)

## GitHub Actions のワークフロー (YAML) をリポジトリに置く
技術記事が置いてあるリポジトリに `.github/workflows/qiita.yml` というファイルを作り、以下のような YAML を書く。`.github` は隠しディレクトリである点に注意。

```yaml:.github/workflows/qiita.yml
name: "GitHub to Qiita"

on:
  push:
    branches: [ main ]

jobs:
  qiita:
    runs-on: ubuntu-latest
    steps:
      - name: "Publish to Qiita"
        uses: noraworld/github-to-qiita@v1.0.0
        with:
          dir: "articles"
          qiita_access_token: ${{ secrets.QIITA_ACCESS_TOKEN }}
          mapping_filepath: "mapping.txt"
          strict: false
```

以下のテーブルを参考に、一部の設定を自分の環境に併せて書き換える。必須ではない部分は省略してもデフォルト値が入るので問題ない。

| キー | 説明 | 必須かどうか | サンプル値またはデフォルト値 |
| --- | --- | --- | --- |
| `jobs.qiita.steps[*].with.dir` | Qiita に投稿したい技術記事が格納されているディレクトリを指定する | true | `articles` |
| `jobs.qiita.steps[*].with.qiita_access_token` | Qiita のアクセストークン (`${{ secrets.QIITA_ACCESS_TOKEN }}` で参照可能) | true | `${{ secrets.QIITA_ACCESS_TOKEN }}` |
| `jobs.qiita.steps[*].with.mapping_filepath` | マッピングファイルパスを指定する | false | `mapping.txt` |
| `jobs.qiita.steps[*].with.strict` | 厳密チェックモードをオンにするかどうか | false | `false` |

`${{ secrets.QIITA_ACCESS_TOKEN }}` の `QIITA_ACCESS_TOKEN` の部分は、リポジトリにアクセストークンを設定した際に環境変数を別の名前に変えていた場合は、ここも変更する必要がある。

### マッピングファイルパスについて
マッピングファイルとは、GitHub リポジトリ上の技術記事のファイルパスと、Qiita の記事 ID を対応付けるためのファイルのこと。

これは GitHub Actions 側で自動的にマッピングしてくれるので、自分でこのファイルに書き込む必要はない。ただし、この GitHub Actions を導入する前に投稿された技術記事に関してはマッピングされていないので、それらの技術記事を更新した際にも Qiita 上に反映させたい場合は、手動でマッピングする必要がある。

`jobs.qiita.steps[*].with.mapping_filepath` を指定しない場合は `mapping.txt` というファイルがリポジトリのルートに作成される。ファイルパスを変更したい場合はこの値を設定すること。

### 厳密チェックモードについて
厳密チェックモードをオン (`true`) に設定していると、Qiita に投稿されていない (マッピング情報がない) 技術記事がリポジトリ側にあって、それを編集した際には Qiita には投稿されない (エラーになる) 。なぜなら対応する Qiita 記事が見つからないから。

厳密チェックモードをオフ (`false`) にした場合は、Qiita に投稿されていない技術記事を編集した際に、**新しい記事として** Qiita に投稿される。

このように説明するとオフにしておいたほうが、よしなにやってくれるから便利じゃん！ って思うかもしれない。しかし、この GitHub Actions を導入する前に投稿された技術記事に関してはマッピング情報がないので、本当は Qiita に投稿されている記事なのに、マッピング情報がないことによって新しい記事として投稿されてしまう可能性がある。つまり重複投稿になってしまうというわけだ。

マッピングファイルが完全な情報を持っていない (すべての技術記事がマッピングされていない) うちは、`true` にしたほうが良いかもしれない。ただし、`true` にした場合、Qiita API のエラーや技術記事のシンタックスエラーなどで新規投稿ができなかった際に、手動で Qiita に投稿してマッピングファイルを更新しなければいけない点に注意すること。

ちなみにデフォルトだと `false` になっている。

---

これでセットアップは完了！ 簡単でしょ？



# 記述ルール
技術記事の Markdown には以下のような YAML ヘッダをファイルの先頭につける必要がある。これが正しく設定されていないとエラーになってしまうので注意すること。

```yaml
---
title: "記事のタイトル"
topics: ["GitHub Actions", "Ruby", "YAML"]
published: true
---

ここから記事を書き始める。
```

| キー | 説明 | 型 | 制約 |
| --- | --- | --- | --- |
| `title` | 記事のタイトル | 文字列 | |
| `topics` | 記事のタグ | 配列[文字列, <文字列, 文字列, ...>] | タグの数は 1 〜 5 個まで |
| `published` | 一般公開するか限定共有記事にするか | 真偽値 | |

上記 3 つのキーはすべて必須項目。

記事のタグは `topics` というキーであることに注意。表記揺れしていてややこしくて申し訳ないが、これは [Zenn](https://zenn.dev) との互換性のため。

ちなみにファイルの 1 行目を `---` にする必要がある。余計な空行などを入れてはいけない。

追加のキーや値は自由に設定可能。たとえば YAML ヘッダに `foo: bar` などと書いておいても大丈夫。



# 動作方法
あとは、該当リポジトリの特定のブランチ、特定のディレクトリに技術記事を push するだけで自動的に Qiita に投稿してくれる。

投稿が成功したかどうかは `https://github.com/<USERNAME>/<REPONAME>/actions/workflows/qiita.yml` に行くと確認できる。

なお、特定のブランチというのは、ワークフローで設定したブランチのことを指している。

例にあるのと同じように

```yaml
    branches: [ main ]
```

と書いた場合は `main` ブランチに push した場合に動作する。

また、特定のディレクトリというのは、`jobs.qiita.steps[*].with.dir` で設定したディレクトリのことである。それ以外のディレクトリにあるファイルを変更しても動作しない。



# 追加実装予定の機能について
[Issues](https://github.com/noraworld/github-to-qiita/issues) にまとめている。

機能要望やバグ報告についてもここから受け付けている。



# その他
[Qiita の編集リクエスト](https://qiita.com/patches) を受け付けてしまうと、GitHub リポジトリ上には反映されない[^2]。なので、編集リクエストは受け付けないようにしたほうが良いかも。

[^2]: もちろん Qiita のページから記事を編集した場合も同様。

ただし、編集リクエストを受け付けない設定をすることはできないので、Qiita アカウントのプロフィール欄に、「記事の修正の提案は `<技術記事のリポジトリ URL>` に PR を送ってください。」と明記しておくと良いかも。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-to-qiita-by-github-actions/qiita_profile.png)
