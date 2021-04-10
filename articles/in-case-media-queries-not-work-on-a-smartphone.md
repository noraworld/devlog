---
title: "【CSS】スマホで Media Queries が効かないときの対処法"
emoji: "🔖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["CSS", "CSS3"]
published: true
order: 11
layout: article
---

# Media Queries とは
Media Queries はCSS3から追加された機能で、レスポンシブデザインを行うのに利用されます。

# レスポンシブデザインとは
レスポンシブデザインとは、PCやスマホ、タブレットなどの画面サイズが異なる複数のデバイスに対して、それぞれの画面サイズに適したデザインを、それぞれ全く別のCSSファイルで書くのではなく一つのCSSファイルでまとめて行うものです。

# Media Queries の使い方
Media Queries の使い方はとっても簡単です。

```css
@media screen and (max-width: 500px) {

}
```

このブロック内にスマホのみに対応させたいCSSを書くだけでスマホの画面のスタイルを適用することができます。

⚠️ 厳密にはスマホではなく横幅500px以下の画面に対して適用されます。PCでも、ブラウザのウィンドウ幅を500px以下にすればこのブロック内のスタイルが適用されますし、逆に500px以上の画面サイズのスマホがあったならこのスタイルは適用されません。

ところが、使い方を間違えるとレイアウトがおかしくなったり適用されなくなったり、PCではブラウザのウィンドウ幅を狭くすると適用されるのになぜかスマホでは適用されない…なんてことが起こります。今回はそれらの問題について細かく切り分けていきたいと思います。

# スタイルが適用されない・レイアウトがおかしくなる
Media Queries は記述する順番が重要です。どのデバイスを中心にスタイルを組むかによって順番が異なります。

PCのデザインをまず組んで、その後にスマホでデザインが崩れている部分を Media Queries で修正する場合を「PCファースト」、反対にスマホのデザインを組んでから、PCのデザインに合うように Media Queries を適用する場合を「モバイルファースト」と言います。

## PCファーストの場合
PCファーストの場合は、PCのスタイル → スマホのスタイル の順番で Media Queries を記述します。
今回はPCの画面サイズを1200px以下、スマホの画面サイズを500px以下と定義することにします。

```css
@media screen and (max-width: 1200px) {
  /* PC用のスタイル */
}
@media screen and (max-width: 500px) {
  /* スマホ用のスタイル */
}
```

こうすることで先に1200px以下のデバイス(PC)のスタイルが適用され、そのあとにもし500px以下のデバイス(スマホ)であればそちらが上書きで適用されます。

なお、この場合、1200px以上のデバイスの場合はスタイルが適用されないので、スマホのスタイルに対してのみ Media Queries を適用するほうが便利です。

```css
/* 全体に適用されるスタイル */

@media screen and (max-width: 500px) {
  /* スマホ用のスタイル */
}
```

## モバイルファーストの場合
モバイルファーストはPCファーストの逆の順番で記述します。

```css
@media screen and (max-width: 500px) {
  /* スマホ用のスタイル */
}
@media screen and (max-width: 1200px) {
  /* PC用のスタイル */
}
```

こうすることで、先にスマホ用のスタイルが適用されたあとにPCの場合はPC用のスタイルが上書きで適用されます。

ちなみに、今回の例ではPCとスマホのみを例にあげていますが、たとえばタブレット端末にはまた別のスタイルを適用したいという場合はスマホとPCの Media Queries の間に、タブレットに対応した画面サイズの Media Queries を定義してあげればOKです。

# PCでは適用されるのに、なぜかスマホでは適用されない
今回ぼくがはまったのはこれです。PCのブラウザ上でウィンドウの幅を狭めるとうまく適用されるのに、なぜかスマホで見るとスマホ用のスタイルが適用されません。

実は、スマホはPCサイトを見やすくするために独自の画面サイズが定義されていて、スマホでサイトが表示されたときに、たとえば980px用の画面サイズのスタイルで表示されるようになっています。

これを、本来のスマホの画面サイズ(iPhone5なら320px)で Media Queries が適用されるようにするためにはViewportというものが必要になります。

## Viewportの記述法
Viewportの記述法はシンプルです。Media Queries を適用しているCSSを読み込んでいるHTMLのヘッド部分に以下の一行を追加してあげればOKです。

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
```

具体的にはこんな感じ。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <link rel="stylesheet" type="text/css" href="読み込みたいCSSのパス">
  </head>
  <body>
    <p>Responsive Design</p>
  </body>
</html>
```

これで、スマホでアクセスしたときにも Media Queries が適用されるようになります。
