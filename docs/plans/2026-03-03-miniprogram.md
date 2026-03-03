# 小程序集成指南

**文件**:
- `miniprogram/app.ts`
- `miniprogram/pages/login/login.wxml`
- `miniprogram/pages/login/login.ts`
- `miniprogram/pages/learning/learning.wxml`
- `miniprogram/pages/learning/learning.ts`
- `miniprogram/pages/profile/profile.wxml`
- `miniprogram/pages/profile/profile.ts`
- `miniprogram/utils/api.ts`
- `miniprogram/utils/storage.ts`

---

## 1. API 工具函数

**文件**: `miniprogram/utils/api.ts`

```typescript
// 后端 API 基础 URL
const API_BASE_URL = 'https://your-domain.com/api/v1'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * 发送 HTTP 请求
 */
export function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  url: string,
  data?: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')

    const header: any = {
      'Content-Type': 'application/json',
    }

    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res: any) => {
        const response = res.data as ApiResponse<T>

        if (response.code === 0) {
          resolve(response.data)
        } else if (response.code === 40003) {
          // Token 过期，清除并跳转到登录
          wx.removeStorageSync('token')
          wx.removeStorageSync('userId')
          wx.navigateTo({ url: '/pages/login/login' })
          reject(new Error('Unauthorized'))
        } else {
          reject(new Error(response.message))
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}

/**
 * 微信登录
 */
export async function wxLogin(): Promise<{
  token: string
  userId: string
  isNewUser: boolean
}> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            const result = await request<any>('POST', '/auth/wx-login', {
              code: res.code,
            })
            resolve(result)
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error('Failed to get login code'))
        }
      },
      fail: reject,
    })
  })
}

/**
 * 获取用户信息
 */
export function getUserProfile(): Promise<any> {
  return request('GET', '/user/profile')
}

/**
 * 获取当前等级内容
 */
export function getCurrentLevelContent(): Promise<any> {
  return request('GET', '/learning/current-level')
}

/**
 * 记录学习进度
 */
export function recordProgress(sentenceId: string, masteryScore: number): Promise<any> {
  return request('POST', '/learning/progress', {
    sentenceId,
    masteryScore,
  })
}

/**
 * 完成等级
 */
export function completeLevel(): Promise<any> {
  return request('POST', '/learning/complete-level')
}

/**
 * 开始测评
 */
export function startAssessment(): Promise<any> {
  return request('POST', '/assessment/start')
}

/**
 * 提交测评
 */
export function submitAssessment(answers: any[]): Promise<any> {
  return request('POST', '/assessment/submit', { answers })
}
```

---

## 2. 本地存储工具

**文件**: `miniprogram/utils/storage.ts`

```typescript
/**
 * 保存 token
 */
export function saveToken(token: string): void {
  wx.setStorageSync('token', token)
}

/**
 * 获取 token
 */
export function getToken(): string | null {
  return wx.getStorageSync('token') || null
}

/**
 * 清除 token
 */
export function clearToken(): void {
  wx.removeStorageSync('token')
}

/**
 * 保存用户 ID
 */
export function saveUserId(userId: string): void {
  wx.setStorageSync('userId', userId)
}

/**
 * 获取用户 ID
 */
export function getUserId(): string | null {
  return wx.getStorageSync('userId') || null
}

/**
 * 保存用户信息
 */
export function saveUserInfo(userInfo: any): void {
  wx.setStorageSync('userInfo', JSON.stringify(userInfo))
}

/**
 * 获取用户信息
 */
export function getUserInfo(): any {
  const data = wx.getStorageSync('userInfo')
  return data ? JSON.parse(data) : null
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * 清除所有数据
 */
export function clearAll(): void {
  wx.clearStorageSync()
}
```

---

## 3. 应用入口

**文件**: `miniprogram/app.ts`

```typescript
import { getToken } from './utils/storage'

App({
  onLaunch() {
    // 检查登录状态
    const token = getToken()

    if (!token) {
      // 未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login',
      })
    }
  },

  globalData: {
    userInfo: null,
  },
})
```

---

## 4. 登录页面

**文件**: `miniprogram/pages/login/login.wxml`

```xml
<view class="container">
  <view class="header">
    <text class="title">英语PK小程序</text>
    <text class="subtitle">学习 · 对战 · 成长</text>
  </view>

  <view class="content">
    <image class="logo" src="/images/logo.png"></image>
    <text class="welcome">欢迎来到英语学习平台</text>
  </view>

  <view class="footer">
    <button
      class="login-btn"
      type="primary"
      loading="{{loading}}"
      bindtap="handleLogin"
    >
      微信登录
    </button>
    <text class="tips">点击登录即表示同意《用户协议》和《隐私政策》</text>
  </view>
</view>
```

**文件**: `miniprogram/pages/login/login.ts`

```typescript
import { wxLogin } from '../../utils/api'
import { saveToken, saveUserId } from '../../utils/storage'

Page({
  data: {
    loading: false,
  },

  async handleLogin() {
    this.setData({ loading: true })

    try {
      const result = await wxLogin()

      // 保存 token 和 userId
      saveToken(result.token)
      saveUserId(result.userId)

      // 如果是新用户，跳转到测评页面
      if (result.isNewUser) {
        wx.navigateTo({
          url: '/pages/assessment/assessment',
        })
      } else {
        // 否则跳转到学习页面
        wx.navigateTo({
          url: '/pages/learning/learning',
        })
      }
    } catch (error) {
      wx.showToast({
        title: '登录失败',
        icon: 'error',
      })
      console.error('Login error:', error)
    } finally {
      this.setData({ loading: false })
    }
  },
})
```

---

## 5. 学习页面

**文件**: `miniprogram/pages/learning/learning.wxml`

```xml
<view class="container">
  <!-- 顶部进度条 -->
  <view class="header">
    <view class="level-info">
      <text class="level-label">第 {{currentLevel}} 级</text>
      <text class="progress-text">{{progress.completedCount}}/{{progress.totalSentences}}</text>
    </view>
    <progress
      percent="{{(progress.completedCount / progress.totalSentences) * 100}}"
      show-info="false"
      stroke-width="4"
    ></progress>
  </view>

  <!-- 句子卡片 -->
  <view class="content">
    <view class="sentence-card" wx:for="{{sentences}}" wx:key="id">
      <view class="sentence-header">
        <text class="seq-no">第 {{item.seqNo}} 句</text>
        <view class="audio-btn" bindtap="playAudio" data-url="{{item.audioUrl}}">
          <text>🔊 播放</text>
        </view>
      </view>

      <view class="sentence-content">
        <text class="en-text">{{item.enText}}</text>
        <text class="zh-text">{{item.zhText}}</text>
      </view>

      <view class="mastery-selector">
        <text class="label">掌握程度：</text>
        <view class="buttons">
          <button
            class="btn {{selectedMastery[item.id] === 0 ? 'active' : ''}}"
            bindtap="selectMastery"
            data-id="{{item.id}}"
            data-score="0"
          >
            未掌握
          </button>
          <button
            class="btn {{selectedMastery[item.id] === 50 ? 'active' : ''}}"
            bindtap="selectMastery"
            data-id="{{item.id}}"
            data-score="50"
          >
            部分掌握
          </button>
          <button
            class="btn {{selectedMastery[item.id] === 100 ? 'active' : ''}}"
            bindtap="selectMastery"
            data-id="{{item.id}}"
            data-score="100"
          >
            完全掌握
          </button>
        </view>
      </view>
    </view>
  </view>

  <!-- 底部按钮 -->
  <view class="footer">
    <button
      class="complete-btn"
      type="primary"
      loading="{{submitting}}"
      bindtap="handleCompleteLevel"
      disabled="{{progress.completedCount < progress.totalSentences}}"
    >
      {{progress.completedCount >= progress.totalSentences ? '完成本级' : '请完成所有句子'}}
    </button>
  </view>
</view>
```

**文件**: `miniprogram/pages/learning/learning.ts`

```typescript
import {
  getCurrentLevelContent,
  recordProgress,
  completeLevel,
} from '../../utils/api'

Page({
  data: {
    currentLevel: 1,
    sentences: [],
    progress: {
      completedCount: 0,
      masteredCount: 0,
      totalSentences: 20,
    },
    selectedMastery: {},
    submitting: false,
  },

  async onLoad() {
    await this.loadLevelContent()
  },

  async loadLevelContent() {
    try {
      wx.showLoading({ title: '加载中...' })

      const data = await getCurrentLevelContent()

      this.setData({
        currentLevel: data.level,
        sentences: data.sentences,
        progress: data.progress,
      })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      })
      console.error('Load content error:', error)
    } finally {
      wx.hideLoading()
    }
  },

  selectMastery(e: any) {
    const { id, score } = e.currentTarget.dataset
    const selectedMastery = this.data.selectedMastery

    selectedMastery[id] = parseInt(score)

    this.setData({ selectedMastery })

    // 自动保存进度
    this.saveProgress(id, parseInt(score))
  },

  async saveProgress(sentenceId: string, masteryScore: number) {
    try {
      await recordProgress(sentenceId, masteryScore)
      console.log('Progress saved:', sentenceId, masteryScore)
    } catch (error) {
      console.error('Save progress error:', error)
    }
  },

  playAudio(e: any) {
    const { url } = e.currentTarget.dataset

    if (!url) {
      wx.showToast({
        title: '音频不可用',
        icon: 'error',
      })
      return
    }

    const audio = wx.createInnerAudioContext()
    audio.src = url
    audio.play()
  },

  async handleCompleteLevel() {
    if (this.data.progress.completedCount < this.data.progress.totalSentences) {
      wx.showToast({
        title: '请完成所有句子',
        icon: 'error',
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const result = await completeLevel()

      wx.showToast({
        title: result.message,
        icon: 'success',
        duration: 2000,
      })

      // 延迟后加载下一级
      setTimeout(() => {
        this.loadLevelContent()
      }, 2000)
    } catch (error) {
      wx.showToast({
        title: '升级失败',
        icon: 'error',
      })
      console.error('Complete level error:', error)
    } finally {
      this.setData({ submitting: false })
    }
  },
})
```

---

## 6. 用户主页

**文件**: `miniprogram/pages/profile/profile.wxml`

```xml
<view class="container">
  <view class="header">
    <image class="avatar" src="{{userInfo.avatarUrl || '/images/default-avatar.png'}}"></image>
    <view class="info">
      <text class="nickname">{{userInfo.nickname}}</text>
      <text class="level">第 {{userInfo.currentLevel}} 级</text>
    </view>
  </view>

  <view class="stats">
    <view class="stat-item">
      <text class="stat-value">{{stats.completedLevels}}</text>
      <text class="stat-label">已完成等级</text>
    </view>
    <view class="stat-item">
      <text class="stat-value">{{stats.masteredSentences}}</text>
      <text class="stat-label">已掌握句子</text>
    </view>
    <view class="stat-item">
      <text class="stat-value">{{stats.totalPracticed}}</text>
      <text class="stat-label">总学习句子</text>
    </view>
  </view>

  <view class="actions">
    <button class="action-btn" bindtap="goToLearning">继续学习</button>
    <button class="action-btn" bindtap="logout">退出登录</button>
  </view>
</view>
```

**文件**: `miniprogram/pages/profile/profile.ts`

```typescript
import { getUserProfile } from '../../utils/api'
import { clearAll } from '../../utils/storage'

Page({
  data: {
    userInfo: {},
    stats: {
      completedLevels: 0,
      masteredSentences: 0,
      totalPracticed: 0,
    },
  },

  async onLoad() {
    await this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      wx.showLoading({ title: '加载中...' })

      const data = await getUserProfile()

      this.setData({
        userInfo: data,
        stats: data.stats,
      })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      })
      console.error('Load user info error:', error)
    } finally {
      wx.hideLoading()
    }
  },

  goToLearning() {
    wx.navigateTo({
      url: '/pages/learning/learning',
    })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearAll()
          wx.redirectTo({
            url: '/pages/login/login',
          })
        }
      },
    })
  },
})
```

---

## 7. 小程序配置

**文件**: `miniprogram/app.json`

```json
{
  "pages": [
    "pages/login/login",
    "pages/learning/learning",
    "pages/profile/profile",
    "pages/assessment/assessment"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "英语PK小程序",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#007AFF",
    "backgroundColor": "#fff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/learning/learning",
        "text": "学习",
        "iconPath": "images/tab-learning.png",
        "selectedIconPath": "images/tab-learning-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "images/tab-profile.png",
        "selectedIconPath": "images/tab-profile-active.png"
      }
    ]
  },
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  },
  "debug": false
}
```

---

## 8. 样式文件

**文件**: `miniprogram/pages/learning/learning.wxss`

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.header {
  padding: 20px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.level-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.level-label {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.progress-text {
  font-size: 14px;
  color: #999;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.sentence-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sentence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.seq-no {
  font-size: 14px;
  color: #999;
}

.audio-btn {
  background-color: #007AFF;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.sentence-content {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.en-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.zh-text {
  font-size: 14px;
  color: #666;
}

.mastery-selector {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
}

.buttons {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background-color: #fff;
  color: #333;
}

.btn.active {
  background-color: #007AFF;
  color: #fff;
  border-color: #007AFF;
}

.footer {
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #eee;
}

.complete-btn {
  width: 100%;
  padding: 15px;
  background-color: #007AFF;
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.complete-btn:disabled {
  background-color: #ccc;
}
```

---

## 9. 部署步骤

1. **配置后端 URL**
   - 修改 `miniprogram/utils/api.ts` 中的 `API_BASE_URL`

2. **配置微信小程序**
   - 在微信小程序后台配置服务器域名
   - 添加 `https://your-domain.com`

3. **上传小程序**
   - 使用微信开发者工具上传代码
   - 提交审核

4. **测试**
   - 在开发版本中测试所有功能
   - 确保登录、学习、升级流程正常

