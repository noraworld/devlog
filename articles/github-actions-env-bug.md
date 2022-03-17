---
title: "GitHub Actions の composite で環境変数をセットする方法"
emoji: "🐞"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHubActions", "GitHub", "env"]
published: true
order: 132
layout: article
---

# 問題点
GitHub Actions で環境変数を用意したいとする。

[ドキュメント](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs) には以下のように記述することで環境変数が設定できると書かれている。

```yaml
inputs:
  numOctocats:
    description: 'Number of Octocats'
    required: false
    default: '1'
  octocatEyeColor:
    description: 'Eye color of the Octocats'
    required: true
```

上記の YAML を定義すると `INPUT_NUMOCTOCATS` や `INPUT_OCTOCATEYECOLOR` という変数が使えるようになる[^1]、とのこと。

[^1]: 細かいルールは次のとおり。1. `INPUT_` という接頭辞がつく。2. すべて大文字に自動変換される。3. スペースは `_` に自動変換される。つまり今回の場合、`numOctocats` の部分が `NUMOCTOCATS` に変換され、先頭に `INPUT_` が付与され `INPUT_NUMOCTOCATS` となる。`octocatEyeColor` も同様。

しかし、残念ながらこれは [`composite`](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action) の場合は使えない。



# 解決策
[ここ](https://github.community/t/input-variable-name-is-not-available-in-composite-run-steps/127611/2) に書かれているとおり、`env` を使って自分で定義すると良いとのこと。

```yaml
inputs:
  numOctocats:
    description: 'Number of Octocats'
    required: false
    default: '1'
  octocatEyeColor:
    description: 'Eye color of the Octocats'
    required: true

runs:
  using: 'composite'
  steps:
    - run: echo ${INPUT_NUMOCTOCATS}, ${INPUT_OCTOCATEYECOLOR}
      shell: sh
      env:
        INPUT_NUMOCTOCATS: ${{ inputs.numOctocats }}
        INPUT_OCTOCATEYECOLOR: ${{ inputs.octocatEyeColor }}
```

これで環境変数 `INPUT_NUMOCTOCATS` と `INPUT_OCTOCATEYECOLOR` が使えるようになった。

ちなみにここでは `composite` ではない場合の自動生成と同じ環境変数名にしているが、同じにする必要は特にない。
