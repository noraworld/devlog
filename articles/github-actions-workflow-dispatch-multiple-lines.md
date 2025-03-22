---
title: "GitHub Actions の workflow_dispatch で複数行入力できるようにする"
emoji: "🚀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHubActions", "GitHub"]
published: true
---

# できるようになること
GitHub Actions の `workflow_dispatch` で複数行入力ができるようになります。

![](https://noraworld.github.io/box-bulbasaur/2025/03/f1956a0e5516117ed665449c7681d83a.png)

# 結論
**複数行入力するための `type` は GitHub Actions は用意されていませんが、ブラウザのディベロッパーツールを用いることで擬似的に複数行入力を実現することは可能です**。ただし iOS や Android アプリでは使用できません。

# `workflow_dispatch` とは？
以下のようなトリガーを追加することにより手動で GitHub Actions を実行できるようになります。`on.workflow_dispatch.inputs` を設定することで実行時に任意の値を渡すことができます。

```yaml
on:
  workflow_dispatch:
    inputs:
      remarks:
        required: false
        description: '備考'
        type: string
```

![](https://noraworld.github.io/box-bulbasaur/2025/03/d9e318711f79ffdf3fed5e489cd5bd15.png)

上記の例の場合、呼び出されるジョブの中で `${{ github.event.inputs.remarks }}` という変数で参照できるようになります。`remarks` は任意の変数名です。

# 問題点
`type` を `string` にすることでテキストフィールドを用意することができるのですが、残念ながら複数行入力ができません。また、複数行入力をするための `type` は現時点では用意されていません。

# 解決策
ブラウザのディベロッパーツールを用いて、`type: string` で用意された HTML の `input` 要素を `textarea` に変更することで複数行入力が可能になります。

ここでは Google Chrome を利用した方法を紹介します。

## 入力フォームの表示
`workflow_dispatch` を実行するページにアクセスします。"Run workflow" ボタンを押してメニューを開きます。

![](https://noraworld.github.io/box-bulbasaur/2025/03/d9e318711f79ffdf3fed5e489cd5bd15.png)

## ディベロッパーツールの起動
ディベロッパーツールを開きます。ブラウザ画面上の任意の箇所で右クリックして表示されたメニューから「要素の検証」または "Inspect" をクリックします。

あるいは Windows の場合は F12、macOS の場合は Command + Option + I でも開けます。

## 要素の指定
開いたディベロッパーツールのウィンドウの左上にある左上向きの矢印をクリックします。矢印に色がついたら要素が指定できるようになります。

![](https://noraworld.github.io/box-bulbasaur/2025/03/94fc82578a972b3c81b2ca7abfb075d1.png)

## `input` 要素の選択
この状態で先ほど開いた `workflow_dispatch` のメニュー上の、`input` 要素を選択します。

![](https://noraworld.github.io/box-bulbasaur/2025/03/5816e4952d1a5ee3cee5762a5eeb0246.png)

## `textarea` への変更
先ほどの手順により、ディベロッパーツール上で `input` 要素が選択された状態になっていると思います。

![](https://noraworld.github.io/box-bulbasaur/2025/03/5268ed19ea37b36cdbed904a3d5a2b96.png)

そこにある `input` というテキストをダブルクリックして編集可能な状態にします。

![](ttps://noraworld.github.io/box-bulbasaur/2025/03/8f84632e400f2e835c32f644d4ac4e26.png)

要素を `input` から `textarea` に変更します。

![](https://noraworld.github.io/box-bulbasaur/2025/03/26aacad2c52d1af913d34b17a0d0f8e7.png)

これで複数行入力ができるようになったと思います。

ただ入力フォームが複数行になっただけではなく、実際に複数行入力した際に改行が反映されます。

# もっと便利な使い方
この方法だと毎回ディベロッパーツールを開いて要素を選択して `input` を `textarea` に変えないといけません。

これって手間ですよね？

以下の JavaScript を実行することで同じことが実現できます。

```javascript
document.querySelector('summary.primary.btn-sm.btn').click();
setTimeout(convertInputIntoTextarea, 1000);

function convertInputIntoTextarea() {
  const input = document.querySelector('input.form-control.input-contrast.input-sm');
  const textarea = document.createElement('textarea');

  textarea.className = input.className;
  textarea.name = input.name;
  textarea.placeholder = input.placeholder;
  textarea.value = input.value;
  textarea.rows = 4;

  input.parentNode.replaceChild(textarea, input);
}
```

⚠️ ここで指定されているクラス `'summary.primary.btn-sm.btn'` や `'input.form-control.input-contrast.input-sm'` は 2025 年 3 月 22 日のものです。将来的に変更される可能性があります。

あとはこのスクリプトをなるべく手間の少ない方法で実行してあげれば OK です。たとえば

* ディベロッパーツールのコンソールにコピペする
* ブックマークレットに登録してアドレスバーから実行する
* 拡張機能にして `workflow_dispatch` のページにアクセスしたら自動実行されるようにする

などの方法があります。

以下のコードはブックマークレット用です。

```javascript
javascript:document.querySelector('summary.primary.btn-sm.btn').click(); setTimeout(convertInputIntoTextarea, 1000); function convertInputIntoTextarea() { const input = document.querySelector('input.form-control.input-contrast.input-sm'); const textarea = document.createElement('textarea'); textarea.className = input.className; textarea.name = input.name; textarea.placeholder = input.placeholder; textarea.value = input.value; textarea.rows = 4; input.parentNode.replaceChild(textarea, input); }
```

# この方法はパソコン版ブラウザのみ
残念ながらこの方法はパソコン版ブラウザでしかできません。厳密に言えば HTML が直接編集できる環境であれば問題ないのですが、iPhone や Android などのアプリではできません。

将来的に `textarea` 版の `type` も GitHub Actions に実装されるといいですね。

# 参考リンク
* [workflow - Is it possible to give multiline inputs in github actions workflow_dispatch? - Stack Overflow](https://stackoverflow.com/questions/69115785/is-it-possible-to-give-multiline-inputs-in-github-actions-workflow-dispatch)
* [Add way to define a long string workflow_dispatch input · community · Discussion #12882](https://github.com/orgs/community/discussions/12882#discussioncomment-11335603)
* [InputをTextareaに変更](https://chatgpt.com/share/67dd549b-706c-8004-b5b7-566824377cc7)
