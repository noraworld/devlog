---
title: "GitHub Actions でメタデータ (actions.yml) 側のスクリプトを実行する方法"
emoji: "🐙"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHubActions", "GitHub", "YAML", "env"]
published: true
order: 132
layout: article
---

# TL;DR
`${{ github.action_path }}` を使う。



# メタデータとワークフロー
GitHub Actions には、メタデータとワークフローの 2 種類が存在する。ファイル名やディレクトリ構造、使用用途についての違いは以下のとおり。

| 名称 | ファイル名・ディレクトリ構造 | 使用用途 | 備考 |
| --- | --- | --- | --- |
| メタデータ | `action.yml` | 外部のリポジトリで特定の処理を実行させたり、他のユーザに使ってもらったり、[マーケットプレイス](https://github.com/marketplace?type=actions) に公開したりしたい場合 ||
| ワークフロー | `.github/workflow/***.yml` | そのリポジトリ内のみで任意の処理を実行したい場合 | ファイル名 (`***` の部分) は任意 |

ワークフローはそのリポジトリで動作するものなので、任意のコマンドやスクリプトを実行させたい場合はそのままパスを指定すれば良い。

たとえば、リポジトリのルートディレクトリに `main.rb` というファイルがあり、それを実行したい場合は、単に `ruby main.rb` のように記述すれば良い。



# 問題点
しかし、メタデータでそのように記述してしまうと、そのメタデータを使うリポジトリ側、つまりワークフロー側のパスを参照してしまう。

たとえば、リポジトリ A (`username/repo-a`) には、以下のようなメタデータ (`action.yml`) が置かれているとする[^1]。

[^1]: 他にも必要な記述はあるが、説明の都合上、省略している。

```yaml:action.yml
runs:
  using: "composite"
  step:
    - run: ruby main.rb
      shell: sh
```

上記のメタデータをリポジトリ B で使いたいとする[^1]。ファイル名は適当に `ruby.yml` としている。

```yaml:.github/workflow/ruby.yml
jobs:
  ruby:
    runs-on: ubuntu-latest
    steps:
      - uses: username/repo-a
```

この状態で、リポジトリ B でワークフローを実行すると、`ruby main.rb` が実行されるのだが、ここでいう `main.rb` はリポジトリ B の `main.rb` を参照してしまう[^2]。

[^2]: その他の例として、メタデータ (リポジトリ A) 側の `Gemfile` に記載されているライブラリをインストールしたくて `bundle install` を実行すると、ワークフロー (リポジトリ B) 側の `Gemfile` を使ってインストールしようとしてしまう (リポジトリ B 側に `Gemfile` がない場合はコマンドが失敗する) 。

ワークフロー側 (リポジトリ B) ではなく、メタデータ側 (リポジトリ A) にある `main.rb` を実行させたい場合はどうすれば良いだろうか。



# 解決策
`${{ github.action_path }}` を使うことでメタデータ側のパスを指定することができる。メタデータを以下のように書き換える。

```diff:action.yml
 runs:
   using: "composite"
   step:
-    - run: ruby main.rb
+    - run: ruby $GITHUB_ACTION_PATH/main.rb
       shell: sh
+      env:
+        GITHUB_ACTION_PATH: ${{ github.action_path }}
```

すると、`main.rb` はメタデータ (リポジトリ A) のほうを参照してくれるようになる。



# 参考
* [changed-files/action.yml at 9125e4d5da611929abd53b039acc130bc6d19a01 · tj-actions/changed-files](https://github.com/tj-actions/changed-files/blob/9125e4d5da611929abd53b039acc130bc6d19a01/action.yml#L131-L148)
* [github-to-qiita/action.yml at 7cb850a7bbf9a3b23eb7896c0e1e8c5c50d798c6 · noraworld/github-to-qiita](https://github.com/noraworld/github-to-qiita/blob/7cb850a7bbf9a3b23eb7896c0e1e8c5c50d798c6/action.yml#L60-L69)
* [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
* [Metadata syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
