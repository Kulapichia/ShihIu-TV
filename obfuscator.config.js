/**
 * @type {import('javascript-obfuscator').ObfuscatorOptions}
 */
module.exports = {
  // 压缩代码，使其更紧凑
  compact: true,
  // 控制流扁平化：这是强力混淆的核心，会严重破坏代码的逻辑结构，使其难以理解
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  // 随机插入无用代码，增加分析难度
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  // 调试保护：禁止使用开发者工具的调试功能 (F12)
  debugProtection: true,
  // 调试保护间隔：如果开启调试工具，会不断进入 debugger 状态，卡住调试器
  debugProtectionInterval: 4000,
  // 禁止在开发者工具中输出 console 信息
  disableConsoleOutput: true,
  // 标识符（变量名、函数名）混淆方式
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  // 将数字转换为表达式，例如 2 变成 0x11c5-0x11c3
  numbersToExpressions: true,
  // 【关键配置】重命名全局变量和函数。必须设为 false！
  // 否则会破坏 Next.js 和 React 的核心全局变量，导致应用崩溃。
  renameGlobals: false,
  // 自我保护：使混淆后的代码难以被格式化和美化
  selfDefending: true,
  // 字符串数组化：将所有字符串移动到一个大数组中，并通过索引引用
  stringArray: true,
  // 旋转或随机移动字符串数组中的元素，增加破解难度
  rotateStringArray: true,
  // 字符串数组编码方式：'base64' 或 'rc4'。'base64' 兼容性好，'rc4' 更安全但可能稍慢。
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  // 转换对象键名
  transformObjectKeys: true,
  // 将 Unicode 字符转义，例如 '你好' 变成 '\u4f60\u597d'
  unicodeEscapeSequence: false, // 设为 false 以避免增加不必要的体积
};
