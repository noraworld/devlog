---
title: "Docker を利用したマストドンのアップデートメモ"
emoji: "🐳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "マストドン", "Docker", "docker-compose"]
published: false
order: 33
---

# はじめに
このアップデートメモでは、以下の状況を想定しています。

* Docker を使用している場合
* `docker-compose.yml` を編集している場合
* `master` の最新版ではなく最新バージョン（[タグ](https://github.com/tootsuite/mastodon/releases)付き最新版）にアップデートする場合

Docker を使用する場合はデータの永続化を行うために `docker-compose.yml` を編集している人も多いかと思います。未コミットのコードがある状態では最新バージョンのコードをマージすることができないので、未コミット状態のコードを退避する必要があります。

また、`git pull` コマンドを使用して [origin / master](https://github.com/tootsuite/mastodon) の最新版にアップデートすることもできますが、マストドンは頻繁にコミットされているので、`git pull` するタイミングによっては思わぬバグを踏んでしまう可能性があります。そのため、公式でも、最新のタグ付きバージョンに更新することを推奨しています。

これらの点を考慮して、実際にアップデートした手順をメモとしてまとめたいと思います。

# TL;DR

```bash
$ cd path/to/mastodon
$ git fetch
$ git stash
$ git checkout $(git tag | sort -V | tail -n 1)
$ git stash pop stash@{0}
$ sudo docker-compose build
$ sudo docker-compose run --rm web rails db:migrate
$ sudo docker-compose run --rm web rails assets:precompile
$ sudo docker-compose stop && sudo docker-compose up -d
```

# ファイルの退避と更新
未コミット状態のファイルの退避とマストドンのコードの更新を行います。

## 作業ディレクトリへの移動
まずはマストドンのコードがあるディレクトリに移動します。以降はこのディレクトリで作業します。

```bash
$ cd path/to/mastodon
```

## ローカルリポジトリに反映
リモートにある Git リポジトリをローカルに反映させるためにフェッチします。

```bash
$ git fetch
```

## ファイルの退避
`docker-compose.yml` 等のファイルに変更を加えている場合は退避します。

```bash
$ git stash
```

未コミット状態のファイルが退避されました。`git status` や `git diff` を実行したときにリポジトリがクリーンな状態になっていることが確認できると思います。

この状態で以下のコマンドを実行すると、現在退避中のコードが確認できます。

```
$ git stash list
stash@{0}: WIP on (no branch): 01e011bc Bump version to 1.3.2 (#2623)
```

`stash@{0}` の箇所が各スタッシュを識別するための番号のようなものです。`01e011bc Bump version to 1.3.2 (#2623)` は、このスタッシュを退避したときの一番新しいコミット番号とコミットメッセージです。

はじめて退避した場合は `stash@{0}` しかないので特に問題はないと思います。以前に退避を行ってそのまま放置していた場合はスタッシュのリストが複数表示されると思いますが、スタッシュは最新版が上（`stash@{0}`）に来るように積まれていくので、いずれにしても `stash@{0}` が今回退避したコードになります。

### `docker-compose.yml` を編集する理由
デフォルトの `docker-compose.yml`（GitHub の公式リポジトリからクローンしてきて変更を加えていない `docker-compose.yml`）だと、PostgreSQL と Redis のデータが永続化されていません。

データが永続化されていない状態でも使用することはできますが、設定を変更して Docker コンテナを再構築するときや、コマンドをうっかり間違えてコンテナを削除してしまったときに、データベースごと消えてしまいます。

そうならないように、`docker-compose.yml` を編集してデータの永続化を行うようにすることを推奨します。そのために、ここでは `git stash` コマンドで未コミットのファイルを退避する方法を説明しています。

データの永続化に関する詳細や、設定方法に関しては「[Docker を使ってデータの永続化をせずにマストドンをデプロイしてしまったときの対処法](http://qiita.com/noraworld/items/ff775cbad97baf566614)」を参考にしてください。

## タグ付き最新版へのアップデート
退避ができてリポジトリがクリーンな状態になったらタグ付き最新版にアップデートします。

```bash
$ git checkout $(git tag | sort -V | tail -n 1)
```

`git checkout [バージョン番号]` で指定したタグ付きバージョンにアップデートできます。手動でタグ付き最新版のバージョンを調べるなら [Releases · tootsuite/mastodon](https://github.com/tootsuite/mastodon/releases) にアクセスして確認することもできますが、`git tag` を上手く利用することでわざわざ手動で確認しなくても済みます。

```bash
$ git tag
v0.1.0
v0.1.1
v0.1.2
v0.6
v0.7
v0.8
v0.9
v0.9.9
v1.0
v1.1
v1.1.1
v1.1.2
v1.2
v1.2.1
v1.2.2
v1.3
v1.3.1
v1.3.2
v1.3.3
v1.4.1
v1.4rc1
v1.4rc2
v1.4rc3
v1.4rc4
v1.4rc5
v1.4rc6
```

※ 2017/05/30 の出力結果です

この出力結果だと `1.4.1` が最新版ですが、Release Candidate 版が下に来てしまっているので、本来の最新版が一番下に来るようにソートします。

```bash
$ git tag | sort -V
v0.1.0
v0.1.1
v0.1.2
v0.6
v0.7
v0.8
v0.9
v0.9.9
v1.0
v1.1
v1.1.1
v1.1.2
v1.2
v1.2.1
v1.2.2
v1.3
v1.3.1
v1.3.2
v1.3.3
v1.4rc1
v1.4rc2
v1.4rc3
v1.4rc4
v1.4rc5
v1.4rc6
v1.4.1
```

そしてこの出力結果に対して `tail` で一番下の一行を抽出すればそれがタグ付き最新版のバージョンになります。

```bash
$ git tag | sort -V | tail -n 1
v1.4.1
```

## ファイルの復帰
チェックアウトしてタグ付きの最新版に更新できたら、先ほど退避したコードをリストアします。

```bash
$ git stash pop stash@{0}
```

以前に別のコードを退避したものが残っていても、今回の退避は `stash@{0}` のはずなので、上記のコマンドで問題ないかと思います。

退避したコードを復帰するコマンドには `git stash pop [番号]` と `git stash apply [番号]` があります。`pop` は、復帰したあと、スタッシュリストから削除するのに対して、`apply` は復帰するだけでスタッシュリストからの削除を行いません。復帰はしたがスタッシュリストに残ってしまったものを削除するには `git stash drop [番号]` を使います。つまり、`pop` は `apply` と `drop` を一緒に行うものだと考えてください。

復帰済みのコードがスタッシュリストに残り続けていると、退避をするたびにリストが増えてしまい、どのスタッシュがどの内容を退避したのかがわからなくなってきてしまうので、復帰済みのスタッシュは削除することをおすすめします。退避が完了したらスタッシュは不要なので、リストからの削除も一緒に行う `pop` を使用するのが良いかと思います。

# Docker のビルドと再起動
ここまできたらあとは Docker を使用した通常の作業と同様です。まずは最新バージョンの状態になったものをビルドします。

```bash
$ sudo docker-compose build
```

ビルドには時間がかかりますが、多くの場合は問題なくビルドが完了するはずです。

ビルドが完了したらマイグレーションを実行します。

```bash
$ sudo docker-compose run --rm web rails db:migrate
```

次にプリコンパイルを実行します。

```bash
$ sudo docker-compose run --rm web rails assets:precompile
```

最後に Docker を再起動します。

```bash
$ sudo docker-compose stop && sudo docker-compose up -d
```

問題なく再起動できればアップデート作業は終了です。お疲れさまでした。

再起動はすぐに完了しますが、再起動中と再起動直後をあわせて数秒のダウンタイムが発生するので、本番環境で実行する場合はあらかじめユーザにアナウンスをしておくとよいかと思います。

# アップデートの確認
正しいバージョンは把握できていませんが、少なくとも `v1.2.2` 以降からは `/about/more` のページにマストドンのバージョンが表示されるようになっています。（バージョン情報が表示されるようになった正しいバージョンを知っている方はコメントで教えていただけるとうれしいです）

![mastodon_version.png](https://qiita-image-store.s3.amazonaws.com/0/113895/30a08131-7005-0895-6711-f20b1951d390.png)

このバージョンがタグ付き最新版のバージョンと一致していれば、正しくアップデートできたことが確認できます。
