// 导入所需的库
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

// 定义请求处理函数
const handler = async (req: Request): Promise<Response> => {
  try {
    // 解析请求体
    const { email, projectId, inviterEmail, projectName, role, invitationToken } = await req.json()
    
    // 验证必要参数
    if (!email || !projectId || !inviterEmail) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // 创建 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 构建邀请链接
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
    const inviteUrl = `${appUrl}/accept-invitation?token=${invitationToken}&projectId=${projectId}`
    
    // 构建邮件内容
    const emailSubject = `您被邀请加入项目: ${projectName || '未命名项目'}`
    const emailContent = `
      <h2>项目邀请</h2>
      <p>您好，</p>
      <p>${inviterEmail} 邀请您以 ${role || '成员'} 角色加入项目 "${projectName || '未命名项目'}"。</p>
      <p>点击下面的链接接受邀请：</p>
      <p><a href="${inviteUrl}">接受邀请</a></p>
      <p>此邀请链接将在7天后过期。</p>
      <p>如果您不认识邀请人，请忽略此邮件。</p>
      <p>谢谢！</p>
    `
    
    // 使用第三方邮件服务发送邮件
    // 这里使用 EmailJS 作为示例，您可以替换为任何其他邮件服务
    const emailjsUrl = 'https://api.emailjs.com/api/v1.0/email/send'
    const emailjsServiceId = Deno.env.get('EMAILJS_SERVICE_ID') || ''
    const emailjsTemplateId = Deno.env.get('EMAILJS_TEMPLATE_ID') || ''
    const emailjsUserId = Deno.env.get('EMAILJS_USER_ID') || ''
    
    const emailResponse = await fetch(emailjsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsUserId,
        template_params: {
          to_email: email,
          subject: emailSubject,
          message_html: emailContent,
          from_name: '项目管理系统',
          reply_to: inviterEmail,
        }
      })
    })
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('邮件发送失败:', errorText)
      return new Response(
        JSON.stringify({ error: '邮件发送失败', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // 记录邀请发送成功
    const { error: logError } = await supabase
      .from('invitation_logs')
      .insert({
        email,
        project_id: projectId,
        invited_by: inviterEmail,
        sent_at: new Date().toISOString()
      })
    
    if (logError) {
      console.error('记录邀请日志失败:', logError)
    }
    
    // 返回成功响应
    return new Response(
      JSON.stringify({ success: true, message: '邀请邮件已发送' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('处理邀请邮件请求失败:', error)
    return new Response(
      JSON.stringify({ error: '处理请求失败', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 启动服务
serve(handler)