---
title: "cron で systemctl --user を使う方法 (Failed to connect to bus... の解決法)"
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["cron", "systemctl", "linux", "ubuntu"]
published: true
order: 149
layout: article
---

# 前提
まず大前提として、systemctl にはシステムワイドとユーザレベルの 2 種類があります。

```shell
# システムワイド
systemctl status ssh.service

# ユーザレベル
systemctl --user status your-daemon.service
```

システムワイドの場合、必要に応じて root 権限で実行すれば cron 内でも特に問題なく使用することができます。

```shell
*/10 * * * * sudo systemctl restart ssh.service
```



# 問題点
ところが、ユーザレベルの場合、同じように書いても正しく動作しません。

```shell
# 動作しない
*/10 * * * * systemctl --user restart your-daemon.service
```

上記の cron を実行すると以下のようなログが出力されます。

```
Failed to connect to bus: No such file or directory
```



# 解決法
cron 内で、ユーザレベルで systemctl コマンドを使うには `XDG_RUNTIME_DIR` という環境変数をセットする必要があります。

多くの場合、以下のように記述することで動作します。

```shell
*/10 * * * * XDG_RUNTIME_DIR=/run/user/$(id -u) systemctl --user restart your-daemon.service
```

cron の設定を行ったユーザとコマンドを実行したいユーザが異なる場合はユーザ名を明示します。

```shell
*/10 * * * * XDG_RUNTIME_DIR=/run/user/$(id -u <OTHER_USER>) systemctl --user restart your-daemon.service
```

なお、cron 内での変数の定義の仕方がシェルスクリプトに似ているので勘違いしやすいのですが、cron の文法はシェルスクリプトとは異なります。そのため、以下のように最初に `XDG_RUNTIME_DIR` をセットしておいても正しく動作しません。

```shell
# 動作しない
export XDG_RUNTIME_DIR=/run/user/$(id -u)
*/10 * * * * systemctl --user restart your-daemon.service
```

そのため、`systemctl --user` を何回も使いたい場合は環境変数の定義とコマンドの実行をセットにしたシェルスクリプトをどこかに用意しておいて、それを呼び出すと良いでしょう。

```shell:restart-your-daemon.sh
# シェルスクリプト
export XDG_RUNTIME_DIR=/run/user/$(id -u)
systemctl --user restart your-daemon.service
```

```shell
# cron
*/10 * * * * /path/to/restart-your-daemon.sh
```



# 参考
* [systemctl --use Failed to connect to bus: No such file or directory Debian 9](https://superuser.com/questions/1561076/systemctl-use-failed-to-connect-to-bus-no-such-file-or-directory-debian-9)
