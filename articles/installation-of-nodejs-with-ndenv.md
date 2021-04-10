---
title: "ndenv を使用して複数のバージョンの Node.js を管理する方法と基本的な使い方"
emoji: "📝"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Node.js", "ndenv", "npm"]
published: true
order: 39
layout: article
---

# はじめに
Node.js は、専用のリポジトリを追加すれば apt や yum でインストールすることができますが、開発プロジェクトごとにバージョンを切り替えたいときには、やはりバージョンマネージャーが便利です。

Node.js のバージョンマネージャーには、nvm, ndenv, nodebrew, nodenv など様々な種類があり、どれを使用してもあまり変化はありませんが、Ruby では rbenv がよく使われることから、これとほぼ同じ仕様で作られている ndenv を使用しています。今回は ndenv で Node.js のバージョンを管理する方法を紹介します。

# リポジトリをクローンする
ndenv のリポジトリを GitHub からクローンします。

```bash
$ git clone https://github.com/riywo/ndenv ~/.ndenv
```

# パスを通す
ndenv を標準コマンドとして使用できるように環境変数にパスを通します。

```bash
$ echo 'export PATH="$HOME/.ndenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(ndenv init -)"' >> ~/.bash_profile
```

Ubuntu では `.bash_profile` ではなく `.profile` に書き換えてください。また、`.bashrc` をログイン時に読み込むように設定されている場合はそちらに書き込んでも良いです。

パスを通したらシェルを再起動して環境変数を反映させます。

```bash
$ exec $SHELL -l
```

# node-build を導入する
このままでも `ndenv` コマンド自体は使用できますが、肝心な、Node.js をインストールする `ndenv install` コマンドが使用できません。`ndenv install` を使用できるようにするためのプラグインである node-build をインストールします。

node-build のリポジトリをクローンします。

```bash
$ git clone https://github.com/riywo/node-build.git $(ndenv root)/plugins/node-build
```

これで ndenv の導入は完了です。

# インストールできるバージョンの一覧を確認
インストールできる Node.js / io.js のバージョン一覧を確認するには以下のコマンドを実行します。

```bash
$ ndenv install -l
```

出力された一覧から、インストールしたいバージョンを確認してください。もし、インストールしたいバージョンが最新のもので、一覧に出てこない場合は、以下のコマンドを実行してリポジトリを最新のものにアップデートしてください。

```bash
$ cd ~/.ndenv
$ git pull
```

# Node.js をインストール
インストールしたい Node.js のバージョンを指定してインストールします。たとえば v8.4.0 をインストールしたい場合は以下のコマンドを実行します。

```bash
$ ndenv install v8.4.0
```

インストール後は、以下のコマンドを忘れずに実行してください。

```bash
$ ndenv rehash
```

これで Node.js v8.4.0 がインストールされました。

# グローバル環境にセット
現状では、Node.js v8.4.0 がインストールされていますが、`node` コマンドは使用できないはずです。

```
$ node -v
ndenv: node: command not found

The `node' command exists in these Node versions:
  v8.4.0
```

これを解消するにはグローバル環境にセットする必要があります。

```bash
$ ndenv global v8.4.0
```

これで、`node` コマンドが使用できるようになります。

```bash
$ node -v
v8.4.0
```

これは、Node.js を使用しない開発プロジェクトディレクトリで `node` コマンドを実行したとき、どのバージョンを使用するかを指定するものです。規定の Node.js のバージョンをセットするものだと思ってください。

# ローカル環境にセット
では、グローバルとは反対に、Node.js を使用する、あるプロジェクトディレクトリ以下では、v8.4.0 ではなく、v6.11.3 を使用したかったとしましょう。その場合はプロジェクトディレクトリで、以下のコマンドを実行します。(Node.js v6.11.3 は `ndenv install` ですでにインストールされたものとします)

```bash
$ cd project-using-nodejs
$ ndenv local v6.11.3
```

このようにすると `project-using-nodejs` ディレクトリ以下では、v6.11.3 が適用されます。

```bash
$ cd project-using-nodejs
$ node -v
v6.11.3
```

そして、それ以外のディレクトリ (`ndenv local` を実行していないディレクトリ) では、グローバル環境にセットしたバージョンが適用されます。

```bash
$ cd project-not-using-nodejs
$ node -v
v8.4.0
```

このように、ディレクトリを切り替えるだけで、自動的にバージョンを切り替えることができます。もちろん、他のバージョンをインストールして、また別のディレクトリでは違うバージョンの Node.js を使用することもできます。これは地味に便利です。

## ndenv local がやっていること
`ndenv local` コマンドがやっていることは実にシンプルで、このコマンドを実行したディレクトリに、指定したバージョンが記載された `.node-version` というファイルを作成しているだけです。

```bash
$ cd project-using-nodejs
$ cat .node-version
v6.11.3
```

なので、逆を言えば、このファイルがあることで、ndenv はディレクトリごとに Node.js のバージョンを柔軟に切り替えることができます。

`ndenv local` でセットしたバージョンを解除するには、単にそのディレクトリにある `.node-version` を削除すれば良いです。

```bash
$ cd project-using-nodejs
$ node -v
v6.11.3
$ rm .node-version
$ node -v
v8.4.0
```

ちなみに `ndenv global` は `~/.ndenv/version` を見ているので、`ndenv global` でセットしたバージョンを解除するには、`~/.ndenv/version` を削除すれば良いです。

```bash
$ rm ~/.ndenv/version
```

# 今までにインストールしたバージョンの一覧を確認
今までに ndenv によってインストールされた Node.js のバージョン一覧を確認するには、以下のコマンドを実行します。

```bash
$ ndenv versions
  v6.11.3
* v8.4.0 (set by /home/username/.ndenv/version)
```

v6.11.3 と v8.4.0 がインストールされていることがわかります。`set by...` がついているバージョンが、現在そのディレクトリ以下で適用されているバージョンです。

# Node.js をアンインストール
インストールした Node.js をアンインストールするには `ndenv uninstall` コマンドを使用します。たとえば v8.4.0 をアンインストールするには以下のコマンドを実行します。

```bash
$ ndenv uninstall v8.4.0
```

# 使用できるコマンド一覧と使い方の詳細を確認
コマンドの使い方を忘れるたびにこの記事を見に来なくても済むように、コマンドの使い方を調べるコマンドは、忘れずに覚えておくと便利です。

使用できるコマンド一覧を確認するには以下のコマンドを実行します。

```bash
$ ndenv commands
```

コマンドの使い方の詳細を調べるには `ndenv help` を使用します。たとえば `ndenv install` コマンドの使い方の詳細を調べるには以下のコマンドを実行します。

```bash
$ ndenv help install
```

使う機会は少ないですが、他にもここでは紹介していないコマンドがあるので、興味があれば上記のコマンドで調べてみてください。

# npm について
npm は Node.js と一緒にインストールされるので、特にインストールする必要はありません。npm のバージョンは、インストールした Node.js のバージョンに合わせて決まります。

```bash
$ ndenv global v8.4.0
$ node -v
v8.4.0
$ npm -v
5.3.0

$ ndenv global v6.11.3
$ node -v
v6.11.3
$ npm -v
3.10.10
```

# 参考サイト
* [Node.js 公式サイト](https://nodejs.org/ja/)
* [ndenv - another node.js/io.js version manager](https://github.com/riywo/ndenv)
* [node-build](https://github.com/riywo/node-build)
