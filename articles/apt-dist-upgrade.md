---
title: "apt update & upgrade を実行してもアップデートされない場合の解決法"
emoji: "🐕"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ubuntu", "RaspberryPi", "apt"]
published: true
order: 109
layout: article
---

# 結論
```shell:Shell
sudo apt -y update
sudo apt -y upgrade
sudo apt -y dist-upgrade
sudo reboot
```



# 環境
Ubuntu 20.04.3 LTS



# 問題
Ubuntu Server にログインすると、以下のように利用可能なパッケージのアップデートについてのメッセージが表示される。

```
17 updates can be applied immediately.
1 of these updates is a standard security update.
To see these additional updates run: apt list --upgradable
```

それに対し、以下のようにアップデートをして再起動する。

```shell:Shell
sudo apt -y update
sudo apt -y upgrade
sudo reboot
```

しかし、再起動後、再びログインしてもアップデートされていないときがある。

```
17 updates can be applied immediately.
1 of these updates is a standard security update.
To see these additional updates run: apt list --upgradable
```



# 原因
`apt -y upgrade` を実行した際に、以下のように表示される。

```
0 upgraded, 0 newly installed, 0 to remove and 2 not upgraded.
```

`not upgraded` と書かれている通り、アップデートされなかったパッケージがある。そのため、アップデート情報のメッセージが変わらなかった。



# 解決方法
以下のコマンドを実行する。

```shell:Shell
sudo apt -y dist-upgrade
sudo reboot
```

これにより、アップデートされなかったパッケージの問題が解決する。

```
0 updates can be applied immediately.
```

でめたしでめたし。



# 参考サイト
* [29 packages can be updated - How? [duplicate]](https://askubuntu.com/questions/449032/29-packages-can-be-updated-how#answer-621709)
