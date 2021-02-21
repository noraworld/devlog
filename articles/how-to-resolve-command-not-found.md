---
title: "環境変数の設定を間違えてほとんどのコマンドが \"command not found\" になってしまったときの対処法"
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Bash", "ターミナル", "コンソール", "コマンドプロンプト", "コマンド"]
published: false
order: 22
---

# はじめに
先日、サーバの設定をいじっていたときにやらかしてしまい冷汗を書いたので、いざというときに焦らずに対処できるようにするためにここにメモしておきます。

# 原因
自分の中で得られた結論を先に言ってしまうと、**環境変数のexportは複数箇所に書くべきではない**です。

`.bash_profile`等に`export PATH="パス"`を追加することで環境変数が使えるようになります。たとえば`ls`コマンドは本来なら`/bin/ls`や`/usr/bin/ls`としなければ実行できませんが、`/bin`や`/usr/bin`を環境変数として登録しておけば単に`ls`と打つだけで実行できるようになります。

今回の問題の原因は、`export PATH="/path/to/something:/path/to/anything:$PATH"`となっている行の下に`export PATH="/path/to/badthing"`を追加してしまったことです。`PATH`への代入が複数ある場合は下に書いた代入文によって上書きされます（プログラムを書くときと同じです）。なので、今回の例だと`/path/to/badthing`にしかパスが通っていない状態となり、ほとんどのコマンドが環境変数から参照できなくなりました...（これが`"/path/to/thing:$PATH"`とかならまだ良かったんですがね...）

```bash
$ source ~/.bashrc
-bash: rbenv: command not found
$ vi ~/.bashrc
-bash: vi: command not found
$ ls -a
-bash: ls: command not found
```

パスが通っていないのなら、絶対パスから参照すればいいんだ！ とひらめきコマンドのパスを確認しようとするも...

```bash
$ which vi
-bash: which: command not found
```

(￣△￣；）

# 解決法
このサーバだけではもう手の打ちようがないので、同じOSのテストサーバで確認しました。

```bash
$ which vi
/usr/bin/vi
```

ということで、`vi`の絶対パスは`/usr/bin/vi`ということがわかりました。CentOSでもUbuntuでも同じでした。

パスがわかったところで再び問題発生中のサーバに戻り`vi`を起動

```bash
$ /usr/bin/vi ~/.bashrc
```

そして、パスを一行にまとめます。

```bash:~/.bashrc
export PATH="/path/to/something:/path/to/anything:/path/to/goodthing:$PATH"
```

パスは左から順に参照していきますので、たとえば`ls`の場合、`/path/to/something/ls`がなければ`/path/to/anything/ls`を調べ、それがなければ`/path/to/goodthing/ls`を調べ、それもなければ`$PATH`にあるパスを調べていきます。

ちなみにパス一覧は以下のコマンドで確認できます。

```bash
$ echo $PATH
/path/to/something:/path/to/anything:/path/to/goodthing:/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

また、ホームディレクトリ内のディレクトリをパスに指定したい場合は`$HOME`を使用することで`$HOME`の箇所がホームディレクトリまでのパスとして認識されます。

```bash
# $HOME/.binはホームディレクトリ以下の.binディレクトリを参照する
export PATH="$HOME/.bin:/path/to/something:/path/to/anything:/path/to/goodthing:$PATH"
```

環境変数を正しく設定できたので再読込しようとします。ところが...

```bash
$ source ~/.bashrc
-bash: env: command not found
```

となり再読込もできませんでした。この場合、`source`コマンドは利用できますが、内部的に使用されている(?)`env`コマンドのパスが通っていないので実行できませんでした。

どうしたものかと少し悩みましたが、そういえば`.bashrc`の中身は`source`コマンドを使わなくてもシェルに再接続すれば新しい設定で読み込まれるので、一旦切断してしまえばいいことに気づきました。

ローカルの場合はシェルの終了、リモートの場合はSSHのコネクションを切断します。いずれにしても

```bash
$ exit
```

として、再びログインすることで`.bashrc`の中身が新しく読み込まれます。これで設定が間違っていなければちゃんと元に戻ります。

```bash
$ which vi
/usr/bin/vi
$ ls
file1 file2 file3 file4 file5
```

めでたしめでたし:smile:

# 結論
繰り返しになりますが、パスは一行にまとめるのがベターです。一行にまとめなくても

```bash
export PATH="/path/to/something:/path/to/anything:$PATH"
export PATH="/path/to/anotherthing:$PATH"
```

となっていれば、2行目の`$PATH`は1行目のパスの内容を参照するので、この記事のような問題は発生しませんが、冗長的ですし思わぬところでミスをしてしまう可能性があります。

サイトの説明によっては

```bash
$ echo 'export PATH="/path/to/something:$PATH"' >> ~/.bashrc
```

などと書かれていることがあり（現に自分が他の記事で使っています...）一行でまとめておくのはめんどうかもしれませんが、せめて本番サーバ等ではそうしておくほうが無難かな、と今回の反省を踏まえて感じました。
