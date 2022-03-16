---
title: "GitHub Actions で Git の操作 (前のコミット ID 取得など) がうまくいかないときの対処法"
emoji: "🐱"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHubActions", "GitHub", "Git"]
published: true
order: 131
layout: article
---

# GitHub Actions で Git の操作をする方法
GitHub Actions で YAML 内に以下を追加すると Git の操作ができるようになる。

```yaml
- uses: actions/checkout@v2
```

たとえば、push 時に発火して、push 直前のコミットと最新のコミットの間で変更されたファイル一覧を取得したかったとする。

```yaml
run: git diff --name-only ${{ github.event.before }} ${{ github.sha }} | xargs
```

# エラー
しかし、これを GitHub Actions 上で実行すると以下のようなエラーが出る。

```
fatal: bad object 1486f018f2a4958801fef8059f264d8101203404
```

ローカルに clone してきて同じコマンドを実行するとうまくいく。

# 解決策
`fetch-depth` を追加する。

```yaml
- uses: actions/checkout@v2
  with:
    fetch-depth: 0
```

[この記事](https://zenn.dev/satococoa/articles/e026c0689e5678) に以下のように書かれている。

>actions/checkout@v2ではチェックアウト時の時間短縮のために指定されたブランチの先頭コミットしか取得(fetch)してきません。

引用元: https://zenn.dev/satococoa/articles/e026c0689e5678

先の例では、`fetch-depth` を指定しないと、push 直前のコミットが取得できないのでエラーになってしまっていた、ということ。

# 参考
* [GitHub Actionsで特定のコミットをcheckoutしてワークフローを実行する](https://zenn.dev/satococoa/articles/e026c0689e5678)
* [Changed files](https://github.com/tj-actions/changed-files)
* [Get changed files in github actions](https://dev.to/scienta/get-changed-files-in-github-actions-1p36)
