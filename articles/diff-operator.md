---
title: "diff コマンドの大小記号がどっちだったかわからなくなったら見てね"
emoji: "🐤"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["diff", "colordiff"]
published: true
order: 136
layout: article
---

# 結論
* **左** にある引数側の差分が **`<`**
    * `colordiff` の場合は **赤色**
* **右** にある引数側の差分が **`>`**
    * `colordiff` の場合は **緑色**

| 引数 | 記号 | 色 |
| :---: | :---: | :---: |
| **左** | **`<`** | **赤色** |
| **右** | **`>`** | **緑色** |

# 検証
## 左側 (`test1.txt`)

```shell:Shell
cat test1.txt
```

```
Hello world
test1 side
```

## 右側 (`test2.txt`)

```shell:Shell
cat test2.txt
```

```
Hello world
test2 side
```

## diff

```shell:Shell
diff test1.txt test2.txt
```

```
2c2
< test1 side
---
> test2 side
```

**左** の引数 (`test1.txt`) 側にだけある差分が **`<`** で表示され、**右** の引数 (`test2.txt`) 側にだけある差分が **`>`** で表示される。

## colordiff

![](https://raw.githubusercontent.com/noraworld/developers-blog-media-ja/master/diff-operator/Screen%20Shot%202022-03-21%20at%2015.04.46.png)

左 (`<`) が赤色、右 (`>`) が緑色で表示される。

# おわり
毎回忘れるので備忘録として記録しておくことにした。
