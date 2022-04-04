---
title: "GitHub で PR をマージするときの 3 つのオプションの違いについて"
emoji: "🐕"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Git", "GitHub"]
published: true
order: 135
layout: article
---

# はじめに
GitHub で PR をマージするとき、以下の 3 種類のオプションがある。

* Create a merge commit
* Squash and merge
* Rebase and merge

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.05.43.png)

この 3 種類のオプションの違いについて解説する。



# Create a merge commit
* PR にあるコミットと全く同じコミットハッシュのコミットがそのままマージ先ブランチに追加される
* それに加えてすべてのコミットの差分をまとめたマージコミットが新しく追加される

## イメージ

```mermaid
flowchart LR
    subgraph マージ先
        direction LR

        a2[A]
        b2[B]
        c2[C]
        d2[D]
        e2[E]
        f2[F]

        m[M]
    end

    subgraph マージ元
        direction LR

        a1[A]
        b1[B]
        c1[C]
        d1[D]
        e1[E]
        f1[F]
    end

    a1 --- b1 --- c1 --- d1 --- e1 --- f1
    a2 --- b2 --- c2 --- d2 --- e2 --- f2 --- m
```

`A` 〜 `F` は、両者のブランチともにコミットハッシュ含め全く同じコミットである。

`M` はマージコミットで、`A` 〜 `F` までの差分がすべて含まれている。

## 詳細
以下のスクリーンショットは PR のコミット一覧のページである。コミットハッシュの部分を赤枠で囲んでいる。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.22.15.png)

そして上記 PR をマージしたあとのマージ先ブランチのコミット一覧のページが以下のスクリーンショットである。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.18.03.png)

表示順序が逆になっているが、コミットハッシュがマージ元のブランチ (PR) のコミットのものと全く同じであることがわかる。

それに加えてコミットメッセージが `Merge pull request` から始まるコミットが新しく追加されている。このコミットは PR のすべての差分が含まれている。

本質的なコミットとは別にマージコミットが増えてしまうので、コミット履歴は汚くなる。

その代わり、PR のコミットと全く同じコミットが取り込まれるのでややこしいことが起こりづらい。

Git フローで開発していて、リリース時に `develop` ブランチから `main` ブランチにマージするとき、このオプションを使うと、マージコミットを除けば両者のブランチのコミットを同じに保つことができるので比較しやすくなるというメリットがある。




# Squash and merge
* PR にあるすべてのコミットを 1 つにまとめたコミットがマージ先ブランチに追加される

## イメージ

```mermaid
flowchart LR
    subgraph マージ先
        direction LR

        s[S]
    end

    subgraph マージ元
        direction LR

        a[A]
        b[B]
        c[C]
        d[D]
        e[E]
        f[F]
    end

    a --- b --- c --- d --- e --- f
```

`S` はスカッシュしたコミット (1 つにまとめたコミット) で、`A` 〜 `F` までの差分がすべて含まれている。

## 詳細
以下のスクリーンショットは PR のコミット一覧のページである。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.44.24.png)

そして上記 PR をマージしたあとのマージ先ブランチのコミット一覧のページが以下のスクリーンショットである。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.46.10.png)

コミットが 1 つにまとまっている。コミットハッシュはもちろん新しく生成される。

デフォルトだと、すべての PR のコミットメッセージが詳細部分に含まれる。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.47.50.png)

コミットがまとめられるので見た目がスッキリする。コミット履歴をきれいに保ちたい人には重宝するだろう。

ただし、Git フローで開発していて、リリース時に `develop` ブランチから `main` ブランチにマージするとき、このオプションを使うと `develop` ↔ `main` 間のコミットがバラバラになって比較が難しくなるのでおすすめしない。



# Rebase and merge
* PR にあるコミットのクローンコミットがマージ先ブランチに追加される
    * **コミットハッシュがすべて変わる**

## イメージ

```mermaid
flowchart LR
    subgraph マージ先
        direction LR

        a2[A']
        b2[B']
        c2[C']
        d2[D']
        e2[E']
        f2[F']
    end

    subgraph マージ元
        direction LR

        a1[A]
        b1[B]
        c1[C]
        d1[D]
        e1[E]
        f1[F]
    end

    a1 --- b1 --- c1 --- d1 --- e1 --- f1
    a2 --- b2 --- c2 --- d2 --- e2 --- f2
```

`A` 〜 `F` は、コミットメッセージや差分に関しては、それぞれ `A'` 〜 `F'` と同じではあるが、コミットハッシュが異なる。

そのため、Git としてはそれぞれが別のコミットという扱いになる。

## 詳細
以下のスクリーンショットは PR のコミット一覧のページである。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.56.08.png)

そして上記 PR をマージしたあとのマージ先ブランチのコミット一覧のページが以下のスクリーンショットである。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/github-merge-options/Screen%20Shot%202022-03-19%20at%2022.55.45.png)

一見すると、PR のコミットがそのままマージ先ブランチに取り込まれたように見えるが、**コミットハッシュがすべて変わっている** 点に注意。

コミットメッセージやそのコミットの差分はもちろん全く同じなのだが、コミットハッシュは異なる。そのため、Git からすると別のコミット扱いになる。

差分がなくてもコミットハッシュは異なるので、コンフリクトが起きることがある。

こちらも "Squash and merge" と同じく、Git フローのリリース時にこのオプションを使うと `develop` ↔ `main` 間のコミットがバラバラになる。特別な理由がない限りは避けたほうが無難だろう。



# まとめ

| 種類 | 挙動 | メリット | デメリット |
| --- | --- | --- | --- |
| Create a merge commit | PR にあるコミットと全く同じコミット + マージコミット | ブランチ間の差分が比較しやすくなる | コミット履歴が汚くなる |
| Squash and merge | PR にあるすべてのコミットを 1 つにまとめたコミット | コミット履歴がスッキリする | ブランチ間の差分が比較しづらい |
| Rebase and merge | PR にあるコミットのクローンコミット | PR のコミット内容をそのまま反映できる | ブランチ間の差分が比較しづらい |
