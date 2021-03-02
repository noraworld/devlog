---
title: "便利！ AtCoder で競技プログラミングをするときに重宝する AtCoder Tools のご紹介"
emoji: "🐈"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["AtCoder", "atcoder-tools", "AtCoderBeginnersSelection", "Python", "pip"]
published: false
order: 69
---

# はじめに
AtCoder の問題を解くとき、みなさんはどのようにプログラミングしていますか？ 基本的にはローカル環境のエディタでプログラムを書いて提出することになるかと思います。

問題を解いていると、こういった要望が出てきます。

- 一通りできた！ 問題文に載っている入力値でテストしたい！
- 1 つめの入力値は正しかったけど 2 つめ、3 つめはどうだろう？ 一つずつチェックするのはめんどくさい……
- プログラム完成したから提出しよう！ CLI からそのまま提出したい！

こんな要望を満たしてくれる CLI ツールが [AtCoder Tools](https://github.com/kyuridenamida/atcoder-tools) です。この記事ではインストールから基本的な使いかたまでを紹介します。

# 長い説明は良いからはやく使いたいんだけど？
_了。最低限の使いかただけ説明します。_

```shell
# インストール
$ pip install atcoder-tools

# 入出力値の一括ダウンロードとテンプレートからコードを生成
## abs はコンテスト ID
## --workspace でダウンロードするパスを指定
## --lang で自動生成するコードの言語を指定
## --without-login でログインせずにダウンロード
$ atcoder-tools gen abs --workspace=path/to/atcoder-workspace/ --lang=python --without-login

# 複数の入力値に対してまとめてテストを実行
$ cd path/to/program-location
$ atcoder-tools test

# プログラムの提出
$ atcoder-tools submit
```

# 環境
| 環境 | バージョン | インストール元 |
|---|---|---|
| AtCoder Tools | [1.1.7.1](https://github.com/noraworld/dotfiles/blob/a5f4ff63d6727c5ba6125f33eb5a625248c4057d/Pipfile.lock#L19-L25) | pipenv (pip) |
| pipenv | 2020.8.13 | pip |
| pip | 20.1.1 (python 3.8) | pyenv |
| Python | [3.8.5](https://github.com/noraworld/dotfiles/blob/a5f4ff63d6727c5ba6125f33eb5a625248c4057d/.python-version#L1) | pyenv |
| pyenv | 1.2.20-3-g58c776a1 | anyenv |
| anyenv | [1.1.1](https://github.com/noraworld/dotfiles/blob/a5f4ff63d6727c5ba6125f33eb5a625248c4057d/core/Brewfile.lock.json#L24-L48) | Homebrew |
| Homebrew | [2.4.9](https://github.com/noraworld/dotfiles/blob/a5f4ff63d6727c5ba6125f33eb5a625248c4057d/core/Brewfile.lock.json#L867) | n/a |
| macOS | [10.15.6](https://github.com/noraworld/dotfiles/blob/a5f4ff63d6727c5ba6125f33eb5a625248c4057d/core/Brewfile.lock.json#L872) | n/a |

# インストール方法
AtCoder Tools は Python で作られているツールです。pip を使ってインストールすることができます。Homebrew からインストールしたいところですがフォーミュラが用意されていないので今のところは pip を使ったインストール方法しかありません。

```shell
$ pip install atcoder-tools
```

または

```py:Pipfile
[[source]]
url = 'https://pypi.python.org/simple'
verify_ssl = true
name = 'pypi'

[requires]
python_version = '3.8'

[packages]
atcoder-tools = '*'
```
```shell
$ pip install pipenv # pipenv が未インストールの場合
$ pipenv install --system
```

## :warning: 注意点
AtCoder Tools は Python 3.5 以降でのみ動作が保証されているようです。そのため、インストールする際は pip 3 系 (Python 3 系) を使用する必要があります。

必要に応じて `pip` を `pip3` や `pip3.8` などに置き換える必要があります。以下のコマンドを実行して Python 3 系であることを事前に確認してください。

```shell
# 結果が Python 2 系だった場合は pip3 などを使用しましょう
$ pip --version
pip 20.1.1 from /Users/noraworld/.anyenv/envs/pyenv/versions/3.8.5/lib/python3.8/site-packages/pip (python 3.8)
```

また、インストール後はシェルを再起動する必要があるかもしれません。

```shell
$ exec -l $SHELL
```

# 入出力値を一括ダウンロードしたいとき
問題文に掲載されている入出力値をコピーしてファイルにペーストして……、とやっても良いですが、問題を解くごとに毎回やるのは面倒です。

AtCoder Tools を使えば以下のコマンドでコンテストの全問題の全入出力値を一括でダウンロードすることができます。

たとえば、AtCoder に登録したらまず最初にやるべきと言われている [AtCoder Beginners Selection](https://atcoder.jp/contests/abs) の問題全 11 問の全入出力値をダウンロードするには以下のコマンドを実行します。

```shell
$ atcoder-tools gen abs --workspace=path/to/atcoder-workspace/ --lang=python --without-login
```

すると `path/to/atcoder-workspace/` 以下にこのようにダウンロードされます。

<details><summary>ディレクトリツリー (クリックで展開)</summary><div>

```
.
├── ABC049C
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
├── ABC081A
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  └── out_2.txt
├── ABC081B
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
├── ABC083B
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
├── ABC085B
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
├── ABC085C
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── in_4.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  ├── out_3.txt
│  └── out_4.txt
├── ABC086A
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  └── out_2.txt
├── ABC086C
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
├── ABC087B
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
├── ABC088B
│  ├── in_1.txt
│  ├── in_2.txt
│  ├── in_3.txt
│  ├── main.py
│  ├── metadata.json
│  ├── out_1.txt
│  ├── out_2.txt
│  └── out_3.txt
└── PracticeA
   ├── in_1.txt
   ├── in_2.txt
   ├── main.py
   ├── metadata.json
   ├── out_1.txt
   └── out_2.txt
```

`in_*.txt` というファイルが入力値、`out_*.txt` というのが出力値です。`main.py` はテンプレートから自動生成されたコードです。
</div></details>

## 引数についての解説
`gen` サブコマンドを使用します。

続く `abs` はコンテスト名 (コンテスト ID) です。`https://atcoder.jp/contests/<CONTEST_ID>` の `<CONTEST_ID>` の部分です。

`--workspace` オプションでダウンロードするパスを指定します。

`--lang` でプログラミング言語を指定します。ここで指定した言語のテンプレートからコード (入力フォーマットなどを解析しているらしい) が自動生成されます。対応している言語は [ここ](https://github.com/kyuridenamida/atcoder-tools#atcoder-tools) をご覧ください。ぼくの大好きな Ruby はまだ対応していないみたい。残念！

`--without-login` をつけるとログインせずにダウンロードすることができます。つけないと ID とパスワードを求められます。ログインしなくてもダウンロードできる場合はつけておくと楽でしょう。

まとめるとこんな感じ。

| 引数 | 説明 | 省略時のデフォルト値 |
|---|---|---|
| `gen` | サブコマンド名 | (省略不可) |
| `abs` | コンテスト ID | (省略不可) |
| `--workspace` | ダウンロードするパス | `~/atcoder-workspace`
| `--lang` | 自動生成されるテンプレートコードの言語 | `cpp` (C++) |
| `--without-login` | ログインせずに使用する | `nil` (ログインを要求される) |

"[gen コマンドの --without-login をデフォルトにしたい #99](https://github.com/kyuridenamida/atcoder-tools/issues/99)" という issue が上がっているのでもしかしたら今後のバージョンで `--without-login` がデフォルトになるかもしれません。

## 毎回オプション指定するのめんどくさい……
`--workspace` や `--lang` などのオプションを毎回指定するのはめんどくさいと思います。

AtCoder Tools では、`~/.atcodertools.toml` に設定を書くことができ、オプションを省略することができます。

```toml:~/.atcodertools.toml
[codestyle]
workspace_dir='~/Workspace/competitive_programming/atcoder/'
lang='python'

[etc]
download_without_login=true
```

`--workspace` で指定するパスを `[codestyle]` の `workspace_dir` に、`--lang` で指定する言語を `[codestyle]` の `lang` に設定します。

`[etc]` に `download_without_login=true` を設定すれば `--without-login` を省略できるのかなと思ったのですが、省略できませんでした (ログインを要求されてしまいました)。使いかたが間違っているのか、あるいはバグなのかもしれません。

# 複数の入出力値でまとめてテストを行いたいとき
さて、入出力値は一通り揃いました。入力値をプログラムに与えて出力された結果と、正しい出力値を見比べる、ということをしたくなります。

AtCoder Tools を使わずに愚直にやるとこうなると思います。

```shell
$ cat in_1.txt | python main.py
# 出力結果が表示される

$ cat out_1.txt
# 先ほどの出力結果と同じか見比べる

$ cat in_2.txt | python main.py
# 2 つめのテストケースについても同様に

$ cat out_2.txt
# 同じ結果がチェック

$ cat in_3.txt | python main.py
# 3 つめも

$ cat out_3.txt
# チェック

# ... 以下同様
```

……めんどくさいですよね。

AtCoder Tools を使えばコマンド一つでまとめてチェックできます。

```shell
$ cd path/to/program-location # プログラムと入出力ファイルがあるディレクトリに移動
$ atcoder-tools test
# in_1.txt ... PASSED 163 ms
# in_2.txt ... PASSED 136 ms
# in_3.txt ... PASSED 130 ms
Passed all test cases!!!
```

とても便利ですね！

## 実行可能ファイルであれば非対応言語でも OK!
このコマンドでテストされるプログラムは実行権限のあるファイルです。

つまり、プログラムに shebang を設定して実行権限を与えれば、AtCoder Tools で対応していない言語 (たとえば Ruby) のプログラムでもテストできます！

```ruby:main.rb
#!/usr/bin/env ruby

# ↑ 1 行目に shebang をつけて
# プログラムを書く
```
```shell
# 実行権限を与える
$ chmod +x main.rb
```

言語が対応しているかどうかというのはあくまでテンプレートから生成されるコードのことであり、テストを実行する言語には特に制限がないようですね。

## オプションについて
カレントディレクトリ以外のディレクトリからテストを実行したい場合は `--dir` オプションをつけることで対応できます。

また、プログラム (実行権限のあるファイル) は自動検出されますが、ファイルが複数ある場合は自動的にどれかが選ばれます。複数プログラムがある場合に特定のプログラムを指定したい場合は `--exec` オプションをつければ良さそうな気がしますが、自分の環境では `FileNotFoundError` が発生してうまくいきませんでした。

# プログラムを CLI から提出したいとき
これに関してはまだ自分も使っていないので勘で書いています。間違っていたらすみません :bow:

さて、テストも通り、いよいよ提出！ プログラムをコピペして提出しても良いですが、AtCoder Tools にはプログラム提出機能が実装されています。これを使えば CLI から簡単にプログラムを提出することができます。

```shell
$ atcoder-tools submit
```

これだけです。

おそらく (というか `submit` コマンドに関しては確実に) ログインが必要だと思うので ID とパスワードを要求されたら AtCoder の ID とパスワードを入力します。

# もっと詳しいことが知りたい！
[README](https://github.com/kyuridenamida/atcoder-tools/blob/4db78505e97522619be9c2564eba80ac1fc46e2a/README.md) をご覧ください。日本語で書かれているので英語苦手な方でも大丈夫です。

# さいごに
自分はまだ AtCoder (競プロ) 歴 2 日[^1]なんですが、このツールは絶対あったほうが便利だとすぐにわかったので速攻でインストールしました。

[^1]: 「2 日」なので「不束者」です[^2]。

[^2]: え？

自分は今のところ Ruby で問題を解いているのでコード生成が Ruby に対応していなかったり、ところどころオプションや設定が使えなかったりなどの問題はありますが、これらも徐々に改善されていくでしょう。

(ちなみに Ruby に対応する PR を送ろうと思ったのですが、Python 初心者 & ライブラリの contribute 経験がほぼないので挫折しました……w)。
