---
title: "Ruby で競技プログラミング (AtCoder) をやっているときあるある"
emoji: "💎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "AtCoder"]
published: true
order: 118
layout: article
---

# はじめに
筆者はまだ競技プログラミング歴が浅い初心者である。Ruby が好きで、ふだん仕事でもプライベートでも Ruby を書く機会が多いため、Ruby で競技プログラミングをやっているのだが、競技プログラミングで書くコードはアプリケーションで書くコードとはかなり毛色が異なるため、アプリケーションの実装のノリで計算量が現実的ではないコードを書いてしまったり、Ruby っぽくない書き方をしてしまうことがある。

今回はそんな「Ruby で競技プログラミングをやっているときあるある」について紹介しようと思う。あまり役に立つような記事ではないため、娯楽程度に見てほしい。






# 用語
* TLE
    * Time Limit Exceeded (実行時間制限超過) の略
    * 提出したコードが規定の処理時間をオーバーした際に表示される
    * この場合、正解とはならず得点は得られない






# Ruby っぽくないループの書き方をしてしまう
Ruby で配列のループを回すときは [`Array#each`](https://docs.ruby-lang.org/ja/latest/method/Array/i/each.html) を用いるか、[`Array#map`](https://docs.ruby-lang.org/ja/latest/method/Enumerable/i/collect.html) のような関数型言語のようなメソッドを用いることがほとんどだと思う。

そしてこの `Array#each` を使ったループの回し方は、他の言語にはあまりない[^1]ユニークな手法なのではないかと個人的には思っている。他の言語では、`for` 文など、添字をインクリメントして添字で要素を指定するループの回し方が一般的だと思う。

[^1]: あまりないと書いた直後、JavaScript の [`for ... of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) を思い出してしまったので、そうでもないのかな？ とも思ってしまった。それでも、競技プログラミングで良く使われる C++ や Python などでは、添字をインクリメントして添字で要素を指定することが多い気がする。

ところが、競技プログラミングをやっている最中に限っては、トリッキーな位置の要素を指定することが多いため、`Array#each` のような、順番に要素のみを参照するメソッドではなく `for` 文や [`Integer#upto`](https://docs.ruby-lang.org/ja/latest/method/Integer/i/upto.html) などを利用する頻度のほうが高かったりする。

たとえば、[AtCoder Beginner Contest 237 の C 問題の解説](https://atcoder.jp/contests/abc237/editorial/3338) の 30 〜 35 行目[^2]を見てみる。

[^2]: 2022 年 1 月 31 日現在。

```cpp
	for (int i = x; i < (n - y); i++) {
		if (a[i] != a[x + n - y - i - 1]) {
			cout << "No" << endl;
			return 0;
		}
	}
```

ループの開始が `x` で、終了が `(n - y)` というトリッキーな指定となっている。さらにその中の `if` の条件式で、`a[x + n - y - i - 1]` という、かなり複雑な添字の指定になっている。

これと同等のことを `Array#each` を使って表現するのはなかなか難しいだろう。もちろん添字を使うときのために `Array#each_with_index` というメソッドも存在するが、結局、添字しか使わないし、ループの開始と終了が 0 〜 N のように単純ではないので、ここでは筆者は `Integer#upto` を使いたくなるところだ。

ちなみにこの項目を書くにあたって、改めて Ruby のループの書き方についておさらいしたのだが、Ruby にはこんなにループの書き方があるのかと驚かされた。

[【Ruby入門】ループ処理まとめ（for・times・while・each・upto・downto・step・loop）](https://www.sejuku.net/blog/14955)

業務で使用するのはやはり専ら `Array#each` くらいだ。






# 計算量を気にせずに便利なメソッドを使ってしまう
Ruby には (特に文字列や配列において) 他の言語にはないような便利なメソッドが数多くある。ループ内で多用しない限りは便利に使えるメソッドだったりするのだが、こと競技プログラミングにおいては計算量 (処理時間) が仇となって TLE になってしまうことが多発する。筆者も問題を解いているとき、かなりの頻度で TLE が発生するので、普段のコーディングで如何にパフォーマンスを軽んじているかを痛感してしまう。

たとえば、[AtCoder Beginner Contest 237 の D 問題](https://atcoder.jp/contests/abc237/tasks/abc237_d)。与えられた文字列の文字種に応じて数値の挿入処理を行うというものだ。

配列の特定の位置に要素を挿入するのだから、Rubyist の素直な脳で考えると、[`Array#insert`](https://docs.ruby-lang.org/ja/latest/method/Array/i/insert.html) が使えそうだなとなる。実際に解いたコードがこちら。

```ruby
#!/usr/bin/env ruby

def main
  n = gets.to_i
  s = gets.chomp
  a = [0]

  pos = 0
  for i in 0...n
    pos += 1 if s[i] == 'R'
    a.insert(pos, i + 1)
  end

  puts a.join(' ')
end

main
```

これ以上なく簡潔に書けたのではないかと脳内で自画自賛しつつこのコードを提出したところ、TLE となった。原因は `a.insert(pos, i + 1)` の部分だ。

この `Array#insert` と同等の処理を行うメソッドを自作しようと思うとわかるのだが、指定した要素を挿入する位置よりも後ろにある要素の位置をすべて 1 つずつずらした上で挿入する必要があるので、それなりに時間がかかる。最悪の計算量は `O(n)` になると思う。それをループの中で何回も実行しているのだから、最悪の計算量は `O(n^2)` となり、これでは TLE になっても無理はない。

`Array#insert` のような便利メソッドがない言語なら、計算量的に時間がかかりすぎるということにすぐ気付けるため、そもそもこれと同等の処理を行うアルゴリズムを実装しようとは思わないが、Ruby だとこれがすぐに書けてしまうので、ついうっかり使ってしまうのである。

さて、一応、計算量的にも問題ないアルゴリズムも紹介する。解法はいくつか存在するようだが、上記のコードに近い実装の一つとして、2 つの空配列を用意して、挿入位置の左側と右側に分けてそれぞれ要素を追加していく方法がある。このアルゴリズムの詳細な解説は [公式サイト](https://atcoder.jp/contests/abc237/editorial/3323) に上がっているのでこちらも参照してほしい。

このアルゴリズムで実装したコードがこちら。

```ruby
#!/usr/bin/env ruby

def main
  n = gets.to_i
  s = gets.chomp
  a = [0]
  l = []
  r = []

  for i in 0...n
    if s[i] == 'L'
      r.unshift(i)
    else
      l.push(i)
    end
  end

  puts "#{l.join(' ')} #{n} #{r.join(' ')}".strip
end

main
```

コード的には記述量が増えて最初に書いたコードほどスッキリはしていないが、こちらのコードであれば TLE にならずに解を求めることができる。

記述量が増えてスッキリしないと書いたが、それはそもそも `Array#insert` の中身を自分で書いていないからであって、もしこのメソッドのアルゴリズムも自前で書くことになったらきっとそのほうが複雑になるだろう。でも、そうとは感じさせないほど気軽に使えてしまうあたりが Ruby らしくもある。

また、この問題を解いたことにより、`Array#insert` は計算時間がかかるので、`Array#unshift` や `Array#push` が使えるならそちらを使おうという教訓が得られた。






# 便利なメソッドに頼りすぎて勉強にならない
これは先ほどの「計算量を気にせずに便利なメソッドを使ってしまう」と対比している。計算量的にも問題なく、かつシンプルに書けてしまうのだが、その書き方では競技プログラミングをしている意味がない気がする……、というようなことがまあまあある。

たとえば、[AtCoder Beginner Contest 237 の B 問題](https://atcoder.jp/contests/abc237/tasks/abc237_b)。与えられた行列の転置行列を求めるというものだ。

他の言語では 2 重ループで愚直に要素を入れ替えて転置行列を求める[^3]が、Ruby だと [`Array#transpose`](https://docs.ruby-lang.org/ja/latest/method/Array/i/transpose.html) というドンピシャなメソッドが存在する。これを使うと、以下のように書けてしまう。

[^3]: 他の言語にも転置行列を求めるメソッドやライブラリはあると思うが未調査。

```ruby
#!/usr/bin/env ruby

def main
  h, w = gets.split.map(&:to_i)
  a = []
  for i in 0...h
    a << gets.split.map(&:to_i)
  end

  a = a.transpose

  a.each do |b|
    puts b.join(' ')
  end
end

main
```

`main` メソッドの上のほうは入力値を変数に代入する処理で、下のほうは結果を出力する処理である。つまり、この問題の実質的なコードは `a = a.transpose` のたった 1 行のみとなってしまう。

このコードはもちろん正解だし、TLE にもならない。しかし、競技プログラミングをやって数学的な脳を養う、またはアルゴリズムを勉強するという観点でいうと本当にこれで良いんだろうか (いや良くない) という気持ちになる。









# さいごに
今後も Ruby で競技プログラミングを続けていこうと思っているので、また何か気づいたあるあるがあれば加筆する。
