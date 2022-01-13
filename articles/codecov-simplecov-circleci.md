---
title: "Codecov × SimpleCov × RSpec × CircleCI で README にカバレッジを表示させる"
emoji: "🍁"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Codecov", "SimpleCov", "RSpec", "CircleCI", "Rails"]
published: true
order: 117
layout: article
---

# この記事を読むとできること
* GitHub の README に RSpec のカバレッジのバッジを表示させることができる
* バッジをクリックするとカバレッジの詳細やグラフを確認することができる





# はじめに
GitHub のリポジトリを見ていると、テストのカバレッジ (全アプリケーションのコードに対するテストコードのカバー率) が表示されたバッジをよく見かける。あれを自分もやってみたいと思い設定をしてみたのだが、思っていた以上に躓くポイントが多かった。そのため、導入方法をここに残しておく。

Codecov も SimpleCov も CircleCI もメジャーなツールではあるのだが、この 3 つを組み合わせた場合の導入方法を紹介している記事がほとんどなかった。この記事が、同じことを実現しようとしている人の役に立てば幸いである。

なお、この記事では、Git のホスティングサービスには GitHub、Ruby のテストツールには RSpec を使用することを想定している。ただ、基本は同じはずなので、異なる部分は適宜、読み替えること。





# Codecov の設定
まずは Codecov にサインアップしてバッジを表示させたいリポジトリを登録する。

1. [Codecov のサインアップページ](https://about.codecov.io/sign-up/) にアクセスし、サインアップする
    * GitHub, GitLab, Bitbucket から選択できる
    * GitHub Enterprise などを利用している場合は [セルフホストオプション](https://about.codecov.io/self-hosted/) を利用できる
2. `Not yet setup` をクリックすると、まだ Codecov が設定されていないリポジトリ一覧が表示されるので追加する
    * プライベートリポジトリを追加したい場合は、画面上にあるリンクからさらに権限を付与する必要がある
    * オーガナイゼーションのリポジトリを追加したいが一覧に表示されないという場合は、そのオーガナイゼーションのオーナーに権限を付与してもらう必要がある
3. Codecov のリポジトリ設定ページ (`https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/settings`) にアクセスする
4. `Activation` セクションから `Activate` ボタンをクリックして有効化する
5. `Repository Upload Token` セクションからトークンをクリップボードにコピーして控えておく

サインアップした直後はプライベートリポジトリは一覧に表示されない (追加で権限を付与する必要がある) のが少しだけわかりづらいので注意。





# CircleCI の設定
次に CircleCI の設定を行う。CircleCI は該当のリポジトリですでに稼働していることを前提とする。

## 環境変数の登録
1. CircleCI の環境変数の設定ページ (`https://app.circleci.com/settings/project/github/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/environment-variables`) にアクセスする
2. `Add Environment Variable` ボタンをクリックする
3. `Name` に `CODECOV_TOKEN` と入力する
4. `Value` に先ほど Codecov のページで控えておいたトークンをコピペする
5. `Add Environment Variable` ボタンをクリックして環境変数を登録する

## Orb のセキュリティ設定の変更
1. `Organization Settings` の `Security` セクション (`https://app.circleci.com/settings/organization/github/<USERNAME_OR_ORGNAME>/security`) にアクセスする
2. `Orb Security Settings` セクションから `Yes` を選択する




# コードの変更
ここからはリポジトリ上のコードを変更していく。

## Codecov と SimpleCov のインストール
Codecov と SimpleCov の RubyGems をインストールする。RSpec (または minitest などその他のテストツール) はすでにインストール済みであることを前提とする。

Gemfile に以下を記述する。

```ruby:Gemfile
group :test do
  gem 'codecov',   require: false
  gem 'simplecov', require: false
end
```

以下のコマンドを実行する。

```shell:Shell
bundle install
```

## SimpleCov と Codecov の読み込み
RSpec の設定 (`spec/spec_helper.rb`) から SimpleCov の読み込み設定と Codecov 用のフォーマットを追記する。SimpleCov を読み込むことで、テスト実行後にカバレッジ情報を `coverage` ディレクトリに出力してくれる。さらに SimpleCov のフォーマットを Codecov にすることで、Codecov で読み取れる形式の JSON ファイルを書き出してくれる。

RSpec ではないテストツールの場合は適宜変更すること。

```ruby:spec/spec_helper.rb
require 'simplecov'
SimpleCov.start 'rails'

require 'codecov'
SimpleCov.formatter = SimpleCov::Formatter::Codecov

RSpec.configure do |config|
  # 割愛
end
```

## CircleCI の設定ファイルの変更
CircleCI の設定ファイル (`.circleci/config.yml`) に必要な情報を追加する。

`executors`, `commands`, `workflows` などは割愛する。なお、以下はあくまで例なので、必要に応じて変更すること。

```yaml:.circleci/config.yml
version: 2.1

orbs:
  codecov: codecov/codecov@1.0.5

executors:
  # 割愛

commands:
  # 割愛

jobs:
  build:
    executor: default
    steps:
      - setup
      - checkout
      - run:
          name: test
          command: |
            mkdir -p reports
            docker create -v /reports --name reports alpine:3.4 /bin/true
            docker run --network <NETWORK> --env-file=./.circleci/app.env --volumes-from reports -it <CONTAINER> ./.circleci/docker-test
            docker cp reports:/reports reports
      - store_test_results:
          path: reports
      - codecov/upload:
          file: ./reports/reports/coverage/codecov-result.json

workflows:
  # 割愛
```

いくつかポイントがあるので説明する。

### Codecov Orb のバージョン
この Orb のスクリプトはバグが多くて、たとえば `1.0.4` だとシンタックスエラーになってしまう。全部のバージョンを試したわけではないが、他にも `1.1.4`, `1.1.5`, `1.1.6` などでも同じシンタックスエラーが発生することを確認済み。`1.0.5` なら正常に動作することを確認している。

[Orb doesn't work in Alpine images](https://github.com/codecov/codecov-circleci-orb/issues/8)

これは Docker の Alpine イメージ (Bash がない) で発生する問題らしいので、Bash が入っているイメージなら他のバージョンでも正常に動作するのかもしれない。

また、`2.x` や `3.x` だと `gpg: not found` という別のエラーが発生してしまう。

### `store_test_results` (CircleCI で Docker を利用している場合のみ)
Docker コンテナ内のファイルはコマンド終了後に消えてしまう。それを防ぐために、`store_test_results` を指定する。

`path: reports` のように記述すると、`reports` ディレクトリは消えずに残る。ここでは `reports` というディレクトリ名にしているが、他の名前にすることも可能。その場合は実行するコマンド内の記述も併せて変更すること。

### テスト実行用のスクリプトを別途用意 (CircleCI で Docker を利用している場合のみ)
上記の例では `./.circleci/docker-test` というスクリプトを実行しているが、このスクリプト内で RSpec (または別のテストツール) を実行する。`.circleci/docker-test` は以下のように記述する。なお、このファイル名は例なので変更しても良い。

```shell:.circleci/docker-test
#!/bin/sh
set -eux

RAILS_ENV=test bundle exec rails db:drop db:create >/dev/null 2>&1
RAILS_ENV=test bundle exec rspec

cp -R coverage /reports
```

SimpleCov をインストールしている場合、RSpec を実行するとプロジェクトディレクトリに `coverage` というディレクトリが生成され、その中にカバレッジの詳細データが格納される。そしてその `coverage` ディレクトリを、 `store_test_results` で指定したパス (今回は `/reports`) にコピーする必要がある。そうしないと Docker コンテナで生成されたカバレッジの詳細データが消えてしまうからである。

筆者はあまり Docker には詳しくないのだが、以下のように `docker run` コマンドを複数に分けると、RSpec 実行時に生成された `coverage` ディレクトリが消えてしまう。

```shell
docker run --network <NETWORK> --env-file=./.circleci/app.env --volumes-from reports -it <CONTAINER> "bundle exec rspec"
docker run --network <NETWORK> --env-file=./.circleci/app.env --volumes-from reports -it <CONTAINER> "cp -R coverage /reports"
```

そのため、RSpec の実行と `coverage` ディレクトリの退避を単一の `docker run` コマンドで行うために、別途 `.circleci/docker-test` というスクリプトを用意してそれを実行している。

そのあとの `docker cp reports:/reports reports` で、Docker コンテナ側の `/reports` ディレクトリを、ホスト側の `reports` ディレクトリに退避している。

### Docker コンテナ用の環境変数の追加 (CircleCI で Docker を利用している場合のみ)
CircleCI 上で、RSpec などを Docker を使って実行している場合は、必要な環境変数をどこかのファイルに記述しているはずである。

たとえば、CircleCI 上 (`.circleci/config.yml`) で `docker run --env-file=./.circleci/app.env ...` のようなコマンドを実行している場合は `.circleci/app.env` 内に必要な環境変数を記述しているはず。

その場合は、このファイル内に、CircleCI の設定ページで登録したものと同じ環境変数を登録する必要がある。以下のコードブロックのファイル名は `.circleci/app.env` としているが、適宜変更すること。

```env:.circleci/app.env
CODECOV_TOKEN=<REPOSITORY_UPLOAD_TOKEN>
```

### `codecov/upload`
`codecov/upload` を記述することにより、生成されたカバレッジの詳細データを Codecov 上に送信することができる。その際に、`file` オプションを指定することにより、明示的にどのファイル (カバレッジデータ) を Codecov に送信するのかを指定することができる。

Codecov の RubyGems を使用すると、`coverage` ディレクトリの中に `codecov-result.json` というのを生成してくれる。この JSON ファイルを Codecov にアップロードすることで Codecov 上でカバレッジの詳細とグラフを確認することができる。なお、Codecov の RubyGems を使わなかった場合 (SimpleCov のみの場合) は `index.html` が生成されるが、これを Codecov 上にアップロードしてもエラーとなり詳細やグラフなどを確認することができないので注意。

`coverage` ディレクトリは、今回の例だと `./reports/reports` ディレクトリ以下にコピーしてきたので、`./reports/reports/coverage/codecov-result.json` を指定する。

## README にバッジを追加
最後に、README に Codecov のバッジを追加する。

バッジの画像 URL は Codecov のリポジトリ設定ページの `Badge` タブ (`https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/settings/badge`) から取得することができる。Markdown セクションにあるコードをコピーして、README の任意の場所にペーストする。





# GitHub にプッシュ
ここまでできたら、変更を GitHub にプッシュする。CircleCI が回るはずなので、すべてのジョブが終了するのを待つ。

`.circleci/config.yml` の `codecov/upload` は、CircleCI の画面上では `Upload Coverage Results` という名前で表示される。RSpec を実行するジョブ (本記事の例では `test` というジョブ名) と、Codecov にカバレッジ情報をアップロードするジョブ (`Upload Coverage Results`) が両方ともエラーなく通っていれば OK だ。

ただし、`codecov/upload` で指定したファイルパスが間違っていると、`No such file or directory` というエラーが出力されるのだが、これが出ていても CI 自体は正常に通ってしまうので注意。`Upload Coverage Results` のジョブの実行結果の出力を CircleCI 上で確認して何もエラーが出ていないことまで確認する必要がある。





# 動作確認
以下の 2 点を確認する。

* `https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>` にアクセスして、カバレッジのグラフなどが表示されていること
* README 上のカバレッジのバッジにカバレッジの数値が正しく表示されていること

## 別ブランチを切っている場合
ここまでの変更を、別ブランチを切って行っている場合は、おそらくどちらも正常に表示されないはずだ。

* カバレッジのグラフが表示されない
* カバレッジのバッジに `unknown` と表示される

URL 内にブランチを明示的に指定しない場合は、デフォルトブランチ (何も設定していない場合は GitHub リポジトリ上のデフォルトブランチと同じ) の内容が表示される。しかし、今回の変更ではじめて Codecov を導入する場合で、その変更用に別ブランチを切っている場合は、デフォルトブランチではまだ Codecov を導入していないことになる。そのため、ブランチを指定しない場合は Codecov のページに何も表示されなかったり、バッジが `unknown` になってしまう。

今回の変更をデフォルトブランチにマージする前に、正しく表示されるのかどうかを確認するためには、一時的にデフォルトブランチを変更するか、URL 内でブランチを指定してアクセスする。

### 一時的にデフォルトブランチを変更する場合
1. Codecov のリポジトリ設定ページ (`https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/settings`) にアクセスする
2. `Default Branch` セクションの `Branch Name` を、今回 Codecov の導入を対応しているブランチに変更する
3. `Overview` (`https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>`) にアクセスして、グラフなどが表示されていることを確認する
4. Codecov のリポジトリ設定ページの `Badge` タブ (`https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/settings/badge`) にある画像 URL にブラウザから直接アクセスし、カバレッジの数値が正しく表示されていることを確認する

### URL 内でブランチを指定する場合
1. `https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/branch/<BRANCH_NAME>` にアクセスして、グラフなどが表示されていることを確認する
2. `https://codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/branch/<BRANCH_NAME>/graph/badge.svg?token=<TOKEN>` にブラウザから直接アクセスし、カバレッジの数値が正しく表示されていることを確認する
    * `<TOKEN>` は Codecov のリポジトリ設定ページ (`https://app.codecov.io/gh/<USERNAME_OR_ORGNAME>/<REPOSITORY_NAME>/settings`) の `Repository Graphing Token` セクションから確認可能





# その他の選択肢
今回は Codecov を利用したが、Codecov を利用せず、GitHub Pages で似たようなことを実現するツールがある。

* [SimpleCovSmallBadge](https://github.com/MarcGrimme/simplecov-small-badge)
* [Badge formatter for SimpleCov](https://github.com/matthew342/simplecov-badge)

Codecov ほど視覚的にわかりやすい情報は得られないが、外部サービスに頼りたくない場合や、チームメンバーが 6 人以上いる場合[^1]などはこちらを検討するのも良いだろう。

[^1]: Codecov は 6 人より多い人数で利用したい場合は有料となる。参考: https://about.codecov.io/pricing/





# 参考サイト
* [CircleCI のテスト結果（Coverage）を Codecov へ送信し可視化する](http://34.83.105.191/2019/08/20/post-616/)
* [Codecov Ruby Example](https://github.com/codecov/example-ruby)
* [Jest+CircleCIなプロジェクトにCodeCov(カバレッジレポート)を導入するまでの手順ハンズオン](https://qiita.com/riversun/items/917cdf25a22175900139)
* [CircleCIとCodecovでGitHubにカバレッジバッジをつけよう！](https://medium.com/veltra-engineering/how-to-add-coverage-badge-to-github-repository-using-circleci-and-codecov-663dd412d95f)
