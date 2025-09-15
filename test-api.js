// 简单的API测试脚本
import { getOrganizationMembers } from './src/api/organizations.js'

async function testAPI() {
  try {
    console.log('测试组织成员API...')
    const members = await getOrganizationMembers('90e07a80-a940-4e51-8314-879880f51a90')
    console.log('API调用成功:', members)
  } catch (error) {
    console.error('API调用失败:', error.message)
  }
}

testAPI()