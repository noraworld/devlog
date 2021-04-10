---
title: "Docker で binding.pry などの標準入力を \"簡単に\" 行う方法"
emoji: "🐳"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Docker", "ShellScript"]
published: true
order: 87
layout: article
---

# はじめに
Docker でアプリケーションのコンテナを起動中に `binding.pry` などのデバッガ (標準入力) を受け付けるようにする方法は調べるとすぐに出てきます。

```diff:docker-compose.yml
+ stdin_open: true
+ tty: true
```

```shell:shell
$ docker-compose up -d
$ docker ps                    # loop up the corresponding container ID
$ docker attach <CONTAINER_ID>
```

https://qiita.com/hb5kz/items/7c9d266480079910de5c

しかし、毎回コンテナ ID を調べるのは面倒なので、上記 3 つのコマンドを一発で実行するスクリプトを作ったので紹介します。

# スクリプトの設置
以下のスクリプトを `docker-server` というファイル名で保存し、パスが通っている場所に置きます。

```shell:docker-server
#!/bin/sh

docker-compose up -d
echo

# this must be executed after "docker-compose up -d"
# avoid making "docker ps" executed over and over again
DOCKER_PS=$(docker ps)

select_container() {
  echo "$DOCKER_PS" | fzf --tac --exact --no-sort | awk '{print $1}'
}

if [ -n "$1" ]; then
  if [ "$(echo "$DOCKER_PS" | awk '{print $2}' | grep -c $1)" -eq 0 ]; then
    echo "No such container"
    echo "Select a container manually after a few seconds..."
    echo
    sleep 2
    container_id=$(select_container $1)
  elif [ "$(echo "$DOCKER_PS" | awk '{print $2}' | grep -c $1)" -ge 2 ]; then
    echo "Too many containers found"
    echo "Select a container manually after a few seconds..."
    echo
    sleep 2
    container_id=$(select_container $1)
  else
    while read line
    do
      image=$(echo $line | awk '{print $2}' | grep $1)

      if [ -n "$image" ]; then
        container_id=$(echo $line | awk '{print $1}')
      fi
    done <<< "$(echo "$DOCKER_PS")"
  fi
else
  container_id=$(select_container $1)
fi

if [ -z "$container_id" ]; then
  echo "Canceled" >&2
  exit 1
elif [[ ! "$container_id" =~ ^[0-9a-f]+$ ]]; then
  echo "Error: Invalid container ID" >&2
  exit 2
fi

echo "Selected container info:"
echo "$DOCKER_PS" | head -1
echo "$DOCKER_PS" | grep $container_id
echo
echo "Attaching container $container_id"
echo

docker attach $container_id
```

https://github.com/noraworld/dotfiles/blob/cc2b8d8dc223f52dab7a5a16094031d68720802e/bin/src/general/docker-server

上記スクリプトに実行権限を与えます。

```shell:shell
$ chmod +x /path/to/docker-server
```

# 使い方
使い方は簡単です。

```shell:shell
$ docker-server
```

引数を与えなければ、fzf が起動し、Docker のコンテナ一覧が表示されます。アプリケーションのコンテナを選択し、エンターを押すと、そのコンテナを attach できます。

⚠ 事前に fzf のインストールが必要です。以下でインストールできます。

```shell:shell
$ brew install fzf        # macOS
$ sudo apt -y install fzf # Ubuntu
```

```shell:shell
$ docker-server app
```

引数としてイメージの名前の一部を与えて、一意にコンテナが定まれば fzf での選択を省略できます。上記の例ではイメージの名前に `app` が含まれていることを想定しています。

`Dockerfile` や `docker-compose.yml` の中身を編集しない限りはイメージ名が変わることはないと思うので、特定のプロジェクトで使用する場合はイメージ名さえ覚えておけば毎回コンテナを選択する必要もありません。

# コンテナの終了と detach
コンテナを終了する場合は `Ctrl+C` を押します。

コンテナを終了させずに、attach した Docker のコンテナから抜けたい場合 (detach したい場合) は、`Ctrl+P` を押した後、`Ctrl+Q` を押します。

あとでまた使う場合は `Ctrl+P` + `Ctrl+Q` で detach し、しばらく使わない場合は `Ctrl+C` でコンテナを終了させておくと良いでしょう。

# さいごに
これで Docker コンテナを起動するときにいちいちコンテナ名を調べなくても attach できるようになりました。

開発中は `binding.pry` などのデバッガをよく使うと思うので、基本的には `docker-compose up` ではなく `docker-server` を使うようにします。
