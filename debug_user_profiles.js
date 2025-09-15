// 调试 user_profiles 表结构的脚本
// 在浏览器控制台中运行这个代码来查看表结构

// 1. 查看 user_profiles 表的所有字段
const debugUserProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  console.log('user_profiles 表结构:', data)
  console.log('错误信息:', error)
  
  if (data && data.length > 0) {
    console.log('可用字段:', Object.keys(data[0]))
  }
}

// 2. 查看当前用户的 auth 信息
const debugAuthUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('当前用户信息:', user)
  console.log('用户元数据:', user?.user_metadata)
}

// 运行调试
debugUserProfiles()
debugAuthUser()