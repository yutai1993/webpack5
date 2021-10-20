
/* 自动导入所有 svg文件 */
const req = require.context('../assets/icon/svg', false, /\.svg$/)
const requireAll = requireContext => requireContext.keys().map(requireContext)
requireAll(req)
