---
title: "Zsh: sudo でも補完を有効にする"
emoji: "🐚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Shell", "Zsh"]
published: true
---

自作コマンドを `sudo` をつけて実行しようとしたときに補完できない場合は、以下を `~/.zshrc` に追加する。

```diff:~/.zshrc
+ zstyle ':completion:*:sudo:*' command-path $path
```

`$PATH` ではなく `$path` であることに注意。
