---
title: "Code Spell Checker のファイル保存先と適用範囲について"
emoji: "🪄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["VS Code", "Code Spell Checker"]
published: true
order: 119
layout: article
---

# Code Spell Checker とは？
VS Code のメジャーな拡張機能で、英単語の誤植を波線で指摘してくれる。英語以外の言語にも対応しているが、日本語には非対応。

以下のリンクからインストールすることができる。

[Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)





# インストールのきっかけ
仕事で Ruby を書いていて、`# frozen_string_literal: true` の `frozen` というスペルを、間違えて `fronzen` とタイポしたままリモートに取り込んで、しばらく気づかなかった上にコピペで他のファイルにまで拡散してしまったことがきっかけ。

これを会社の Slack で報告したところ、チームメンバーからこの拡張機能を教えてもらい秒でインストールした。




# 独自の単語を登録することができる
一般的な英単語や有名な固有名詞 (`google` など) はあらかじめ登録されているが、プロジェクト固有の名詞などは指摘の対象となってしまう。そのような単語を指摘しないようにするための設定も用意されている。





# 単語帳の作り方について
さて、この拡張機能、とても便利ではあるのだが、単語の追加方法や追加場所が若干わかりづらい。

コマンドパレット経由やファイルに直接記述して単語を追加することができるのだが、どのファイルにどのように追加されるのか (コマンドパレットの場合)、また、どのファイルにどのように追加すれば良いのか (ファイルに直接記述する場合) が、若干わかりづらかった。

この記事ではそれらについて解説する。

## コマンドパレット経由
コマンドパレット (`shift` + `cmd` + `P`) を押すとコマンドパレットが起動する。入力欄に `add words to` まで入力すると、以下の 8 つの項目が候補として表示される。

* Add Words to CSpell Configuration
* Add Words to Dictionary
* Add Words to User Settings
* Add Words to User Dictionary
* Add Words to Folder Settings
* Add Words to Folder Dictionary
* Add Words to Workspace Settings
* Add Words to Workspace Dictionary

これらのどれを選んでも単語は登録されるのだが、どのファイルに登録されるのか、またその単語帳の適用範囲はどこまでなのかを説明する。

なお、8 項目あるが、実際には全く同じ挙動をする項目があり、グループ分けすると 4 種類である。そのため、その 4 グループごとに説明することにする。

### グループ 1 (未検証)
#### 該当するコマンド名
* Add Words to CSpell Configuration

これは筆者の環境では `No matching configuration found.` というエラーが出て登録できなかった。そのため未検証。



### グループ 2 (Folder)
#### 該当するコマンド名
* Add Words to Dictionary
* Add Words to Folder Settings
* Add Words to Folder Dictionary

#### 保存先ファイル名と適用範囲
| 保存先ファイル名 | 適用範囲 |
| --- | --- |
| `<PROJECT_ROOT>/.vscode/settings.json` | そのプロジェクトのディレクトリ以下のみ |

#### 備考
そのプロジェクトの `.gitignore` で `.vscode/` を追加している場合は、各人が自由に単語を登録しても問題ない。

逆にそのプロジェクトのチームメンバー全員で単語帳を共有したい場合は `.gitignore` から削除する。ただし、単語を追加するたびに差分が発生してしまい、そのためだけに `git commit` して `git push` して PR を作成して承認をもらってマージする、という手順を踏むのは少々手間かもしれない。



### グループ 3 (User)
#### 該当するコマンド名
* Add Words to User Settings
* Add Words to User Dictionary

#### 保存先ファイル名と適用範囲
| 保存先ファイル名 | 適用範囲 |
| --- | --- |
| `$HOME/Library/Application\ Support/Code/User/settings.json` | VS Code 全体 |



### グループ 4 (Workspace) (非推奨)
#### 該当するコマンド名
* Add Words to Workspace Settings
* Add Words to Workspace Dictionary

#### 保存先ファイル名と適用範囲
| 保存先ファイル名 | 適用範囲 |
| --- | --- |
| `$HOME/Library/Application\ Support/Code/Workspaces/<RANDOM_VALUE>/workspace.json` | ワークスペース全体 |

#### 備考
`<RANDOM_VALUE>` は `1625624235245` のような値で、複数のワークスペースを識別する VS Code 内部の値のようだ。

ここに保存されると `dotfiles` リポジトリやプロジェクトリポジトリで管理するのが難しいのでおすすめしない。また、どこに保存されたのかがわかりづらいため、現状の単語帳を把握するのも難しい。実際、筆者もこのファイルを探すのにホームディレクトリ以下を登録した単語で grep したが、探すのにとても苦労した。



## ファイルに直接記述
基本的には、前述した [コマンドパレット経由](#コマンドパレット経由) の保存先ファイル名と適用範囲を見て、どこに記述すれば良いのかを決めれば良い。

ただし、`settings.json` のほかに、`cspell.json` というファイルも有効である。`settings.json` は VS Code 全般の設定であるのに対し、`cspell.json` は Code Spell Checker のみの設定である。

たとえば、単語帳をプロジェクトのチームメンバー全員で共有したいから、`<PROJECT_ROOT>/.vscode/settings.json` を Git 管理対象としたいが、人によってはここに Code Spell Checker 以外の、プロジェクト固有の VS Code の設定を入れている可能性がある。

つまり、`<PROJECT_ROOT>/.vscode/settings.json` を Git 管理対象としてしまうと、良くも悪くもチーム全体で、そのプロジェクト固有の VS Code の設定を一律にしなければならなくなってしまう。もちろんユーザ設定に追加しているものなら問題ないが、そのプロジェクトでだけ適用したい VS Code の設定というのもあるだろう。

そこで使えるのが `cspell.json` である。`settings.json` と同じディレクトリにこのファイルを置いておき、ここには Code Spell Checker のみの設定を記述する。

注意点として、ネームスペースが両者で若干異なるということだ。以下は `<PROJECT_ROOT>/.vscode/settings.json` に `dotfiles` という単語を追加した場合の設定である。

```json:.vscode/settings.json
{
  "cSpell.words": [
    "dotfiles"
  ]
}
```

これを `cspell.json` で管理する場合は、`cSpell` を取り除く必要がある。

```json:.vscode/cspell.json
{
  "words": [
    "dotfiles"
  ]
}
```

ちなみに、プロジェクトディレクトリ直下に置いても良いらしい。つまり、`<PROJECT_ROOT>/.vscode/cspell.json` ではなく `<PROJECT_ROOT>/cspell.json` でも良い。こちらであれば `.gitignore` から外す必要もなくて便利かもしれない。

また、VS Code 全体で適用する場合、つまり `$HOME/.vscode/cspell.json` に記述する場合も同様に `cSpell` を取り除く必要がある。`$HOME/.vscode/cspell.json` に置く場合はプロジェクトとは無関係のため `settings.json` と分けるメリットはあまりないかもしれないが、単語登録だけで `settings.json` を埋め尽くしたくない場合に便利だろう。




# 参考サイト
* [VSCode に Code Spell Checker を導入して typo で4時間溶けないようにした[EOF]](https://zenn.dev/junki555/articles/7bc79cd35191bd)
