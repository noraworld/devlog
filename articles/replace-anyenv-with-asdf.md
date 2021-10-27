---
title: "まだ anyenv (**env) 使ってるの？ asdf を使おう！"
emoji: "💨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["anyenv", "asdf", "ndenv", "rbenv", "pyenv"]
published: true
order: 114
layout: article
---

# はじめに
メジャーなプログラミング言語には、たいていバージョン管理システムがある。これを利用することで、プロジェクトごとに異なるバージョンの言語を使用することができる。

代表的なバージョン管理システムを以下に挙げる。

| Language | Version manager |
| -------- | --------------- |
| Node.js  | ndenv           |
| Ruby     | rbenv           |
| Python   | pyenv           |
| PHP      | phpenv          |

しかし、言語ごとにバージョン管理システムをインストールするのはめんどうだ。そこで、これらをまとめた [anyenv](https://github.com/anyenv/anyenv) というものがある。

このツールはとても便利で、筆者も利用していたのだが、一点、致命的な弱点がある。それは、**ロードが遅い** ことだ。

筆者は ndenv, rbenv, pyenv, phpenv の 4 種類を anyenv で管理していた。そして、シェル起動時にそれらをロードするようにしていた。

ロードするための設定を以下に示す。

```sh:~/.zshrc
# anyenv
if [[ -s ~/.anyenv ]]; then
  PATH="$HOME/.anyenv/bin:$PATH"
  eval "$(anyenv init -)"
fi

# ndenv
if [[ -s ~/.ndenv ]]; then
  PATH="$HOME/.ndenv/bin:$PATH"
  eval "$(ndenv init -)"
fi

# rbenv
if [[ -s ~/.rbenv ]]; then
  PATH="$HOME/.rbenv/bin:$PATH"
  eval "$(rbenv init -)"
fi

# pyenv
if [[ -s ~/.pyenv ]]; then
  PYENV_ROOT="$HOME/.pyenv"
  PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(pyenv init -)"
fi

# phpenv
if [[ -s ~/.phpenv ]]; then
  PATH="$HOME/.phpenv/bin:$PATH"
  eval "$(phpenv init -)"
fi
```

ベンチマークを利用して正確に時間を計測したわけではないが、ここの部分の実行時間が、約 **2.6786839962** 秒だった。とても遅い……。

何かもっと良いツールはないかなと探していたら、asdf というものを発見した。これも複数の言語に対応したバージョン管理システムだ。

anyenv から asdf に置き換えたことにより、シェルの起動が驚くほど速くなった。

そこで今回はこの asdf のインストール方法と簡単な使い方について紹介する。



# インストール
## 依存関係パッケージのインストール
`curl` と `git` が必要なので、インストールされていない場合はインストールする。例として Ubuntu の場合は以下のコマンドを実行する。

```sh:Shell
sudo apt install -y curl git
```

ただし、Homebrew 経由でインストールする場合は自動的にインストールされるので、対応不要。

## asdf のインストール
3 種類の方法を紹介するが、おすすめは Zinit だ。

### Homebrew
```sh:Shell
brew install asdf
```

続いて、以下のコマンドを実行する。

```sh:Shell
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh"
```

実行後に表示されるスクリプトをそのまま `~/.bashrc` や `~/.zshrc` などに追記する。

### Git
```sh:Shell
git clone https://github.com/asdf-vm/asdf.git ~/.asdf
```

上記の場合、`master` ブランチの最新版がインストールされる。

`master` の最新版にはバグが含まれている可能性があるので、特定のバージョンをインストールする場合は `--branch` オプションを使用する。

```sh:Shell
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.8.1
```

続いて、以下を `~/.bashrc` や `~/.zshrc` などに追記する。

```sh:~/.zshrc
. $HOME/.asdf/asdf.sh
```

### Zinit (おすすめ)
以下を `~/.bashrc` や `~/.zshrc` などに追記する。

```sh:~/.zshrc
zinit light asdf-vm/asdf
```

注: Zinit 自体をロードする部分は割愛。

## 補完機能
補完を有効にする場合は、`~/.bashrc` や `~/.zshrc` などに以下も追記する。

### Bash
以下のコマンドを実行した結果を `~/.bashrc` にそのまま追記する。

```sh:~/.bashrc
echo -e "\n. $(brew --prefix asdf)/etc/bash_completion.d/asdf.bash"
```

### Zsh
以下を `~/.zshrc` に追記する。

```sh:~/.zshrc
fpath=(${ASDF_DIR}/completions $fpath)
autoload -Uz compinit && compinit
```

## プラグインのインストール
使用する言語用のプラグインをインストールする。

以下で紹介されていない言語については、検索するとすぐに出てくるはずだ。

### Node.js
```sh:Shell
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
```

### Ruby
```sh:Shell
asdf plugin add ruby https://github.com/asdf-vm/asdf-ruby.git
```

Ruby をインストールする場合は事前に `openssl` や `readline` をインストールしておく必要がある。

参考: [Suggested build environment](https://github.com/rbenv/ruby-build/wiki#suggested-build-environment)

#### Homebrew
```sh:Shell
brew install openssl readline
```

#### Ubuntu
```sh:Shell
sudo apt install -y autoconf bison build-essential libssl-dev libyaml-dev libreadline6-dev zlib1g-dev libncurses5-dev libffi-dev libgdbm6 libgdbm-dev libdb-dev
```

### Python
```sh:Shell
asdf plugin-add python
```

## 言語のインストール
使用する言語とそのバージョンを指定してインストールする。

例として、Node.js 15.2.1 をインストールする場合は以下のコマンドを実行する。

```sh:Shell
asdf install nodejs 15.2.1
```

`nodejs` の部分を、それぞれ `ruby` や `python` にすることで他の言語もインストールできる。

また、`15.2.1` の部分を `latest` とすると、最新版をインストールすることができる。



# グローバルで使用する
インストールしたバージョンをグローバルで使用したい場合は以下のようにコマンドを実行する。

```sh:Shell
asdf global nodejs 15.2.1
```

# ローカルで使用する
逆に、カレントディレクトリ以下でのみそのバージョンを使用したい場合は以下のようにコマンドを実行する。

```sh:Shell
asdf local nodejs 15.2.1
```

ちなみにこのとき、`.tool-versions` というファイルが生成されるが、`.node-version` や `.ruby-version` のような従来のファイルでバージョンを管理したい場合は、`~/.asdfrc` に以下を追加する。

```toml:~/.asdfrc
legacy_version_file = yes
```

# 一時的に別のバージョンを使用する
カレントディレクトリ以下では 15.2.1 が使用されているが、このコマンドの実行時だけ一時的に 12.16.1 を使用したい、みたいな場合には環境変数 `ASDF_NODEJS_VERSION` が利用できる。

```sh:Shell
ASDF_NODEJS_VERSION=12.16.1 node -v
```

```
v12.16.1
```

# グローバルにインストールしたコマンドを使用する
`npm install -g <PACKAGE_NAME>` や `gem install <PACKAGE_NAME>` などでインストールしたパッケージに、コマンドが提供されているものがある。

それらのコマンドを使用するためには、再読み込みをする必要がある。

```sh:Shell
asdf reshim nodejs
```

# 参考
* [asdf](https://github.com/asdf-vm/asdf)
* [Getting Started | asdf](https://asdf-vm.com/guide/getting-started.html)
* [asdf-nodejs](https://github.com/asdf-vm/asdf-nodejs)
* [asdf-ruby](https://github.com/asdf-vm/asdf-ruby)
* [asdf-python](https://github.com/danhper/asdf-python)
