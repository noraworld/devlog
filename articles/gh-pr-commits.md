---
title: "gh コマンドで特定の PR のコミットハッシュをすべて取得する方法"
emoji: "🌟"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["gh", "GitHub"]
published: true
order: 120
layout: article
---

# 取得方法
調べてもすぐに情報が出てこなかったので備忘録として残しておく。

```shell
gh pr view <PR_NUMBER> --json commits --jq .commits[].oid [--repo <USERNANE>/<REPONAME>]
```

# 例
たとえば [Pull Request #17516 · mastodon/mastodon](https://github.com/mastodon/mastodon/pull/17516) のコミットハッシュをすべて取得するコマンドを例に挙げる。

## リモートリポジトリに紐付いたリポジトリがローカルにない場合

```shell
gh pr view 17516 --json commits --jq .commits[].oid --repo mastodon/mastodon
```

```
d631b743c51a15994634314d6302fa33b9b49fef
d388a25dcddf93909d56f66872d48850e0194ca7
e2a97be470f3f4788dc850de4e352e85b5b567a7
```

## リモートリポジトリに紐付いたリポジトリがローカルにあり、そのディレクトリにいる場合
`--repo` を省略できる。

```shell
gh pr view 17516 --json commits --jq .commits[].oid
```

```
d631b743c51a15994634314d6302fa33b9b49fef
d388a25dcddf93909d56f66872d48850e0194ca7
e2a97be470f3f4788dc850de4e352e85b5b567a7
```

# 参考
* [Optionally show commit details as part of the PR details](https://github.com/cli/cli/issues/959#issuecomment-1034071623)
* [gh pr view | GitHub CLI](https://cli.github.com/manual/gh_pr_view)
