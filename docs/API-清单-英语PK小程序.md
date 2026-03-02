# 英语PK小程序 接口清单 v1

## 1. 接口规范
- Base URL：`/api/v1`
- 认证方式：
  - 小程序端：`Authorization: Bearer <token>`
  - 后台端：`Authorization: Bearer <admin_token>`
- 响应格式：
```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```
- 幂等约定：涉及支付、积分、结算接口必须传 `Idempotency-Key`。
- 时间格式：ISO8601（UTC+8）。

## 2. 通用错误码
- `0`：成功
- `40001`：参数错误
- `40003`：鉴权失败
- `40009`：权限不足
- `41001`：豆豆余额不足
- `41002`：等级不匹配
- `42001`：订单状态非法
- `42002`：幂等冲突
- `50000`：系统异常

## 3. 小程序端 API

### 3.1 认证与用户
1. `POST /auth/wx-login`
- 说明：微信登录换取业务 token。
- 请求：`code`
- 响应：`token`, `user_id`, `is_new_user`

1. `GET /user/profile`
- 说明：获取个人主页信息。
- 响应：`nickname`, `avatar`, `current_level`, `bean_balance`, `vip_status`

1. `PATCH /user/settings`
- 说明：更新用户设置。
- 请求：`audio_enabled`, `locale`

### 3.2 内容与学习
1. `GET /learning/current-level`
- 说明：获取当前等级及20句内容。
- 响应：`level`, `sentences[]`, `progress`

1. `POST /learning/progress`
- 说明：上报句子学习进度。
- 请求：`sentence_id`, `is_completed`, `mastery_score`

1. `POST /learning/complete-level`
- 说明：提交本级完成，触发升级判定。
- 响应：`old_level`, `new_level`, `upgraded`

### 3.3 测评与互评
1. `POST /assessment/start`
- 说明：初始化测评试卷。
- 响应：`assessment_id`, `questions[]`

1. `POST /assessment/submit`
- 说明：提交测评答案并返回建议等级。
- 请求：`assessment_id`, `answers[]`
- 响应：`score`, `suggested_level`, `confirmed_level`

1. `POST /reviews`
- 说明：对1-2级句子评分（3级及以上）。
- 请求：`sentence_id`, `score(1-5)`, `comment`

1. `GET /reviews/stat`
- 说明：查看句子社区评分统计。
- 请求：`sentence_id`
- 响应：`avg_score`, `review_count`

### 3.4 PK对战
1. `POST /pk/match/join`
- 说明：加入同级匹配队列。
- 请求：`level`（可选，不传默认当前等级）
- 前置：余额校验、等级校验。
- 响应：`match_ticket`, `queue_no`

1. `GET /pk/match/status`
- 说明：查询匹配状态。
- 请求：`match_ticket`
- 响应：`status`, `battle_id`

1. `GET /pk/battles/{battle_id}`
- 说明：获取对战基础信息和题目。
- 响应：`battle_meta`, `questions[]`, `remain_sec`

1. `POST /pk/battles/{battle_id}/answer`
- 说明：提交单题答案。
- 请求：`round_no`, `sentence_id`, `answer`

1. `POST /pk/battles/{battle_id}/finish`
- 说明：结束对战并触发结算。
- 请求头：`Idempotency-Key`
- 响应：`result`, `my_score`, `bean_change`

1. `GET /pk/history`
- 说明：查询用户战绩。
- 响应：`items[]`（胜负、得分、奖励）

### 3.5 豆豆系统
1. `GET /beans/wallet`
- 说明：查询钱包余额。
- 响应：`balance`, `frozen_balance`

1. `GET /beans/ledger`
- 说明：查询豆豆流水。
- 请求：`page`, `page_size`, `biz_type`

1. `POST /beans/sign-in`
- 说明：每日签到领豆。
- 请求头：`Idempotency-Key`
- 响应：`reward_bean`, `signed_today`

1. `POST /beans/ad-reward`
- 说明：广告激励发豆。
- 请求：`ad_unit_id`, `trace_id`
- 请求头：`Idempotency-Key`

### 3.6 商城与背包
1. `GET /shop/items`
- 说明：获取在售商品（固定10位）。

1. `POST /shop/orders`
- 说明：创建订单（豆豆或微信支付）。
- 请求：`item_id`, `pay_channel(bean|wxpay)`
- 请求头：`Idempotency-Key`
- 响应：`order_no`, `pay_info`

1. `GET /shop/orders/{order_no}`
- 说明：查询订单状态。
- 响应：`order_status`, `paid_at`, `item_granted`

1. `GET /inventory/items`
- 说明：查询我的道具。

1. `POST /inventory/equip`
- 说明：装备道具。
- 请求：`inventory_id`

### 3.7 会员
1. `GET /vip/plans`
- 说明：获取会员方案。

1. `POST /vip/subscribe`
- 说明：发起会员订阅下单。
- 请求：`plan_id`, `auto_renew`
- 请求头：`Idempotency-Key`
- 响应：`order_no`, `pay_info`

1. `GET /vip/status`
- 说明：查询会员状态与权益。
- 响应：`vip_status`, `start_at`, `end_at`, `entitlements[]`

## 4. 支付回调 API
1. `POST /pay/wx/callback`
- 说明：微信支付回调通知。
- 要求：验签、幂等、可重试。
- 返回：微信要求的成功应答。

## 5. 后台管理 API

### 5.1 后台认证
1. `POST /admin/auth/login`
- 请求：`username`, `password`
- 响应：`admin_token`, `role_code`

### 5.2 内容管理
1. `GET /admin/content/sentences`
1. `POST /admin/content/sentences`
1. `PUT /admin/content/sentences/{id}`
1. `DELETE /admin/content/sentences/{id}`
1. `POST /admin/content/sentences/import`（CSV/Excel）

### 5.3 商城管理
1. `GET /admin/shop/items`
1. `POST /admin/shop/items`
1. `PUT /admin/shop/items/{id}`
1. `POST /admin/shop/items/{id}/publish`
1. `POST /admin/shop/items/{id}/unpublish`

### 5.4 数据看板
1. `GET /admin/stats/overview`
- 响应：`total_users`, `dau`, `pay_amount`, `ad_revenue`, `pk_count`

1. `GET /admin/stats/users`
1. `GET /admin/stats/payments`
1. `GET /admin/stats/ads`

### 5.5 运营与审计
1. `GET /admin/operation-logs`
1. `GET /admin/reviews/pending`
1. `POST /admin/reviews/{id}/approve`
1. `POST /admin/reviews/{id}/reject`

## 6. 状态机约定（接口联动）
- 订单状态：`CREATED -> PAID -> FULFILLED -> CLOSED`
- PK状态：`MATCHING -> READY -> PLAYING -> SETTLED -> CLOSED`
- 会员状态：`INACTIVE -> ACTIVE -> EXPIRED -> CANCELED`

## 7. 安全与风控要求
- 所有写接口需服务端二次鉴权，不信任客户端等级与余额。
- 支付、签到、广告奖励、PK结算接口强制幂等键。
- 后台接口按角色鉴权，关键改动必须记录 `operation_log`。

## 8. 与PRD/ER对齐检查项
- `learning/complete-level` 必须同步更新 `user` 与 `user_level_progress`。
- `pk/battles/{id}/finish` 必须落 `pk_battle_player + bean_ledger + bean_wallet`。
- `shop/orders` 与 `/pay/wx/callback` 必须以 `order_no` + `transaction_id` 做幂等。
