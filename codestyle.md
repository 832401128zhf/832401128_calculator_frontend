# Code Style

JavaScript/CSS/HTML 主要参考 Google JavaScript Style Guide 与一致的可读性约定。

- JavaScript 变量、函数使用 lowerCamelCase。
- 常量使用 UPPER_SNAKE_CASE。
- 使用 4 空格缩进。
- 前端仅负责 UI、事件处理和 API 通信，不承担最终表达式计算。
- 用户输入输出到 HTML 前进行转义，避免直接插入不可信文本。
- API 地址集中在 `API_BASE_URL` 中配置。

参考：https://google.github.io/styleguide/jsguide.html
