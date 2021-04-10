---
title: "Zsh: sudo でも補完を有効にする"
emoji: "🐚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Shell", "Zsh"]
published: true
order: 92
layout: article
---

自作コマンドを `sudo` をつけて実行しようとしたときに補完できない場合は、以下を `~/.zshrc` に追加する。

```diff:~/.zshrc
+ zstyle ':completion:*:sudo:*' command-path $path
```

`$PATH` ではなく `$path` であることに注意。

# 参考サイト
* [Zsh初心者がzshrcを色々調べたの晒してみる](https://qiita.com/ryuichi1208/items/2eef96debebb15f5b402#zshrc%E3%82%B3%E3%83%A1%E3%83%B3%E3%83%88%E4%BB%98%E3%81%8D)
