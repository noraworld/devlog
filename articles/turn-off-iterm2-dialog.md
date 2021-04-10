---
title: "iTerm2 v3 終了時に確認ダイアログを表示させない方法"
emoji: "🖥"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["iTerm2"]
published: true
order: 85
layout: article
---

![スクリーンショット 2021-02-28 12.43.29.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/4f7fb45a-3f6f-d9af-ccbc-364bb4d1053c.png)

iTerm2 終了時に上記の確認ダイアログを表示させない方法です。

# 手順
1. `⌘ + ,` で環境設定を開く
2. `General` > `Closing` と進み、不要な確認をする項目のチェックを外す
3. `Profiles` > `Session` と進み、`Prompt before closing?` の選択項目で `Never` を選択する

![スクリーンショット_2021-02-28_12_46_35.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/4911def8-0981-95d3-61e7-a7b128135dfb.png)
![スクリーンショット_2021-02-28_12_47_22.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/cd435730-2f10-e934-aafe-193fce4aa96f.png)

# 各項目について
- Quit when all windows are closed
  - すべての iTerm2 のウィンドウが閉じられた際に iTerm2 を自動的に終了させたい場合はチェックします
  - 今回の確認ダイアログの話とは関係ありません
- Confirm closing multiple sessions
    - 複数のセッション (複数タブや複数ウィンドウを開いている状態) で iTerm2 を終了させようとしたときのみダイアログを表示する場合はチェックします
- Confirm "Quit iTerm2 (⌘Q)"
    - メニューバーまたはショートカット (`⌘ + Q`) で iTerm2 を終了させようとしたときにダイアログを表示する場合はチェックします
    - うっかり `⌘ + Q` で終了させてしまうのを防ぐためのオプションですが、自動アップデートの際は不便です
    - iTerm2 の環境設定ではなく Karabiner-Elements などで汎用的な対応をするほうがおすすめです
- Even if there are no windows
  - Confirm "Quit iTerm2 (⌘Q)" にチェックを入れた状態で、ウィンドウが一つも開かれていなくても iTerm2 を終了させる場合にダイアログを表示する場合はチェックします

# なぜ確認ダイアログを表示させたくないか
macOS の自動アップデートのときに、iTerm2 終了の確認ダイアログのせいで自動アップデートができないからです。
