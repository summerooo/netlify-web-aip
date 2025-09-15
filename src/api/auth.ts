import { supabase } from '../lib/supabase'

// 注册用户
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  if (error) throw error
  
  // 如果注册成功且有用户ID，创建用户资料
  if (data.user && fullName) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: email,
        full_name: fullName
      })
    
    if (profileError) {
      console.error('创建用户资料失败:', profileError)
      // 不抛出错误，因为主要注册已成功
    }
  }
  
  return data
}

// 登录用户
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// 退出登录
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 获取当前会话
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 监听认证状态变化
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
