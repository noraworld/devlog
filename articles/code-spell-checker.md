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
以下の 2 通りの追加方法がある

* コマンドパレットで追加
* 設定ファイルに直接記述して追加

## コマンドパレット
`shift` + `cmd` + `P` を押すとコマンドパレットが起動する。入力欄に `add words to` まで入力すると、以下の 8 つの項目が候補として表示される。

* Add Words to CSpell Configuration
* Add Words to Dictionary
* Add Words to User Settings
* Add Words to User Dictionary
* Add Words to Folder Settings
* Add Words to Folder Dictionary
* Add Words to Workspace Settings
* Add Words to Workspace Dictionary

これらのどれを選んでも単語は登録されるが、どのファイルに追加されるのか、またその単語帳の適用範囲はどこまでなのかについては [グループ分け](#グループ分け) 以降で後述する。

なお、8 項目あるが、実際には全く同じ挙動をする項目があり、同じ挙動のものはまとめて紹介する。同じ挙動のものはどれを使っても良い。

`Add Words to CSpell Configuration` だけは、筆者の環境では `No matching configuration found.` というエラーが出て登録できなかった。そのため未検証。

## 設定ファイル
主に `settings.json` または `cspell.json` を編集することにより設定することができる。それぞれの特徴は以下の通り。

* `settings.json`
    * VS Code 全般の設定ファイル
    * ネームスペースに `cSpell` が必要 ([グループ分け](#グループ分け) 以降の記述例参照)
* `cspell.json`
    * Code Spell Checker のみの設定ファイル
    * ネームスペースに `cSpell` は不要 ([グループ分け](#グループ分け) 以降の記述例参照)
    * `settings.json` に記述すると単語帳の部分が肥大化するので単語帳を別ファイルに分けたいときにおすすめ
    * `<PROJECT_ROOT>/.vscode/settings.json` に、そのプロジェクトでのみ適用される VS Code の設定をしている人がチームメンバー内にいる場合におすすめ (プロジェクトのディレクトリ以下で管理する場合)

## グループ分け
単語を追加するファイルの場所や、コマンドパレット経由での追加方法はいくつもあるのだが、分類すると以下の 3 つに分けられる。

* User
* Folder
* Workspace

それぞれのグループごとに、適用範囲、コマンドパレットでのコマンド名、保存先ファイル名、記述例を説明する。コマンドパレット経由の場合、複数ファイルがあるうちの、「コマンドパレット経由」の列に「○」がついている行のファイルに単語が追加される。

### User
#### 適用範囲
VS Code 全体

#### コマンドパレットでのコマンド名
* Add Words to User Settings
* Add Words to User Dictionary

#### 保存先ファイル名

| 保存先ファイル名 | コマンドパレット経由 |
| --- | :---: |
| `$HOME/Library/Application\ Support/Code/User/settings.json` | ○ |
| `$HOME/.vscode/cspell.json` | |

#### 記述例
```json:settings.json
{
    "cSpell.userWords": [
        "dotfiles"
    ]
}
```

```json:cspell.json
{
    "userWords": [
        "dotfiles"
    ]
}
```

#### 備考
`$HOME/.vscode/cspell.json` は実態ファイルでないと正しく動作しないことを確認している。バグなのか仕様なのかは不明。

`$HOME/Library/Application\ Support/Code/User/settings.json` のほうはシンボリックリンクでも問題なく動作することを確認済み。

##### シンボリックリンクの場合
ファイルを変更してもすぐに反映されない。リンクを削除して、もう一度、リンクを作成すると反映される。正直これでは使い物にならない。

##### ハードリンクの場合
そもそも設定が反映されない。




### Folder
#### 適用範囲
そのプロジェクトのディレクトリ以下のみ

#### コマンドパレットでのコマンド名
* Add Words to Dictionary
* Add Words to Folder Settings
* Add Words to Folder Dictionary

#### 保存先ファイル名

| 保存先ファイル名 | コマンドパレット経由 |
| --- | :---: |
| `<PROJECT_ROOT>/.vscode/settings.json` | ○ |
| `<PROJECT_ROOT>/.vscode/cspell.json` | |
| `<PROJECT_ROOT>/cspell.json` | |

#### 記述例
```json:settings.json
{
    "cSpell.words": [
        "dotfiles"
    ]
}
```

```json:cspell.json
{
    "words": [
        "dotfiles"
    ]
}
```

#### 備考
`.gitignore` に追加しない限りは、そのプロジェクトで管理することになる。

メリットは、チームメンバー全員でそのプロジェクト固有の単語を共有できること。デメリットは、単語を追加するたびに差分が発生してしまい、そのためだけに `git commit` して `git push` して PR を作成して承認をもらってマージする、という手順が発生すること。




# Workspace (非推奨)
#### 適用範囲
ワークスペース全体

厳密には異なるが、ワークスペースはウィンドウのことだと思って良い。VS Code のウィンドウを 2 つ開いている場合は 2 つのワークスペースがあることになる。そのうちのどちらかのみに適用することができる。

#### コマンドパレットでのコマンド名
* Add Words to Workspace Settings
* Add Words to Workspace Dictionary

#### 保存先ファイル名

| 保存先ファイル名 | コマンドパレット経由 |
| --- | :---: |
| `$HOME/Library/Application\ Support/Code/Workspaces/<WORKSPACE_ID>/workspace.json` | ○ |

#### 記述例
```json:workspace.json
{
    "cSpell.words": [
        "dotfiles"
    ]
}
```

#### 備考
`<WORKSPACE_ID>` は `1625624235245` のような値で、複数のワークスペースを識別する VS Code 内部の値のようだ。

ここに保存されると dotfiles リポジトリやプロジェクトリポジトリで管理するのが難しいのでおすすめしない。また、どこに保存されたのかがわかりづらいため、現状の単語帳を把握するのも難しい。実際、筆者もこのファイルを探すのに、ホームディレクトリ以下を、登録した単語で grep したが、探すのにとても苦労した。

そもそも `<WORKSPACE_ID>` からワークスペースを特定するのも難しいため、ファイルを手動で書き換えるようなものではない。




# 参考サイト
* [VSCode に Code Spell Checker を導入して typo で4時間溶けないようにした[EOF]](https://zenn.dev/junki555/articles/7bc79cd35191bd)
