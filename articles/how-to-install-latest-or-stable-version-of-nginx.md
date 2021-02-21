---
title: "CentOS 7 (5, 6) で \"安定版 (最新版)\" のNginxをインストールする方法"
emoji: "😎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nginx", "Yum", "CentOS", "centos7"]
published: false
order: 13
---

# 前置き
CentOSでNginxをインストールする方法を調べてみると、大抵のサイトには「Nginxはyumのリポジトリに登録されていないので、はじめにリポジトリの登録をしないとインストールできません」と紹介されています。

本当にそうなのか？ と疑問に思ったので、登録をせずにいきなりインストールしようとしてみました。

`$ sudo yum -y install`

すると、あっさりインストールできました😮

もしかすると前はyumのリポジトリに登録されていなくて、現在は登録されたのかもしれません。

面倒な手間が省けてラッキー！ と思ったのもつかの間で、バージョンを確認してみたら…

```
$ nginx -v
nginx version: nginx/1.6.3
```

だいぶ古いバージョンでインストールされてしまいました😅
登録はされたけどしばらく更新がなかったのかもしれないですね…

なので、今回はCentOSで安定版のNginxをインストールする方法を紹介します。

# 手順
## 設定ファイルの追加
`/etc/yum.repos.d/nginx.repo` というファイルを作成し、そのファイルに以下の設定を追加します。

```/etc/yum.repos.d/nginx.repo
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=0
enabled=1
```

⚠️ 上記は、CentOS 7 の設定です。もし、CentOS 5 や 6 をお使いの方は `baseurl` の `7` という部分を、お使いのCentOSのバージョンに書き換えてください。

‼️ このファイルはroot権限を持っていないと編集できないので`vi`などのエディタを使う場合は`sudo`が必要になるかもしれません。

上記の設定を追加したら保存してエディタを閉じます。

## インストール
あとは普通にインストールすればOKです。ただし、インストールするのは今回設定したURLからなので、`enablerepo`というオプションをつけてインストールします。

`$ sudo yum -y --enablerepo=nginx install nginx`

インストール後、バージョンを確認します。

`$ nginx -v`

2016年8月6日現在では以下のように表示されればOKです。
`nginx version: nginx/1.10.1`

正確には、[Nginxの公式ページ](https://nginx.org/en/download.html)にある "Stable version" の箇所にあるバージョンと同じものが表示されたら成功です。おつかれさまでした！

# おまけ：安定版ではなく、最新版をインストールしたい
Nginxには"Stable version"(安定版)と"Mainline version"(最新版)の2種類があり、ぼくは安定版をインストールしましたが、最新版をインストールしたい場合もあるかと思います。

その場合は、先ほどの設定ファイル(`/etc/yum.repos.d/nginx.repo`)をちょっとだけ編集します。

```/etc/yum.repos.d/nginx.repo
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/mainline/centos/7/$basearch/
gpgcheck=0
enabled=1
```

⚠️ CentOS 5 や 6 を使っている方は先ほど同様に該当箇所を書き換えてください

先ほどと異なる点は、`baseurl`に`mainline`が追加されたことです。これで上記と同じように `$ sudo yum -y --enablerepo=nginx install nginx` すれば最新版がインストールされます。

2016年8月6日現在では、1.11.3がインストールされればOKです。最新版のバージョン(Mainline version)は[Nginxの公式ページ](https://nginx.org/en/download.html)で確認してください。

# 参考サイト
[nginx: Linux packages](https://nginx.org/en/linux_packages.html)
[CentOS7でnginxをyumでインストール(phpのおまけ付き)](http://qiita.com/kesuzuki/items/4a1644fc0d637993e7d3)
