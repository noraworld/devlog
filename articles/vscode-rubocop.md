---
title: "VS Code で自動的に RuboCop を実行する (rbenv, asdf 対応)"
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["VSCode", "RuboCop", "Ruby", "Rails"]
published: true
order: 113
layout: article
---

# はじめに
この記事の通りに設定すると、VS Code 上で Ruby ファイルを保存した際に、自動的に RuboCop が実行され、以下のようにエディタ上にリアルタイムで結果が反映されるようになる。

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/vscode-rubocop/Screen%20Shot%202021-10-26%20at%2018.50.17.png)

RuboCop のルールに従っていない箇所に波線が表示され、そこにマウスオーバーすると具体的な警告内容が表示される。

## 便利な点
* `git commit` するたびにいちいち `bundle exec rubocop <FILENAME>` を実行する必要がない
    * リアルタイムで修正していけるので、あとから RuboCop の警告修正のためだけの時間を取られることが少なくなる
* `.rubocop.yml` の内容が反映される
    * プロジェクトごとにルールが異なる場合にも対応できる
* **rbenv や asdf などで複数バージョンの Ruby を利用していても使える**
    * [ruby-rubocop](https://marketplace.visualstudio.com/items?itemName=misogi.ruby-rubocop) ではこれができない

## 不便な点
* ファイルを保存してから結果が反映されるまでに若干時間がかかる
* ファイルを開いた直後は実行されないときもある
    * ファイルを開いたあと、変更を加え保存してからでないと効かないときがある
    * ファイルを開いただけで効くときもあるのでよくわからない
* プロジェクトディレクトリのルートに `.rubocop.yml` が必要
    * デフォルトのルールを適用させたい場合でも `.rubocop.yml` が必要となる
    * プロジェクトで管理されていない簡素な Ruby スクリプトなどに適用することはできない
* VS Code 上での自動修正 (`--auto-correct`) はできない
* Metrics 系の警告は、クラスやモジュール、メソッドの全行に波線が入るので見づらくなる
    * 筆者は Metrics 系の警告の波線表示は無効にしている (詳しくは後述)

## ruby-rubocop について
この機能を利用するための VS Code の拡張機能として、[ruby-rubocop](https://marketplace.visualstudio.com/items?itemName=misogi.ruby-rubocop) というものがある。

筆者は最初はこの拡張機能を利用していた。しかし、この拡張機能だと、rbenv や asdf などで複数バージョンの Ruby を管理している環境だと動かない。

複数の Ruby / Rails プロジェクトを持っていて、それぞれが異なる Ruby のバージョンだったりすると全く使えなくなってしまうので、しばらくの間、この機能を使っていなかった。

これに関して issue を投稿したりもしたのだが、3 ヶ月経っても音沙汰なかった。

[ruby-rubocop does not pick the proper Ruby and RuboCop versions #155](https://github.com/misogi/vscode-ruby-rubocop/issues/155)

### 別の拡張機能を発見
しかし、もともとインストールしていた [Ruby](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby) という定番の拡張機能に、同等の機能があることを知った。単に設定を正しくしていなかっただけだった。

[vscode-ruby/docs at 330dcd2af212a336eba791ac0bd185f1c78042d7 · rubyide/vscode-ruby](https://github.com/rubyide/vscode-ruby/tree/330dcd2af212a336eba791ac0bd185f1c78042d7/docs)

この拡張機能なら、上述の問題を解消できる。タイトルに「rbenv, asdf 対応」と入れたのはそういうことだ。

というわけで、今回はこの [Ruby](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby) という拡張機能を使って、表題の機能を利用する。



# インストール
まずは拡張機能をインストールする。以下の URL からインストールボタンを押したあと、VS Code を開きインストールする。

[Ruby - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby)




# 設定を追加
次に設定を追加する。VS Code 上で `Command + Shift + P` [^1] を押し `open settings` と入力すると、候補の中に `Preferences: Open Settings (JSON)` というのが表示されるはずなので、それを選択して設定用の JSON ファイルを開く。

[^1]: Windows では確認していないので不明。おそらく `Ctrl + Shift + P` でいける気がするが、未検証。

適当な箇所に以下を追加する。

```json
"ruby.useBundler": true,
"ruby.useLanguageServer": true,
"ruby.lint": {
    "rubocop": {
        "useBundler": true,
        "except": ["Metrics"] // because it is annoying that it puts wavy lines to all lines in those methods
    }
},
"ruby.format": "rubocop",
```

[dotfiles/settings.json at bc520e130c458e078a8ec2a8cace1603040303b5 · noraworld/dotfiles](https://github.com/noraworld/dotfiles/blob/bc520e130c458e078a8ec2a8cace1603040303b5/vscode/settings.json#L54-L62)

これで使えるようになる。

ただし、Ruby ファイルを開いただけでは RuboCop が実行されず、ファイルに変更を加えて保存しないといけないときもある。

また、反映されるのには若干時間がかかる (5 秒くらい) 点に注意。

## except について
これは冒頭の「不便な点」でも言及したが、Metrics の警告が発生した場合、その警告の発生元であるメソッドやクラス、モジュール全体が波線で表示されてしまう。

しかも、Metrics の警告は、単純に書き方を変えるだけで修正できるものではないので、開発中、波線だらけになってとても見づらくなってしまう。

そこで、`except` を使う。配列で RuboCop のルール名を指定すると、そのルールに関しては警告 (波線) を表示しないようにできる。

もちろん、これは VS Code 上の話に限定されるため、ターミナル上で `bundle exec rubocop` を実行した場合はちゃんと Metrics の警告も表示される。

以前使っていた [ruby-rubocop](https://marketplace.visualstudio.com/items?itemName=misogi.ruby-rubocop) では、たしか名前の部分だけ (たとえば `class Foo` の行のみ) に波線が引かれていたので見づらくはならなかった。ここはちょっとだけ残念なポイントだ。

ちなみに、`Metrics` と指定すると Metrics 関連のすべてのルールに影響するが、`Metrics/AbcSize` のように特定のルールのみに適用することもできる。
