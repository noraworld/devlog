---
title: "cron のタイムゾーンを変更する際は再起動が必要！"
emoji: "😸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["cron", "cronjob", "crontab", "TimeZone", "Linux"]
published: true
order: 101
layout: article
---

表題の通りだが、システムのタイムゾーンを変更しても、すぐに cron に反映されるわけではないらしい。

```shell:Shell
sudo timedatectl set-timezone Asia/Tokyo
```

上記のようにシステムのタイムゾーンを変更したら、

```shell:Shell
sudo systemctl restart cron
```

cron の再起動も忘れずに。
