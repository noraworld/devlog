---
title: "macOS で pyenv install すると BUILD FAILED となりインストールに失敗するときの解決法 (の一つ)"
emoji: "🔖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Python", "Python3", "pyenv", "pip"]
published: true
order: 68
---

# 解決法
pyenv を使用して Python をインストールしたところ BUILD FAILED となりインストールに失敗しました。原因は binutils でした。binutils を一旦アンインストールしてから再実行したらうまくいきました。

```shell
$ brew uninstall binutils
$ pyenv install <PYTHON_VERSION>
$ brew install binutils
```

なぜ binutils がインストールされているとインストールに失敗するのかはよくわかりませんでした。

"[pyenv install build failed macos](https://www.google.com/search?q=pyenv+install+build+failed+macos)" などで調べてみるとたくさん記事が出てくるのですが、どれも解決法がバラバラでした。自分の場合は binutils をアンインストールするだけで解決したので、解決法の一つとして共有しておきます。参考になれば幸いです。

# 環境
| 環境 | バージョン |
|---|---|
| macOS | 10.15.6 |
| pyenv | 1.2.20-3-g58c776a1 |
| Python (この手順でインストールしたもの) | 3.8.5 |
| その他のシステム情報 | [Brewfile.lock.json](https://github.com/noraworld/dotfiles/blob/a5f4ff63d6727c5ba6125f33eb5a625248c4057d/core/Brewfile.lock.json#L864-L875) |
