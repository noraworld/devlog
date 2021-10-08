---
title: "ripgrep をラズパイや M シリーズチップ搭載 Mac でインストールする方法"
emoji: "🍓"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ripgrep", "aarch64", "amd64", "RaspberryPi", "macOS"]
published: true
order: 111
layout: article
---

# TL;DR
```shell:Shell
# For Ubuntu & aarch64
curl -LO https://github.com/microsoft/ripgrep-prebuilt/releases/download/v13.0.0-2/ripgrep-v13.0.0-2-aarch64-unknown-linux-gnu.tar.gz
tar zxvf ripgrep-v13.0.0-2-aarch64-unknown-linux-gnu.tar.gz
```



# 背景
[ripgrep は grep よりもはるかに高速](https://github.com/BurntSushi/ripgrep/tree/9b01a8f9ae53ebcd05c27ec21843758c2c1e823f#quick-examples-comparing-tools) なので、基本的に筆者は grep ではなく ripgrep を利用している。

しかし、Ubuntu にインストールする場合は少しだけ障害がある。詳しくは [公式の README](https://github.com/BurntSushi/ripgrep/tree/9b01a8f9ae53ebcd05c27ec21843758c2c1e823f#:~:text=N.B.%20Various%20snaps%20for%20ripgrep%20on%20Ubuntu%20are%20also%20available%2C%20but%20none%20of%20them%20seem%20to%20work%20right%20and%20generate%20a%20number%20of%20very%20strange%20bug%20reports%20that%20I%20don%27t%20know%20how%20to%20fix%20and%20don%27t%20have%20the%20time%20to%20fix.%20Therefore%2C%20it%20is%20no%20longer%20a%20recommended%20installation%20option.) に記載されているが、`apt` でインストールする場合は何やら問題があるらしく、正しく動かない可能性があるとのこと。

筆者の自宅では Ubuntu 20.04.3 をインストールした Raspberry Pi 4 があるのだが、数ヶ月前に新しく OS をインストールし直したところ、そもそも `apt` ではインストールできなくなっていた。

そこで、推奨されているインストール方法として、リリースノートのアセットリストからパッケージをダウンロードして `dpkg -i` コマンドでインストールするという方法があるのだが……。

現時点で最新版である [13.0.0 リリースノート](https://github.com/BurntSushi/ripgrep/releases/tag/13.0.0) を見てみると、なんと aarch64 (arm64) がないことに気づく。

Raspberry Pi 4 は 64-bit なので、自力でソースコードからビルドするしかなくなってしまう。

しかし、さすがに aarch64 に対応していないのは issue に上がっているのではないだろうかと思い、issue を漁ってみると、見事にヒットした。

[Not available for aarch64](https://github.com/BurntSushi/ripgrep/issues/1094)

そして、該当の issue を見てみると、以下のコメントにこの問題の解決案を書いてくれている人を見つけた。

[Not available for aarch64](https://github.com/BurntSushi/ripgrep/issues/1094#issuecomment-897210998)

どうやら、Microsoft が ripgrep の aarch64 版のバイナリを提供してくれているようだ[^1]。

[^1]: Microsoft ってこんなことまでしてくれるのか、太っ腹だな。

そして、その [Microsoft のリポジトリのリリースノート](https://github.com/microsoft/ripgrep-prebuilt/releases/tag/v13.0.0-2) を見てみると、ちゃんと aarch64 版が提供されているのを確認した。



# インストール方法
というわけで、さっそくダウンロードしてみる。

最新版の URL は [ここ](https://github.com/microsoft/ripgrep-prebuilt/releases/latest) から確認すること。なお、以下のコマンドは Ubuntu 20.04.3 (aarch64) での例である。M シリーズチップ搭載の Mac の場合は `ripgrep-v13.0.0-2-aarch64-unknown-linux-gnu.tar.gz` の部分を `ripgrep-v13.0.0-2-aarch64-apple-darwin.tar.gz` に置き換えること。

```shell:Shell
# For Ubuntu & aarch64
curl -LO https://github.com/microsoft/ripgrep-prebuilt/releases/download/v13.0.0-2/ripgrep-v13.0.0-2-aarch64-unknown-linux-gnu.tar.gz
tar zxvf ripgrep-v13.0.0-2-aarch64-unknown-linux-gnu.tar.gz
```

すると、カレントディレクトリに `rg` というバイナリだけが生成されるので、それをパスの通っているところに置いてシェルを再起動すれば使えるようになる。



# Zinit でインストールする
ただ、このやり方だとマシンの環境を新しくしたときなどに、手動でまたインストールし直す必要があったり、インストールしたパッケージ一覧を管理できなかったりして嫌だ。そこで Zinit で管理することにした。

Zinit 自体のインストールに関しては [公式リポジトリ](https://github.com/zdharma/zinit) を参照すること。

```bash
if [ "$(uname -i)" = "aarch64" ]; then
  zinit ice from"gh-r" as"program" bpick"*aarch64-unknown-linux-gnu*" pick"rg"
  zinit light microsoft/ripgrep-prebuilt
elif [ "$OSTYPE" =~ "darwin" ]; then
  zinit ice from"gh-r" as"program" bpick"*apple-darwin*" pick"rg"
  zinit light microsoft/ripgrep-prebuilt
fi
```

ただし、Mac 側 (`elif` のほう) は、筆者の手元に M シリーズチップ搭載の Mac がないため動作確認はしていない。もし間違っていたら教えていただけるとありがたい。



# 参考サイト
* Zinit の書き方について
    * [【ターミナル改造⑧】zinitでzshで利用できるRustツール一式を用意](https://qiita.com/t_o_d/items/983d2c6a29c0d3e46a75)
    * [zinit をしっかりと理解する](https://zenn.dev/xeres/articles/2021-05-05-understanding-zinit-syntax)
    * [Zplugin (zinit) を使ってみる](https://blog.katio.net/page/zplugin)
