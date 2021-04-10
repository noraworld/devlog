---
title: "macOS Mojave で brew install や brew update に失敗するときの解決法"
emoji: "🦁"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["homebrew", "Mojave", "MacOSX", "macOSMojave", "macos"]
published: true
order: 54
layout: article
---

# 症状
macOS Mojave にアップグレードして、`brew install` したところ、エラーが発生しました。

```
$ brew install imagemagick

(... 省略 ...)

xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
Error: Failure while executing; `git config --local --replace-all homebrew.analyticsmessage true` exited with 1.
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
Error: Failure while executing; `git config --local --replace-all homebrew.private true` exited with 1.
```

# TL;DR
```
$ sudo mkdir -p /usr/local/sbin /usr/local/Frameworks
$ sudo chown -R $(whoami) /usr/local/sbin /usr/local/Frameworks
$ xcode-select --install
```

# brew doctor
困ったときはとりあえず `brew doctor` で原因を探ります。

```
$ brew doctor
Please note that these warnings are just used to help the Homebrew maintainers
with debugging if you file an issue. If everything you use Homebrew for is
working fine: please don't worry or file an issue; just ignore this. Thanks!

Warning: Missing Homebrew/brew git origin remote.

Without a correctly configured origin, Homebrew won't update
properly. You can solve this by adding the Homebrew remote:
  git -C "/usr/local/Homebrew" remote add origin https://github.com/Homebrew/brew.git

Warning: The following directories do not exist:
/usr/local/sbin
/usr/local/Frameworks

You should create these directories and change their ownership to your account.
  sudo mkdir -p /usr/local/sbin /usr/local/Frameworks
  sudo chown -R $(whoami) /usr/local/sbin /usr/local/Frameworks

Warning: No developer tools installed.
Install the Command Line Tools:
  xcode-select --install

xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
```

基本的にはここに書かれているコマンドを実行していけば問題は解決できます。

# 解決法
## Git の remote リポジトリの設定
まずは Git の remote リポジトリの設定が何かおかしいと言われるのですが、これは特に何もする必要がありませんでした。

```
$ git -C "/usr/local/Homebrew" remote add origin https://github.com/Homebrew/brew.git
fatal: remote origin already exists.
```

表示されているコマンドを実行しても、すでに「存在する」となって何も起きません。これは問題がないと思われるので無視します。

## `/usr/local/sbin` と `/usr/local/Frameworks` が存在しない
次に `/usr/local/sbin` と `/usr/local/Frameworks` が存在しないという警告についてはその通りなので、表示されているコマンドを素直に実行します。

```
$ sudo mkdir -p /usr/local/sbin /usr/local/Frameworks
$ sudo chown -R $(whoami) /usr/local/sbin /usr/local/Frameworks
```

## ディベロッパーツールがインストールされていない
最後に、Xcode のディベロッパーツールがインストールされていないと言われるのでインストールしましょう。

```
$ xcode-select --install
```

上記コマンドでインストールされます。通信環境にもよりますが、それなりに時間がかかります。

# 確認
以上で作業は完了です。最初の Git の remote リポジトリの設定がおかしいという警告もいつの間にか直っています。`brew doctor` を実行して、まだ警告が残っている場合は表示されたコマンドを素直に実行してみれば直るでしょう。

```
$ brew install imagemagick
```

ちゃんと `brew install` ができるようになりました。`brew update` に関しても問題なく実行できると思います。

# 感想
`brew doctor` は、ただ警告やエラーが表示されるだけでなく、これを実行すれば解決しますという的確なコマンドも提示してくれるのがとても親切ですね。

macOS Mojave にアップグレードによって発生したエラーに限らず、Homebrew で問題が発生したときは、まず `brew doctor` を実行してみることをおすすめします。
