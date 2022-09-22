---
title: "M1 Mac (macOS Monterey) で Docker の MySQL のインストールに失敗するときの対処法"
emoji: "🐳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["docker", "mysql", "mac", "macos"]
published: true
order: 156
layout: article
---

M1 Mac で Docker の MySQL のイメージを pull しようとすると以下のようなエラーが表示されます。

```
no matching manifest for linux/arm64/v8 in the manifest list entries
```

`docker-compose.yml` に `platform: linux/x86_64` を追加すると pull できるようになります。

```diff:docker-compose.yml
 version: '3'
 services:
   db:
+    platform: linux/x86_64
     image: mysql:5.7
```



# 参考サイト
* [Docker (Apple Silicon/M1 Preview) MySQL "no matching manifest for linux/arm64/v8 in the manifest list entries"](https://stackoverflow.com/a/65592942)
