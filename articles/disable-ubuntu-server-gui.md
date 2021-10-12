---
title: "Ubuntu Server が突然 GUI モードになってしまう問題の対処法"
emoji: "🤨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ubuntu", "GUI", "RaspberryPi"]
published: true
order: 112
layout: article
---

# 事の発端
数週間ぶりに Ubuntu Server を再起動したら、突然 GUI モードになってしまった。

もちろん Ubuntu Desktop をインストールしたわけではない。だから、Ubuntu Desktop ではない GUI だった。

なんというか、非常にちゃちな造りの GUI で、デスクトップ画面の背景が無地の青色なのだが、SSH すると画面の中央部分だけが紫色になる。さらにマウスをつないでカーソル移動すると、カーソルの軌跡が変色する。そして、数分間、操作がないと画面が薄暗くなるのだが、マウスやキーボードを操作しても画面が復活しなかったりする。これはどうみてもおかしい。

![](https://raw.githubusercontent.com/noraworld/blog-content/main/disable-ubuntu-server-gui/IMG_0434.JPG)

というかそもそも GUI を入れるつもりは毛頭ないので、もちろん無効にすることにした。



# 解決方法
直し方は非常にシンプル。以下のコマンドを実行するだけ。

```shell:Shell
sudo systemctl set-default multi-user
```

そして再起動するだけ。

```shell:Shell
sudo reboot
```



# 原因不明
直すのは簡単だったが、原因が不明だった。最近インストールしたパッケージの中で、怪しいものをすべて完全に消去したりもしたのだが、それでは直らなかった。



# 参考
* [Ubuntu 20.04 Server Suddenly has GUI and No Terminal](https://askubuntu.com/questions/1250026/ubuntu-20-04-server-suddenly-has-gui-and-no-terminal#answer-1297572)
* [How to disable/enable GUI on boot in Ubuntu 20.04 Focal Fossa Linux Desktop](https://linuxconfig.org/how-to-disable-enable-gui-on-boot-in-ubuntu-20-04-focal-fossa-linux-desktop)
