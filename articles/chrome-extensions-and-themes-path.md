---
title: "Google Chrome のアプリや拡張機能、テーマが保存されている場所"
emoji: "😊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["google", "Chrome", "アプリ", "拡張機能", "テーマ"]
published: false
---

今回が初投稿です。よろしくお願いします。

Google Chrome の拡張機能がどこに保存されているのかをよく忘れてしまうのでメモっておきます。

# 拡張機能が保存されているディレクトリ
## Mac
`/Users/(ユーザ名)/Library/Application Support/Google/Chrome/Default/Extensions`
## Windows
`C:\Users\(ユーザ名)\AppData\Local\Google\Chrome\User Data\Default\Extensions`

今回は Mac を中心に説明します。

![ディレクトリ一覧](https://qiita-image-store.s3.amazonaws.com/0/113895/187f294d-4f77-f32a-3128-1ac90d39ac07.png)

上記のパスにアクセスしてその中身を表示するとズラッとディレクトリが出てきます。一つ一つのディレクトリが一つの拡張機能に対応していて、それぞれの拡張機能の ID がそのままディレクトリ名(長ったらしい文字列)になっています。

調べたい拡張機能があればそのディレクトリにアクセスしてソースコードや画像などを見ることができます。しかしこれだとどのディレクトリにどの拡張機能のコードが入っているかわかりません。なので調べたい拡張機能の ID をまず調べます。

# 拡張機能の ID の調べ方
Chrome Web Store で調べたい拡張機能のページに移動します。Chrome Web Store にアクセスしてから拡張機能を検索する方法もありますが、インストール済みの拡張機能なので、拡張機能のページ(chrome://extensions)から拡張機能の`詳細`をクリックするか`デベロッパーのウェブサイト`をクリックすれば一発で移動できます(拡張機能によって Chrome Web Store へのリンクが異なります)。

![拡張機能IDの取得.png](https://qiita-image-store.s3.amazonaws.com/0/113895/877bb5cf-58b2-05bc-8e74-a4aeca45f00e.png)

Chrome Web Store に移動するとこのようなページに来ます。今回は例として Google ドキュメントの ID を調べます。このページの URL を見ると、`https://chrome.google.com/webstore/detail/google-docs/aohghmighlieiainnegkcijnfilokake` となっていて、この URL の一番最後のパス、今回でいう `aohghmighlieiainnegkcijnfilokake` が拡張機能のパスになります。

あとは、この ID と一致するディレクトリ名を探せば拡張機能のソースコードや画像を見ることができます！

# どういうときに使うのか？
自分は趣味で Chrome の拡張機能を作っているのですが、他の方が作った拡張機能で実装されている機能をどう実現するのかをネットで調べてもよくわからないときにその拡張機能のコードを見て参考にさせていただいていたりします。

また、Google Chrome ではテーマは一つしか適用されません。つまり、新しいテーマを適用すると、前のテーマは削除されてしまいます(ローカルからも削除されてしまいます)。なので、新しいテーマを適用する前に前のテーマのコードや画像を別の場所に保管しておけば、前のテーマが何だったか忘れてしまっても前のテーマに戻すことができます。

# まとめ
はじめての投稿なのでまだよくわかりませんがこんな感じでよいのでしょうか…?
もし質問やこうしたほうが良いなどがありましたらコメントくださるとうれしいです！
