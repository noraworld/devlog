---
title: "macOS Big Sur で eventmachine がインストールできないときの対処法"
emoji: "⚙️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["eventmachine", "Ruby", "RubyGems", "Bundler", "macOS"]
published: true
order: 93
layout: article
---

# 結果だけ知りたい
```shell:Shell
sudo xcode-select --switch /Applications/Xcode.app
sudo xcodebuild -license accept
gem install eventmachine
```


# 環境
* macOS Big Sur 11.2.3
* Xcode 12.4
* Ruby 2.7.1
* RubyGems 3.1.2
* Bundler 2.1.4
* eventmachine 1.2.7

システムのバージョン詳細: [Brewfile.lock.json](https://github.com/noraworld/dotfiles/blob/6f63a6e8266c21a0ea7557d111d80c1c7eaf222d/core/Brewfile.lock.json)


# `--with-cppflags` ではダメだった
macOS に eventmachine をインストールしようとしたら失敗した。

ネットで記事を調べると、以下の解決法しか出てこないが、これだとインストールできなかった。

```shell:Shell
gem install eventmachine -- --with-cppflags=-I/usr/local/opt/openssl/include
```

https://stackoverflow.com/questions/30818391/gem-eventmachine-fatal-error-openssl-ssl-h-file-not-found


# ログを見る
真面目にログを見てみる。

```log:/Users/noraworld/.anyenv/envs/rbenv/versions/2.7.1/lib/ruby/gems/2.7.0/extensions/x86_64-darwin-19/2.7.0/eventmachine-1.2.7/mkmf.log
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
checked program was:
/* begin */
1: #include "ruby.h"
2:
3: int main(int argc, char **argv)
4: {
5:   return !!argv[argc];
6: }
/* end */

"pkg-config --exists openssl"
package configuration for openssl is not found
```

## package configuration for openssl is not found
`package configuration for openssl is not found` が気になる。

でも、OpenSSL はちゃんと最新版がインストールされているし、`--with-ssl-include` とか `--with-cppflags` とか `--with-openssl-config` とか、OpenSSL に関連しそうなオプションをいろいろ付けてみたけどダメだった。

`package configuration for openssl is not found` って出てくるけど、どうやら OpenSSL の問題だけではなさそう。

## xcrun: error: invalid active developer path
次に気になるのは `xcrun: error: invalid active developer path` だ。

`CommandLineTools` のパスがなんかおかしいと言われている。

ここで、ふと、自分が以前に書いた記事を思い出した。

https://zenn.dev/noraworld/articles/brew-install-and-update-failure-on-macos-mojave

すると、過去にも全く同じ警告が出ていることがわかった。


# `brew doctor`
そこで、`brew doctor` を試してみた。

```shell:Shell
brew doctor
```

```
Warning: Your Xcode is configured with an invalid path.
You should change it to the correct path:
  sudo xcode-select --switch /Applications/Xcode.app
```

どうやらこれを実行すれば良さそう。

```shell:Shell
sudo xcode-select --switch /Applications/Xcode.app
```

その後、もう一度 `brew doctor` を実行すると、以下のエラーが出た。

```shell:Shell
brew doctor
```

```
Error: You have not agreed to the Xcode license. Please resolve this by running:
  sudo xcodebuild -license accept
```

ライセンスに同意していないので同意してくれということらしいので、同意する。

```shell:Shell
sudo xcodebuild -license accept
```

そして、さらにもう一度 `brew doctor` を実行すると、警告が消えた。


# インストール完了
ここで、最初に戻り、eventmachine をインストールしようとしたら、インストールできた。

```
gem install eventmachine
```

結局、オプション (`--with-ssl-include` とか `--with-cppflags` とか `--with-openssl-config` とか) は要らなかった。


# 結論
困ったときは、`brew doctor`。
