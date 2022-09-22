---
title: "M1 Mac (macOS Monterey) で Node.js のインストールに失敗するときの対処法"
emoji: "❇️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["node", "nodejs", "mac", "macos"]
published: true
order: 155
layout: article
---

# 解決方法
M1 Mac で従来どおりに Ruby をインストールしようとするとビルドエラーが出てしまいます。

筆者の環境では以下のコマンドを事前に実行することにより無事インストールすることができました。

```shell:Shell
arch -x86_64 zsh   # Zsh の場合
arch -x86_64 bash  # Bash の場合
```

tmux などを使っている場合は以下のようなメッセージが表示されるので、いったん終了してから実行してみてください。

```
sessions should be nested with care, unset $TMUX to force
```



# 参考サイト
* [Unable to install nodejs](https://github.com/asdf-vm/asdf-nodejs/issues/130#issuecomment-753945615)
