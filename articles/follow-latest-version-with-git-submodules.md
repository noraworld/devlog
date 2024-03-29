---
title: "Git Submodules でサブモジュール内のリポジトリをリモートの master の最新版に追従する"
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Git", "submodule", "GitHub", "git-submodule"]
published: true
order: 49
layout: article
---

# サブモジュールが更新されない
Git Submodules を使うと他のリポジトリのコードを取り込むことができます。

```bash
$ git submodule add <リポジトリのURL>
```

しかし、上記のようにサブモジュールを追加すると、サブモジュール側が更新されても新しい更新に追従することができません。`git submodule update` を実行してもリモートの最新の状態に追従することができません。

Git Submodules は、通常はブランチではなく特定のコミット単位で関連付けを行うため、上記のコマンドを実行すると、その時点での最新のコミットのコミット ID で関連付けを行います。つまり、その後、サブモジュール側が更新されても、コミット ID は変更されないため、`git submodule update` しても更新されないのです。

# ブランチ名を指定
ブランチ名を追加することでそのブランチの最新版に追従することができます。

```bash
$ git submodule add -b <ブランチ名> <リポジトリのURL>
```

つまり、リモートリポジトリの master に追従したい場合は `<ブランチ名>` に `master` を指定すれば OK です。

```bash
$ git submodule add -b master <リポジトリのURL>
```

# リモートリポジトリの master に追従
追従する際には `--remote` オプションをつけることで、リモートリポジトリの master に追従することができます。

```bash
$ git submodule update --remote
```

また、サブモジュール内のコードを直接変更してコミットした場合は、`git submodule update` を実行しなくても勝手に追従してくれます。

`git submodule update` を実行するとサブモジュールの変更が入るので、`git add` して `git commit` すればサブモジュールの更新の追従を反映させることができます。

# サブモジュールの運用方法
本記事で紹介したように、ブランチを指定する方法もありますが、基本的にはサブモジュールは特定のコミット単位で指定するものです。そのような仕様になっていることからも、頻繁に更新されるプロジェクトをサブモジュールで管理して、頻繁にサブモジュール側の最新に追従するという運用はあまり好ましくありません。

サブモジュールを最新に追従するたびにコミットが発生しますし、常に最新を追従していると、サブモジュール側のバグを取り込んでしまう可能性も高くなります。

サブモジュールの運用としては、サブモジュール側のプロジェクトのメジャーアップデートが行われたタイミングなど、更新を頻繁に行う必要がない程度に管理すると良いでしょう。

# 参考サイト
* [git submodule tracking latest](https://stackoverflow.com/questions/9189575/git-submodule-tracking-latest)
