---
title: "【iTerm2】ターミナル上で画像を表示する方法"
emoji: "🗂"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["iTerm2", "ターミナル", "シェル", "シェルスクリプト"]
published: true
---

# 環境
Mac (OS X El Capitan 10.11.5)
iTerm2 Build 3.0.8

# 概要
iTerm2 v3 がリリースされてからターミナル上で画像が表示されるようになりました。
[Images - Documentation - iTerm2 - Mac OS Terminal Replacement](https://www.iterm2.com/documentation-images.html)

数行のシェルスクリプトをコピペするだけで簡単に使えるようになります。
なお、これは iTerm2 v3 からの新機能なので、iTerm2 v3 以前のバージョンでは使用できません。
また、Macに最初からある`ターミナル.app`では、コマンドの実行自体はできますが画像を表示することができません。

# 手順
## スクリプトを設置
公式が配布しているシェルスクリプトをコピーします。
[imgcat](https://raw.githubusercontent.com/gnachman/iTerm2/master/tests/imgcat)

上記のサイトにアクセスして表示されたシェルスクリプトを丸々コピーしてください。

次にコピーしたスクリプトを`/usr/local/bin`上に置きます。
`$ sudo vi /usr/local/bin/imgcat`

`vi`が開いたら `INSERT MODE` にして先ほどコピーしたスクリプトをそのままペーストします。
ペーストしたら保存して終了します。

## 権限を付与
最後に、このスクリプトが通常コマンドとして使えるようにファイルの権限を変更します。
`$ sudo chmod +x /usr/local/bin/imgcat`

以上で画像を表示するコマンド`imgcat`が使えるようになりました。

# 使用方法
`$ imgcat 画像ファイルパス` で使用できます。

![imgcat.png](https://qiita-image-store.s3.amazonaws.com/0/113895/750f47e6-a992-57b2-198b-7d883eceab2e.png)

⚠️ `command not found` と表示された場合は`/usr/local/bin`がパスとして通っていない可能性があります。パスを通してください。

# 特徴
Macのローカルの画像ファイルを見たいときは、その画像のあるフォルダをFinderで開いてプレビューなどで見ることができるのであまり実用性がないかもしれません。

しかし、このコマンドはSSH接続した先のサーバでも使用できるのでリモートの画像ファイルをいちいちローカルにダウンロードしなくても確認できるのでかなり便利です。

サーバ上の画像ファイルを表示したい場合は、上記の手順をサーバ上でも同様に行うと使えるようになります。ただし繰り返しになりますが iTerm2 v3 を使用する必要があります。

すべてのOSで確認したわけではありませんが、CentOS7では同様に使用できることを確認しています。

# 参考サイト
[Images - Documentation - iTerm2 - Mac OS Terminal Replacement](https://www.iterm2.com/documentation-images.html)
