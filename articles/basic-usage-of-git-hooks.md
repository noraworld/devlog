---
title: "Git フックの基本的な使い方"
emoji: "😽"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Git", "githooks", "pre-commit", "commit-msg", "GitHub"]
published: false
order: 48
---

# TL;DR
```bash
# テンプレートディレクトリを作成
$ mkdir -p ~/.git_template/hooks

# テンプレートを読み込む
$ git config --global init.templatedir '~/.git_template'

# pre-commit スクリプトを作成 (中身は下に記載)
$ touch ~/.git_template/hooks/pre-commit

# commit-msg スクリプトを作成 (中身は下に記載)
$ touch ~/.git_template/hooks/commit-msg

# 実行権限を付与
$ chmod a+x ~/.git_template/hooks/pre-commit
$ chmod a+x ~/.git_template/hooks/commit-msg

# 適当なディレクトリを作成
$ mkdir git-hooks-test2

$ cd git-hooks-test2
$ git init

# 適当なファイルを作成 (中身は適当な文字で OK)
$ touch test.txt

$ git add test.txt
$ git commit -m "Add test.txt"

# ユーザ名がセットされていないとエラーになることを確認
fatal: user.name is not set locally

$ git config user.name "test"
$ git commit -m "Add test.txt"

# メールアドレスがセットされていないとエラーになることを確認
fatal: user.email is not set locally

$ git config user.email "test@example.com"
$ git commit -m "Add test.txt"

# コミット時に以下のようなメッセージが表示されることを確認
Committed as:
 (use "git reset --soft HEAD^" to undo)

 test <test@exmaple.com>

Check if they are correct
```

```sh:~/.git_template/hooks/pre-commit
#!/bin/sh

if [ -z "`git config --local user.name`" ]; then
 echo "fatal: user.name is not set locally"
 exit 1
fi

if [ -z "`git config --local user.email`" ]; then
 echo "fatal: user.email is not set locally"
 exit 1
fi
```

```bash:~/.git_template/hooks/commit-msg
#!/bin/bash

echo -e "Committed as:"
echo -e " (use \"git reset --soft HEAD^\" to undo)\n"
echo -e " \033[1;93m`git config --local user.name` <`git config --local user.email`>\033[00m\n"
echo -e "\033[1;95mCheck if they are correct\033[00m\n"
```

* 新しく作成したフックスクリプトを、すでに Git で管理されているディレクトリに追加する場合は `git init`
* すでに読み込んでいるフックスクリプトを編集した場合は `.git/hooks` 内の該当スクリプトを削除してから `git init`
* その他、注意事項は [注意点まとめ](#注意点まとめ) を参照すること


# Git フックとは
Git フックは、Git でコマンドを実行する直前もしくは実行後に特定のスクリプトを実行するための仕組みです。

たとえば、`pre-commit` という Git フックを使用すると、`git commit` を実行する直前に任意のスクリプトを実行することができます。これを利用することで、コミットメッセージにイシューやチケットの番号が含まれていなかったらコミットを中止する、などの処理を行うことができるようになります。

# サンプルフックスクリプトの確認 (任意)
試しにサンプルのフックスクリプトを見てみましょう。この操作はただの確認なので、必要でなければ読み飛ばしても問題ありません。

適当なディレクトリを作成し、`git init` を実行します。

```bash
$ mkdir git-hooks-test
$ cd git-hooks-test
$ git init
```

`git init` を実行すると、`.git` という隠しディレクトリが作成されます。`.git` ディレクトリ内に `hooks` というディレクトリが入っているので、`hooks` ディレクトリの中身を見てみましょう。

```bash
$ ls .git/hooks
applypatch-msg.sample pre-applypatch.sample pre-rebase.sample update.sample
commit-msg.sample pre-commit.sample pre-receive.sample
post-update.sample pre-push.sample prepare-commit-msg.sample
```

ファイルがたくさん入っていることがわかります。ファイル名の `.sample` を外せばフックスクリプトとして動作します。たとえば `pre-commit` ならコミットする直前に実行されますし、`commit-msg` ならコミットされたときに実行されます。

ここではサンプルスクリプトの中身の詳細については触れませんが、興味があれば中身を見てみたり、実際にスクリプトを実行してみたりすると良いと思います。

## サンプルフックスクリプトが生成されない場合
`git init` しても `.git/hooks` 内にサンプルフックスクリプトが生成されないことがあります。その理由は、すでに自作のフックスクリプトを読み込んでいるからです。サンプルフックスクリプトをもう一度生成するようにしたい場合は、一時的に自作のフックスクリプトを読み込まないように設定を変更してください。

```bash:サンプルフックスクリプトを生成したい場合のみ実行
$ git config --global --unset init.templatedir
```

その後、もう一度 `git init` すればサンプルフックスクリプトが生成されます。

# 自作のスクリプトを読み込む設定を追加
Git フックの仕組みがわかったところで自作のフックスクリプトを読み込む設定を追加してみましょう。ホームディレクトリに `.git_template` というディレクトリを作成し、その中に `hooks` ディレクトリを作成します。

```bash
$ mkdir -p ~/.git_template/hooks
```

`.git_template` ディレクトリに Git のテンプレートが入っていることを Git で認識できるように設定を追加します。

```bash
$ git config --global init.templatedir '~/.git_template'
```

# フックスクリプトの作成
ではいよいよフックスクリプトを作成していきましょう。サンプルフックスクリプトで見たように、フックスクリプトの種類はたくさんありますが、ここでは例としてコミットする直前に実行される `pre-commit` とコミット時に実行される `commit-msg` のスクリプトを作成してみましょう。

## pre-commit スクリプトの作成
先ほど作成した `~/.git_template/hooks` ディレクトリ内にスクリプトファイルを作ります。

```bash
$ touch ~/.git_template/hooks/pre-commit
```

そして、`pre-commit` に以下のようなスクリプトを書いてみます。

```sh:~/.git_template/hooks/pre-commit
#!/bin/sh

if [ -z "`git config --local user.name`" ]; then
 echo "fatal: user.name is not set locally"
 exit 1
fi

if [ -z "`git config --local user.email`" ]; then
 echo "fatal: user.email is not set locally"
 exit 1
fi
```

参考: [リポジトリごとに user.name や user.email の設定を強制する](https://qiita.com/uasi/items/a340bb487ec07caac799#git-27%E4%BB%A5%E4%B8%8B)

上記のスクリプトは、コミットする前に `user.name` と `user.email` がそのリポジトリ内でローカルに設定されているかどうかを確認し、もしどちらかが設定されていなければ、設定されいないというメッセージを出力し、コミットを中断するフックスクリプトです。

`pre-commit` などの、Git コマンドの実行直前に実行されるフックスクリプト (`pre` という接頭辞がついているフックスクリプト) では、非ゼロの値で `exit` することによって、そのコマンドを中断することができます。上記のフックスクリプトでは、ユーザ名、メールアドレスが設定されていないときに `exit 1` とすることで、`git commit` の実行を中断しています。

Git 2.8 以降では `user.useConfigOnly` という設定が新たに用意され、これを使用することで、コミットする際にユーザ名やメールアドレスが設定されていないとエラーにすることができるようになりました。そのため、Git 2.8 以降をお使いの環境ではあまり有用ではないかもしれませんが、Git 2.8 以前を使用している環境や、グローバルにはセットしているけどローカルにはセットしていない場合にもコミットを中断する設定にしたい場合には便利なスクリプトです。

## commit-msg スクリプトの作成
もう一つ例を見てみましょう。`pre-commit` の例で十分理解した方はこちらは無視しても構いません。

`pre-commit` と同様に、`hooks` ディレクトリ内に `commit-msg` というスクリプトファイルを作成します。

```bash
$ touch ~/.git_template/hooks/commit-msg
```

`commit-msg` 内に以下のようなスクリプトを書いてみます。

```bash:~/.git_template/hooks/commit-msg
#!/bin/bash

echo -e "Committed as:"
echo -e " (use \"git reset --soft HEAD^\" to undo)\n"
echo -e " \033[1;93m`git config --local user.name` <`git config --local user.email`>\033[00m\n"
echo -e "\033[1;95mCheck if they are correct\033[00m\n"
```

このフックスクリプトを用意すると、コミットした後に以下のようなメッセージが表示されます。

<img width="408" alt="commit-msg.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/9c26db3b-c6d3-e7a9-a4e7-3e1ef377b131.png">

`git commit` したときのユーザ名とメールアドレスが表示されるようになります。

使用している PC で一つのリモートリポジトリのアカウントしか管理していない場合は特に有用性はありませんが、個人用と会社用で GitHub のアカウントを分けている場合や、別のユーザ名、メールアドレスで GitLab や Bitbucket などのアカウントと併用している場合では、うっかり違うユーザ名とメールアドレスでコミットしてしまう事故が発生することがあります。そのような事故を防ぐために、コミットした後にどのユーザ名、メールアドレスでコミットされたのかが上記のように表示されると便利です。

### TIPS: 他のスクリプト言語も実行可能
今回の例ではシェルスクリプトを使用しましたが、Ruby や Perl などの別のスクリプト言語を実行させることも可能です。shebang を、実行したいスクリプト言語に変更すれば OK です。

# 実行権限を付与
実はこのままではこのフックスクリプトは実行されません。シェルスクリプトをよく書く人ならお気づきかもしれませんが、ファイルに実行権限を与えないとスクリプトとして実行することができません。そのため、上記で作成したフックスクリプトファイルに実行権限を与えます。

```bash
$ chmod a+x ~/.git_template/hooks/pre-commit
$ chmod a+x ~/.git_template/hooks/commit-msg
```

これでフックスクリプトが実行されるようになりました。この作業は新しいフックスクリプトを作成したときなどに忘れがちなので注意してください。また、もし実行権限が与えられていない場合、Git は何も警告を出してくれません。フックスクリプトを設定したのになぜか実行されない場合は実行権限が与えられているかどうかを確認してみてください。

# フックスクリプトの実行確認
ではフックスクリプトが動作するかどうか確認してみましょう。適当なディレクトリを作成し、`git init` を実行して、適当なファイルを作成してコミットしてみます。

```bash
# 適当なディレクトリを作成
$ mkdir git-hooks-test2

$ cd git-hooks-test2
$ git init

# 適当なファイルを作成
$ touch test.txt # エディタを開き test.txt に適当な文字を入力

$ git add test.txt
$ git commit -m "Add test.txt"

# ユーザ名がセットされていないとエラーになることを確認
fatal: user.name is not set locally

$ git config user.name "test"
$ git commit -m "Add test.txt"

# メールアドレスがセットされていないとエラーになることを確認
fatal: user.email is not set locally

$ git config user.email "test@example.com"
$ git commit -m "Add test.txt"

# コミット時に以下のようなメッセージが表示されることを確認
Committed as:
 (use "git reset --soft HEAD^" to undo)

 test <test@exmaple.com>

Check if they are correct
```

ユーザ名とメールアドレスを設定していない状態でコミットしようとしたときにエラーメッセージが表示されコミットされていないことがわかります。また、ユーザ名とメールアドレスを設定してコミットした後に `test <test@exmaple.com>` としてコミットしたことを表すメッセージが表示されているのが確認できます。

## フックスクリプト生成の注意点
フックスクリプトは、`git init` したときや `git clone` したときに、そのディレクトリ内の `.git/hooks` 内に生成されます。フックスクリプトを作成したあとに `git clone` する場合や、新しくディレクトリを作成して `git init` する場合は問題ありませんが、すでに Git で管理されているディレクトリにフックスクリプトを追加する場合は注意が必要です。

### 新しく作成したフックスクリプトを追加する場合
すでに Git で管理されているディレクトリに、新たに追加作成したフックスクリプトを読み込ませるには、単に `git init` をもう一度実行すれば OK です。

```bash
$ git init
Reinitialized existing Git repository in /path/to/repo/.git/
```

すでに一度 `git init` を実行している場合でも、もう一度実行すれば新しいフックスクリプトを読み込んでくれるようになります。

### すでに読み込んでいるフックスクリプトを編集した場合
たとえば `pre-commit` がすでにそのディレクトリ内で動作していて、`~/.git_template/hooks/pre-commit` の中身を変更した場合、変更後の `pre-commit` を反映させるためには、一旦そのディレクトリ内にある古い `pre-commit` を手動で削除する必要があります。

```bash
$ rm path/to/repo/.git/hooks/pre-commit
$ git init
Reinitialized existing Git repository in /path/to/repo/.git/
```

すでに `pre-commit` がある状態で `git init` しただけだと、変更した `~/.git_template/hooks/pre-commit` の内容は反映されないので注意してください。

# その他
## プロジェクトディレクトリごとにフックスクリプトを変更したい場合
今回の例では `~/.git_template/hooks` にフックスクリプトを置いて、そのフックスクリプトを各々のプロジェクトディレクトリで読み込む方法について紹介しました。要するに、すべての Git 管理下のディレクトリで共通のフックスクリプトが実行されるようになっています。

通常はこれで問題ないかと思いますが、特定のディレクトリだけ別のフックスクリプトを実行したい場合があるかもしれません。

その場合は、単にそのディレクトリ内の `.git/hooks` に用意されたテンプレートのフックスクリプト (`~/.git_template/hooks` から読み込まれたフックスクリプト) を削除し、新たに別のフックスクリプトを追加すれば良いです。先ほども説明したように、すでに存在するフックスクリプトに関しては、`git init` しても上書きはされないので問題ありません。ただし、フックスクリプトの管理が煩雑になるので、あまりおすすめはしません。

## 注意点まとめ
* すでに自作のフックスクリプトが読み込まれている場合は、`git init` を実行してもサンプルフックスクリプトは生成されない
* フックスクリプトを新たに作成した場合は実行権限の付与を忘れずに
* すでに Git で管理されているディレクトリに、新たに作成したフックスクリプトを追加する場合は `git init` する必要がある
* すでに読み込んでいるフックスクリプトを編集した場合は、一度 `.git/hooks` 内の該当スクリプトを削除してから `git init` しないと反映されない

# 参考サイト
* [gitのhooksを管理する(自分用テンプレートを使う)](https://qiita.com/quattro_4/items/59fdf8b9aa9ef48ecbdf)
* [git-commit前にsyntaxチェックする](https://qiita.com/ymko/items/9209aa8ed811db795024)
* [リポジトリごとに user.name や user.email の設定を強制する](https://qiita.com/uasi/items/a340bb487ec07caac799)
