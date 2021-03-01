---
title: "[Mac] peco で複数選択ができないときの対処法"
emoji: "🐕"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Peco", "IME", "Mac", "MacOSX", "macos"]
published: false
order: 50
---

# peco で複数選択する方法
[peco の Wiki](https://github.com/peco/peco/wiki/Keyboard-Shortcuts#selection-shortcuts) によると、**CTRL+space** で「行を選択してカーソルを下に移動する」と書かれています。

ところが、Mac で **CTRL+space** を押すと、入力ソースの切り替えが出てきてしまいます。

<img width="264" alt="input_source.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/ecececc7-97b4-1e53-44cb-b5ed002a9a50.png">

# 解決策
設定で入力ソースの切り替えを無効にします。

`システム環境設定 > キーボード > ショートカット > 入力ソース` と進み「**前の入力ソースを選択**」のチェックボックスをオフにします。

<img width="660" alt="setting_keyboard.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/a75901f9-b787-be11-f6bd-9c7cbea8c563.png">

<img width="660" alt="スクリーンショット 2018-06-17 22.00.55.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/e3ef3d79-ba0e-26d4-0b60-9a5f97f0d8ef.png">

これで設定は終了です。peco のインターフェースで **CTRL+space** を押すと複数選択ができるようになります。

<img width="1440" alt="peco_multi_select.png" src="https://qiita-image-store.s3.amazonaws.com/0/113895/282ed271-5092-ca45-b305-bd2cbcf8613a.png">
