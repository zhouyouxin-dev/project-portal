# 竞赛获奖项目库

学科竞赛获奖项目的收录与展示平台：逐项保留立项背景、技术方案、参与人员，以及完整的答辩材料（演示 PPT 与视频）。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| 后端 | Java 17+ / Spring Boot 3.5（Web / Data JPA / Security / Validation） |
| 数据库 | H2（文件模式，零安装；生产可切换 MySQL） |
| 认证 | JWT + HttpOnly Cookie（Spring Security） |
| 文件存储 | 本地上传目录；图片走静态映射，材料走受控接口 |

## 功能

- **项目目录**：按赛道分组的图片卡片网格，每张卡片直出封面、奖项徽章、年份、摘要与技术标签；无封面时自动生成赛道占位图
- **多维检索**：赛事级别 / 获奖等级 / 年份 / 赛道 / 标签组合筛选 + 关键词搜索（覆盖项目名、摘要、成员、指导教师），由后端执行，URL 参数驱动可分享
- **一项目多奖项**：同一项目可挂多条获奖记录（如省赛一等奖 + 国赛二等奖），详情页以徽章与表格呈现，按级别与等级高低排序
- **答辩材料**：演示 PPT ≤100MB、演示视频 ≤300MB，视频支持在线播放与进度拖拽，其余格式提供下载
- **项目详情**：封面大图 + 信息栏（奖项徽章 / 成员 / 指导教师 / 单位 / 摘要 / 关键词），Markdown 正文渲染与目录导航
- **管理后台**：登录鉴权、项目增删改查、获奖记录编辑、材料上传（带进度与中断）、封面上传、Markdown 编辑带预览、草稿/发布可见性控制、排序权重
- **标签管理**：统一维护技术关键词，跨项目聚合
- **预置示例数据**：首次启动自动写入 6 个示例项目（含 1 个草稿、2 个多奖项项目）

## 界面设计

现代产品风，以图片卡片为主角：

- **中性灰阶为主色**：按钮、文字、边框全部无彩色，层级靠明度、圆角与柔和阴影表达
- **唯一的彩色留给奖项徽章**：特等奖 / 一等奖 = 金、二等奖 = 银、三等奖 = 铜、优秀奖 = 灰。颜色是稀缺资源，只在最需要区分的地方出现
- **每个项目都有图**：首页按赛道分组，组内为响应式卡片网格（手机 1 列 / 平板 2 列 / 桌面 3 列），封面图左上角叠加奖项徽章、右上角年份；无封面时按赛道生成柔和渐变 + 赛道图标占位，卡片高度始终一致
- **系统无衬线字体**：不加载外部字体，首屏无字体闪烁
- **深色模式**：右上角一键切换，卡片阴影在深色下由边框亮度补偿

配色令牌集中在 `client/src/index.css`（灰阶 + 奖牌色 + 占位渐变），字号与阴影层级在 `client/tailwind.config.js`；赛道色相与奖牌映射在 `client/src/types/index.ts`。

## 快速开始

### 1. 启动后端（端口 8080）

```bash
cd server
mvn spring-boot:run
```

默认以 `dev` profile 运行，首次启动会自动建表并写入示例数据；数据库文件位于 `server/data/portal.mv.db`。

H2 控制台：http://localhost:8080/h2-console （JDBC URL: `jdbc:h2:file:./data/portal`，用户名 `sa`，密码空）

> 控制台仅在 `dev` profile 下开启，且安全层限制**只有服务器本机**能访问。

### 2. 启动前端（端口 5173）

```bash
cd client
npm install
npm run dev
```

访问 http://localhost:5173 ，开发模式下 `/api` 与 `/uploads` 会自动代理到后端。

### 3. 登录管理后台

- 入口：首页右上角「管理」，或直接访问 http://localhost:5173/admin
- 开发默认账号：`admin` / `admin123`（该提示只出现在开发构建中）

> 新建项目时「项目材料」区不可用 —— 附件需要归属到已存在的项目。保存后页面会自动留在编辑页，此时即可上传 PPT 与视频。

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | 运行 profile，**生产必须设为 `prod`** | dev |
| `ADMIN_USERNAME` | 管理员用户名 | admin |
| `ADMIN_PASSWORD` | 管理员密码（支持 BCrypt 哈希，即以 `$2` 开头的值） | admin123 |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符）。**prod 下无默认值，未设置直接启动失败** | dev 有开发默认值 |
| `CORS_ALLOWED_ORIGINS` | 允许的跨域来源，逗号分隔 | http://localhost:5173,http://127.0.0.1:5173 |
| `COOKIE_SECURE` | 认证 Cookie 是否只走 HTTPS | dev: false / prod: true |
| `COOKIE_SAME_SITE` | Cookie SameSite 策略 | Lax |
| `LOGIN_MAX_ATTEMPTS` | 登录失败几次后锁定 | 5 |
| `LOGIN_LOCKOUT_MINUTES` | 锁定时长（分钟） | 15 |
| `UPLOAD_DIR` | 上传文件目录 | ./uploads |
| `DB_URL` / `DB_DRIVER` / `DB_USERNAME` / `DB_PASSWORD` | 数据源，用于切换 MySQL | H2 文件库 |

## 文件上传设计

大文件链路上有几处不显眼但会真出问题的地方，改配置前先读这一节。

**分级限额**。`spring.servlet.multipart.max-file-size` 是**全局唯一**的一个值，为放行 300MB 视频已放宽到 320MB。因此各类文件的真实上限都在应用层自己守：

| 类型 | 上限 | 守在哪 |
|---|---|---|
| 封面图 / 证书 | 5MB | `UploadController.MAX_SIZE` |
| 演示 PPT / 文档 | 100MB | `AttachmentService.MAX_SIZE` |
| 演示视频 | 300MB | 同上 |

**`file-size-threshold: 0`**：任何大小都直接写临时文件，不在堆里缓冲，并发上传大视频时内存不会被顶爆。

**临时目录同盘**。`MultipartConfig` 把 multipart 临时目录改到 `<upload-dir>-tmp`（上传目录的同级旁路）。两个原因：落盘用 `transferTo(File)`，同盘时是一次 rename，跨盘则退化成逐字节复制；而临时目录若放在 `uploads/` **里面**，会被 `/uploads/**` 静态映射一起暴露出去。

**`server.tomcat.max-swallow-size: -1`**：上传超限被拒时，Tomcat 默认只吞掉 2MB 剩余请求体就断连，300MB 的视频会让浏览器收到 RST 而非我们返回的 400 提示。

**上传进度**用 `XMLHttpRequest` 而非 `fetch` —— fetch 至今没有可用的上传进度事件。

**格式校验是双重的**：魔数决定「是不是这个容器族」，扩展名决定「记成哪种格式」。因为 pptx / docx / xlsx 都是 ZIP 容器、头四字节完全相同，单靠魔数分不出来；而伪装成 `.pptx` 的 mp4 会在魔数这关被挡下。落盘名始终由服务端用 UUID 重新生成。

### 安全设计要点

- **H2 控制台**：`prod` profile 下配置层关闭 + 安全层 `denyAll` 双重拦截；`dev` 下也只允许回环地址访问
- **认证 Cookie**：`HttpOnly`（XSS 拿不到）+ `SameSite=Lax`（跨站 POST 不携带，阻断 CSRF）+ 生产 `Secure`
- **登录限流**：同一 IP 连续失败达阈值后锁定，阻断在线爆破；密码比对为恒定时间，不泄露时序差异
- **启动自检**：`prod` 下若仍使用默认密码或开发 JWT 密钥，服务拒绝启动
- **材料访问控制**：附件不走公开的 `/uploads/**`，而是经 `/api/files/{id}`；所属项目为草稿时要求已登录，且返回 **404 而非 403** —— 不泄露资源是否存在
- **磁盘清理**：删除附件或项目时，磁盘文件在**事务提交后**才删（提交前删，万一回滚就成了「记录还在、文件没了」）；删除失败只记日志不阻断操作
- **Markdown 正文**：`marked` 渲染后经 `DOMPurify` 消毒，外链自动加 `rel="noopener noreferrer"`

## 部署到服务器

### 打包

```bash
# 后端：生成可执行 jar
cd server && mvn clean package -DskipTests

# 前端：生成静态文件
cd client && npm run build
```

### 运行

```bash
SPRING_PROFILES_ACTIVE=prod \
ADMIN_PASSWORD='强密码' \
JWT_SECRET="$(openssl rand -base64 48)" \
CORS_ALLOWED_ORIGINS=https://你的域名 \
java -jar server/target/project-portal-server-1.0.0.jar
```

### 前端托管：两种方式

**方式一 · 交给 Spring Boot 统一托管（最省事）**

把 `client/dist` 的内容放进 jar 的 `static` 目录即可。后端已内置 history 回退，直接访问 `/project/xxx` 或刷新都不会 404。

**方式二 · Nginx 托管**

必须配置 SPA history 回退，否则深层路由刷新会 404；另外**必须放宽 `client_max_body_size`**，否则 300MB 视频会被 Nginx 在到达后端前就拒掉：

```nginx
server {
    listen 80;
    server_name 你的域名;
    root /var/www/portal;          # client/dist 的内容

    location / {
        try_files $uri $uri/ /index.html;   # ← SPA 回退，不可省略
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # ← 登录限流按真实 IP、Cookie Secure 判定依赖它

        client_max_body_size 320m;    # ← 视频上传，不可省略
        proxy_request_buffering off;  # ← 边收边转，避免 Nginx 先把 300MB 落到自己的临时盘
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

### 切换 MySQL（可选）

无需改代码，注入环境变量即可：

```bash
DB_URL='jdbc:mysql://localhost:3306/portal?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai' \
DB_DRIVER=com.mysql.cj.jdbc.Driver \
DB_USERNAME=用户名 \
DB_PASSWORD=密码 \
java -jar ...
```

并在 `pom.xml` 中加入 MySQL 驱动依赖。

## 目录结构

```
├── server/                 # Spring Boot 后端
│   └── src/main/java/com/portal/
│       ├── config/         # 安全、CORS、静态资源、multipart、启动自检、示例数据
│       ├── controller/     # REST API（公开 + admin + 文件读取）
│       ├── service/        # 业务逻辑（项目、附件、认证）
│       ├── repository/     # JPA 数据访问
│       ├── entity/         # Project / Award / Attachment / Tag 实体
│       ├── dto/            # 请求/响应 DTO
│       └── common/         # JWT、登录限流、文件类型判定、异常处理
├── client/                 # React 前端
│   └── src/
│       ├── pages/          # 首页 / 详情 / admin 后台
│       ├── components/     # Navbar / Footer / ProjectCard / CoverImage / AwardBadge / TagChip / FilterBar / AwardTable / AttachmentList / ui
│       ├── lib/            # api 客户端（含 XHR 上传）、Markdown 渲染
│       ├── hooks/          # use-debounce 等
│       ├── types/          # 类型定义、展示映射、赛道色相与奖牌色
│       └── index.css       # 设计令牌（灰阶 / 奖牌色 / 占位渐变 / Markdown 排版）
└── README.md
```

## 数据模型要点

- `Project` ─┬─ `@OneToMany` → `Award`（获奖记录，`orphanRemoval`，编辑时整组重建）
  　　　　　  ├─ `@OneToMany` → `Attachment`（材料，即时上传，单独增删）
  　　　　　  └─ `@ManyToMany` → `Tag`
- `awards` / `attachments` 刻意**不做 fetch join**：`tags` 已占用唯一一个 fetch join 名额，再并上两个集合就是三重笛卡尔积。改用 `@BatchSize(32)`，列表页 N 个项目只多两条 IN 查询
- 按 `level` / `grade` 筛选要 join `awards`，一个项目有多条记录就会命中多行。这里**不能**用 `query.distinct(true)`（`content` 是 CLOB，H2 会在 `SELECT DISTINCT` 上报错），改在 `ProjectService.toSummaries` 里按 id 去重
- `level` 与 `grade` 同时给出时共用**一个** join，语义是「同一条获奖记录既是国家级又是一等奖」；分开 join 会变成「有国家级的奖，且有某个一等奖」

## REST API 摘要

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/login` | 登录（下发 HttpOnly Cookie） | - |
| POST | `/api/auth/logout` | 退出登录 | - |
| GET | `/api/auth/me` | 当前用户（未登录返回 401） | - |
| GET | `/api/projects` | 公开项目列表（type/status/year/tag/level/grade/q 筛选） | - |
| GET | `/api/projects/facets` | 筛选候选项与总览统计 | - |
| GET | `/api/projects/{slug}` | 项目详情 | - |
| GET | `/api/files/{id}` | 材料播放/预览（支持 Range → 206） | 草稿项目需登录 |
| GET | `/api/files/{id}?download=1` | 材料下载（带原始文件名） | 同上 |
| GET/POST | `/api/admin/projects` | 项目列表 / 新建 | 需登录 |
| PUT/DELETE | `/api/admin/projects/{id}` | 更新 / 删除（连带清理材料文件） | 需登录 |
| GET/POST/PUT/DELETE | `/api/admin/tags` | 标签管理 | 需登录 |
| POST | `/api/admin/upload` | 图片上传（jpg/png/webp ≤5MB，按文件头校验） | 需登录 |
| POST | `/api/admin/attachments` | 材料上传（projectId + kind + file） | 需登录 |
| DELETE | `/api/admin/attachments/{id}` | 删除材料（连带删磁盘文件） | 需登录 |

## 后续迭代方向

- 数据看板：获奖级别分布、年度趋势、赛道对比
- PPT 在线预览（需服务端转 PDF，会引入 LibreOffice 依赖）
- 获奖证书图片的集中浏览
- 批量导入（Excel 台账 → 项目条目）
- 项目列表分页（当前一次返回全部，数百条内够用）
