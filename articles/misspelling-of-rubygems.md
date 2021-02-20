---
title: "Linux で Rubygems がインストールできなかった超初歩的なミス"
emoji: "🙌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["rubygems", "Ruby", "Gem", "Linux"]
published: true
order: 4
---

環境: Vagrant (CentOS 7.1)

# Rubygems のインストール
とある目的で gem を使うことになったので以下のコマンドで rubygems をインストールしようとしました。

`$ sudo yum -y install rubygem`

すると以下のように表示され、インストールできませんでした。

```
パッケージ rubygem は利用できません。
エラー: 何もしません
```

# 原因
コマンドを間違えていた。正しくは

`$ sudo yum -y install rubygems`

`rubygem` ではなく `rubygems` でした。
疲れているとこういうミスも気づかなかったりするので注意ですね。

こんなミスをする人は多くないと思いますが、また同じミスをしないようにするための個人的なメモです。
