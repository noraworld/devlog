---
title: "ユーザレベルで systemd のユニットファイルを書くときの注意点"
emoji: "🐷"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["systemd"]
published: true
order: 94
layout: article
---

# はじめに
systemd はシステムワイドでの起動とユーザレベルでの起動の 2 種類ある。

```shell:Shell
(sudo) systemctl <SUB_COMMAND> <SERVICE_NAME> # system-wide
systemctl --user <SUB_COMMAND> <SERVICE_NAME> # user-level
```

ユニットファイル (`*.service`) を書くとき、システムワイドでは問題ないがユーザレベルだと使えなかったり正しく起動できないものがあるのでまとめておく。



# `User` / `Group` は使えない
システムワイドでは、どのユーザでデーモンを起動するかを指定するために、`User` や `Group` というのを使うことがあるが、ユーザレベルでは使えない。

```config
[Service]
User=ubuntu
Group=ubuntu
```

## 発生する問題
ユーザレベルで上記の項目を書くと、以下のようなエラーが発生する。

```log:Log
foo.service: Failed to determine supplementary groups: Operation not permitted
foo.service: Failed at step GROUP spawning /usr/bin/env: Operation not permitted
```

## 解決策
単に `User` や `Group` を削除すれば良い。

削除後はデーモンのリロードを忘れずに。

```shell:Shell
systemctl --user daemon-reload
```

https://unix.stackexchange.com/questions/438064/failed-to-determine-supplementary-groups-operation-not-permitted



# `multi-user.target` は使えない
システムワイドでは `WantedBy` に `multi-user.target` を指定することがあるが、これもユーザレベルでは使えない。

```config
[Install]
WantedBy=multi-user.target
```

## 発生する問題
これが書かれていてもデーモンの起動自体はできるが、自動起動を有効にしていてもシステム起動時のデーモンの自動起動が効かなくなる。

## 解決策
代わりに、`default.target` が使える。

```config
[Install]
WantedBy=default.target
```

ちなみに、上記の間違いを修正する際、すでに自動起動を有効にしている場合は、いったん無効にしてもう一度有効にする必要がある。もちろんデーモンのリロードも必要。

```shell:Shell
systemctl --user daemon-reload
systemctl --user disable <SERVICE_NAME>
systemctl --user enable <SERVICE_NAME>
```

正しく追加されているか確認するには、以下のコマンドを実行する。

```shell:Shell
systemctl --user list-dependencies default.target
```

https://github.com/systemd/systemd/issues/2690#issuecomment-186973730
