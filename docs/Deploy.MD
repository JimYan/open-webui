# 系统部署文档

本文是Conda + PM2 + LLMLite + Open WEB UI + Postgresql部署一个可以借助微软云（https://oai.azure.com/）打造的私有化部署的ChatAGI。

## Conda

> Python 虚拟环境工具

### Install

```bash
wget "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
source ~/.bashrc
```

### 创建环境 & 激活环境

```bash
conda env list # 查看环境列表。
conda create -n ai python=3.9 # 创建 AI 环境
conda activate ai # 切换到 AI 环境
conda deactivate # 退出 AI 环境
```

## PM2 & Nodejs

> NodeJS环境，用来执行 PM2 和 build。

### Install

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install v20
nvm use v20
npm install pm2 -g
```

## LLMLite Proxy

### Install

```bash
# 创建环境
conda create -n litellm-proxy-env python=3.11
conda activate litellm-proxy-env
pip install 'litellm[proxy]'
```

### Useage

```bash
conda activate litellm-proxy-env
litellm --config litellm/litellm.yaml # 单次执行
pm2 start pm2.config.js --only litellm # 通过 PM2 启动常驻任务
pm2 restart litellm # 重启litellm
```

## Open Web UI

> 查看教程：https://docs.openwebui.com/getting-started/

### Install

```bash
cp -RPp .env.example .env

npm install # 安装依赖
npm run build # 编译前端静态页面。

cd ./backend
conda create -n open-webui-env python=3.11
conda activate open-webui-env
pip install -r requirements.txt -U
```

### Useage

```bash
cd backend
conda activate open-webui-env
sh dev.sh  本地调试

pm2 start pm2.config.js --only openWebUI

```

### Nginx Configure

```text
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"'
                      '"$upstream_response_time" "$upstream_status" "$upstream_addr"';
    upstream ai {
        server 127.0.0.1:8080;
    }
    server {
        listen 80;
        server_name ai.web302.com;
        rewrite ^(.*)$ https://$host$1 permanent;
    }
    server {
        listen 443;
        server_name ai.web302.com;
        ssl on;
        ssl_certificate  /path/to/ai.web302.com_bundle.pem;
        ssl_certificate_key /path/to/ai.web302.com.key;

        access_log /var/log/nginx/access.log main;
        error_log /var/log/nginx/error.log;
        location / {
                root  /data/workspace/open-webui/build;
                try_files $uri $uri /index.html;
        }
        location /cache/ {
                alias /data/workspace/open-webui/backend/data/cache/;
        }

        location /stable-diffusion {
                proxy_pass http://127.0.0.1:7860/;
        }

        location /api {
                proxy_pass http://ai/api;
        }
        location /ollama {
                proxy_pass http://ai/ollama;
        }
        location /images/api {
                proxy_pass http://ai/images/api;
        }

        location /rag/api {
                proxy_pass http://ai/rag/api;
        }
        location /audio/api {
                proxy_pass http://ai/audio/api;
        }
        location /openai {
                proxy_pass http://ai/openai;
        }

        location /ws/socket.io/ {
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header Host $host;

                proxy_pass http://ai;

                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
        }
    }

```

需要修改以上`server_name`和 location中`/`和`/cache`的相关信息。

## Postgresql

在 Open WEBUI 中，默认使用本地的sqlite存储相关数据，可以使用 Postgresql代替做分布式部署和应用。

### Install

```bash
sudo apt-get install postgresql postgresql-contrib
# 查看状态
sudo systemctl status postgresql
```

### Useage

**设置可以远程访问：**

1. 修改配置文件`/etc/postgresql/14/main/postgresql.conf`，新增或者修改 `listen_addresses = '*'`
2. 修改配置文件`/etc/postgresql/14/main/pg_hba.conf`，新增 `host all all 0.0.0.0/0 md5`

**常用命令:**

```bash
# 超级用户进入psql
sudo -u postgres psql
# 创建用户
CREATE USER username WITH PASSWORD 'password';
# 授权用户
GRANT ALL PRIVILEGES ON DATABASE dbname TO username;

# 普通用户连接到psql
psql -h 127.0.0.1 -U username -W -d dbname

# 常用命令
\c # 查看当前用户的连接的 db 和用户。
\l # 查看数据库列表
\d # 查看当前数据库中表列表
\d tablename # 查看数据表字段结构
```

## 参考资料

- postgresql https://www.cnblogs.com/hellojesson/p/12109312.html
- postgresql https://www.sjkjc.com/postgresql/create-table/
