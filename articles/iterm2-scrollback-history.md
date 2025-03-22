---
title: "iTerm2 でスクロールしたときの履歴を消さないようにする方法"
emoji: "📜"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["iterm", "iterm2"]
published: true
order: 167
layout: article
---

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/iterm2-scrollback-history/231628444-af06c8e1-8780-48b4-844a-7c1358424fa6.png)

iTerm2 で上にスクロールすると今までの表示履歴を確認することができますが、スクロールの行数が多すぎると過去の履歴は削除されてしまいます。スクロールできる全履歴を、iTerm2 を終了するまで保持するには以下の手順に従い設定を変更します。

1. `Command` + `,` を押下し iTerm2 の環境設定ウィンドウを開きます
2. `Advanced` タブをクリックします
3. 検索フィールドに `scrollback history` と入力します
4. `Prevent CSI 3 J from clearing scrollback history?` という項目を `Unspecified` から `Yes` に変更します
