---
title: "Zsh で $EPOCHREALTIME を使いたい"
emoji: "😎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Zsh", "Bash", "EPOCHREALTIME"]
published: true
order: 81
---

# 答え
```zsh
$ zmodload zsh/datetime
```

# $EPOCHREALTIME とは？
`$EPOCHREALTIME` はその瞬間の UNIX 時間を浮動小数点数で取得できるシェルの組み込み環境変数です。Bash では、バージョン 5 から追加されました。

```bash:Bash
$ echo $EPOCHREALTIME
1609927363.589775
```

Zsh では、バージョン 4.3.13 から追加されたようです。

しかし、Zsh の場合、デフォルトではこの環境変数は有効ではありません。

```zsh:Zsh
$ echo $EPOCHREALTIME
# 何も出ない
```

この環境変数を有効にするには以下を実行します。

```zsh:Zsh
$ zmodload zsh/datetime
```

これで使えるようになりました。

```zsh:Zsh
$ echo $EPOCHREALTIME
1609927355.8729970455
```

常にこの環境変数を使いたい場合は、上記の設定を `~/.zshrc` などに書き込めば OK です。

# 余談
Bash よりも Zsh のほうが浮動小数点以下が細かいですね。

# 参考サイト
- [zsh: 22 Zsh Modules](http://zsh.sourceforge.net/Doc/Release/Zsh-Modules.html)
- [Unixエポックからミリ秒を取得する方法は？](https://www.it-swarm-ja.tech/ja/bash/unix%E3%82%A8%E3%83%9D%E3%83%83%E3%82%AF%E3%81%8B%E3%82%89%E3%83%9F%E3%83%AA%E7%A7%92%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95%E3%81%AF%EF%BC%9F/956726274/)
- [Bash/Zsh + POSIX で sleep 0.01 する方法](https://qiita.com/akinomyoga/items/cddd837140aa0d57839f)
